class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False   # ✅ fixed typo (was SQL_ALCHEMY_TRACK_MODIFICATIONS)


class LocalDevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI = "sqlite:///database.sqlite3"
    DEBUG = True
    SECURITY_PASSWORD_HASH = 'bcrypt'
    SECURITY_PASSWORD_SALT = 'thisshouldbekeptsecret'
    SECRET_KEY = "shouldbekeyveryhidden"
    SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authentication-Token'
    SECURITY_TOKEN_MAX_AGE = 3600

    # Cache config
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_HOST = "localhost"           # ✅ was missing
    CACHE_REDIS_PORT = 6379
    CACHE_DEFAULT_TIMEOUT = 30

    WTF_CSRF_ENABLED = False
