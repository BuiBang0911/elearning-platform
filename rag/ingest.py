import os
import re
import unicodedata
import hashlib
import datetime
import io
import shutil
import gc
import base64
import time
import itertools
import fitz  # PyMuPDF
import psycopg2
import psycopg2.extras
import pdfplumber
import requests
from dotenv import load_dotenv
from PIL import Image, ImageEnhance, ImageOps
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_experimental.text_splitter import SemanticChunker
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_postgres import PGVector
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document
from sqlalchemy import create_engine

# --- CẤU HÌNH DEBUG ---
DEBUG_MODE = False  # Chuyển sang False để tắt debug
DEBUG_FOLDER = "./debug_output"

if DEBUG_MODE:
    if os.path.exists(DEBUG_FOLDER):
        try: shutil.rmtree(DEBUG_FOLDER)
        except: pass
    os.makedirs(DEBUG_FOLDER, exist_ok=True)
    print(f"🐞 DEBUG MODE: ON. Ảnh sẽ được lưu vào '{DEBUG_FOLDER}'")

# 1. Load môi trường & API Keys
load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
COLLECTION_NAME = "my_docs" 

keys_str = os.getenv("GOOGLE_API_KEYS_EMBEDDING", "")
EMBEDDING_KEYS = [k.strip() for k in keys_str.split(",") if k.strip()]
if not EMBEDDING_KEYS:
    fallback = os.getenv("GOOGLE_API_KEYS", os.getenv("GOOGLE_API_KEY", ""))
    EMBEDDING_KEYS = [k.strip() for k in fallback.split(",") if k.strip()]

if not EMBEDDING_KEYS:
    raise ValueError("Thiếu cấu hình GOOGLE_API_KEYS_EMBEDDING!")

embedding_key_iterator = itertools.cycle(EMBEDDING_KEYS)

def get_next_embedding_key():
    return next(embedding_key_iterator)

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
    """(Đã bỏ sử dụng cho Gemini Vision)"""
    return ""
    
def process_image_for_ocr(img_bytes, debug_name=None):
    """
    Gửi ảnh cho mô hình Gemini 1.5 Flash Vision.
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

        with io.BytesIO() as output:
            image.save(output, format="PNG")
            processed_bytes = output.getvalue()
            
        base64_image = base64.b64encode(processed_bytes).decode('utf-8')
        api_key = get_next_embedding_key()
        
        print("         🤖 Gửi ảnh cho Gemini Vision xử lý...")
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0.1,
            google_api_key=api_key
        )
        
        msg = HumanMessage(
            content=[
                {"type": "text", "text": "Trích xuất toàn bộ chữ (text) và giải thích chi tiết nội dung sơ đồ, bảng biểu trong hình ảnh này. Trả về dưới dạng text. Không bịa đặt thông tin. Nếu không có gì quan trọng, hãy trả về 'KHÔNG_CÓ_GÌ'."},
                {"type": "image_url", "image_url": f"data:image/png;base64,{base64_image}"}
            ]
        )
        
        # Thêm sleep nhỏ để tránh rate limit nếu PDF có quá nhiều ảnh liên tục
        time.sleep(4)
        response = llm.invoke([msg])
        
        if response and response.content:
            res_content = response.content.strip()
            if res_content == 'KHÔNG_CÓ_GÌ' or res_content == '':
                return ""
            return res_content
            
    except Exception as e:
        print(f"      ⚠️ Lỗi xử lý ảnh với Gemini: {e}")
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

    with pdfplumber.open(pdf_path) as pdf_plumb:
        for i, page in enumerate(doc):
            page_num = i + 1
            
            # 1. Text gốc - SỬ DỤNG HÀM CẮT TỌA ĐỘ Ở ĐÂY
            raw_text = extract_text_without_margins(page, margin_percent=0.08)
            clean_raw = clean_and_merge_lines(raw_text)

            # 1.5 Trích xuất Bảng (Table) sang Markdown
            table_content = ""
            try:
                plumb_page = pdf_plumb.pages[i]
                tables = plumb_page.extract_tables()
                if tables:
                    print(f"   --- Trang {page_num}: Bắt được {len(tables)} bảng biểu.")
                    for tbl in tables:
                        table_content += "\n\n=== [BẢNG BIỂU DỮ LIỆU] ===\n"
                        for r_idx, row in enumerate(tbl):
                            # Xóa ký tự xuống dòng và pipe (|) để tránh hỏng cú pháp markdown
                            clean_row = [str(x).replace('\n', ' ').replace('|', '').strip() if x else "" for x in row]
                            table_content += "| " + " | ".join(clean_row) + " |\n"
                            if r_idx == 0:  # Thêm dòng phân cách header của markdown
                                table_content += "| " + " | ".join(["---"] * len(clean_row)) + " |\n"
                        table_content += "==============================\n"
            except Exception as e:
                print(f"   ⚠️ Lỗi khi đọc bảng trang {page_num}: {e}")
            
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
            page_content = clean_raw + " " + table_content + " " + ocr_content
            full_text_content += page_content + " "
            
            # Giải phóng RAM cực mạnh sau mỗi trang
            del page
            del plumb_page
            del clean_raw
            del table_content
            del ocr_content
            gc.collect()

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

    print(f"\n📚 Đang chia nhỏ (Chunking) {len(raw_docs)} trang tài liệu bằng Semantic Chunker...")
    embeddings_for_chunking = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=get_next_embedding_key())
    text_splitter = SemanticChunker(embeddings_for_chunking, breakpoint_threshold_type="percentile")
    docs = text_splitter.split_documents(raw_docs)
    print(f"✂️ Đã chia thành {len(docs)} đoạn nhỏ thuật toán ngữ nghĩa (chunks).")

    for doc in docs:
        filename = doc.metadata.get("filename", "unknown")
        # Nhồi thẳng Metadata vào nội dung trước khi tạo Vector
        enriched_content = (
            f"Tên tài liệu: {filename}\n"
            f"Nội dung trích đoạn:\n{doc.page_content}"
        )
        doc.page_content = enriched_content

    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=get_next_embedding_key())
    
    # Tạo engine với pool_pre_ping để tránh lỗi SSL connection
    engine = create_engine(DB_URL, pool_pre_ping=True, pool_recycle=300)

    vector_store = PGVector(
        embeddings=embeddings,
        collection_name=COLLECTION_NAME,
        connection=engine,
        use_jsonb=True,
    )
    namespace = f"pgvector/{COLLECTION_NAME}"

    try:
        clean_db_url = DB_URL.replace("postgresql+psycopg2://", "postgresql://")
        pg_conn = psycopg2.connect(clean_db_url)
    except Exception as e:
        print("❌ Không thể kết nối tới DATABASE_URL:", e)
        return

    ensure_table(pg_conn)
    sync_engine(pg_conn, docs, vector_store, namespace)
    pg_conn.close()

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

def sync_engine(pg_conn, docs, vector_store, namespace):
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

    print("\n🚀 Bắt đầu đồng bộ dữ liệu...")

    existing = load_existing(pg_conn, namespace)
    current_record_ids = set()
    to_add = []
    to_update = []

    for i, doc in enumerate(docs):
        source_file = doc.metadata.get("filename", "unknown")
        # ID sẽ luôn có độ dài cố định là 32 ký tự
        record_id = hashlib.md5(f"{source_file}-{doc.page_content}".encode()).hexdigest()
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
    
    # Logic for full sync deletion only works when processing the whole directory
    # If we are doing a single file update, we might not want to delete everything else.
    # For simplicity, we keep the deletion if run_ingest is called.

def ingest_file(file_path: str, lesson_id: int = None):
    """Xử lý đồng bộ 1 file duy nhất (Local Path hoặc URL Cloud)."""
    lname = file_path.lower()
    raw_docs = []
    temp_local_path = None

    # Nếu là URL Cloud (Azure Blob, v.v.)
    if file_path.startswith("http://") or file_path.startswith("https://"):
        try:
            filename = os.path.basename(file_path.split('?')[0]) # Bỏ SAS token nếu có
            temp_dir = os.path.join(os.path.dirname(__file__), "data", "temp")
            if not os.path.exists(temp_dir): os.makedirs(temp_dir)
            
            temp_local_path = os.path.join(temp_dir, f"cloud_{datetime.datetime.now().timestamp()}_{filename}")
            
            print(f"🌐 Đang tải file từ Cloud: {file_path}")
            response = requests.get(file_path, timeout=60)
            response.raise_for_status()
            
            with open(temp_local_path, "wb") as f:
                f.write(response.content)
            
            print(f"✅ Tải xong. Đã lưu tạm tại: {temp_local_path}")
            file_path = temp_local_path
            lname = file_path.lower()
        except Exception as e:
            print(f"❌ Lỗi khi tải file từ Cloud: {e}")
            return {"status": "error", "message": f"Cloud download failed: {str(e)}"}

    if lname.endswith(".pdf"):
        raw_docs = process_pdf(file_path)
    elif lname.endswith(".txt"):
        loader = TextLoader(file_path, encoding="utf-8")
        raw_docs = loader.load()
        for d in raw_docs:
            d.page_content = clean_and_merge_lines(d.page_content)
            d.metadata["source"] = file_path
            d.metadata["filename"] = os.path.basename(file_path)
            if lesson_id:
                d.metadata["lesson_id"] = lesson_id

    if not raw_docs:
        return {"status": "error", "message": "File format not supported or empty"}

    embeddings_for_chunking = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=get_next_embedding_key())
    text_splitter = SemanticChunker(embeddings_for_chunking, breakpoint_threshold_type="percentile")
    docs = text_splitter.split_documents(raw_docs)

    for doc in docs:
        filename = doc.metadata.get("filename", "unknown")
        doc.page_content = f"Tên tài liệu: {filename}\nNội dung trích đoạn:\n{doc.page_content}"
        # Ensure lesson_id is in metadata for each chunk
        if lesson_id:
            doc.metadata["lesson_id"] = lesson_id

    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=get_next_embedding_key())
    
    # Tạo engine với pool_pre_ping
    engine = create_engine(DB_URL, pool_pre_ping=True, pool_recycle=300)
    
    vector_store = PGVector(embeddings=embeddings, collection_name=COLLECTION_NAME, connection=engine, use_jsonb=True)
    
    clean_db_url = DB_URL.replace("postgresql+psycopg2://", "postgresql://")
    pg_conn = psycopg2.connect(clean_db_url)
    ensure_table(pg_conn)
    
    namespace = f"pgvector/{COLLECTION_NAME}"
    
    # Chạy sync chỉ cho file này
    current_ids = []
    for i, doc in enumerate(docs):
        source_file = doc.metadata.get("filename", "unknown")
        # ID sẽ luôn có độ dài cố định là 32 ký tự
        record_id = hashlib.md5(f"{source_file}-{doc.page_content}".encode()).hexdigest()
        checksum = compute_checksum(doc.page_content)
        current_ids.append(record_id)
        
        # Upsert record and vector
        vector_store.add_documents([doc], ids=[record_id])
        with pg_conn.cursor() as cur:
            cur.execute("""
                INSERT INTO ingest_records(record_id, namespace, source, checksum, updated_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (record_id) DO UPDATE
                SET checksum = EXCLUDED.checksum, updated_at = EXCLUDED.updated_at
            """, (record_id, namespace, source_file, checksum, datetime.datetime.utcnow()))
    
    pg_conn.commit()
    pg_conn.close()
    
    # Dọn dẹp file tạm nếu là download từ Cloud
    if temp_local_path and os.path.exists(temp_local_path):
        try:
            os.remove(temp_local_path)
            print(f"🗑️ Đã dọn dẹp file tạm: {temp_local_path}")
        except: pass

    return {"status": "success", "chunks": len(docs)}

if __name__ == "__main__":
    run_ingest()