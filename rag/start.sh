#!/bin/bash

echo "🚀 Starting Celery Worker..."
celery -A tasks worker --loglevel=info &

echo "🚀 Starting Uvicorn API Server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
