from flask_security import SQLAlchemyUserDatastore, hash_password
from backend.models import db, Doctor
from flask import current_app as app

with app.app_context():
    db.create_all()

    userdatastore: SQLAlchemyUserDatastore = app.security.datastore

    # ✅ Commit roles first before creating any users
    userdatastore.find_or_create_role(id=1, name="admin", description="admin")
    userdatastore.find_or_create_role(id=2, name="doctor", description="professional_doctor")
    db.session.commit()  # ✅ roles must be committed before assigning to users

    if not userdatastore.find_user(email="admin@abc.in"):
        userdatastore.create_user(
            email="admin@abc.in",
            password=hash_password("pass"),
            roles=["admin"],
        )
        db.session.commit()

    # ✅ Separate bool flag from the Doctor object
    create_doctor = False
    doc_user = None

    if not userdatastore.find_user(email="doctor@abc.in"):
        doc_user = userdatastore.create_user(
            email="doctor@abc.in",
            password=hash_password("1234"),
            roles=["doctor"],
        )
        create_doctor = True

    db.session.commit()

    # ✅ Use separate variable for Doctor model object
    if create_doctor and doc_user:
        new_doctor = Doctor(
            full_name="Kumar SV",
            address="Mumbai",
            degree="MBBS",
            user_id=doc_user.id,  # ✅ use doc_user, not DOC_user (was undefined if rerun)
            active=True,
        )
        db.session.add(new_doctor)
        db.session.commit()