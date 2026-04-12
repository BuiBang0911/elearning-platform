from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

# Cấu hình Redis lấy từ file .env
REDIS_URL = os.getenv("CELERY_BROKER_URL")
RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND")

app = Celery(
    "rag_worker",
    broker=REDIS_URL,
    backend=RESULT_BACKEND,
    include=["tasks"]
)

# Cấu hình Celery
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    # Celery 4.0+ default task naming: module.function
    task_default_queue="celery",
    task_protocol=2, # Ép sử dụng Protocol v2
    # Cấu hình ổn định cho Windows
    broker_connection_retry_on_startup=True,
)

if __name__ == "__main__":
    app.start()
