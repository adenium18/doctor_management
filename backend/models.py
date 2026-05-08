import sys, types, os as _os
if 'pkg_resources' not in sys.modules:
    _m = types.ModuleType('pkg_resources')
    def _resource_string(package, path):
        import importlib as _il
        mod = _il.import_module(package)
        full = _os.path.join(_os.path.dirname(mod.__file__), path)
        with open(full, 'rb') as _f:
            return _f.read()
    _m.resource_string = _resource_string
    sys.modules['pkg_resources'] = _m

from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from datetime import datetime, timezone

def utcnow():
    return datetime.now(timezone.utc)

db = SQLAlchemy()


class RolesUsers(db.Model):
    __tablename__ = "roles_users"
    id      = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column("user_id", db.Integer(), db.ForeignKey("user.id"))
    role_id = db.Column("role_id", db.Integer(), db.ForeignKey("role.id"))


class Role(db.Model, RoleMixin):
    id          = db.Column(db.Integer(), primary_key=True)
    name        = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))


class User(db.Model, UserMixin):
    id             = db.Column(db.Integer(), primary_key=True)
    email          = db.Column(db.String(), unique=True)
    password       = db.Column(db.String(255))
    active         = db.Column(db.Boolean())
    fs_uniquifier  = db.Column(db.String(255), unique=True, nullable=False)
    roles          = db.relationship(
        "Role", secondary="roles_users",
        backref=db.backref("users", lazy="dynamic")
    )


class Doctor(db.Model):
    id        = db.Column(db.Integer(), primary_key=True)
    full_name = db.Column(db.String(255))
    address   = db.Column(db.String(255))
    degree    = db.Column(db.String())
    user_id   = db.Column(db.Integer(), db.ForeignKey("user.id"), unique=True)
    active    = db.Column(db.Boolean(), default=True)
    user      = db.relationship("User", backref=db.backref("doctor", uselist=False))


class Patient(db.Model):
    id                = db.Column(db.Integer(), primary_key=True)
    full_name         = db.Column(db.String(255), nullable=False)
    address           = db.Column(db.String(255))
    pincode           = db.Column(db.String())
    dob               = db.Column(db.String(), nullable=True)
    age               = db.Column(db.Integer(), nullable=True)
    weight            = db.Column(db.Float())
    height            = db.Column(db.Float(), nullable=True)
    blood_group       = db.Column(db.String(10), nullable=True)
    sex               = db.Column(db.String())
    phone             = db.Column(db.String())
    emergency_contact = db.Column(db.String(100), nullable=True)
    active            = db.Column(db.Boolean, default=True)


class Casepaper(db.Model):
    id             = db.Column(db.Integer(), primary_key=True)
    patient_id     = db.Column(db.Integer(), db.ForeignKey("patient.id"))
    doctor_id      = db.Column(db.Integer(), db.ForeignKey("doctor.id"), nullable=False)
    # Core fields (used in list view / search / reports)
    symptoms       = db.Column(db.String())
    diagnosis      = db.Column(db.String())
    prescription   = db.Column(db.String())
    charges        = db.Column(db.Integer(), default=150)
    amount_paid    = db.Column(db.Integer(), nullable=True)
    payment_status = db.Column(db.String(20), default="paid")
    payment_method = db.Column(db.String(20), default="cash")
    visit_type     = db.Column(db.String(50), default="consultation")
    notes          = db.Column(db.String(500), default="")
    next_followup  = db.Column(db.String(), nullable=True)
    # Extended clinical data (stored as JSON text)
    visit_info       = db.Column(db.Text(), nullable=True)   # chief complaints, HPI, history
    vitals           = db.Column(db.Text(), nullable=True)   # pulse, bp, temp, spo2, rr
    examination      = db.Column(db.Text(), nullable=True)   # general, systemic, findings
    diagnosis_detail = db.Column(db.Text(), nullable=True)   # provisional, final, ICD, severity
    treatment_detail = db.Column(db.Text(), nullable=True)   # injections, procedures, dressing…
    medicines        = db.Column(db.Text(), nullable=True)   # JSON array of medicine rows
    investigations   = db.Column(db.Text(), nullable=True)   # JSON array of investigation rows
    # Timestamps
    created_at     = db.Column(db.DateTime(), default=utcnow)
    updated_at     = db.Column(db.DateTime(), default=utcnow, onupdate=utcnow)

    patient = db.relationship(
        "Patient",
        backref=db.backref("casepapers", lazy="dynamic", cascade="all, delete-orphan")
    )


class Expense(db.Model):
    id          = db.Column(db.Integer(), primary_key=True)
    doctor_id   = db.Column(db.Integer(), db.ForeignKey("doctor.id"), nullable=False)
    title       = db.Column(db.String(255), nullable=False)
    category    = db.Column(db.String(100), default="Other")
    amount      = db.Column(db.Float(), nullable=False)
    date        = db.Column(db.String(), nullable=False)
    description = db.Column(db.String(500), default="")
    created_at  = db.Column(db.DateTime(), default=utcnow)

    doctor = db.relationship("Doctor", backref=db.backref("expenses", lazy="dynamic"))
