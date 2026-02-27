from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

import models
import schemas
from database import engine, SessionLocal, Base

# 🔹 Create DB tables
Base.metadata.create_all(bind=engine)

# 🔹 Create FastAPI app FIRST
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------- TEST API ----------------
@app.get("/")
def home():
    return {"message": "Backend is working 🚀"}

# ---------------- USER APIs ----------------
@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(
        name=user.name,
        email=user.email,
        role=user.role
    )
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    return db_user

@app.get("/users/", response_model=list[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

# ---------------- COMPLAINT APIs ----------------
@app.post("/complaints/", response_model=schemas.ComplaintResponse)
def create_complaint(
    complaint: schemas.ComplaintCreate,
    db: Session = Depends(get_db)
):
    new_complaint = models.Complaint(
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,
        user_email=complaint.user_email,
        status="Open"
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint

@app.get("/complaints/", response_model=list[schemas.ComplaintResponse])
def get_complaints(db: Session = Depends(get_db)):
    return db.query(models.Complaint).all()