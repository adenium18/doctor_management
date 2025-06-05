from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin
from datetime import datetime

db = SQLAlchemy()


class User(db.Model, UserMixin):
    id = db.Column(db.Integer(), primary_key=True)
    email = db.Column(db.String, unique=True)
    password = db.Column(db.String(255))
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False)


class Patient(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    full_name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255))
    pincode = db.Column(db.Integer())
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
