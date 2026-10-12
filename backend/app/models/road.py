from datetime import datetime, date
from sqlalchemy import (
    Column, String, Float, Boolean, Integer, ForeignKey,
    DateTime, Date, Text
)
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class Road(TimeStampedBase):
    __tablename__ = "roads"

    code = Column(String(50), unique=True, index=True, nullable=False)   # Например "КВ-01"
    name = Column(String(255), index=True, nullable=False)               # "Көкшетау – Зеренді"
    total_length_km = Column(Float, nullable=False)                     # Протяженность в км
    category = Column(String(100), default="III техническая категория")
    district = Column(String(255), nullable=True)                        # Проходит через районы
    start_point = Column(String(255), nullable=True)
    end_point = Column(String(255), nullable=True)
    geometry_geojson = Column(Text, nullable=True)                       # GeoJSON LineString координат

    sections = relationship("RoadSection", back_populates="road", cascade="all, delete-orphan")
    infra_objects = relationship("InfraObject", back_populates="road", foreign_keys="[InfraObject.linked_road_id]")
    defects = relationship("Defect", back_populates="road")

class RoadSection(TimeStampedBase):
    __tablename__ = "road_sections"

    road_id = Column(Integer, ForeignKey("roads.id", ondelete="CASCADE"), nullable=False, index=True)
    section_code = Column(String(50), index=True, nullable=False)        # "КВ-01-УЧ-1"
    start_km = Column(Float, nullable=False)
    end_km = Column(Float, nullable=False)
    length_km = Column(Float, nullable=False)

    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="SET NULL"), nullable=True, index=True)
    inspector_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    geometry_geojson = Column(Text, nullable=True)                       # Координаты отрезка
    center_latitude = Column(Float, nullable=True)
    center_longitude = Column(Float, nullable=True)

    last_inspected_at = Column(DateTime, nullable=True)
    is_inspected_this_month = Column(Boolean, default=False)

    road = relationship("Road", back_populates="sections")
    contractor = relationship("Contractor", back_populates="road_sections")
    inspector = relationship("User", foreign_keys=[inspector_id])
    infra_objects = relationship("InfraObject", back_populates="road_section", foreign_keys="[InfraObject.linked_road_section_id]")
    defects = relationship("Defect", back_populates="road_section")

class InspectionRoute(TimeStampedBase):
    __tablename__ = "inspection_routes"

    inspector_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    inspection_date = Column(Date, default=date.today, nullable=False)
    km_covered = Column(Float, default=0.0)
    geometry_geojson = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    inspector = relationship("User")
