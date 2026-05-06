import os


class Config:
    DEBUG                             = False
    TESTING                           = False
    SQLALCHEMY_TRACK_MODIFICATIONS    = False
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"
    SECURITY_TOKEN_MAX_AGE            = 3600
    WTF_CSRF_ENABLED                  = False


class LocalDevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI  = "sqlite:///database.sqlite3"
    DEBUG                    = True
    SECURITY_PASSWORD_HASH   = "bcrypt"
    SECURITY_PASSWORD_SALT   = "thisshouldbekeptsecret"
    SECRET_KEY               = "shouldbekeyveryhidden"
    CACHE_TYPE               = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT    = 30


class ProductionConfig(Config):
    # Secrets come from environment variables — never hard-coded.
    # Use .get() so the class body doesn't crash on import in dev;
    # the app will fail loudly at first request if the key is truly missing.
    SECRET_KEY               = os.environ.get("SECRET_KEY", "")
    SECURITY_PASSWORD_HASH   = "bcrypt"
    SECURITY_PASSWORD_SALT   = os.environ.get("SECURITY_PASSWORD_SALT", "")

    # Render / Railway provide DATABASE_URL for PostgreSQL.
    # SQLAlchemy requires postgresql:// (Render still uses the old postgres:// prefix).
    _db_url = os.environ.get("DATABASE_URL", "sqlite:///database.sqlite3")
    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI  = _db_url

    # Redis cache — optional; falls back to SimpleCache if REDIS_URL not set
    _redis = os.environ.get("REDIS_URL")
    if _redis:
        CACHE_TYPE            = "RedisCache"
        CACHE_REDIS_URL       = _redis
        CACHE_DEFAULT_TIMEOUT = 300
    else:
        CACHE_TYPE            = "SimpleCache"
        CACHE_DEFAULT_TIMEOUT = 300

    # Email (Gmail SMTP)
    MAIL_SERVER          = "smtp.gmail.com"
    MAIL_PORT            = 587
    MAIL_USE_TLS         = True
    MAIL_USERNAME        = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD        = os.environ.get("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER  = os.environ.get("MAIL_USERNAME")

    # Cookie / transport security
    SESSION_COOKIE_SECURE    = True
    SESSION_COOKIE_HTTPONLY  = True
    SESSION_COOKIE_SAMESITE  = "Lax"
    PREFERRED_URL_SCHEME     = "https"
