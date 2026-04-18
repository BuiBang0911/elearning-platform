import os
import psycopg2
import logging
from celery.utils.log import get_task_logger
from celery_app import app
from ingest import ingest_file
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
logger = get_task_logger(__name__)

def update_document_status(document_id, status):
    """Cập nhật trạng thái Document trực tiếp vào Postgres."""
    try:
        # Chuyển đổi URL từ định dạng SQLAlchemy/LangChain sang định dạng psycopg2 nếu cần
        # Ví dụ: postgresql+psycopg2:// -> postgresql://
        clean_db_url = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql://")
        
        conn = psycopg2.connect(clean_db_url)
        cur = conn.cursor()
        
        # Cập nhật Status (int) cho Document có Id tương ứng
        # Trong EF Core, mặc định bảng sẽ là "Documents"
        cur.execute(
            'UPDATE "Documents" SET "Status" = %s WHERE "Id" = %s',
            (status, document_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        logger.info(f"✅ Updated Document {document_id} status to {status}")
    except Exception as e:
        logger.error(f"❌ Failed to update status for Document {document_id}: {e}")

@app.task(name="rag.tasks.process_document_task")
def process_document_task(file_path, lesson_id, document_id):
    logger.info(f"🚀 Starting task for Document {document_id}: {file_path}")
    
    try:
        # 1. Chuyển sang trạng thái Processing (3)
        update_document_status(document_id, 3)
        
        # 2. Thực hiện Ingest (Embedding & Vector lưu vào pgvector)
        result = ingest_file(file_path, lesson_id=lesson_id, document_id=document_id)
        
        if result.get("status") == "success":
            # 3. Thành công -> Processed (4)
            update_document_status(document_id, 4)
            logger.info(f"🎉 Task completed for Document {document_id} with chunks {result.get('chunks')}")
            return result
        else:
            # 4. Lỗi từ logic ingest -> Failed (5)
            update_document_status(document_id, 5)
            logger.warning(f"⚠️ Ingest logic returned error: {result.get('message')}")
            return result
            
    except Exception as e:
        # 5. Lỗi hệ thống -> Failed (5)
        update_document_status(document_id, 5)
        logger.error(f"❌ Task failed for Document {document_id}: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}

@app.task(name="rag.tasks.delete_document_task")
def delete_document_task(file_name):
    logger.info(f"🗑️ Deleting RAG data for: {file_name}")
    try:
        clean_db_url = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql://")
        conn = psycopg2.connect(clean_db_url)
        cur = conn.cursor()
        
        # 1. Xóa trong ingest_records
        cur.execute('DELETE FROM ingest_records WHERE source = %s', (file_name,))
        
        # 2. Xóa trong bảng vector của LangChain (mặc định là langchain_pg_embedding)
        # Lọc theo trường filename trong cột cmetadata (JSONB)
        cur.execute(
            "DELETE FROM langchain_pg_embedding WHERE cmetadata->>'filename' = %s",
            (file_name,)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        # 3. Xóa file vật lý
        file_path = os.path.join(os.path.dirname(__file__), "data", file_name)
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"📁 Physical file deleted: {file_path}")
            
        logger.info(f"✅ RAG cleanup completed for: {file_name}")
        return {"status": "success", "file": file_name}
        
    except Exception as e:
        logger.error(f"❌ Failed to delete RAG data for {file_name}: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}
