from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from datetime import datetime

db = SQLAlchemy()

class RolesUsers(db.Model):
    __tablename__ = "roles_users"
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column("user_id", db.Integer(), db.ForeignKey("user.id"))
    role_id = db.Column("role_id", db.Integer(), db.ForeignKey("role.id"))

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

class User(db.Model, UserMixin):
    id = db.Column(db.Integer(), primary_key=True)
    email = db.Column(db.String(), unique=True)
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean())
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False)
    roles = db.relationship(
        "Role", secondary="roles_users", backref=db.backref("users", lazy="dynamic")
    )

class Casepaper(db.Model):
    id           = db.Column(db.Integer(), primary_key=True)
    patient_id   = db.Column(db.Integer(), db.ForeignKey('patient.id'))
    doctor_id    = db.Column(db.Integer(), db.ForeignKey('doctor.id'), nullable=False)
    symptoms     = db.Column(db.String())
    diagnosis    = db.Column(db.String())
    prescription = db.Column(db.String())
    created_at   = db.Column(db.DateTime(), default=datetime.utcnow)
    charges      = db.Column(db.Integer(), default=150)   # ✅ uncomment this line
    patient = db.relationship("Patient",backref=db.backref('casepapers', lazy='dynamic', cascade='all, delete-orphan'))

class Doctor(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    full_name = db.Column(db.String(255))
    address = db.Column(db.String(255))
    degree = db.Column(db.String())
    user_id = db.Column(db.Integer(), db.ForeignKey("user.id"), unique=True)
    active = db.Column(db.Boolean(), default=True)
    user = db.relationship(
        "User",
        backref=db.backref("doctor", uselist=False)  # ✅ Bug 3 fix — singular "doctor" matches views.py usage
    )

class Patient(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    full_name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255))
    pincode = db.Column(db.String())
    dob = db.Column(db.String(), nullable=True)   # ✅ Bug 2 fix — allow null DOB
    age = db.Column(db.Integer(), nullable=True)   # ✅ Bug 2 fix — allow null age
    weight = db.Column(db.Integer())
    sex = db.Column(db.String())
    phone = db.Column(db.String())
    active = db.Column(db.Boolean, default=True)


class Expense(db.Model):
    id          = db.Column(db.Integer(), primary_key=True)
    doctor_id   = db.Column(db.Integer(), db.ForeignKey('doctor.id'), nullable=False)
    title       = db.Column(db.String(255), nullable=False)
    category    = db.Column(db.String(100), default="Other")  # Rent, Supplies, Equipment, Staff, Other
    amount      = db.Column(db.Float(),  nullable=False)
    date        = db.Column(db.String(), nullable=False)       # stored as YYYY-MM-DD string
    description = db.Column(db.String(500), default="")

    doctor = db.relationship("Doctor", backref=db.backref("expenses", lazy="dynamic"))