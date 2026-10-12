from sqlalchemy import Column, String, Float, Boolean, Integer, Text
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class Contractor(TimeStampedBase):
    __tablename__ = "contractors"

    name = Column(String(255), unique=True, index=True, nullable=False)
    bin = Column(String(12), unique=True, index=True, nullable=False)  # БИН компании
    director_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)

    # Дисциплинарные метрики
    rating_score = Column(Float, default=100.0)  # 0 - 100 баллов
    is_systemic_problem = Column(Boolean, default=False, index=True)
    systemic_reason = Column(Text, nullable=True)

    active_projects_count = Column(Integer, default=0)
    delayed_projects_count = Column(Integer, default=0)
    active_defects_count = Column(Integer, default=0)
    overdue_defects_count = Column(Integer, default=0)

    # Связи
    users = relationship("User", back_populates="contractor")
    infra_objects = relationship("InfraObject", back_populates="contractor")
    road_sections = relationship("RoadSection", back_populates="contractor")
    defects = relationship("Defect", back_populates="contractor")
