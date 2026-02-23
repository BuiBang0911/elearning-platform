# Python 3.10 slim
FROM python:3.10-slim

# Không tạo .pyc + log realtime
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Tăng timeout pip + dùng mirror nhanh
ENV PIP_DEFAULT_TIMEOUT=1000
ENV PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple

WORKDIR /app

# Cài lib cần cho psycopg2 / postgres
RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements trước để cache layer
COPY requirements.txt .

# Update pip + install deps
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Expose FastAPI
EXPOSE 8000

# Run app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
