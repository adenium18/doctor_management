import os

# Workers: 2 * CPU cores + 1  (Render free tier has 0.1 CPU; use 2 workers)
workers    = int(os.environ.get("WEB_CONCURRENCY", 2))
threads    = int(os.environ.get("PYTHON_MAX_THREADS", 2))
worker_class = "gthread"

# Bind to the PORT that Render / Railway inject
bind       = f"0.0.0.0:{os.environ.get('PORT', '5000')}"

# Timeouts
timeout         = 120
keepalive       = 5
graceful_timeout = 30

# Logging
loglevel        = "info"
accesslog       = "-"   # stdout
errorlog        = "-"   # stderr
access_log_format = '%(h)s "%(r)s" %(s)s %(b)s %(D)sµs'

# Reload on code change in development only
reload = os.environ.get("FLASK_ENV") != "production"
