from socket import timeout
from flask import current_app as app, jsonify, request
from flask_restful import Resource, Api, reqparse, marshal, fields
from flask_security import auth_required, roles_required, current_user, hash_password
from .models import Patient, User,db, Complaints
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


api.add_resource(PatientAPI,"/patients")