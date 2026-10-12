import enum
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Float, Boolean, Integer, ForeignKey,
    DateTime, Date, Enum, Text
)
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class ObjectType(str, enum.Enum):
    CONSTRUCTION = "construction"          # Строительство
    MAJOR_REPAIR = "major_repair"          # Капитальный ремонт
    MEDIUM_REPAIR = "medium_repair"        # Средний ремонт
    LANDSCAPING = "landscaping"            # Благоустройство

class ObjectCategory(str, enum.Enum):
    ROAD = "road"                          # Дорожная инфраструктура
    SOCIAL = "social"                      # Социальные объекты (школы, больницы, ФОК)
    UTILITIES = "utilities"                # ЖКХ, водоснабжение, сети

class ObjectStage(str, enum.Enum):
    PLANNING = "planning"                  # 1. Планирование
    PROCUREMENT = "procurement"            # 2. Закупка
    CONSTRUCTION = "construction"          # 3. Строительство / Ремонт
    ACCEPTANCE = "acceptance"              # 4. Приёмка
    OPERATION = "operation"                # 5. Эксплуатация

class ObjectHealth(str, enum.Enum):
    ON_SCHEDULE = "on_schedule"            # В графике (зеленый)
    AT_RISK = "at_risk"                    # Риск (желтый)
    DELAYED = "delayed"                    # Отставание (красный)

class InfraObject(TimeStampedBase):
    __tablename__ = "infra_objects"

    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    type = Column(Enum(ObjectType), nullable=False)
    category = Column(Enum(ObjectCategory), default=ObjectCategory.ROAD, nullable=False)
    district = Column(String(100), index=True, nullable=False)  # Район области
    location_description = Column(String(255), nullable=True)

    # Геопозиция
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geometry_geojson = Column(Text, nullable=True)  # Полилиния если дорога

    # Подрядчик
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="SET NULL"), nullable=True, index=True)
    contractor = relationship("Contractor", back_populates="infra_objects")

    # Финансы (тенге)
    budget_allocated = Column(Float, default=0.0)
    budget_spent = Column(Float, default=0.0)
    source_of_financing = Column(String(100), default="Областной бюджет")  # РБ / ОБ / МБ

    # Ответственный специалист
    curator_name = Column(String(255), nullable=True)
    curator_phone = Column(String(50), nullable=True)

    # Жизненный цикл и прогресс
    stage = Column(Enum(ObjectStage), default=ObjectStage.CONSTRUCTION, nullable=False, index=True)
    health_status = Column(Enum(ObjectHealth), default=ObjectHealth.ON_SCHEDULE, nullable=False, index=True)

    planned_start_date = Column(Date, nullable=True)
    planned_end_date = Column(Date, nullable=True)
    actual_start_date = Column(Date, nullable=True)
    actual_end_date = Column(Date, nullable=True)

    planned_progress = Column(Float, default=0.0)  # 0-100%
    actual_progress = Column(Float, default=0.0)   # 0-100%
    last_status_update_at = Column(DateTime, default=datetime.utcnow)

    # Автоматические флаги отставания
    has_lag_flag = Column(Boolean, default=False)              # Факт отстает от плана > X п.п.
    lag_points = Column(Float, default=0.0)                    # Разница в п.п.
    has_milestone_overdue_flag = Column(Boolean, default=False)# Просрочена контрольная веха
    has_freshness_flag = Column(Boolean, default=False)        # Не обновлялся > 14 дней
    days_since_update = Column(Integer, default=0)
    has_budget_overrun_flag = Column(Boolean, default=False)   # Превышение сметы
    budget_overrun_amount = Column(Float, default=0.0)
    flag_summary = Column(Text, nullable=True)

    # Связка с дорожной сетью
    linked_road_id = Column(Integer, ForeignKey("roads.id", ondelete="SET NULL"), nullable=True, index=True)
    linked_road_section_id = Column(Integer, ForeignKey("road_sections.id", ondelete="SET NULL"), nullable=True, index=True)

    road = relationship("Road", back_populates="infra_objects", foreign_keys=[linked_road_id])
    road_section = relationship("RoadSection", back_populates="infra_objects", foreign_keys=[linked_road_section_id])

    milestones = relationship("InfraMilestone", back_populates="infra_object", cascade="all, delete-orphan")
    status_logs = relationship("InfraStatusLog", back_populates="infra_object", cascade="all, delete-orphan")
    defects = relationship("Defect", back_populates="infra_object")

class InfraMilestone(TimeStampedBase):
    __tablename__ = "infra_milestones"

    object_id = Column(Integer, ForeignKey("infra_objects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    planned_date = Column(Date, nullable=False)
    actual_date = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False)
    is_overdue = Column(Boolean, default=False)

    infra_object = relationship("InfraObject", back_populates="milestones")

class InfraStatusLog(TimeStampedBase):
    __tablename__ = "infra_status_logs"

    object_id = Column(Integer, ForeignKey("infra_objects.id", ondelete="CASCADE"), nullable=False, index=True)
    updated_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    prev_progress = Column(Float, nullable=False)
    new_progress = Column(Float, nullable=False)
    comment = Column(Text, nullable=True)
    photos_json = Column(Text, nullable=True)  # JSON-массив URL/путей фото

    infra_object = relationship("InfraObject", back_populates="status_logs")
    updated_by = relationship("User")
