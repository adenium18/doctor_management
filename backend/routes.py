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

@app.route('/api/patients', method=["GET","POST"])

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
    

@app.route("/api/update/patient/<int:id>", method=["GET","POST"])
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