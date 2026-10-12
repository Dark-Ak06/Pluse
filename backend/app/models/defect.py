import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Boolean, Integer, ForeignKey,
    DateTime, Enum, Text
)
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class DefectType(str, enum.Enum):
    POTHOLE = "pothole"            # Яма / выбоина
    CRACK = "crack"                # Трещины / колейность
    MARKINGS = "markings"          # Дорожная разметка
    SIGNAGE = "signage"            # Дорожные знаки
    BARRIER = "barrier"            # Барьерные / перильные ограждения
    OTHER = "other"                # Прочее

class DefectSeverity(str, enum.Enum):
    LOW = "low"                    # Низкая (срок до 10 дней)
    MEDIUM = "medium"              # Средняя (срок до 5 дней)
    HIGH = "high"                  # Высокая (срок до 48 часов)
    EMERGENCY = "emergency"        # Аварийная (срок до 24 часов)

class DefectStatus(str, enum.Enum):
    REPORTED = "reported"                      # Зафиксирован
    ASSIGNED = "assigned"                      # Передан подрядчику
    IN_PROGRESS = "in_progress"                # В работе
    FIXED_PENDING_REVIEW = "fixed_pending_review"  # Устранен подрядчиком (ждет проверки)
    VERIFIED_CLOSED = "verified_closed"        # Проверен и закрыт инспектором
    REJECTED = "rejected"                      # Отклонен инспектором (на доработку)
    ESCALATED = "escalated"                    # Просрочен / на эскалации

class Defect(TimeStampedBase):
    __tablename__ = "defects"

    code = Column(String(50), unique=True, index=True, nullable=False)  # Например "DEF-2026-0812"
    road_id = Column(Integer, ForeignKey("roads.id", ondelete="CASCADE"), nullable=False, index=True)
    road_section_id = Column(Integer, ForeignKey("road_sections.id", ondelete="SET NULL"), nullable=True, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="SET NULL"), nullable=True, index=True)
    inspector_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Ключевая связка: объект капитального/среднего ремонта на этом участке
    infra_object_id = Column(Integer, ForeignKey("infra_objects.id", ondelete="SET NULL"), nullable=True, index=True)

    defect_type = Column(Enum(DefectType), nullable=False, index=True)
    severity = Column(Enum(DefectSeverity), default=DefectSeverity.MEDIUM, nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Геопозиция инспектора в момент фиксации
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address_reference = Column(String(255), nullable=True)  # Например "км 14+200, справа"

    # Фотоматериалы
    photo_before_url = Column(String(500), nullable=True)
    photo_after_url = Column(String(500), nullable=True)

    # Статус и хронометраж передачи (KPI < 5 минут)
    status = Column(Enum(DefectStatus), default=DefectStatus.ASSIGNED, nullable=False, index=True)
    reported_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    assigned_to_contractor_at = Column(DateTime, nullable=True)
    handover_duration_seconds = Column(Integer, default=0)  # Сколько секунд заняла передача

    # Сроки и эскалация
    deadline_at = Column(DateTime, nullable=True)
    fixed_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)

    is_overdue = Column(Boolean, default=False, index=True)
    escalation_level = Column(Integer, default=0)  # 0: Норма, 1: Руководителю подрядчика, 2: Управление дорог
    
    # Системный флаг: подрядчик срывает и ремонт объекта, и дефекты
    has_systemic_flag = Column(Boolean, default=False, index=True)
    systemic_note = Column(Text, nullable=True)

    road = relationship("Road", back_populates="defects")
    road_section = relationship("RoadSection", back_populates="defects")
    contractor = relationship("Contractor", back_populates="defects")
    inspector = relationship("User", foreign_keys=[inspector_id])
    infra_object = relationship("InfraObject", back_populates="defects")
    logs = relationship("DefectStatusLog", back_populates="defect", cascade="all, delete-orphan")
    escalations = relationship("EscalationLog", back_populates="defect", cascade="all, delete-orphan")

class DefectStatusLog(TimeStampedBase):
    __tablename__ = "defect_status_logs"

    defect_id = Column(Integer, ForeignKey("defects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # REPORTED, ASSIGNED, FIXED, VERIFIED, REJECTED, ESCALATED
    comment = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)

    defect = relationship("Defect", back_populates="logs")
    user = relationship("User")
