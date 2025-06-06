from socket import timeout
from flask import current_app as app, jsonify, request
from flask_restful import Resource, Api, reqparse, marshal, fields
from flask_security import auth_required, roles_required, current_user, hash_password
from .models import Patient, User,db, Complaints,Doctor
from werkzeug.security import generate_password_hash
from datetime import datetime


datastore = app.security.datastore
cache = app.cache
api = Api(prefix="/api")





parser1 = reqparse.RequestParser()

parser1.add_argument(
    "full_name",
    type=str,
    help="Full name is required and should be a string",
    required=True
)

parser1.add_argument(
    "Address",
    type=str,
    help="Address is required and should be a string",
)
parser1.add_argument(
    "sex",
    type=str,
    help="gender is required and should be a string",
    required=True,
)

parser1.add_argument(
    "dob",
    type=str,
    help="date of birth is required",
    required=True,
)

parser1.add_argument(
    "weight",
    type=int,
    help="weight is required and should be a string",
    required=True,
)

parser1.add_argument(
    "pincode",
    type=str,
    help="pincode is required and should be a string",
    required=True,
)
parser1.add_argument(
    "phone_number",
    type=str,
    help="contact number is required and should be a string",
)

parser1.add_argument(
    "date_of_arrival",
    type=str,
    help="date of arrival is required and should be a string",
)


patient_fields = {
    "id": fields.Integer,
    "full_name": fields.String,
    "pincode": fields.Integer,
    "address": fields.String,
    "dob": fields.String,
    "age":fields.Integer,
    "weight": fields.Integer,
    "sex":fields.String,
    "phone":fields.String,
    "date_of_arrival":fields.String,
}

class PatientAPI(Resource):
    def get(self):
        patients = Patient.query.all()
        return jsonify([{
            "id" : patient.id,
            "full_name": patient.full_name,
            "address" : patient.address,
            "pincode" : patient.pincode,
            "dob" : patient.dob,
            "age" : patient.age,
            "weight" : patient.weight,
            "sex" : patient.sex,
            "phone" : patient.phone,
            "date_of_arrival" : patient.date_of_arrival,
        } for patient in patients])
    

class  UpdatePatient(Resource):
    def get(self,id):
        patients=Patient.query.get(id)
        return marshal(patients, patient_fields)
    
    def post(self, id):
        patients=Patient.query.get(id)
        args=parser1.parse_args()
        patients.full_name=args.full_name
        patients.address=args.address
        patients.pincode=args.pincode
        patients.dob=args.dob
        patients.age=args.age
        patients.weight=args.weight
        patients.sex=args.sex
        patients.phone=args.phone
        patients.date_of_arrival=args.date_of_arrival
        db.session.commit()
        return {"message":"Patient Info updated"}






#============================create new doctor========================

parser2=reqparse.RequestParser()

parser2.add_argument(
    'email',type=str, help='Email required and should be a string', required=True
)

parser2.add_argument(
    "password", type=str, help="password required and should be a string", required=True
)

parser2.add_argument(
    "full_name", type=str, help="full name is required and should be A STRING", required=True
)

parser2.add_argument(
    "address", type=str, help="required with pincode"
)

parser2.add_argument(
    "degree", type=str, help="reuired and should be a string", required=True
)

doctor_fields={
    "id": fields.Integer,
    "full_name": fields.String,
    "address": fields.String,
    "degree": fields.String,
    "user_id": fields.Integer,
    "active":fields.Boolean,
}


class DoctorsAPI(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self):
        doctors = Doctor.query.all()
        if len(doctors) == 0:
            return {"message": "No User Found"}, 404
        return marshal(doctors, doctor_fields)

    def post(self):
        args = parser2.parse_args()
        datastore.create_user(
            email=args.email, password=hash_password(args.password), roles=["doctor"]
        )
        doctor = Doctor(
            full_name=args.full_name,
            address=args.address,
            degree=args.degree,
            user_id=User.query.filter_by(email=args.email).all()[0].id,
            active=True,
        )
        db.session.add(doctor)
        db.session.commit()
        return {"message": "New Doctor Added"}







































api.add_resource(PatientAPI,"/patients")
api.add_resource(Doctor,"/doctors")