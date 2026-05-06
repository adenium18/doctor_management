# ── Build stage ─────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Runtime stage ────────────────────────────────────────────────────────────
FROM python:3.12-slim

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY --chown=appuser:appgroup . .

# Remove dev files from the image
RUN rm -rf .venv .git instance __pycache__ backend/__pycache__ .env

USER appuser

EXPOSE 5000

ENV FLASK_ENV=production \
    WEB_CONCURRENCY=2 \
    PORT=5000

CMD ["gunicorn", "app:app", "-c", "gunicorn.conf.py"]
