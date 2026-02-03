# Sử dụng Python 3.10
FROM python:3.10-slim

# Thiết lập thư mục làm việc
WORKDIR /app

# Cài đặt các gói cần thiết cho PostgreSQL driver
RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy file requirements và cài đặt thư viện
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code vào container
COPY . .

# Mở cổng 8000
EXPOSE 8000

# Lệnh chạy mặc định (đã được ghi đè trong docker-compose nhưng cứ để đây cho chuẩn)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]