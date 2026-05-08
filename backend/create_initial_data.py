import os
from flask_security import SQLAlchemyUserDatastore, hash_password
from backend.models import db, Doctor
from flask import current_app as app
from sqlalchemy import inspect, text


def _add_missing_columns():
    """Add new columns to existing tables without dropping data."""
    inspector = inspect(db.engine)
    dialect   = db.engine.dialect.name
    text_type = "TEXT"

    patient_cols    = {c["name"] for c in inspector.get_columns("patient")}
    casepaper_cols  = {c["name"] for c in inspector.get_columns("casepaper")}

    patient_new = [
        ("height",            "FLOAT"),
        ("blood_group",       "VARCHAR(10)"),
        ("emergency_contact", "VARCHAR(100)"),
    ]
    casepaper_new = [
        ("visit_info",       text_type),
        ("vitals",           text_type),
        ("examination",      text_type),
        ("diagnosis_detail", text_type),
        ("treatment_detail", text_type),
        ("medicines",        text_type),
        ("investigations",   text_type),
        ("amount_paid",      "INTEGER"),
        ("payment_method",   "VARCHAR(20)"),
    ]

    changed = False
    for col, typ in patient_new:
        if col not in patient_cols:
            db.session.execute(text(f"ALTER TABLE patient ADD COLUMN {col} {typ}"))
            changed = True
    for col, typ in casepaper_new:
        if col not in casepaper_cols:
            db.session.execute(text(f"ALTER TABLE casepaper ADD COLUMN {col} {typ}"))
            changed = True
    if changed:
        db.session.commit()

# Seed credentials — read from env vars in production, use safe defaults in dev.
# On first deploy set these in your platform's environment variables dashboard.
ADMIN_EMAIL    = os.environ.get("ADMIN_EMAIL",    "admin@abc.in")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD",  "UzIx79Eo-hXbCxfD3xwL5Q")
DOCTOR_EMAIL   = os.environ.get("DOCTOR_EMAIL",   "doctor@abc.in")
DOCTOR_PASSWORD= os.environ.get("DOCTOR_PASSWORD", "hZ76S0_vC_ZbT9TAH3bX3g")

with app.app_context():
    db.create_all()
    _add_missing_columns()

    userdatastore: SQLAlchemyUserDatastore = app.security.datastore

    userdatastore.find_or_create_role(id=1, name="admin",  description="admin")
    userdatastore.find_or_create_role(id=2, name="doctor", description="professional_doctor")
    db.session.commit()

    if not userdatastore.find_user(email=ADMIN_EMAIL):
        userdatastore.create_user(
            email=ADMIN_EMAIL,
            password=hash_password(ADMIN_PASSWORD),
            roles=["admin"],
        )
        db.session.commit()

    create_doctor = False
    doc_user      = None

    if not userdatastore.find_user(email=DOCTOR_EMAIL):
        doc_user = userdatastore.create_user(
            email=DOCTOR_EMAIL,
            password=hash_password(DOCTOR_PASSWORD),
            roles=["doctor"],
        )
        create_doctor = True

    db.session.commit()

    if create_doctor and doc_user:
        new_doctor = Doctor(
            full_name="Kumar SV",
            address="Mumbai",
            degree="MBBS",
            user_id=doc_user.id,
            active=True,
        )
        db.session.add(new_doctor)
        db.session.commit()