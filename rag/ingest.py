import os
import re
import unicodedata
import hashlib
import datetime
import io
import shutil
import fitz  # PyMuPDF
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from PIL import Image, ImageEnhance, ImageOps
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_postgres import PGVector
from rapidocr_onnxruntime import RapidOCR
from langchain_core.documents import Document

# --- CẤU HÌNH DEBUG ---
DEBUG_MODE = False  # Chuyển sang False để tắt debug
DEBUG_FOLDER = "./debug_output"

if DEBUG_MODE:
    if os.path.exists(DEBUG_FOLDER):
        try: shutil.rmtree(DEBUG_FOLDER)
        except: pass
    os.makedirs(DEBUG_FOLDER, exist_ok=True)
    print(f"🐞 DEBUG MODE: ON. Ảnh sẽ được lưu vào '{DEBUG_FOLDER}'")

# 1. Load môi trường
load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
COLLECTION_NAME = "my_docs" 

# --- 1. KHỞI TẠO OCR ---
ocr = RapidOCR()

# --- 2. CÁC HÀM XỬ LÝ TEXT & PDF ---

def extract_text_without_margins(page, margin_percent=0.08):
    """
    Trích xuất chữ từ trang PDF nhưng bỏ qua lề trên và lề dưới để né Header/Footer.
    margin_percent=0.08 nghĩa là cắt bỏ 8% ở đỉnh và 8% ở đáy trang.
    """
    rect = page.rect # Lấy kích thước trang: x0, y0, x1, y1
    
    # Tạo khung (Bounding Box) cắt lề
    clip_rect = fitz.Rect(
        rect.x0, 
        rect.y0 + (rect.height * margin_percent), # Kéo trần xuống
        rect.x1, 
        rect.y1 - (rect.height * margin_percent)  # Kéo sàn lên
    )
    
    # Chỉ lấy chữ nằm trong vùng an toàn này
    return page.get_text("text", clip=clip_rect)

def clean_and_merge_lines(text):
    """Làm sạch và nối dòng văn bản bị ngắt sai."""
    if not text: return ""
    # Đã bỏ hàm remove_pdf_artifacts() vì giờ cắt theo tọa độ ở hàm trên
    text = unicodedata.normalize('NFC', text)
    text = text.replace('\x00', '')
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def adaptive_text_sorting(ocr_result):
    """
    Tự động phát hiện bố cục:
    - Nếu có khoảng trắng dọc xuyên suốt -> Đọc theo CỘT (Sơ đồ).
    - Nếu text trải dài liên tục -> Đọc theo DÒNG (Văn bản thường).
    """
    if not ocr_result: return ""
    
    # 1. Chuẩn bị dữ liệu
    boxes = []
    min_x, max_x = 10000, 0
    
    for item in ocr_result:
        box, text = item[0], item[1]
        xs = [pt[0] for pt in box]
        ys = [pt[1] for pt in box]
        x1, x2 = min(xs), max(xs)
        y1, y2 = min(ys), max(ys)
        
        boxes.append({
            "text": text,
            "x1": x1, "x2": x2,
            "y1": y1, "y2": y2,
            "cx": (x1+x2)/2, "cy": (y1+y2)/2
        })
        min_x = min(min_x, x1)
        max_x = max(max_x, x2)

    # 2. KIỂM TRA "KHE HỞ DỌC" (VERTICAL GAPS)
    width = int(max_x - min_x) + 1
    if width <= 0: return ""
    
    x_projection = [0] * width 
    
    for b in boxes:
        start = int(b['x1'] - min_x)
        end = int(b['x2'] - min_x)
        for k in range(max(0, start), min(width, end)):
            x_projection[k] = 1

    GAP_THRESHOLD = 30
    has_vertical_split = False
    current_gap = 0
    
    margin = int(width * 0.1) 
    for val in x_projection[margin : width - margin]:
        if val == 0:
            current_gap += 1
        else:
            if current_gap > GAP_THRESHOLD:
                has_vertical_split = True
                break
            current_gap = 0
            
    if current_gap > GAP_THRESHOLD: has_vertical_split = True

    # 3. QUYẾT ĐỊNH CHIẾN THUẬT
    if has_vertical_split:
        print("         ⚡ Phát hiện bố cục CỘT -> Gom nhóm dọc.")
        boxes.sort(key=lambda k: k['cx'])
        columns = []
        current_col = [boxes[0]]
        
        COL_MARGIN = 50 
        
        for i in range(1, len(boxes)):
            prev, curr = current_col[-1], boxes[i]
            if abs(curr['cx'] - prev['cx']) < COL_MARGIN:
                current_col.append(curr)
            else:
                columns.append(current_col)
                current_col = [curr]
        if current_col: columns.append(current_col)

        final_text = []
        for col in columns:
            col.sort(key=lambda k: k['cy'])
            col_text = " ".join([b['text'] for b in col])
            final_text.append(col_text)
            
        return "\n".join(final_text)
    else:
        print("         📝 Phát hiện bố cục VĂN BẢN -> Đọc theo dòng.")
        boxes.sort(key=lambda k: (int(k['cy'] / 15), k['cx'])) 
        return " ".join([b['text'] for b in boxes])
    
def process_image_for_ocr(img_bytes, debug_name=None):
    """
    1. Tiền xử lý (Nền trắng, Tương phản).
    2. Chạy OCR.
    3. Sắp xếp thông minh (Adaptive Sorting).
    """
    try:
        image = Image.open(io.BytesIO(img_bytes))
        print(f"      🖼️  Xử lý ảnh kích thước: {image.size}, mode: {image.mode}")
        
        if image.mode in ('RGBA', 'LA') or (image.mode == 'P' and 'transparency' in image.info):
            bg = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode != 'RGBA': image = image.convert('RGBA')
            bg.paste(image, mask=image.split()[3])
            image = bg
        else:
            image = image.convert('RGB')

        image = ImageOps.grayscale(image)
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0) 

        print("         🔍 Ảnh đã được tiền xử lý cho OCR.")
        if DEBUG_MODE and debug_name:
            try:
                image.save(os.path.join(DEBUG_FOLDER, "proc_" + debug_name))
            except: pass

        with io.BytesIO() as output:
            image.save(output, format="PNG")
            processed_bytes = output.getvalue()
        
        result, _ = ocr(processed_bytes)
        
        if result:
            return adaptive_text_sorting(result)
            
    except Exception as e:
        print(f"      ⚠️ Lỗi xử lý ảnh: {e}")
    return ""

def get_image_caption(page, img_rect):
    """Quét vùng văn bản ngay bên dưới ảnh để tìm caption."""
    try:
        caption_rect = fitz.Rect(img_rect.x0, img_rect.y1, img_rect.x1, img_rect.y1 + 60)
        raw_caption = page.get_text("text", clip=caption_rect)
        clean_caption = clean_and_merge_lines(raw_caption)
        
        if not clean_caption: return None
            
        keywords = ["Hình", "Figure", "Fig", "Sơ đồ", "Biểu đồ", "Bảng"]
        if any(k in clean_caption for k in keywords) or len(clean_caption) < 150:
            return clean_caption
            
    except Exception:
        return None
    return None

def process_pdf(pdf_path):
    full_text_content = ""
    
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"❌ Không mở được file: {e}")
        return []
    
    filename = os.path.basename(pdf_path)
    print(f"\n📄 Đang xử lý: {filename} ({len(doc)} trang)...")

    for i, page in enumerate(doc):
        page_num = i + 1
        
        # 1. Text gốc - SỬ DỤNG HÀM CẮT TỌA ĐỘ Ở ĐÂY
        raw_text = extract_text_without_margins(page, margin_percent=0.08)
        clean_raw = clean_and_merge_lines(raw_text)
        
        # 2. Xử lý Ảnh
        image_list = page.get_images(full=True)
        ocr_content = ""
        processed_any_image = False
        
        if image_list:
            print(f"   --- Trang {page_num}: Có {len(image_list)} ảnh.")
            
            for img_index, img in enumerate(image_list):
                try:
                    xref = img[0]
                    rects = page.get_image_rects(xref)
                    
                    for rect_idx, rect in enumerate(rects):
                        w, h = rect.width, rect.height
                        print(f"      🖼️  Ảnh {img_index}.{rect_idx} ({w:.0f}x{h:.0f}): ", end="")
                        
                        if w < 50 or h < 50: 
                            print("❌ BỎ QUA (Quá nhỏ)")
                            continue
                        
                        print("✅ CẮT & OCR...", end=" ")
                        
                        try:
                            caption = get_image_caption(page, rect)
                        
                            if caption:
                                header_title = f"HÌNH ẢNH: {caption}"
                                print(f"      🏷️  Tìm thấy caption: '{caption[:30]}...'")
                            else:
                                header_title = f"HÌNH ẢNH (Trang {page_num})"
                                
                            clip_rect = rect + (-10, -10, 10, 10)
                            pix = page.get_pixmap(clip=clip_rect, matrix=fitz.Matrix(3, 3))
                            
                            dbg_name = f"p{page_num}_img{img_index}_{rect_idx}.png"
                            text_in_image = process_image_for_ocr(pix.tobytes("png"), debug_name=dbg_name)
                            
                            if not text_in_image:
                                print("⚠️ RỖNG (Không đọc được chữ).")
                            elif len(text_in_image) <= 5:
                                print(f"⚠️ RÁC (Len={len(text_in_image)}): '{text_in_image}'")
                            else:
                                print(f"🎉 OK! ({len(text_in_image)} chars).")
                                ocr_content += (
                                    f"\n\n=== [{header_title}] ===\n"
                                    f"{text_in_image}\n"
                                    f"==============================\n"
                                )
                                processed_any_image = True
                                
                        except Exception as inner_e:
                            print(f"❌ Lỗi hàm OCR: {inner_e}")

                except Exception as e:
                    print(f"\n      ❌ Lỗi vòng lặp ảnh: {e}")
                    continue

        # 3. Fallback Snapshot
        if not processed_any_image and len(clean_raw) < 300:
            print(f"   📸 Trang {page_num} ít text -> Thử chụp toàn trang...")
            try:
                pix = page.get_pixmap(matrix=fitz.Matrix(3, 3))
                dbg_name = f"p{page_num}_snapshot.png"
                full_page_ocr = process_image_for_ocr(pix.tobytes("png"), debug_name=dbg_name)
                
                if len(full_page_ocr) > len(clean_raw) + 50:
                    print(f"      ✅ Snapshot lấy thêm được {len(full_page_ocr)} ký tự.")
                    ocr_content += f"\n\n=== [SCAN TOÀN TRANG {page_num}] ===\n{full_page_ocr}\n==============================\n"
            except: pass

        # Gộp nội dung
        page_content = clean_raw + " " + ocr_content
        full_text_content += page_content + " "

    if full_text_content.strip():
        print(f"   ✅ Xong file. Tổng: {len(full_text_content)} ký tự.")
        return [Document(
            page_content=full_text_content,
            metadata={
                "source": pdf_path,
                "filename": filename,
                "total_pages": len(doc)
            }
        )]
            
    return []

def load_all_documents():
    docs = []
    data_dir = "./data"
    
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print("📁 Đã tạo thư mục data, hãy copy file vào!")
        return []

    for root, _, files in os.walk(data_dir):
        for fname in files:
            path = os.path.join(root, fname)
            lname = fname.lower()
            try:
                if lname.endswith(".pdf"):
                    docs.extend(process_pdf(path))
                elif lname.endswith(".txt"):
                    print(f"📄 Đang xử lý TXT: {fname}")
                    loader = TextLoader(path, encoding="utf-8")
                    loaded = loader.load()
                    for d in loaded:
                        d.page_content = clean_and_merge_lines(d.page_content)
                        d.metadata["source"] = path
                        d.metadata["filename"] = fname
                    docs.extend(loaded)
            except Exception as e:
                print(f"❌ Lỗi xử lý file {fname}: {e}")
                
    print(f"\n✅ TỔNG KẾT: {len(docs)} trang tài liệu đã sẵn sàng!")
    return docs

def run_ingest():
    print("🔄 Đang quét thư mục data...")
    raw_docs = load_all_documents()
    
    if not raw_docs:
        print("⚠️ Không tìm thấy file nào hoặc file rỗng!")
        return 

    print(f"\n📚 Đang chia nhỏ (Chunking) {len(raw_docs)} trang tài liệu...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, add_start_index=True)
    docs = text_splitter.split_documents(raw_docs)
    print(f"✂️ Đã chia thành {len(docs)} đoạn nhỏ (chunks).")

    for doc in docs:
        filename = doc.metadata.get("filename", "unknown")
        # Nhồi thẳng Metadata vào nội dung trước khi tạo Vector
        enriched_content = (
            f"Tên tài liệu: {filename}\n"
            f"Nội dung trích đoạn:\n{doc.page_content}"
        )
        doc.page_content = enriched_content

    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    vector_store = PGVector(
        embeddings=embeddings,
        collection_name=COLLECTION_NAME,
        connection=DB_URL,
        use_jsonb=True,
    )
    namespace = f"pgvector/{COLLECTION_NAME}"

    def compute_checksum(text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def ensure_table(conn):
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS ingest_records (
                    record_id TEXT PRIMARY KEY,
                    namespace TEXT,
                    source TEXT,
                    checksum TEXT,
                    updated_at TIMESTAMP
                )
            """)
            conn.commit()

    def load_existing(conn, namespace):
        with conn.cursor() as cur:
            cur.execute("SELECT record_id, checksum FROM ingest_records WHERE namespace = %s", (namespace,))
            return {row[0]: row[1] for row in cur.fetchall()}

    def upsert_record(conn, namespace, record_id, source, checksum):
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO ingest_records(record_id, namespace, source, checksum, updated_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (record_id) DO UPDATE
                SET checksum = EXCLUDED.checksum, updated_at = EXCLUDED.updated_at
            """, (record_id, namespace, source, checksum, datetime.datetime.utcnow()))
            conn.commit()

    def delete_record(conn, namespace, record_id):
        with conn.cursor() as cur:
            cur.execute("DELETE FROM ingest_records WHERE namespace = %s AND record_id = %s", (namespace, record_id))
            conn.commit()

    try:
        clean_db_url = DB_URL.replace("postgresql+psycopg2://", "postgresql://")
        pg_conn = psycopg2.connect(clean_db_url)
    except Exception as e:
        print("❌ Không thể kết nối tới DATABASE_URL:", e)
        return

    ensure_table(pg_conn)

    print("\n🚀 Bắt đầu đồng bộ dữ liệu...")

    existing = load_existing(pg_conn, namespace)
    current_record_ids = set()
    to_add = []
    to_update = []

    for i, doc in enumerate(docs):
        source_file = doc.metadata.get("filename", "unknown")
        record_id = f"{source_file}:{i}"
        checksum = compute_checksum(doc.page_content)
        current_record_ids.add(record_id)

        if record_id not in existing:
            to_add.append((record_id, doc, checksum, source_file))
        elif existing.get(record_id) != checksum:
            to_update.append((record_id, doc, checksum, source_file))

    def process_batch(items, is_update=False):
        if not items: return 0
        ids = [item[0] for item in items]
        batch_docs = [item[1] for item in items]
        action = "Cập nhật" if is_update else "Thêm mới"
        print(f"   Wait... Đang {action} {len(batch_docs)} vectors...")
        try:
            vector_store.add_documents(batch_docs, ids=ids)
            for rid, _, csum, src in items:
                upsert_record(pg_conn, namespace, rid, src, csum)
            return len(batch_docs)
        except Exception as e:
            print(f"   ❌ Lỗi Batch: {e}")
            return 0

    num_added = process_batch(to_add, is_update=False)
    num_updated = process_batch(to_update, is_update=True)

    existing_ids = set(existing.keys())
    to_delete = list(existing_ids - current_record_ids)
    num_deleted = 0

    if to_delete:
        print(f"   🗑️ Đang xóa {len(to_delete)} vectors cũ...")
        try:
            vector_store.delete(ids=to_delete)
            for rid in to_delete:
                delete_record(pg_conn, namespace, rid)
                num_deleted += 1
        except Exception as e:
             print(f"⚠️ Lỗi xóa vector: {e}")

    pg_conn.close()

    print("\n✅ HOÀN TẤT ĐỒNG BỘ!")
    print(f"   ➕ Thêm: {num_added}")
    print(f"   🔄 Update: {num_updated}")
    print(f"   🗑️ Xóa: {num_deleted}")
    print(f"   ⏭️ Bỏ qua (Không đổi): {len(docs) - num_added - num_updated}")

if __name__ == "__main__":
    run_ingest()