from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.models.base import TimeStampedBase

class AuditLog(TimeStampedBase):
    __tablename__ = "audit_logs"

    user_id = Column(Integer, nullable=True, index=True)
    user_name = Column(String(255), nullable=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(100), nullable=True)
