import csv
import io
from urllib import response
from flask import Response, current_app as app, jsonify, request, render_template, send_file
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
        full_name=data.get("full_name").strip(),
        age=data.get("age", None),
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
    

@app.route("/api/update-patient/<int:id>", methods=["GET","PUT"])
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
    
    elif request.method == "PUT":
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




@app.route("/api/casepapers", methods=["GET"])
@auth_required("token")
@roles_required("doctor")
def get_casepapers():
    query_str = request.args.get("query", "").strip().lower()
    year  = request.args.get("year")
    month = request.args.get("month")
    day   = request.args.get("day")
 
    base = db.session.query(
        Casepaper.id.label("casepaper_id"),
        Casepaper.created_at,
        Casepaper.symptoms,
        Casepaper.diagnosis,
        Casepaper.prescription,
        Casepaper.charges,          # ✅ include charges
        Patient.full_name,
        Patient.pincode,
        Patient.address,
        Patient.sex,
        Patient.weight,
        Patient.phone,
        Patient.age
    ).join(Patient, Casepaper.patient_id == Patient.id)
 
    if query_str:
        search = f"%{query_str}%"
        base = base.filter(
            db.or_(
                Patient.full_name.ilike(search),
                Casepaper.symptoms.ilike(search),
                Casepaper.diagnosis.ilike(search),
                Casepaper.prescription.ilike(search)
            )
        )
 
    if year:
        base = base.filter(db.extract("year",  Casepaper.created_at) == int(year))
    if month:
        base = base.filter(db.extract("month", Casepaper.created_at) == int(month))
    if day:
        base = base.filter(db.extract("day",   Casepaper.created_at) == int(day))
 
    results = base.order_by(Casepaper.created_at.desc()).all()
 
    return jsonify([{
        "casepaper_id": r.casepaper_id,
        "created_at":   r.created_at,
        "symptoms":     r.symptoms,
        "diagnosis":    r.diagnosis,
        "prescription": r.prescription,
        "charges":      r.charges if r.charges is not None else 150,  # ✅ never return null
        "full_name":    r.full_name,
        "pincode":      r.pincode,
        "address":      r.address,
        "sex":          r.sex,
        "weight":       r.weight,
        "phone":        r.phone,
        "age":          r.age
    } for r in results])


 
@app.route("/api/casepaper", methods=["POST"])
@auth_required("token")
@roles_required("doctor")
def create_casepaper():
    data = request.json
    required_fields = ["doctor_id", "symptoms", "diagnosis", "prescription"]
 
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
 
    patient = Patient.query.get(data.get("patient_id"))
    doctor  = Doctor.query.get(data.get("doctor_id"))
    if not patient or not doctor:
        return jsonify({"error": "Invalid patient_id or doctor_id"}), 404
 
    new_casepaper = Casepaper(
        patient_id   = data.get("patient_id"),
        doctor_id    = data.get("doctor_id"),
        symptoms     = data.get("symptoms", ""),
        diagnosis    = data.get("diagnosis", ""),
        prescription = data.get("prescription"),
        charges      = data.get("charges", 150),   # ✅ read charges from request
        # created_at auto-filled by default=datetime.utcnow
    )
    db.session.add(new_casepaper)
    db.session.commit()
 
    return jsonify({"message": "Casepaper created successfully"}), 201
 
 
 
#-----------------------------update casepaper--------------------------------------
@app.route('/api/casepaper/<int:id>', methods=['PUT'])
@auth_required('token')
@roles_required('doctor')
def update_casepaper(id):
    casepaper = Casepaper.query.get_or_404(id)
    data = request.get_json()
 
    casepaper.symptoms     = data.get('symptoms',     casepaper.symptoms)
    casepaper.diagnosis    = data.get('diagnosis',    casepaper.diagnosis)
    casepaper.prescription = data.get('prescription', casepaper.prescription)
    casepaper.charges      = data.get('charges',      casepaper.charges)  # ✅ update charges
 
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
    db.session.expire_all()
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify({"error": "Query missing"}), 400

    patients = Patient.query.filter(Patient.full_name.ilike(f"%{query}%")).all()
    if not patients:
        return jsonify([]), 200  # Return empty list if no patient found

    # ✅ Return a list of matched patients with basic details and their last visit
    result = []
    for patient in patients:
        latest_casepaper = (
            Casepaper.query
            .filter_by(patient_id=patient.id)
            .order_by(Casepaper.created_at.desc())
            .first()
        )
        result.append({
            "id": patient.id,
            "full_name": patient.full_name,
            "age": patient.age,
            "sex": patient.sex,
            "address": patient.address,
            "pincode": patient.pincode,
            "dob": patient.dob if patient.dob else None,
            "weight": patient.weight,
            "phone": patient.phone,
            "last_visit": latest_casepaper.created_at if latest_casepaper else None
        })

    return jsonify(result), 200

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
    doctor_id = None
    if hasattr(user, "doctor") and user.doctor:
        doctor_id = user.doctor.id
 
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user_id": user.id,  # ✅ Fix: Include user_id
        "doctor_id": doctor_id,          # ✅ add this — needed for billing/dashboard
        "full_name": user.email.split('@')[0],  # Extract name from email
        "role": "admin" if any(role.name == "admin" for role in user.roles) else "doctor"
    }), 200


   
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



# ============================================================
# ADD THESE ROUTES TO YOUR EXISTING views.py
# ============================================================

# At the top of views.py, add these imports if not already present:
# from datetime import datetime, date
# import io, csv
# from flask import Response

# ---------------------------------------------------------------
# DASHBOARD STATS
# ---------------------------------------------------------------
# ============================================================
# FIX 1 — In views.py, update get_user_details to return doctor_id
# ============================================================

@app.route("/user-details", methods=["GET"])
@auth_required("token")
def get_user_details():
    user = current_user
    if hasattr(user, "doctor") and user.doctor:
        return jsonify({
            "full_name": user.doctor.full_name,
            "address":   user.doctor.address,
            "degree":    user.doctor.degree,
            "role":      "doctor",
            "doctor_id": user.doctor.id,      # ✅ add this — Dashboard needs it
            "user_id":   user.id
        })
    if any(role.name == "admin" for role in user.roles):
        return jsonify({"full_name": user.email, "role": "admin", "user_id": user.id})
    return jsonify({"message": "User not found"}), 404


# ============================================================
# FIX 2 — In views.py, fix dashboard_stats datetime comparison
# ============================================================

@app.route("/api/dashboard/stats")
@auth_required("token")
@roles_required("doctor")
def dashboard_stats():
    doctor_id = request.args.get("doctor_id", type=int)
    if not doctor_id:
        return jsonify({"error": "doctor_id required"}), 400

    total_patients = Patient.query.count()

    # ✅ Bug 4 fix — use datetime objects not date objects for DateTime column comparison
    now             = datetime.utcnow()
    first_of_month  = datetime(now.year, now.month, 1)   # datetime not date

    monthly_casepapers = Casepaper.query.filter(
        Casepaper.doctor_id == doctor_id,
        
        Casepaper.created_at >= first_of_month
    ).all()

    total_casepapers = Casepaper.query.filter_by(doctor_id=doctor_id).count()

    monthly_earnings = sum((cp.charges or 0) for cp in monthly_casepapers)

    total_earnings = db.session.query(
        db.func.sum(Casepaper.charges)
    ).filter_by(doctor_id=doctor_id).scalar() or 0

    return jsonify({
        "total_patients":     total_patients,
        "total_casepapers":   total_casepapers,
        "monthly_casepapers": len(monthly_casepapers),
        "monthly_earnings":   monthly_earnings,
        "total_earnings":     int(total_earnings),
        "month":              now.strftime("%B %Y")
    }), 200
    return jsonify({
        "debug_doctor_id_received": doctor_id,
        "debug_all_casepapers": [(c.id, c.doctor_id, c.charges) for c in Casepaper.query.all()],
        "debug_matched": [(c.id, c.doctor_id) for c in Casepaper.query.filter_by(doctor_id=doctor_id).all()]
    })
# ---------------------------------------------------------------
# BILLING — per patient/month summary
# ---------------------------------------------------------------
@app.route("/api/billing")
@auth_required("token")
@roles_required("doctor")
def billing():
    """Returns billing records — optionally filtered by month/year."""
    doctor_id = request.args.get("doctor_id", type=int)
    month     = request.args.get("month",     type=int)
    year      = request.args.get("year",      type=int)

    query = db.session.query(
        Casepaper.id.label("casepaper_id"),
        Casepaper.created_at,
        Casepaper.charges,
        Patient.full_name,
        Patient.phone,
        Patient.pincode
    ).join(Patient, Casepaper.patient_id == Patient.id)\
     .filter(Casepaper.doctor_id == doctor_id)

    if year:
        query = query.filter(db.extract("year",  Casepaper.created_at) == year)
    if month:
        query = query.filter(db.extract("month", Casepaper.created_at) == month)

    rows = query.order_by(Casepaper.created_at.desc()).all()

    result = [{
        "casepaper_id": r.casepaper_id,
        "created_at":   r.created_at,
        "charges":      r.charges or 0,
        "full_name":    r.full_name,
        "phone":        r.phone,
        "pincode":      r.pincode
    } for r in rows]

    total = sum(r["charges"] for r in result)
    return jsonify({"records": result, "total": total}), 200


# ---------------------------------------------------------------
# EXPENSE TRACKER
# ---------------------------------------------------------------
@app.route("/api/expenses", methods=["GET", "POST"])
@auth_required("token")
@roles_required("doctor")
def expenses():
    from backend.models import Expense  # make sure to add Expense model (see models.py note below)

    if request.method == "GET":
        doctor_id = request.args.get("doctor_id", type=int)
        month     = request.args.get("month",     type=int)
        year      = request.args.get("year",      type=int)

        q = Expense.query.filter_by(doctor_id=doctor_id)
        if year:
            q = q.filter(db.extract("year",  Expense.date) == year)
        if month:
            q = q.filter(db.extract("month", Expense.date) == month)

        items = q.order_by(Expense.date.desc()).all()
        return jsonify([{
            "id":          e.id,
            "title":       e.title,
            "category":    e.category,
            "amount":      e.amount,
            "date":        e.date,
            "description": e.description
        } for e in items]), 200

    elif request.method == "POST":
        data = request.json
        exp = Expense(
            doctor_id   = data.get("doctor_id"),
            title       = data.get("title"),
            category    = data.get("category", "Other"),
            amount      = data.get("amount"),
            date        = data.get("date"),
            description = data.get("description", "")
        )
        db.session.add(exp)
        db.session.commit()
        return jsonify({"message": "Expense added", "id": exp.id}), 201


@app.route("/api/expenses/<int:id>", methods=["DELETE"])
@auth_required("token")
@roles_required("doctor")
def delete_expense(id):
    from backend.models import Expense
    exp = Expense.query.get_or_404(id)
    db.session.delete(exp)
    db.session.commit()
    return jsonify({"message": "Expense deleted"}), 200


# ---------------------------------------------------------------
# REPORTS — CSV downloads (Excel-compatible)
# ---------------------------------------------------------------
@app.route("/api/reports/monthly-earnings")
@auth_required("token")
@roles_required("doctor")
def report_monthly_earnings():
    """Download monthly earnings as CSV (opens in Excel)."""
    doctor_id = request.args.get("doctor_id", type=int)
    month     = request.args.get("month",     type=int)
    year      = request.args.get("year",      type=int)

    query = db.session.query(
        Casepaper.id,
        Casepaper.created_at,
        Casepaper.charges,
        Casepaper.symptoms,
        Casepaper.diagnosis,
        Patient.full_name,
        Patient.phone
    ).join(Patient, Casepaper.patient_id == Patient.id)\
     .filter(Casepaper.doctor_id == doctor_id)

    if year:
        query = query.filter(db.extract("year",  Casepaper.created_at) == year)
    if month:
        query = query.filter(db.extract("month", Casepaper.created_at) == month)

    rows = query.order_by(Casepaper.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["#", "Date", "Patient Name", "Phone", "Symptoms", "Diagnosis", "Charges (₹)"])
    total = 0
    for i, r in enumerate(rows, 1):
        writer.writerow([i, r.created_at, r.full_name, r.phone, r.symptoms, r.diagnosis, r.charges or 0])
        total += r.charges or 0
    writer.writerow([])
    writer.writerow(["", "", "", "", "", "TOTAL", total])

    output.seek(0)
    filename = f"earnings_{year or 'all'}_{month or 'all'}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.route("/api/reports/patient-list")
@auth_required("token")
@roles_required("doctor")
def report_patient_list():
    """Download full patient list as CSV."""
    patients = Patient.query.order_by(Patient.full_name).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["#", "Full Name", "DOB", "Age", "Sex", "Phone", "Address", "Pincode", "Weight"])
    for i, p in enumerate(patients, 1):
        writer.writerow([i, p.full_name, p.dob, p.age, p.sex, p.phone, p.address, p.pincode, p.weight])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=patient_list.csv"}
    )


@app.route("/api/reports/tax-summary")
@auth_required("token")
@roles_required("doctor")
def report_tax_summary():
    """Download yearly tax summary as CSV."""
    doctor_id = request.args.get("doctor_id", type=int)
    year      = request.args.get("year", type=int, default=datetime.utcnow().year)

    # Group earnings by month
    monthly = {}
    rows = db.session.query(
        db.extract("month", Casepaper.created_at).label("month"),
        db.func.sum(Casepaper.charges).label("total"),
        db.func.count(Casepaper.id).label("count")
    ).filter(
        Casepaper.doctor_id == doctor_id,
        db.extract("year", Casepaper.created_at) == year
    ).group_by("month").all()

    for r in rows:
        monthly[int(r.month)] = {"total": r.total or 0, "count": r.count}

    month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([f"Tax Summary — FY {year}"])
    writer.writerow([])
    writer.writerow(["Month", "Consultations", "Gross Income (₹)", "Est. Tax @30% (₹)"])
    grand_total = 0
    for m in range(1, 13):
        data = monthly.get(m, {"total": 0, "count": 0})
        tax  = round(data["total"] * 0.30, 2)
        writer.writerow([month_names[m-1], data["count"], data["total"], tax])
        grand_total += data["total"]
    writer.writerow([])
    writer.writerow(["TOTAL", "", grand_total, round(grand_total * 0.30, 2)])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename=tax_summary_{year}.csv"}
    )


@app.route("/api/reports/gst-summary")
@auth_required("token")
@roles_required("doctor")
def report_gst_summary():
    """Download GST summary as CSV. Note: Medical consultations are GST-exempt in India,
       but clinic supplies/equipment may attract GST. This report shows expenses by category."""
    doctor_id = request.args.get("doctor_id", type=int)
    year      = request.args.get("year", type=int, default=datetime.utcnow().year)

    from backend.models import Expense
    expenses = Expense.query.filter(
        Expense.doctor_id == doctor_id,
        db.extract("year", Expense.date) == year
    ).all()

    # Group by category
    cats = {}
    for e in expenses:
        cats.setdefault(e.category, 0)
        cats[e.category] += e.amount or 0

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([f"GST / Expense Summary — {year}"])
    writer.writerow(["Note: Medical consultations are GST-exempt under Indian tax law."])
    writer.writerow([])
    writer.writerow(["Category", "Total Expense (₹)", "GST @18% (₹)"])
    grand = 0
    for cat, amt in cats.items():
        writer.writerow([cat, amt, round(amt * 0.18, 2)])
        grand += amt
    writer.writerow([])
    writer.writerow(["TOTAL", grand, round(grand * 0.18, 2)])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename=gst_summary_{year}.csv"}
    )