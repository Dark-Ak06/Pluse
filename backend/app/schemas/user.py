from pydantic import BaseModel
from typing import Optional
from app.models.user import UserRole

class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    department: Optional[str] = None
    is_active: bool = True
    contractor_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
