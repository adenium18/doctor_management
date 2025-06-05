import csv
from urllib import response
from flask import current_app as app, jsonify, request, render_template, send_file
from flask_security import auth_required, roles_required, verify_password, current_user
from datetime import datetime
from flask_restful import marshal, fields
import flask_excel as excel
from celery.result import AsyncResult
#from backend.celery.tasks import add, create_csv
from backend.models import User, db, Patient, Complaints

datastore= app.security.datastore
cache=app.cache

@app.route('/api/patients', methods=["GET","POST"])

def manage_patients():
    if request.method=="GET":
        patients=Patient.query.all()
        return jsonify([
            {
                "id":p.id,
                "full_name":p.full_name,
                "address":p.address,
                "pincode":p.pincode,
                "age":p.age,
                "weight":p.weight,
                "phone":p.phone,
                "sex":p.sex,
                "date_of_arrival":p.date_of_arrival
            }
             for p in patients
        ])
    
    elif request.method=="POST":
        data=request.json
        if not data.get("full_name"):
            return jsonify({"message": "Patient name mandatory"})
        
        new_patient= Patient(
            full_name=data['full_name'],
            address=data['address'],
            pincode=data['pincode'],
            age=data['age'],
            weight=data['weight'],
            phone=data["phone"],
            sex=data["sex"],
            date_of_arrival=data["date_of_arrival"]
        )

        db.session.add(new_patient)
        db.session.commit()
        return jsonify({"message":"patient profile created successfully"}),201
    

@app.route("/api/update/patient/<int:id>", methods=["GET","POST"])
def update_patient(id):
    patient= Patient.query.get_or_404(id)

    if patient.method=="GET":
        return jsonify({
                "id":patient.id,
                "full_name":patient.full_name,
                "address":patient.address,
                "pincode":patient.pincode,
                "weight":patient.weight,
                "age":patient.age,
                "weight":patient.weight,
                "phone":patient.phone,
                "sex":patient.sex,
                "date_of_arrival":patient.date_of_arrival
            
        })
    
    elif request.method=="POST":
        data=request.json
        patient.full_name=data['full_name'],
        patient.address=data['address'],
        patient.pincode=data['pincode'],
        patient.age=data['age'],
        patient.weight=data['weight'],
        patient.phone=data["phone"],
        patient.sex=data["sex"],
        patient.date_of_arrival=data["date_of_arrival"]
        db.session.commit()
        return jsonify({"message":"Patient details upadtaed successfully"})
    

@app.route("/delete/patient/<int:id>", methods=["DELETE"])

def delete_patient(id):
    patient = Patient.query.get_or_404(id)
    db.session.delete(patient)
    db.session.commit()
    return jsonify({"message": "patient deleted successfully"})


@app.get("/")
def home():
    return render_template("index.html")


@app.route("/user-login", methods=["POST"])
def user_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password):
        return jsonify({"message": "Invalid email or password"}), 401

    # Ensure the user is active
    if hasattr(user, "professional") and user.professional and not user.professional.active:
        return jsonify({"message": "Your account is not yet approved. Please wait for admin approval."}), 403


    
    # ✅ Check if user is a blocked customer
    if hasattr(user, "customer") and user.customer and not user.customer.active:
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
        "role": "admin" if any(role.name == "admin" for role in user.roles) else
                "professional" if user.professional else "customer"
    }), 200

@app.route("/user-details", methods=["GET"])
@auth_required("token")
def get_user_details():
    user = current_user
    user_data = {
        "id": user.id,
        "email": user.email,
        "role": "admin" if any(role.name == "admin" for role in user.roles) else
                "professional" if user.professional else "customer",}
    
    if hasattr(user, "customer") and user.customer:
        return jsonify({"email": user.email, "full_name": user.customer.full_name, "address":user.customer.address, "pincode": user.customer.pincode,"role": "customer"})
    if hasattr(user, "professional") and user.professional:
        return jsonify({"email":user.email, "full_name": user.professional.full_name, "address":user.professional.address, "pincode": user.professional.pincode, "role": "professional"})
    if any(role.name == "admin" for role in user.roles):
        return jsonify({"full_name": user.email, "role": "admin"})
    return jsonify({"message": "User not found"}), 404
