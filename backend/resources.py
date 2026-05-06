from socket import timeout
from flask import current_app as app, jsonify, request
from flask_restful import Resource, Api, reqparse, marshal, fields
from flask_security import auth_required, roles_required, current_user, hash_password
from .models import Patient, User,db, Casepaper,Doctor
from werkzeug.security import generate_password_hash
from datetime import datetime,date         # Optional: Calculate age from DOB



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
    "address",
    type=str,
    help="Address is required and should be a string",
)
parser1.add_argument(
    "sex",
    type=str,
    help="gender is required and should be a string",
)
parser1.add_argument(
    "age",
    type=int,
    help="Age in years",
)

parser1.add_argument(
    "dob",
    type=str,
    help="date of birth is required",
)

parser1.add_argument(
    "weight",
    type=int,
    help="weight is required and should be a string",
)

parser1.add_argument(
    "pincode",
    type=str,
    help="pincode is required and should be a string",
   
)
parser1.add_argument(
    "phone",
    type=str,
    help="contact number is required and should be a string",
)



patient_fields = {
    "id": fields.Integer,
    "full_name": fields.String,
    "pincode": fields.String,
    "address": fields.String,
    "dob": fields.String,
    #"age":fields.Integer,
    "weight": fields.Integer,
    "sex":fields.String,
    "phone":fields.String,
    "active": fields.Boolean,
}

class PatientAPI(Resource):
    @auth_required("token")
    @roles_required("doctor")
    def get(self):
        from flask_security import current_user
        doctor_id = None
        if hasattr(current_user, "doctor") and current_user.doctor:
            doctor_id = current_user.doctor.id

        patient_ids = db.session.query(Casepaper.patient_id)\
            .filter_by(doctor_id=doctor_id).distinct()
        patients = Patient.query.filter(Patient.id.in_(patient_ids)).all()

        return jsonify([{
            "id":        patient.id,
            "full_name": patient.full_name,
            "address":   patient.address,
            "pincode":   patient.pincode,
            "dob":       patient.dob,
            "age":       patient.age,
            "weight":    patient.weight,
            "sex":       patient.sex,
            "phone":     patient.phone,
        } for patient in patients])

    def post(self):
        args = parser1.parse_args()
        age = args.age
        if args.dob and not age:
            try:
                dob = datetime.strptime(args.dob, "%Y-%m-%d").date()
                today = date.today()
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            except Exception:
                pass

        new_patient = Patient(
            full_name=args.full_name.strip(),
            address=args.address,
            pincode=args.pincode,
            dob=args.dob,
            age=age,
            weight=args.weight,
            sex=args.sex,
            phone=args.phone,
        )
        db.session.add(new_patient)
        db.session.commit()
        db.session.refresh(new_patient)
        return {"message": "Patient profile created successfully", "id": new_patient.id, "patient_id": new_patient.id}, 201

class  UpdatePatient(Resource):
    def get(self,id):
        patients=Patient.query.get(id)
        return marshal(patients, patient_fields)
    
    def post(self, id):
        patients=Patient.query.get(id)
        args=parser1.parse_args()
        age = patients.age  # keep existing age by default
        if args.dob:
            try:
                dob = datetime.strptime(args.dob, "%Y-%m-%d").date()
                today = date.today()
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            except:
                pass
        patients.full_name=args.full_name.strip()
        patients.address=args.address
        patients.age=age,
        patients.pincode=args.pincode
        patients.dob=args.dob
        patients.weight=args.weight
        patients.sex=args.sex
        patients.phone=args.phone
        db.session.commit()
        return {"message":"Patient Info updated"}






#============================create new doctor========================

parser2 = reqparse.RequestParser()

parser2.add_argument(
    'email', type=str, help='Email required and should be a string', required=True
)

parser2.add_argument(
    "password", type=str, help="Password required and should be a string", required=True
)

parser2.add_argument(
    "full_name", type=str, help="Full name is required and should be a string", required=True
)

parser2.add_argument(
    "address", type=str, help="Address required with pincode"
)

parser2.add_argument(
    "degree", type=str, help="Degree is required and should be a string", required=True
)

# Output format for marshaling doctor data
doctor_fields = {
    "id": fields.Integer,
    "full_name": fields.String,
    "address": fields.String,
    "degree": fields.String,
    "user_id": fields.Integer,
    "active": fields.Boolean,
}


class DoctorsAPI(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self):
        doctors = Doctor.query.all()
        if not doctors:
            return {"doctors": []}, 200
        return marshal(doctors, doctor_fields), 200

    @auth_required("token")
    @roles_required("admin")
    def post(self):
        args = parser2.parse_args()

        # Create user
        try:
            datastore.create_user(
                email=args.email,
                password=hash_password(args.password),
                roles=["doctor"]
            )
        except Exception as e:
            return {"message": "User creation failed", "error": str(e)}, 400

        user = User.query.filter_by(email=args.email).first()
        if not user:
            return {"message": "User not found after creation"}, 500

        # Create doctor
        doctor = Doctor(
            full_name=args.full_name,
            address=args.address,
            degree=args.degree,
            user_id=user.id,
            active=True,
        )

        try:
            db.session.add(doctor)
            db.session.commit()
            return {"message": "New Doctor Added"}, 201
        except Exception as e:
            db.session.rollback()
            return {"message": "Failed to add doctor", "error": str(e)}, 500



# Request parser for casepaper creation
casepaper_parser = reqparse.RequestParser()
casepaper_parser.add_argument("patient_id", type=int, help="Patient ID is required")
casepaper_parser.add_argument("doctor_id", type=int, required=True, help="Doctor ID is required")
casepaper_parser.add_argument("symptoms", type=str, required=True, help="Symptoms are required")
casepaper_parser.add_argument("diagnosis", type=str, required=True, help="Diagnosis is required")
casepaper_parser.add_argument("prescription", type=str, required=True, help="Prescription is required")
casepaper_parser.add_argument("charges", type=int, required=False, default=150, help="Consultation charges")
 
casepaper_fields={
    "id":fields.Integer,
    "patient_id": fields.Integer,
    "doctor_id":fields.Integer,
    "patient_name":fields.String,
    "age":fields.Integer,
    "weight":fields.Integer,
    "sex":fields.String,
    "address":fields.String,
    "phone":fields.String,
    "symptoms": fields.String,
    "diagnosis": fields.String,
    "prescription": fields.String,
    "created_at":fields.String,

}

class CasepaperAPI(Resource):
    @auth_required("token")
    @roles_required("doctor")
    def get(self):
        doctor_id = current_user.doctor.id if (
            hasattr(current_user, "doctor") and current_user.doctor
        ) else None

        casepapers = Casepaper.query.filter_by(doctor_id=doctor_id).all() if doctor_id else []

        response = []
        for req in casepapers:
            patient = Patient.query.filter_by(id=req.patient_id).first()
            if not patient:
                continue
            response.append({
                "id":           req.id,
                "patient_id":   req.patient_id,
                "doctor_id":    req.doctor_id,
                "patient_name": patient.full_name,
                "age":          patient.age,
                "sex":          patient.sex,
                "weight":       patient.weight,
                "address":      patient.address,
                "phone":        patient.phone,
                "symptoms":     req.symptoms,
                "diagnosis":    req.diagnosis,
                "prescription": req.prescription,
                "created_at":   req.created_at.isoformat() if req.created_at else None,
            })
        return {"casepaper": marshal(response, casepaper_fields) if response else []}
    
    @auth_required("token")
    @roles_required("doctor")
    def post(self):
        try:
            data = request.get_json(force=True, silent=True) or {}
            patient_id = data.get("patient_id")
            if not patient_id:
                return {"message": "patient_id is required"}, 400
            if not all(data.get(f) for f in ["symptoms", "diagnosis", "prescription"]):
                return {"message": "symptoms, diagnosis, and prescription are required"}, 400

            doctor_id = current_user.doctor.id if hasattr(current_user, "doctor") and current_user.doctor else None
            if not doctor_id:
                return {"message": "Doctor profile not found"}, 403

            patient = Patient.query.get(patient_id)
            if not patient:
                return {"message": "Patient not found"}, 404

            cp = Casepaper(
                patient_id   = patient_id,
                doctor_id    = doctor_id,
                symptoms     = data.get("symptoms",     ""),
                diagnosis    = data.get("diagnosis",    ""),
                prescription = data.get("prescription", ""),
                charges      = data.get("charges",      150),
            )
            cp.visit_type     = data.get("visit_type",     "consultation")
            cp.payment_status = data.get("payment_status", "paid")
            cp.notes          = data.get("notes",          "")
            cp.next_followup  = data.get("next_followup",  None)
            db.session.add(cp)
            db.session.commit()
            db.session.refresh(cp)
            return {"message": "Casepaper created successfully", "casepaper_id": cp.id}, 201
        except Exception as e:
            db.session.rollback()
            return {"message": "Error creating casepaper", "error": str(e)}, 400
        



# NOTE: PatientAPI GET is shadowed by manage_patients in routes.py for doctor-filtered results.
# PatientAPI POST is kept here (routes.py POST is registered after and Flask picks first match).
# CasepaperAPI and DoctorsAPI POSTs are superseded by routes.py — registrations kept for GET only.
api.add_resource(PatientAPI,"/patients")
api.add_resource(DoctorsAPI,"/doctors")
api.add_resource(CasepaperAPI,"/casepaper")
api.add_resource(UpdatePatient, "/patients/<int:id>")
