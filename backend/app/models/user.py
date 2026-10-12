import enum
from sqlalchemy import Column, String, Boolean, Enum, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class UserRole(str, enum.Enum):
    AKIM = "akim"                      # Аким области
    HEAD = "head"                      # Руководитель управления
    CURATOR = "curator"                # Ответственный специалист за объект
    INSPECTOR = "inspector"            # Дорожный инспектор
    CONTRACTOR = "contractor"          # Представитель подрядчика

class User(TimeStampedBase):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.AKIM, nullable=False)
    phone = Column(String(50), nullable=True)
    department = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

    # Optional binding for contractor role
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="SET NULL"), nullable=True)
    
    contractor = relationship("Contractor", back_populates="users", foreign_keys=[contractor_id])
