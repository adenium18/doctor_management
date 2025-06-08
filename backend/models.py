from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin,RoleMixin
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
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    doctor_id = db.Column(db.Integer, nullable=False)  # Or ForeignKey if you have a Doctor model
    symptoms = db.Column(db.Text)
    diagnosis = db.Column(db.Text)
    prescription = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
class Doctor(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    full_name = db.Column(db.String(255))
    address = db.Column(db.String(255))
    degree = db.Column(db.String())
    user_id = db.Column(db.Integer(), db.ForeignKey("user.id"), unique=True)
    user = db.relationship("User", backref=db.backref("doctors", uselist=False))
    active = db.Column(db.Boolean(), default=True)

class Patient(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    full_name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255))
    pincode = db.Column(db.String())
    dob = db.Column(db.String(),nullable=False)
    age = db.Column(db.Integer(),nullable=False)
    weight = db.Column(db.Integer())
    sex = db.Column(db.String())
    phone = db.Column(db.String(), unique=True)
    date_of_arrival = db.Column(db.String(),nullable=False)
    active = db.Column(db.Boolean, default=True)

class Complaints(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    patient_id = db.Column(db.Integer(), db.ForeignKey("patient.id"))
    complaints = db.Column(db.String(),nullable=False)
    findings = db.Column(db.String())
    feedback =db.Column(db.String())
    treatment = db.Column(db.String())
    weight = db.Column(db.Integer())
    date = db.Column(db.String(),nullable=False)
    fees = db.Column(db.Integer())
