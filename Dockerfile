FROM python:3.12-slim

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appgroup . .

RUN rm -rf .venv .git instance __pycache__ backend/__pycache__ .env && \
    mkdir -p /app/instance && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 10000

ENV FLASK_ENV=production

CMD ["gunicorn", "app:app", "-c", "gunicorn.conf.py"]
