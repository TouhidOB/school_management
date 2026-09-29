# syntax=docker/dockerfile:1
FROM python:3.11-slim

# - PYTHONDONTWRITEBYTECODE: no .pyc clutter in the image/volume
# - PYTHONUNBUFFERED: logs stream straight to docker (no stdout buffering)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Build deps for psycopg/Pillow. libpq for Postgres, the rest for image handling.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libpq-dev libjpeg-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Collected static + uploaded media live on mounted volumes at runtime.
RUN mkdir -p /app/staticfiles /app/media

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
