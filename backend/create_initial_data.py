from flask_security import SQLAlchemyUserDatastore, hash_password
from backend.models import db

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

    db.session.commit()