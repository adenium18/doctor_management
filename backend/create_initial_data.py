from flask_security import SQLAlchemyUserDatastore, hash_password
from backend.models import db,Doctor

from flask import current_app as app

with app.app_context():
    db.create_all()

    userdatastore : SQLAlchemyUserDatastore = app.security.datastore

    userdatastore.find_or_create_role(id=1, name="admin", description="admin")
    userdatastore.find_or_create_role(id=2, name="doctor", description="professional_doctor")
   
    if not userdatastore.find_user(email="admin@abc.in"):
        userdatastore.create_user(
            email="admin@abc.in",
            password=hash_password("pass"),
            roles=["admin"],
        )
        db.session.commit()

    doctor = False
    if not userdatastore.find_user(email="doctor@abc.in"):
        DOC_user = userdatastore.create_user(
            email="doctor@abc.in",
            password=hash_password("1234"),
            roles=["doctor"],
        )
        doctor = True

    db.session.commit()

    if doctor:
        doctor = Doctor(
            full_name="Kumar SV",
            address="Mumbai",
            degree="MBBS",
            user_id=DOC_user.id,
            active=True,
        )
        db.session.add(doctor)
    db.session.commit()