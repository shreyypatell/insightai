# --- Build stage ---
FROM python:3.11-slim AS base

WORKDIR /app

# System dependencies needed by some Python packages (e.g. psycopg2, xgboost)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Pre-create storage directories so they exist in the container
RUN mkdir -p storage/uploads storage/models

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
