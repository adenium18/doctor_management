import os
from flask import Flask, jsonify
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

    @app.security.unauthn_handler
    def _unauthn_handler(mechanisms, headers=None):
        return jsonify({"message": "Authentication required", "code": 401}), 401

    @app.security.unauthz_handler
    def _unauthz_handler(func_name, params):
        return jsonify({"message": "Permission denied", "code": 403}), 403

    # Push a temporary context so module-level code in resources/routes can
    # reference app.security / app.cache.  This context is popped at the end
    # of createApp(); every real WSGI request gets its own fresh context.
    ctx = app.app_context()
    ctx.push()

    from backend.resources import api
    api.init_app(app)

    import backend.routes

    ctx.pop()
    return app


app = createApp()

with app.app_context():
    import backend.create_initial_data

excel.init_excel(app)

if __name__ == "__main__":
    app.run()
