import csv
from urllib import response
from flask import current_app as app, jsonify, request, render_template, send_file
from flask_security import auth_required, roles_required, verify_password, current_user
from datetime import datetime
from flask_restful import marshal, fields
import flask_excel as excel
from celery.result import AsyncResult
#from backend.celery.tasks import add, create_csv
from backend.models import User, db, Patient, Casepaper, Doctor

datastore= app.security.datastore
cache=app.cache
@app.get("/")
def home():
    return render_template("index.html")


@app.route('/api/patients', methods=["GET","POST"])
@auth_required("token")
@roles_required("doctor")
def manage_patients():
    if request.method == "GET":
        patients = Patient.query.all()
        if not patients:
            return jsonify([]), 200  # Still return 200 with empty list
        return jsonify([
            {
            "id": p.id,
            "full_name": p.full_name,
            "address": p.address,
            "pincode": p.pincode,
            "age": p.age,
            "weight": p.weight,
            "phone": p.phone,
            "sex": p.sex,
            "date_of_arrival": p.date_of_arrival
            } for p in patients
        ]), 200

    
    elif request.method=="POST":
        data=request.json
        required_fields = ["full_name", "sex"]

        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        new_patient = Patient(
        full_name=data.get("full_name"),
        
        sex=data.get("sex"),
        address=data.get("address", ""),
        pincode=data.get("pincode", ""),
        dob=data.get("dob", None),
        weight=data.get("weight", None),
        phone=data.get("phone", None),
        date_of_arrival=data.get("date_of_arrival", None)
    )

        db.session.add(new_patient)
        db.session.commit()
        return jsonify({"id":new_patient.id, "message":"patient profile created successfully"}),201
    

@app.route("/api/update-patient/<int:id>", methods=["GET","POST"])
def update_patient(id):
    patient= Patient.query.get_or_404(id)

    if request.method=="GET":
        return jsonify({
                "id":patient.id,
                "full_name":patient.full_name,
                "address":patient.address,
                "pincode":patient.pincode,
                "weight":patient.weight,
                "dob":patient.dob,
                "age":patient.age,
                "weight":patient.weight,
                "phone":patient.phone,
                "sex":patient.sex,
                
            
        })
    
    elif request.method == "POST":
        data = request.json
        patient.full_name = data.get('full_name')
        patient.address = data.get('address')
        patient.pincode = data.get('pincode')
        patient.dob = data.get('dob')
        patient.age = data.get('age')
        patient.weight = data.get('weight')
        patient.phone = data.get('phone')
        patient.sex = data.get('sex')
        
        db.session.commit()
        return jsonify({"message":"Patient details updated successfully"})
    

@app.route("/delete/patient/<int:id>", methods=["DELETE"])

def delete_patient(id):
    patient = Patient.query.get_or_404(id)
    db.session.delete(patient)
    db.session.commit()
    return jsonify({"message": "patient deleted successfully"})

# Create a new casepaper
@app.route("/api/casepaper", methods=["GET"])
@auth_required("token")
@roles_required("doctor")
def get_casepaper():
    casepaper_list = (
        db.session.query(
            Casepaper.id,
            Casepaper.doctor_id,
            Casepaper.patient_id,
            Patient.full_name,
            Patient.age,
            Patient.sex,
            Patient.address,
            Patient.weight,
            Patient.phone,
            Casepaper.created_at,
            Casepaper.symptoms,
            Casepaper.diagnosis,
            Casepaper.prescription
        )
        .join(Patient, Casepaper.patient_id == Patient.id)
        .join(Doctor, Casepaper.doctor_id == Doctor.id)
        .all()
    )

    if not casepaper_list:
        return jsonify({'message': "No casepaper / history found"}), 404

    return jsonify([
        {
            "id": req.id,
            "patient_id": req.patient_id,
            "doctor_id": req.doctor_id,
            "patient_name": req.full_name,
            "age": req.age,
            "sex": req.sex,
            "address": req.address,
            "weight": req.weight,
            "phone": req.phone,
            "created_at": req.created_at.strftime("%Y-%m-%d %H:%M"),
            "symptoms": req.symptoms,
            "diagnosis": req.diagnosis,
            "prescription": req.prescription
        } for req in casepaper_list
    ])


@app.route("/api/casepaper", methods=["POST"])
@auth_required("token")
@roles_required("doctor")
def create_casepaper():
    data = request.json
    required_fields = ["doctor_id", "symptoms", "diagnosis", "prescription"]

    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Optionally verify patient and doctor exist
    patient = Patient.query.get(data.get("patient_id"))
    doctor = Doctor.query.get(data.get("doctor_id"))
    if not patient or not doctor:
        return jsonify({"error": "Invalid patient_id or doctor_id"}), 404
    doctor_id=data.get("doctor_id")
    patient_id=data.get("patient_id")
    
    new_casepaper = Casepaper(
        patient_id=patient_id,
        doctor_id=doctor_id,
        symptoms=data.get("symptoms",""),
        diagnosis=data.get("diagnosis",""),
        prescription=data.get("prescription")
        # created_at auto-filled by default=datetime.utcnow
    )
    db.session.add(new_casepaper)
    db.session.commit()

    return jsonify({"message": "Casepaper created successfully"}), 201


#-----------------------------update casepaper--------------------------------------
@app.route('/api/casepaper/<int:id>', methods=['POST'])
@auth_required('token')
@roles_required('doctor')
def update_casepaper(id):
    casepaper = Casepaper.query.get_or_404(id)
    data = request.get_json()

    casepaper.symptoms = data.get('symptoms', casepaper.symptoms)
    casepaper.diagnosis = data.get('diagnosis', casepaper.diagnosis)
    casepaper.prescription = data.get('prescription', casepaper.prescription)

    db.session.commit()
    return jsonify({'message': 'Casepaper updated successfully'}), 200

#----------------------------------delete casepaper------------------------------------------

@app.route('/delete/casepaper/<int:id>', methods=['DELETE'])
@auth_required('token')
@roles_required('doctor')
def delete_casepaper(id):
    casepaper = Casepaper.query.get_or_404(id)
    db.session.delete(casepaper)
    db.session.commit()
    return jsonify({'message': 'Casepaper deleted successfully'}), 200


#--------------------------------search patient by name for doctor's homepage-----------------------------------------
@app.route("/api/patient/search")
@auth_required("token")
@roles_required("doctor")
def search_patient():
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify({"error": "Query missing"}), 400

    patients = Patient.query.filter(Patient.full_name.ilike(f"%{query}%")).all()
    if not patients:
        return jsonify(None), 200  # no patient found

    patient = patients[0]

    # ✅ Fetch the latest casepaper for the patient
    latest_casepaper = (
        Casepaper.query
        .filter_by(patient_id=patient.id)
        .order_by(Casepaper.created_at.desc())
        .first()
    )

    return jsonify({
        "id": patient.id,
        "full_name": patient.full_name,
        "age": patient.age,
        "sex": patient.sex,
        "address": patient.address,
        "pincode": patient.pincode,
        "dob": patient.dob if patient.dob else None,
        "weight": patient.weight,
        "phone": patient.phone,
        #"date_of_arrival": patient.date_of_arrival.strftime("%Y-%m-%d") if patient.date_of_arrival else None,
        # ✅ Add this field
        "last_visit": latest_casepaper.created_at if latest_casepaper else None
    })

#-----------------------------------------get casepaper by patient name-for /patient_history-------------
@app.route('/api/casepapers/patient/<int:patient_id>', methods=['GET'])
@auth_required('token')
@roles_required('doctor')
def get_casepapers_by_patient(patient_id):
    casepapers = Casepaper.query.filter_by(patient_id=patient_id).order_by(Casepaper.created_at.desc()).all()
    result = []
    for cp in casepapers:
        result.append({
            'id': cp.id,
            'created_at': cp.created_at,
            'symptoms': cp.symptoms,
            'diagnosis': cp.diagnosis,
            'prescription': cp.prescription
        })
    return jsonify({'casepapers': result}), 200

#-------------------------------------for serach-for-doctor-----------------------------------
@app.route("/api/search-for-doctor")
@auth_required("token")
@roles_required("doctor")
def doctor_search():
    search_type = request.args.get("type")
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify({"results": []})

    base = db.session.query(
        Casepaper.id.label("casepaper_id"),
        Patient.full_name,
        Patient.pincode,
        Casepaper.symptoms,
        Casepaper.diagnosis,
        Casepaper.prescription,
        Casepaper.created_at
    ).join(Patient, Casepaper.patient_id == Patient.id)

    if search_type == "name":
        base = base.filter(Patient.full_name.ilike(f"%{query}%"))
    elif search_type == "pincode":
        base = base.filter(Patient.pincode.ilike(f"%{query}%"))
    elif search_type in ("symptoms", "diagnosis", "prescription"):
        field = getattr(Casepaper, search_type)
        base = base.filter(field.ilike(f"%{query}%"))
    else:
        return jsonify({"results": []})

    rows = base.order_by(Casepaper.created_at.desc()).all()
    results = [{
        "casepaper_id": r.casepaper_id,
        "full_name": r.full_name,
        "pincode": r.pincode,
        "symptoms": r.symptoms,
        "diagnosis": r.diagnosis,
        "prescription": r.prescription,
        "created_at": r.created_at
    } for r in rows]

    return jsonify({"results": results}), 200


@app.route("/user-login", methods=["POST"])
def user_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password):
        return jsonify({"message": "Invalid email or password"}), 401

    
    # ✅ Check if user is a blocked doctor
    if hasattr(user, "doctor") and user.doctor and not user.doctor.active:
        return jsonify({"message": "Your account is blocked"}), 403



    # Generate token using Flask-Security
    token = user.get_auth_token()

    # Allow frontend to access the token
    #response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    #response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user_id": user.id,  # ✅ Fix: Include user_id

        "full_name": user.email.split('@')[0],  # Extract name from email
        "role": "admin" if any(role.name == "admin" for role in user.roles) else "doctor"
    }), 200

@app.route("/user-details", methods=["GET"])
@auth_required("token")
def get_user_details():
    user = current_user
    '''user_data = {
        "id": user.id,
        "email": user.email,
        
        "role": "admin" if any(role.name == "admin" for role in user.roles) else "doctor",}
    '''
    if hasattr(user, "doctor") and user.doctor:
        return jsonify({"full_name": user.doctor.full_name, "address":user.doctor.address, "degree": user.doctor.degree,"role": "doctor"})
    
    if any(role.name == "admin" for role in user.roles):
        return jsonify({"full_name": user.email, "role": "admin"})
    return jsonify({"message": "User not found"}), 404


   
@app.route("/api/doctors", methods=["GET"])
@auth_required("token")
@roles_required("admin")
def get_doctors():
    doctors = Doctor.query.all()
    
    if not doctors:
        return jsonify([])  # ✅ Return empty list instead of 404
    
    return jsonify([{
        "id": doctor.id,
        "full_name": doctor.full_name,
        "address": doctor.address,
        "degree": doctor.degree,
        "active":doctor.active,
    } for doctor in doctors])
