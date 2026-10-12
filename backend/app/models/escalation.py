from datetime import datetime
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class EscalationLog(TimeStampedBase):
    __tablename__ = "escalation_logs"

    defect_id = Column(Integer, ForeignKey("defects.id", ondelete="CASCADE"), nullable=False, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=True, index=True)
    previous_level = Column(Integer, default=0)
    new_level = Column(Integer, default=1)
    reason = Column(Text, nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notified_party = Column(String(255), nullable=True)  # "Директор ТОО Сарыарқа Жол Құрылыс", "Руководитель Управления дорог"
    is_systemic = Column(Boolean, default=False)         # Сработало правило системного отставания

    defect = relationship("Defect", back_populates="escalations")
    contractor = relationship("Contractor")
