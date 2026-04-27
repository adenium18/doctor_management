# ============================================================
# COMPLETE views.py — Multi-doctor data isolation
# Every route now filters by the LOGGED-IN doctor's ID
# Admin can see everything
# ============================================================

import csv
import io
import calendar
from flask import current_app as app, jsonify, request, render_template, Response
from flask_security import auth_required, roles_required, verify_password, hash_password, current_user
from datetime import datetime, date, timezone, timedelta
from backend.models import User, db, Patient, Casepaper, Doctor, Expense

datastore = app.security.datastore
cache     = app.cache

@app.get("/")
def home():
    return render_template("index.html")


# ---------------------------------------------------------------
# HELPER — get the logged-in doctor's Doctor.id safely
# ---------------------------------------------------------------
def get_current_doctor_id():
    """Returns Doctor.id for the logged-in doctor, or None if admin."""
    user = current_user
    if hasattr(user, "doctor") and user.doctor:
        return user.doctor.id
    return None


# ---------------------------------------------------------------
# PATIENTS
# ---------------------------------------------------------------
@app.route('/api/patients', methods=["GET", "POST"])
@auth_required("token")
@roles_required("doctor")
def manage_patients():
    doctor_id = get_current_doctor_id()

    if request.method == "GET":
        # ✅ Only return patients who have casepapers from THIS doctor
        # OR patients created by this doctor (via subquery)
        patient_ids = db.session.query(Casepaper.patient_id)\
            .filter_by(doctor_id=doctor_id).distinct()
        patients = Patient.query.filter(Patient.id.in_(patient_ids)).all()

        return jsonify([{
            "id":              p.id,
            "full_name":       p.full_name,
            "address":         p.address,
            "pincode":         p.pincode,
            "age":             p.age,
            "weight":          p.weight,
            "phone":           p.phone,
            "sex":             p.sex,
            "dob":             p.dob,
        } for p in patients]), 200

    elif request.method == "POST":
        data = request.json
        if not data.get("full_name", "").strip():
            return jsonify({"error": "Patient name is required"}), 400

        # Calculate age from dob if provided
        age = data.get("age", None)
        if data.get("dob") and not age:
            try:
                dob = datetime.strptime(data["dob"], "%Y-%m-%d").date()
                from datetime import date
                today = date.today()
                age = today.year - dob.year - (
                    (today.month, today.day) < (dob.month, dob.day)
                )
            except Exception:
                age = None

        new_patient = Patient(
            full_name = data.get("full_name", "").strip(),
            sex       = data.get("sex"),
            address   = data.get("address", ""),
            pincode   = data.get("pincode", ""),
            dob       = data.get("dob", None),
            age       = age,
            weight    = data.get("weight", None),
            phone     = data.get("phone", None),
        )
        db.session.add(new_patient)
        db.session.commit()
        db.session.refresh(new_patient)
        return jsonify({"id": new_patient.id, "message": "Patient created"}), 201


@app.route("/api/update-patient/<int:id>", methods=["GET", "PUT"])
@auth_required("token")
@roles_required("doctor")
def update_patient(id):
    doctor_id = get_current_doctor_id()
    patient   = Patient.query.get_or_404(id)

    # ✅ Security check — only allow if this doctor has a casepaper for this patient
    owns = Casepaper.query.filter_by(
        doctor_id=doctor_id, patient_id=id
    ).first()
    if not owns:
        return jsonify({"error": "Access denied"}), 403

    if request.method == "GET":
        return jsonify({
            "id":       patient.id,
            "full_name":patient.full_name,
            "address":  patient.address,
            "pincode":  patient.pincode,
            "weight":   patient.weight,
            "dob":      patient.dob,
            "age":      patient.age,
            "phone":    patient.phone,
            "sex":      patient.sex,
        })

    elif request.method == "PUT":
        data = request.json
        # Recalculate age if dob changed
        age = data.get("age", patient.age)
        if data.get("dob"):
            try:
                dob   = datetime.strptime(data["dob"], "%Y-%m-%d").date()
                today = date.today()
                age   = today.year - dob.year - (
                    (today.month, today.day) < (dob.month, dob.day)
                )
            except Exception:
                pass

        patient.full_name = data.get("full_name", patient.full_name).strip()
        patient.address   = data.get("address",   patient.address)
        patient.pincode   = data.get("pincode",   patient.pincode)
        patient.dob       = data.get("dob",       patient.dob)
        patient.age       = age
        patient.weight    = data.get("weight",    patient.weight)
        patient.phone     = data.get("phone",     patient.phone)
        patient.sex       = data.get("sex",       patient.sex)
        db.session.commit()
        return jsonify({"message": "Patient updated"}), 200


@app.route("/delete/patient/<int:id>", methods=["DELETE"])
@auth_required("token")
@roles_required("doctor")
def delete_patient(id):
    doctor_id = get_current_doctor_id()
    # ✅ Only delete if this doctor owns casepapers for this patient
    owns = Casepaper.query.filter_by(doctor_id=doctor_id, patient_id=id).first()
    if not owns:
        return jsonify({"error": "Access denied"}), 403
    patient = Patient.query.get_or_404(id)
    db.session.delete(patient)
    db.session.commit()
    return jsonify({"message": "Patient deleted"}), 200


# ---------------------------------------------------------------
# PATIENT SEARCH
# ---------------------------------------------------------------
@app.route("/api/patient/search")
@auth_required("token")
@roles_required("doctor")
def search_patient():
    db.session.expire_all()
    doctor_id = get_current_doctor_id()
    query     = request.args.get("query", "").strip()
    if not query:
        return jsonify({"error": "Query missing"}), 400

    # ✅ Only search patients this doctor has treated
    patient_ids = db.session.query(Casepaper.patient_id)\
        .filter_by(doctor_id=doctor_id).distinct()

    patients = Patient.query.filter(
        Patient.id.in_(patient_ids),
        Patient.full_name.ilike(f"%{query}%")
    ).all()

    # Also search ALL patients by name for new casepaper creation
    # (doctor may be seeing a new patient never seen before)
    all_matched = Patient.query.filter(
        Patient.full_name.ilike(f"%{query}%")
    ).all()

    result = []
    for patient in all_matched:
        latest = Casepaper.query.filter_by(
            patient_id=patient.id,
            doctor_id=doctor_id
        ).order_by(Casepaper.created_at.desc()).first()

        result.append({
            "id":         patient.id,
            "full_name":  patient.full_name,
            "age":        patient.age,
            "sex":        patient.sex,
            "address":    patient.address,
            "pincode":    patient.pincode,
            "dob":        patient.dob,
            "weight":     patient.weight,
            "phone":      patient.phone,
            "last_visit": latest.created_at.isoformat() if latest and latest.created_at else None
        })

    return jsonify(result), 200


# ---------------------------------------------------------------
# CASEPAPERS
# ---------------------------------------------------------------
@app.route("/api/casepapers", methods=["GET"])
@auth_required("token")
@roles_required("doctor")
def get_casepapers():
    doctor_id = get_current_doctor_id()
    query_str = request.args.get("query", "").strip().lower()
    year      = request.args.get("year")
    month     = request.args.get("month")
    day       = request.args.get("day")

    base = db.session.query(
        Casepaper.id.label("casepaper_id"),
        Casepaper.created_at,
        Casepaper.symptoms,
        Casepaper.diagnosis,
        Casepaper.prescription,
        Casepaper.charges,
        Casepaper.visit_type,
        Casepaper.payment_status,
        Patient.full_name,
        Patient.pincode,
        Patient.address,
        Patient.sex,
        Patient.weight,
        Patient.phone,
        Patient.age
    ).join(Patient, Casepaper.patient_id == Patient.id)\
     .filter(Casepaper.doctor_id == doctor_id)  # ✅ filter by logged-in doctor

    if query_str:
        search = f"%{query_str}%"
        base = base.filter(db.or_(
            Patient.full_name.ilike(search),
            Casepaper.symptoms.ilike(search),
            Casepaper.diagnosis.ilike(search),
            Casepaper.prescription.ilike(search)
        ))
    if year:
        base = base.filter(db.extract("year",  Casepaper.created_at) == int(year))
    if month:
        base = base.filter(db.extract("month", Casepaper.created_at) == int(month))
    if day:
        base = base.filter(db.extract("day",   Casepaper.created_at) == int(day))

    results = base.order_by(Casepaper.created_at.desc()).all()

    return jsonify([{
        "casepaper_id":   r.casepaper_id,
        "created_at":     r.created_at.isoformat() if r.created_at else None,
        "symptoms":       r.symptoms,
        "diagnosis":      r.diagnosis,
        "prescription":   r.prescription,
        "charges":        r.charges if r.charges is not None else 150,
        "visit_type":     r.visit_type     or "consultation",
        "payment_status": r.payment_status or "paid",
        "full_name":      r.full_name,
        "pincode":        r.pincode,
        "address":        r.address,
        "sex":            r.sex,
        "weight":         r.weight,
        "phone":          r.phone,
        "age":            r.age
    } for r in results])


@app.route("/delete/casepaper/<int:id>", methods=["DELETE"])
@auth_required("token")
@roles_required("doctor")
def delete_casepaper(id):
    doctor_id = get_current_doctor_id()
    casepaper = Casepaper.query.get_or_404(id)

    # ✅ Only the doctor who created it can delete it
    if casepaper.doctor_id != doctor_id:
        return jsonify({"error": "Access denied"}), 403

    db.session.delete(casepaper)
    db.session.commit()
    return jsonify({"message": "Casepaper deleted"}), 200


# ---------------------------------------------------------------
# SEARCH FOR DOCTOR
# ---------------------------------------------------------------
@app.route("/api/search-for-doctor")
@auth_required("token")
@roles_required("doctor")
def doctor_search():
    doctor_id   = get_current_doctor_id()
    search_type = request.args.get("type")
    query       = request.args.get("query", "").strip()
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
    ).join(Patient, Casepaper.patient_id == Patient.id)\
     .filter(Casepaper.doctor_id == doctor_id)  # ✅ filter by doctor

    if search_type == "name":
        base = base.filter(Patient.full_name.ilike(f"%{query}%"))
    elif search_type == "pincode":
        base = base.filter(Patient.pincode.ilike(f"%{query}%"))
    elif search_type in ("symptoms", "diagnosis", "prescription"):
        base = base.filter(getattr(Casepaper, search_type).ilike(f"%{query}%"))
    else:
        return jsonify({"results": []})

    rows = base.order_by(Casepaper.created_at.desc()).all()
    return jsonify({"results": [{
        "casepaper_id": r.casepaper_id,
        "full_name":    r.full_name,
        "pincode":      r.pincode,
        "symptoms":     r.symptoms,
        "diagnosis":    r.diagnosis,
        "prescription": r.prescription,
        "created_at":   r.created_at
    } for r in rows]}), 200


# ---------------------------------------------------------------
# DASHBOARD STATS
# ---------------------------------------------------------------
@app.route("/api/dashboard/stats")
@auth_required("token")
@roles_required("doctor")
def dashboard_stats():
    doctor_id = get_current_doctor_id()  # ✅ always use logged-in user, ignore param

    total_patients = db.session.query(Casepaper.patient_id)\
        .filter_by(doctor_id=doctor_id).distinct().count()

    now            = datetime.now(timezone.utc)
    first_of_month = datetime(now.year, now.month, 1)

    monthly_casepapers = Casepaper.query.filter(
        Casepaper.doctor_id  == doctor_id,
        Casepaper.created_at >= first_of_month
    ).all()

    total_casepapers = Casepaper.query.filter_by(doctor_id=doctor_id).count()
    monthly_earnings = sum((cp.charges or 0) for cp in monthly_casepapers)
    total_earnings   = db.session.query(
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


# ---------------------------------------------------------------
# BILLING
# ---------------------------------------------------------------
@app.route("/api/billing")
@auth_required("token")
@roles_required("doctor")
def billing():
    doctor_id = get_current_doctor_id()  # ✅ ignore frontend param, use server-side
    month     = request.args.get("month", type=int)
    year      = request.args.get("year",  type=int)

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

    rows   = query.order_by(Casepaper.created_at.desc()).all()
    result = [{
        "casepaper_id": r.casepaper_id,
        "created_at":   r.created_at,
        "charges":      r.charges or 0,
        "full_name":    r.full_name,
        "phone":        r.phone,
        "pincode":      r.pincode
    } for r in rows]

    return jsonify({"records": result, "total": sum(r["charges"] for r in result)}), 200


# ---------------------------------------------------------------
# EXPENSES
# ---------------------------------------------------------------
@app.route("/api/expenses", methods=["GET", "POST"])
@auth_required("token")
@roles_required("doctor")
def expenses():
    doctor_id = get_current_doctor_id()  # ✅ server-side, not from request param

    if request.method == "GET":
        month = request.args.get("month", type=int)
        year  = request.args.get("year",  type=int)

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
        exp  = Expense(
            doctor_id   = doctor_id,               # ✅ always server-side
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
    doctor_id = get_current_doctor_id()
    exp       = Expense.query.get_or_404(id)

    # ✅ Only delete own expenses
    if exp.doctor_id != doctor_id:
        return jsonify({"error": "Access denied"}), 403

    db.session.delete(exp)
    db.session.commit()
    return jsonify({"message": "Expense deleted"}), 200


# ---------------------------------------------------------------
# REPORTS
# ---------------------------------------------------------------
@app.route("/api/reports/monthly-earnings")
@auth_required("token")
@roles_required("doctor")
def report_monthly_earnings():
    doctor_id = get_current_doctor_id()
    month     = request.args.get("month", type=int)
    year      = request.args.get("year",  type=int)

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

    rows   = query.order_by(Casepaper.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["#", "Date", "Patient", "Phone", "Symptoms", "Diagnosis", "Charges (₹)"])
    total = 0
    for i, r in enumerate(rows, 1):
        writer.writerow([i, r.created_at, r.full_name, r.phone, r.symptoms, r.diagnosis, r.charges or 0])
        total += r.charges or 0
    writer.writerow([])
    writer.writerow(["", "", "", "", "", "TOTAL", total])
    output.seek(0)

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename=earnings_{year}_{month}.csv"}
    )


@app.route("/api/reports/patient-list")
@auth_required("token")
@roles_required("doctor")
def report_patient_list():
    doctor_id   = get_current_doctor_id()
    patient_ids = db.session.query(Casepaper.patient_id)\
        .filter_by(doctor_id=doctor_id).distinct()
    patients    = Patient.query.filter(Patient.id.in_(patient_ids)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["#", "Name", "DOB", "Age", "Sex", "Phone", "Address", "Pincode", "Weight"])
    for i, p in enumerate(patients, 1):
        writer.writerow([i, p.full_name, p.dob, p.age, p.sex, p.phone, p.address, p.pincode, p.weight])
    output.seek(0)

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=my_patients.csv"}
    )


@app.route("/api/reports/tax-summary")
@auth_required("token")
@roles_required("doctor")
def report_tax_summary():
    doctor_id = get_current_doctor_id()
    year      = request.args.get("year", type=int, default=datetime.now(timezone.utc).year)

    rows = db.session.query(
        db.extract("month", Casepaper.created_at).label("month"),
        db.func.sum(Casepaper.charges).label("total"),
        db.func.count(Casepaper.id).label("count")
    ).filter(
        Casepaper.doctor_id == doctor_id,
        db.extract("year", Casepaper.created_at) == year
    ).group_by("month").all()

    monthly     = {int(r.month): {"total": r.total or 0, "count": r.count} for r in rows}
    month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([f"Tax Summary — {year}"])
    writer.writerow([])
    writer.writerow(["Month", "Consultations", "Gross Income (₹)", "Est. Tax @30% (₹)"])
    grand = 0
    for m in range(1, 13):
        d   = monthly.get(m, {"total": 0, "count": 0})
        tax = round(d["total"] * 0.30, 2)
        writer.writerow([month_names[m-1], d["count"], d["total"], tax])
        grand += d["total"]
    writer.writerow([])
    writer.writerow(["TOTAL", "", grand, round(grand * 0.30, 2)])
    output.seek(0)

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename=tax_{year}.csv"}
    )


@app.route("/api/reports/gst-summary")
@auth_required("token")
@roles_required("doctor")
def report_gst_summary():
    doctor_id = get_current_doctor_id()
    year      = request.args.get("year", type=int, default=datetime.now(timezone.utc).year)

    exps = Expense.query.filter(
        Expense.doctor_id == doctor_id,
        db.extract("year", Expense.date) == year
    ).all()

    cats = {}
    for e in exps:
        cats.setdefault(e.category, 0)
        cats[e.category] += e.amount or 0

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([f"GST Summary — {year}"])
    writer.writerow(["Note: Medical consultations are GST-exempt in India."])
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
        headers={"Content-Disposition": f"attachment; filename=gst_{year}.csv"}
    )


# ---------------------------------------------------------------
# AUTH
# ---------------------------------------------------------------
@app.route("/user-login", methods=["POST"])
def user_login():
    data     = request.json
    email    = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password):
        return jsonify({"message": "Invalid email or password"}), 401

    if hasattr(user, "doctor") and user.doctor and not user.doctor.active:
        return jsonify({"message": "Your account has been blocked by admin"}), 403

    token     = user.get_auth_token()
    doctor_id = user.doctor.id if (hasattr(user, "doctor") and user.doctor) else None
    full_name = user.doctor.full_name if (hasattr(user, "doctor") and user.doctor) else user.email.split("@")[0]
    role      = "admin" if any(r.name == "admin" for r in user.roles) else "doctor"

    return jsonify({
        "message":   "Login successful",
        "token":     token,
        "user_id":   user.id,
        "doctor_id": doctor_id,
        "full_name": full_name,
        "role":      role
    }), 200


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
            "doctor_id": user.doctor.id,
            "user_id":   user.id
        })
    if any(r.name == "admin" for r in user.roles):
        return jsonify({"full_name": user.email, "role": "admin", "user_id": user.id})
    return jsonify({"message": "User not found"}), 404


# ---------------------------------------------------------------
# DOCTOR PROFILE — view and update own profile
# ---------------------------------------------------------------
@app.route("/api/doctor/profile", methods=["GET", "PUT"])
@auth_required("token")
@roles_required("doctor")
def doctor_profile():
    user   = current_user
    doctor = user.doctor
    if not doctor:
        return jsonify({"error": "Doctor profile not found"}), 404

    if request.method == "GET":
        return jsonify({
            "full_name": doctor.full_name,
            "address":   doctor.address,
            "degree":    doctor.degree,
            "email":     user.email,
        }), 200

    data = request.get_json()
    if data.get("full_name", "").strip():
        doctor.full_name = data["full_name"].strip()
    if "address" in data:
        doctor.address = data["address"]
    if "degree" in data:
        doctor.degree = data["degree"]
    db.session.commit()
    return jsonify({"message": "Profile updated"}), 200


# ---------------------------------------------------------------
# CHANGE PASSWORD
# ---------------------------------------------------------------
@app.route("/api/auth/change-password", methods=["POST"])
@auth_required("token")
def change_password():
    user = current_user
    data = request.get_json()
    current_pw = data.get("current_password", "")
    new_pw     = data.get("new_password", "")

    if not verify_password(current_pw, user.password):
        return jsonify({"error": "Current password is incorrect"}), 400
    if len(new_pw) < 4:
        return jsonify({"error": "New password must be at least 4 characters"}), 400

    user.password = hash_password(new_pw)
    db.session.commit()
    return jsonify({"message": "Password changed successfully"}), 200


# ---------------------------------------------------------------
# ADMIN — patients list (separate from doctor route)
# ---------------------------------------------------------------
@app.route("/api/patients/admin", methods=["GET"])
@auth_required("token")
@roles_required("admin")
def admin_get_patients():
    patients = Patient.query.order_by(Patient.id.desc()).all()
    return jsonify([{
        "id":        p.id,
        "full_name": p.full_name,
        "age":       p.age,
        "sex":       p.sex,
        "phone":     p.phone,
        "pincode":   p.pincode,
    } for p in patients]), 200


# ---------------------------------------------------------------
# ADMIN ONLY
# ---------------------------------------------------------------
@app.route("/api/doctors", methods=["GET", "POST"])
@auth_required("token")
@roles_required("admin")
def manage_doctors():
    if request.method == "GET":
        doctors = Doctor.query.all()
        return jsonify([{
            "id":        d.id,
            "full_name": d.full_name,
            "address":   d.address,
            "degree":    d.degree,
            "active":    d.active,
        } for d in doctors]), 200

    data = request.get_json()
    email    = data.get("email", "").strip()
    password = data.get("password", "")
    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400

    datastore = app.security.datastore
    try:
        user = datastore.create_user(
            email=email,
            password=hash_password(password),
            roles=["doctor"]
        )
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "User creation failed", "error": str(e)}), 400

    doctor = Doctor(
        full_name = data.get("full_name", "").strip() or email.split("@")[0],
        address   = data.get("address", ""),
        degree    = data.get("degree", ""),
        user_id   = user.id,
        active    = True,
    )
    db.session.add(doctor)
    db.session.commit()
    return jsonify({"message": "Doctor registered successfully"}), 201


@app.route("/api/doctors/<int:id>/toggle", methods=["POST"])
@auth_required("token")
@roles_required("admin")
def toggle_doctor(id):
    doctor        = Doctor.query.get_or_404(id)
    doctor.active = not doctor.active
    db.session.commit()
    status = "activated" if doctor.active else "blocked"
    return jsonify({"message": f"Doctor {status} successfully", "active": doctor.active}), 200


@app.route("/api/casepapers/admin", methods=["GET"])
@auth_required("token")
@roles_required("admin")
def admin_get_casepapers():
    """Admin-only route to see ALL casepapers across all doctors."""
    query_str = request.args.get("query", "").strip().lower()
    year      = request.args.get("year")
    month     = request.args.get("month")

    base = db.session.query(
        Casepaper.id.label("casepaper_id"),
        Casepaper.created_at,
        Casepaper.symptoms,
        Casepaper.diagnosis,
        Casepaper.prescription,
        Casepaper.charges,
        Patient.full_name,
        Patient.pincode
    ).join(Patient, Casepaper.patient_id == Patient.id)

    if query_str:
        search = f"%{query_str}%"
        base = base.filter(db.or_(
            Patient.full_name.ilike(search),
            Casepaper.symptoms.ilike(search),
            Casepaper.diagnosis.ilike(search),
        ))
    if year:
        base = base.filter(db.extract("year",  Casepaper.created_at) == int(year))
    if month:
        base = base.filter(db.extract("month", Casepaper.created_at) == int(month))

    results = base.order_by(Casepaper.created_at.desc()).all()
    return jsonify([{
        "casepaper_id": r.casepaper_id,
        "created_at":   r.created_at,
        "symptoms":     r.symptoms,
        "diagnosis":    r.diagnosis,
        "prescription": r.prescription,
        "charges":      r.charges or 0,
        "full_name":    r.full_name,
        "pincode":      r.pincode
    } for r in results])


# ---------------------------------------------------------------
# CASEPAPER PATIENT NAME — for PatientHistory
# ---------------------------------------------------------------
@app.route("/api/casepapers/patient/<int:patient_id>", methods=["GET"])
@auth_required("token")
@roles_required("doctor")
def get_casepapers_by_patient(patient_id):
    doctor_id  = get_current_doctor_id()
    patient    = Patient.query.get_or_404(patient_id)
    casepapers = Casepaper.query.filter_by(
        patient_id=patient_id, doctor_id=doctor_id
    ).order_by(Casepaper.created_at.desc()).all()

    return jsonify({
        "patient_name": patient.full_name,
        "casepapers": [{
            "id":             cp.id,
            "created_at":     cp.created_at.isoformat() if cp.created_at else None,
            "symptoms":       cp.symptoms,
            "diagnosis":      cp.diagnosis,
            "prescription":   cp.prescription,
            "charges":        cp.charges or 150,
            "visit_type":     getattr(cp, "visit_type",     "consultation"),
            "payment_status": getattr(cp, "payment_status", "paid"),
        } for cp in casepapers]
    }), 200


# ---------------------------------------------------------------
# CASEPAPER UPDATE — include new fields
# ---------------------------------------------------------------
@app.route("/api/casepaper/<int:id>", methods=["PUT"])
@auth_required("token")
@roles_required("doctor")
def update_casepaper(id):
    doctor_id = get_current_doctor_id()
    casepaper = Casepaper.query.get_or_404(id)

    if casepaper.doctor_id != doctor_id:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()
    casepaper.symptoms       = data.get("symptoms",       casepaper.symptoms)
    casepaper.diagnosis      = data.get("diagnosis",      casepaper.diagnosis)
    casepaper.prescription   = data.get("prescription",   casepaper.prescription)
    casepaper.charges        = data.get("charges",        casepaper.charges)
    casepaper.visit_type     = data.get("visit_type",     casepaper.visit_type     or "consultation")
    casepaper.payment_status = data.get("payment_status", casepaper.payment_status or "paid")
    db.session.commit()
    return jsonify({"message": "Casepaper updated"}), 200


# ---------------------------------------------------------------
# CASEPAPER CREATE — include new fields
# ---------------------------------------------------------------
@app.route("/api/casepaper", methods=["POST"])
@auth_required("token")
@roles_required("doctor")
def create_casepaper():
    doctor_id = get_current_doctor_id()
    data      = request.json

    if not all(f in data for f in ["symptoms", "diagnosis", "prescription"]):
        return jsonify({"error": "Missing required fields"}), 400

    patient = Patient.query.get(data.get("patient_id"))
    if not patient:
        return jsonify({"error": "Invalid patient_id"}), 404

    cp = Casepaper(
        patient_id   = patient.id,
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
    return jsonify({"message": "Casepaper created"}), 201


# ---------------------------------------------------------------
# FINANCE — P&L Statement
# ---------------------------------------------------------------
@app.route("/api/finance/pl")
@auth_required("token")
@roles_required("doctor")
def finance_pl():
    doctor_id = get_current_doctor_id()
    period    = request.args.get("period", "month")   # day | week | month | quarter | year | custom
    year      = request.args.get("year",  type=int, default=datetime.now(timezone.utc).year)
    month     = request.args.get("month", type=int)
    date_from = request.args.get("from")
    date_to   = request.args.get("to")

    now = datetime.now(timezone.utc)

    # Build date range
    if period == "day":
        d = date.today()
        date_from = datetime(d.year, d.month, d.day, 0, 0, 0)
        date_to   = datetime(d.year, d.month, d.day, 23, 59, 59)
    elif period == "week":
        today = date.today()
        start = today - timedelta(days=today.weekday())
        date_from = datetime(start.year, start.month, start.day, 0, 0, 0)
        date_to   = now
    elif period == "month":
        m = month or now.month
        date_from = datetime(year, m, 1)
        last_day  = calendar.monthrange(year, m)[1]
        date_to   = datetime(year, m, last_day, 23, 59, 59)
    elif period == "quarter":
        q         = ((now.month - 1) // 3) + 1
        qm        = (q - 1) * 3 + 1
        date_from = datetime(year, qm, 1)
        last_m    = qm + 2
        last_day  = calendar.monthrange(year, last_m)[1]
        date_to   = datetime(year, last_m, last_day, 23, 59, 59)
    elif period == "year":
        date_from = datetime(year, 1, 1)
        date_to   = datetime(year, 12, 31, 23, 59, 59)
    else:
        date_from = datetime.strptime(date_from, "%Y-%m-%d") if date_from else datetime(now.year, 1, 1)
        date_to   = datetime.strptime(date_to,   "%Y-%m-%d") if date_to   else now

    # Revenue from casepapers
    cp_q = Casepaper.query.filter(
        Casepaper.doctor_id  == doctor_id,
        Casepaper.created_at >= date_from,
        Casepaper.created_at <= date_to
    )
    casepapers       = cp_q.all()
    gross_revenue    = sum(c.charges or 0 for c in casepapers)
    paid_revenue     = sum(c.charges or 0 for c in casepapers
                           if getattr(c, "payment_status", "paid") == "paid")
    partial_revenue  = sum(c.charges or 0 for c in casepapers
                           if getattr(c, "payment_status", "paid") == "partial")
    unpaid_revenue   = sum(c.charges or 0 for c in casepapers
                           if getattr(c, "payment_status", "paid") == "unpaid")
    total_visits     = len(casepapers)

    # Expenses
    exp_q = Expense.query.filter(
        Expense.doctor_id == doctor_id,
        Expense.date      >= date_from.strftime("%Y-%m-%d"),
        Expense.date      <= date_to.strftime("%Y-%m-%d")
    )
    expenses       = exp_q.all()
    total_expenses = sum(e.amount or 0 for e in expenses)

    # P&L
    net_profit    = gross_revenue - total_expenses
    profit_margin = round((net_profit / gross_revenue * 100), 1) if gross_revenue else 0
    expense_ratio = round((total_expenses / gross_revenue * 100), 1) if gross_revenue else 0

    # Revenue by visit type — return as list of objects
    vt_map = {}
    for c in casepapers:
        vt = getattr(c, "visit_type", "consultation") or "consultation"
        if vt not in vt_map:
            vt_map[vt] = {"count": 0, "revenue": 0}
        vt_map[vt]["count"]   += 1
        vt_map[vt]["revenue"] += (c.charges or 0)
    visit_breakdown = [
        {
            "visit_type": vt,
            "count":      v["count"],
            "revenue":    v["revenue"],
            "avg_charge": round(v["revenue"] / v["count"], 0) if v["count"] else 0
        }
        for vt, v in vt_map.items()
    ]

    # Expense by category — return as list of objects
    cat_map = {}
    for e in expenses:
        cat_map[e.category] = cat_map.get(e.category, 0) + (e.amount or 0)
    expense_breakdown = [
        {"category": cat, "amount": amt}
        for cat, amt in sorted(cat_map.items(), key=lambda x: -x[1])
    ]

    return jsonify({
        "period":            period,
        "date_from":         date_from.strftime("%Y-%m-%d"),
        "date_to":           date_to.strftime("%Y-%m-%d"),
        "gross_revenue":     gross_revenue,
        "paid_revenue":      paid_revenue,
        "partial_revenue":   partial_revenue,
        "unpaid_revenue":    unpaid_revenue,
        "total_expenses":    total_expenses,
        "net_profit":        net_profit,
        "profit_margin":     profit_margin,
        "expense_ratio":     expense_ratio,
        "total_visits":      total_visits,
        "avg_per_visit":     round(gross_revenue / total_visits, 0) if total_visits else 0,
        "visit_breakdown":   visit_breakdown,
        "expense_breakdown": expense_breakdown,
    }), 200


# ---------------------------------------------------------------
# FINANCE — Monthly Revenue Trend (last 12 months)
# ---------------------------------------------------------------
@app.route("/api/finance/revenue-trend")
@auth_required("token")
@roles_required("doctor")
def finance_revenue_trend():
    doctor_id = get_current_doctor_id()
    mode      = request.args.get("mode", "monthly")   # daily | monthly | yearly | custom
    year      = request.args.get("year", type=int, default=datetime.now(timezone.utc).year)
    days_back = request.args.get("days", type=int, default=30)
    date_from = request.args.get("from")
    date_to   = request.args.get("to")
    now       = datetime.now(timezone.utc)

    labels = []
    revenue = []
    visits  = []

    if mode == "daily":
        start = now - timedelta(days=days_back)
        rows = db.session.query(
            db.func.date(Casepaper.created_at).label("day"),
            db.func.sum(Casepaper.charges).label("revenue"),
            db.func.count(Casepaper.id).label("visits")
        ).filter(
            Casepaper.doctor_id  == doctor_id,
            Casepaper.created_at >= start
        ).group_by("day").order_by("day").all()

        day_map = {str(r.day): {"revenue": r.revenue or 0, "visits": r.visits} for r in rows}
        cur = start.date()
        end = now.date()
        while cur <= end:
            key = str(cur)
            d   = day_map.get(key, {"revenue": 0, "visits": 0})
            labels.append(cur.strftime("%d %b"))
            revenue.append(d["revenue"])
            visits.append(d["visits"])
            cur += timedelta(days=1)

    elif mode == "monthly":
        rows = db.session.query(
            db.extract("month", Casepaper.created_at).label("month"),
            db.func.sum(Casepaper.charges).label("revenue"),
            db.func.count(Casepaper.id).label("visits")
        ).filter(
            Casepaper.doctor_id == doctor_id,
            db.extract("year",  Casepaper.created_at) == year
        ).group_by("month").all()

        month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        data    = {int(r.month): {"revenue": r.revenue or 0, "visits": r.visits} for r in rows}
        labels  = month_names
        revenue = [data.get(m, {}).get("revenue", 0) for m in range(1, 13)]
        visits  = [data.get(m, {}).get("visits",  0) for m in range(1, 13)]

    elif mode == "yearly":
        rows = db.session.query(
            db.extract("year", Casepaper.created_at).label("yr"),
            db.func.sum(Casepaper.charges).label("revenue"),
            db.func.count(Casepaper.id).label("visits")
        ).filter(
            Casepaper.doctor_id == doctor_id
        ).group_by("yr").order_by("yr").all()

        labels  = [str(int(r.yr)) for r in rows]
        revenue = [r.revenue or 0 for r in rows]
        visits  = [r.visits for r in rows]

    else:  # custom
        d_from = datetime.strptime(date_from, "%Y-%m-%d") if date_from else datetime(now.year, now.month, 1)
        d_to   = datetime.strptime(date_to,   "%Y-%m-%d") if date_to   else now
        delta  = (d_to - d_from).days

        if delta > 60:
            # Group by month for wide ranges
            mon_names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
            rows = db.session.query(
                db.extract("year",  Casepaper.created_at).label("yr"),
                db.extract("month", Casepaper.created_at).label("mo"),
                db.func.sum(Casepaper.charges).label("revenue"),
                db.func.count(Casepaper.id).label("visits")
            ).filter(
                Casepaper.doctor_id  == doctor_id,
                Casepaper.created_at >= d_from,
                Casepaper.created_at <= d_to
            ).group_by("yr", "mo").order_by("yr", "mo").all()
            labels  = [f"{mon_names[int(r.mo)]} {int(r.yr)}" for r in rows]
            revenue = [r.revenue or 0 for r in rows]
            visits  = [r.visits for r in rows]
        else:
            # Group by day for short ranges
            rows = db.session.query(
                db.func.date(Casepaper.created_at).label("day"),
                db.func.sum(Casepaper.charges).label("revenue"),
                db.func.count(Casepaper.id).label("visits")
            ).filter(
                Casepaper.doctor_id  == doctor_id,
                Casepaper.created_at >= d_from,
                Casepaper.created_at <= d_to
            ).group_by("day").order_by("day").all()
            day_map = {str(r.day): {"revenue": r.revenue or 0, "visits": r.visits} for r in rows}
            cur = d_from.date()
            end = d_to.date()
            while cur <= end:
                key = str(cur)
                d   = day_map.get(key, {"revenue": 0, "visits": 0})
                labels.append(cur.strftime("%d %b"))
                revenue.append(d["revenue"])
                visits.append(d["visits"])
                cur += timedelta(days=1)

    return jsonify({
        "labels":  labels,
        "revenue": revenue,
        "visits":  visits,
        "mode":    mode
    }), 200


# ---------------------------------------------------------------
# FINANCE — KPI Summary for Finance Dashboard
# ---------------------------------------------------------------
@app.route("/api/finance/kpis")
@auth_required("token")
@roles_required("doctor")
def finance_kpis():
    doctor_id = get_current_doctor_id()
    now       = datetime.now(timezone.utc)
    today     = date.today()

    # Today
    today_start = datetime(today.year, today.month, today.day, 0, 0, 0)
    today_cps   = Casepaper.query.filter(
        Casepaper.doctor_id  == doctor_id,
        Casepaper.created_at >= today_start
    ).all()
    today_revenue = sum(c.charges or 0 for c in today_cps)

    # This month
    month_start = datetime(now.year, now.month, 1)
    month_cps   = Casepaper.query.filter(
        Casepaper.doctor_id  == doctor_id,
        Casepaper.created_at >= month_start
    ).all()
    month_revenue = sum(c.charges or 0 for c in month_cps)

    # Last month
    lm_year  = now.year if now.month > 1 else now.year - 1
    lm_month = now.month - 1 if now.month > 1 else 12
    lm_days  = calendar.monthrange(lm_year, lm_month)[1]
    lm_start = datetime(lm_year, lm_month, 1)
    lm_end   = datetime(lm_year, lm_month, lm_days, 23, 59, 59)
    lm_cps   = Casepaper.query.filter(
        Casepaper.doctor_id  == doctor_id,
        Casepaper.created_at >= lm_start,
        Casepaper.created_at <= lm_end
    ).all()
    last_month_revenue = sum(c.charges or 0 for c in lm_cps)
    revenue_growth = round(
        ((month_revenue - last_month_revenue) / last_month_revenue * 100), 1
    ) if last_month_revenue else 0

    # This month expenses
    month_exp = Expense.query.filter(
        Expense.doctor_id == doctor_id,
        Expense.date      >= month_start.strftime("%Y-%m-%d")
    ).all()
    month_expenses = sum(e.amount or 0 for e in month_exp)

    # Unpaid revenue
    unpaid_cps = Casepaper.query.filter(
        Casepaper.doctor_id == doctor_id,
        Casepaper.payment_status == "unpaid"
    ).all() if hasattr(Casepaper, "payment_status") else []
    unpaid_revenue = sum(c.charges or 0 for c in unpaid_cps)

    # Total patients
    total_patients = db.session.query(Casepaper.patient_id)\
        .filter_by(doctor_id=doctor_id).distinct().count()

    # New patients this month
    new_patient_ids = db.session.query(Casepaper.patient_id).filter(
        Casepaper.doctor_id  == doctor_id,
        Casepaper.created_at >= month_start
    ).distinct().all()
    new_patient_ids = {r[0] for r in new_patient_ids}

    # Patients seen before this month
    old_patient_ids = db.session.query(Casepaper.patient_id).filter(
        Casepaper.doctor_id  == doctor_id,
        Casepaper.created_at < month_start
    ).distinct().all()
    old_patient_ids = {r[0] for r in old_patient_ids}
    repeat_this_month = len(new_patient_ids & old_patient_ids)
    new_this_month    = len(new_patient_ids - old_patient_ids)

    return jsonify({
        "today_revenue":       today_revenue,
        "today_visits":        len(today_cps),
        "month_revenue":       month_revenue,
        "month_visits":        len(month_cps),
        "last_month_revenue":  last_month_revenue,
        "revenue_growth":      revenue_growth,
        "month_expenses":      month_expenses,
        "net_profit":          month_revenue - month_expenses,
        "unpaid_revenue":      unpaid_revenue,
        "total_patients":      total_patients,
        "new_this_month":      new_this_month,
        "repeat_this_month":   repeat_this_month,
        "month":               now.strftime("%B %Y"),
    }), 200


# ---------------------------------------------------------------
# FINANCE — Top Patients by Revenue
# ---------------------------------------------------------------
@app.route("/api/finance/top-patients")
@auth_required("token")
@roles_required("doctor")
def finance_top_patients():
    doctor_id = get_current_doctor_id()
    limit     = request.args.get("limit", type=int, default=10)

    rows = db.session.query(
        Patient.id,
        Patient.full_name,
        Patient.phone,
        db.func.sum(Casepaper.charges).label("total_revenue"),
        db.func.count(Casepaper.id).label("total_visits"),
        db.func.max(Casepaper.created_at).label("last_visit")
    ).join(Casepaper, Casepaper.patient_id == Patient.id)\
     .filter(Casepaper.doctor_id == doctor_id)\
     .group_by(Patient.id)\
     .order_by(db.desc("total_revenue"))\
     .limit(limit).all()

    return jsonify([{
        "id":            r.id,
        "full_name":     r.full_name,
        "phone":         r.phone,
        "total_revenue": r.total_revenue or 0,
        "total_visits":  r.total_visits,
        "last_visit":    r.last_visit.strftime("%Y-%m-%d") if r.last_visit else None,
        "avg_per_visit": round((r.total_revenue or 0) / r.total_visits, 0) if r.total_visits else 0,
    } for r in rows]), 200


# ---------------------------------------------------------------
# FINANCE — Revenue by Weekday
# ---------------------------------------------------------------
@app.route("/api/finance/by-weekday")
@auth_required("token")
@roles_required("doctor")
def finance_by_weekday():
    doctor_id = get_current_doctor_id()
    year      = request.args.get("year", type=int, default=datetime.now(timezone.utc).year)

    casepapers = Casepaper.query.filter(
        Casepaper.doctor_id == doctor_id,
        db.extract("year",  Casepaper.created_at) == year
    ).all()

    days    = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    revenue = [0] * 7
    visits  = [0] * 7
    for c in casepapers:
        if c.created_at:
            wd = c.created_at.weekday()
            revenue[wd] += c.charges or 0
            visits[wd]  += 1

    return jsonify({"labels": days, "revenue": revenue, "visits": visits}), 200