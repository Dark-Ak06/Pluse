import io
from typing import List
import pandas as pd
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models.infrastructure import InfraObject

class ExportService:
    @staticmethod
    def generate_excel_summary(objects: List[InfraObject]) -> bytes:
        data = []
        for o in objects:
            data.append({
                "Код объекта": o.code,
                "Наименование": o.name,
                "Тип": o.type.value if hasattr(o.type, "value") else str(o.type),
                "Район": o.district,
                "Стадия": o.stage.value if hasattr(o.stage, "value") else str(o.stage),
                "Подрядчик": o.contractor.name if o.contractor else "Не назначен",
                "Бюджет (тенге)": o.budget_allocated,
                "Освоено (тенге)": o.budget_spent,
                "План (%)": o.planned_progress,
                "Факт (%)": o.actual_progress,
                "Отставание (п.п.)": o.lag_points,
                "Статус здоровья": "Отставание" if o.has_lag_flag else ("Риск" if o.has_freshness_flag else "В графике"),
                "Дней без обновления": o.days_since_update,
                "Замечания и флаги": o.flag_summary or "Без замечаний"
            })
        
        df = pd.DataFrame(data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Сводка объектов", index=False)
        return output.getvalue()

    @staticmethod
    def generate_pdf_summary(objects: List[InfraObject], region_name: str = "Сарыарқа облысы") -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=20, leftMargin=20, topMargin=25, bottomMargin=20
        )
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            name="TitleStyle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#1e293b"),
            alignment=1
        )
        subtitle_style = ParagraphStyle(
            name="SubtitleStyle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748b"),
            alignment=1
        )
        cell_style = ParagraphStyle(
            name="CellStyle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10
        )

        elements.append(Paragraph(f"СВОДНЫЙ ОТЧЕТ ПО ИНФРАСТРУКТУРНЫМ ОБЪЕКТАМ", title_style))
        elements.append(Paragraph(f"Акимат региона: {region_name} | Программа G-TON | Система 'RegionControl'", subtitle_style))
        elements.append(Spacer(1, 15))

        # Статистика
        total = len(objects)
        delayed = sum(1 for o in objects if o.has_lag_flag)
        freshness_issues = sum(1 for o in objects if o.has_freshness_flag)
        stat_text = f"Всего объектов: {total} | В графике: {total - delayed} | С критическим отставанием: {delayed} | Требуют обновления статуса (>14 дн): {freshness_issues}"
        elements.append(Paragraph(stat_text, subtitle_style))
        elements.append(Spacer(1, 10))

        # Таблица топ проблемных объектов
        table_data = [
            ["Код", "Наименование объекта", "Район", "Подрядчик", "План %", "Факт %", "Отставание", "Флаг контроля"]
        ]
        
        # Сортируем: сначала с отставанием
        sorted_objs = sorted(objects, key=lambda x: (not x.has_lag_flag, -x.lag_points))[:35]
        for o in sorted_objs:
            c_name = o.contractor.name if o.contractor else "Н/Д"
            table_data.append([
                Paragraph(o.code, cell_style),
                Paragraph(o.name[:45] + ("..." if len(o.name) > 45 else ""), cell_style),
                Paragraph(o.district, cell_style),
                Paragraph(c_name[:25] + ("..." if len(c_name) > 25 else ""), cell_style),
                f"{o.planned_progress:.1f}%",
                f"{o.actual_progress:.1f}%",
                f"{o.lag_points:.1f} п.п." if o.has_lag_flag else "-",
                Paragraph(o.flag_summary[:35] if o.flag_summary else "Норма", cell_style)
            ])

        col_widths = [60, 220, 90, 130, 45, 45, 60, 130]
        t = Table(table_data, colWidths=col_widths, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0284c7")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")])
        ]))
        elements.append(t)

        doc.build(elements)
        return buffer.getvalue()
