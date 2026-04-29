import os
from flask import Flask
from backend.config import LocalDevelopmentConfig, ProductionConfig
from backend.models import db, User, Role
from flask_security import Security, SQLAlchemyUserDatastore, auth_required
from flask_caching import Cache
from flask_cors import CORS
import flask_excel as excel


def createApp():
    app = Flask(
        __name__,
        template_folder="frontend/templates",
        static_folder="frontend/static"
    )

    # ── Config ───────────────────────────────────────────────────────────────
    env = os.environ.get("FLASK_ENV", "development")
    if env == "production":
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(LocalDevelopmentConfig)

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Production: set ALLOWED_ORIGINS="https://app.yourdomain.com"
    # Development: defaults to allow all
    raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
    origins = [o.strip() for o in raw_origins.split(",")] if "," in raw_origins else raw_origins
    CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)

    # ── Extensions ───────────────────────────────────────────────────────────
    db.init_app(app)
    cache = Cache(app)
    app.cache = cache

    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore=datastore, register_blueprint=False)
    app.app_context().push()

    from backend.resources import api
    api.init_app(app)

    return app


app = createApp()

import backend.create_initial_data
import backend.routes

excel.init_excel(app)

if __name__ == "__main__":
    app.run()
