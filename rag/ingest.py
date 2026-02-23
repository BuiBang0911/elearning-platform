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
DEBUG_MODE = True  # Chuyển sang False để tắt debug
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

# --- HÀM LỌC HEADER RÁC CỦA PDF ---
def remove_pdf_artifacts(text):
    """
    Hàm này loại bỏ các dòng header/footer lặp lại gây nhiễu.
    Bạn có thể thêm các từ khóa header cụ thể của tài liệu vào đây.
    """
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line_clean = line.strip()
        # 1. Bỏ dòng trống
        if not line_clean: continue
        
        # 2. Bỏ các Header/Footer cụ thể (Dựa trên tài liệu bạn gửi)
        # Ví dụ: "AI VIETNAM (AIO2024)", "aivietnam.edu.vn"
        if "AI VIETNAM" in line_clean: continue
        if "aivietnam.edu.vn" in line_clean: continue
        if "AI COURSE 2024" in line_clean: continue
        
        # 3. Bỏ số trang đơn lẻ (ví dụ dòng chỉ có số "1", "2")
        if line_clean.isdigit() and len(line_clean) < 4: continue
        
        cleaned_lines.append(line) # Giữ nguyên format dòng để nối sau
        
    return "\n".join(cleaned_lines)

# --- 2. CÁC HÀM XỬ LÝ TEXT ---

def clean_and_merge_lines(text):
    """Làm sạch và nối dòng văn bản bị ngắt sai."""
    if not text: return ""
    text = remove_pdf_artifacts(text)
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
    # Tạo một mảng đại diện cho trục X
    width = int(max_x - min_x) + 1
    if width <= 0: return ""
    
    x_projection = [0] * width # 0 là trống, 1 là có chữ
    
    for b in boxes:
        # Chiếu hộp chữ xuống trục X
        start = int(b['x1'] - min_x)
        end = int(b['x2'] - min_x)
        for k in range(max(0, start), min(width, end)):
            x_projection[k] = 1

    # Tìm các khoảng trống lớn trên trục X (Gap > 20px)
    GAP_THRESHOLD = 30
    has_vertical_split = False
    current_gap = 0
    
    # Chỉ xét vùng giữa (bỏ qua lề trái/phải)
    margin = int(width * 0.1) 
    for val in x_projection[margin : width - margin]:
        if val == 0:
            current_gap += 1
        else:
            if current_gap > GAP_THRESHOLD:
                has_vertical_split = True
                break
            current_gap = 0
            
    # Check lần cuối nếu gap nằm ở cuối
    if current_gap > GAP_THRESHOLD: has_vertical_split = True

    # 3. QUYẾT ĐỊNH CHIẾN THUẬT
    if has_vertical_split:
        # === CHẾ ĐỘ CỘT (COLUMN MODE) ===
        # Dành cho Sơ đồ RAG, Bảng biểu
        print("         ⚡ Phát hiện bố cục CỘT -> Gom nhóm dọc.")
        
        # Gom nhóm dựa trên tâm X (Center X)
        boxes.sort(key=lambda k: k['cx'])
        columns = []
        current_col = [boxes[0]]
        
        COL_MARGIN = 50 # Các chữ lệch nhau < 50px thì cùng cột
        
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
            # Trong mỗi cột, sắp xếp từ trên xuống dưới
            col.sort(key=lambda k: k['cy'])
            col_text = " ".join([b['text'] for b in col])
            final_text.append(col_text)
            
        return "\n".join(final_text)

    else:
        # === CHẾ ĐỘ DÒNG (ROW MODE) - MẶC ĐỊNH ===
        # Dành cho văn bản thường, paragraph
        print("         📝 Phát hiện bố cục VĂN BẢN -> Đọc theo dòng.")
        
        # Sắp xếp theo Y trước (để gom dòng), sau đó theo X
        # RapidOCR mặc định trả về khá chuẩn, ta chỉ cần sort nhẹ lại
        
        # Logic đơn giản: Sort theo Y top-down. 
        # Nếu Y gần nhau (<10px) thì sort theo X left-right.
        boxes.sort(key=lambda k: (int(k['cy'] / 15), k['cx'])) 
        
        return " ".join([b['text'] for b in boxes])
    
def process_image_for_ocr(img_bytes, debug_name=None):
    """
    Hàm xử lý ảnh toàn diện:
    1. Tiền xử lý (Nền trắng, Tương phản).
    2. Chạy OCR.
    3. Sắp xếp thông minh (Adaptive Sorting).
    """
    try:
        image = Image.open(io.BytesIO(img_bytes))
        print(f"      🖼️  Xử lý ảnh kích thước: {image.size}, mode: {image.mode}")
        # 1. LÓT NỀN TRẮNG (Fix lỗi trong suốt)
        if image.mode in ('RGBA', 'LA') or (image.mode == 'P' and 'transparency' in image.info):
            bg = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode != 'RGBA': image = image.convert('RGBA')
            bg.paste(image, mask=image.split()[3])
            image = bg
        else:
            image = image.convert('RGB')

        # 2. TĂNG TƯƠNG PHẢN
        image = ImageOps.grayscale(image)
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0) 

        print("         🔍 Ảnh đã được tiền xử lý cho OCR.")
        # [Debug] Lưu ảnh xử lý
        if DEBUG_MODE and debug_name:
            try:
                image.save(os.path.join(DEBUG_FOLDER, "proc_" + debug_name))
            except: pass

        with io.BytesIO() as output:
            image.save(output, format="PNG")
            processed_bytes = output.getvalue()
        
        # 3. CHẠY OCR
        result, _ = ocr(processed_bytes)
        
        if result:
            # Thay vì join thô thiển, ta gọi hàm sắp xếp thông minh
            return adaptive_text_sorting(result)
            
    except Exception as e:
        print(f"      ⚠️ Lỗi xử lý ảnh: {e}")
    return ""

    # --- HÀM MỚI: TÌM TÊN HÌNH (CAPTION) ---
def get_image_caption(page, img_rect):
    """
    Quét vùng văn bản ngay bên dưới ảnh để tìm caption.
    Ví dụ: "Hình 1: Kiến trúc RAG", "Figure 2. Data Flow"
    """
    try:
        # 1. Định nghĩa vùng quét: Ngay bên dưới ảnh, cao khoảng 60px
        # (x0, y1, x1, y1 + 60) -> Quét từ chân ảnh xuống 60 đơn vị
        caption_rect = fitz.Rect(img_rect.x0, img_rect.y1, img_rect.x1, img_rect.y1 + 60)
        
        # 2. Lấy text trong vùng đó
        # clip=caption_rect: Chỉ đọc chữ nằm trong vùng này
        raw_caption = page.get_text("text", clip=caption_rect)
        
        # 3. Làm sạch text
        clean_caption = clean_and_merge_lines(raw_caption)
        
        if not clean_caption:
            return None
            
        # 4. Kiểm tra xem có giống caption không?
        # Thường caption sẽ bắt đầu bằng "Hình", "Figure", "Sơ đồ", "Fig"
        # Hoặc đơn giản là một dòng text ngắn (< 150 ký tự) nằm ngay dưới ảnh
        keywords = ["Hình", "Figure", "Fig", "Sơ đồ", "Biểu đồ", "Bảng"]
        
        # Nếu bắt đầu bằng keyword HOẶC ngắn vừa phải thì lấy
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
        # KHAI BÁO PAGE_NUM Ở ĐÂY ĐỂ TRÁNH LỖI 'not defined'
        page_num = i + 1
        
        # 1. Text gốc
        raw_text = page.get_text()
        clean_raw = clean_and_merge_lines(raw_text)
        
        # 2. Xử lý Ảnh (Vòng lặp Debug chi tiết)
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
                        # In ra kích thước thật
                        w, h = rect.width, rect.height
                        print(f"      🖼️  Ảnh {img_index}.{rect_idx} ({w:.0f}x{h:.0f}): ", end="")
                        
                        if w < 50 or h < 50: 
                            print("❌ BỎ QUA (Quá nhỏ)")
                            continue
                        
                        print("✅ CẮT & OCR...", end=" ")
                        
                        try:
                            caption = get_image_caption(page, rect)
                        
                            # Tạo tiêu đề header
                            if caption:
                                header_title = f"HÌNH ẢNH: {caption}" # Ví dụ: HÌNH ẢNH: Hình 1. RAG
                                print(f"      🏷️  Tìm thấy caption: '{caption[:30]}...'")
                            else:
                                header_title = f"HÌNH ẢNH (Trang {page_num})"
                            clip_rect = rect + (-10, -10, 10, 10)
                            pix = page.get_pixmap(clip=clip_rect, matrix=fitz.Matrix(3, 3))
                            
                            # Debug name chứa page_num
                            dbg_name = f"p{page_num}_img{img_index}_{rect_idx}.png"
                            
                            # Gọi hàm OCR
                            text_in_image = process_image_for_ocr(pix.tobytes("png"), debug_name=dbg_name)
                            
                            # IN RA KẾT QUẢ ĐỂ KIỂM TRA
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

        # 3. Fallback Snapshot (Nếu không bắt được ảnh nào mà trang ít chữ)
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

    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
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