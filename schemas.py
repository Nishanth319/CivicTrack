from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    role: str = "user"

class UserResponse(UserCreate):
    id: int

    class Config:
        from_attributes = True


class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    user_email: str

class ComplaintResponse(ComplaintCreate):
    id: int
    status: str

    class Config:
        from_attributes = True