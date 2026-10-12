import random
import json
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, init_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.contractor import Contractor
from app.models.infrastructure import (
    InfraObject, InfraMilestone, InfraStatusLog,
    ObjectType, ObjectCategory, ObjectStage, ObjectHealth
)
from app.models.road import Road, RoadSection, InspectionRoute
from app.models.defect import (
    Defect, DefectStatusLog, DefectType, DefectSeverity, DefectStatus
)
from app.models.escalation import EscalationLog
from app.services.flag_engine import FlagEngine
from app.services.escalation_engine import EscalationEngine
from app.services.rating_service import RatingService

def seed_database(db: Session):
    print("[1/5] Ochistka i initsializatsiya tablits BD...")
    # Очистка в порядке внешних ключей
    db.query(EscalationLog).delete()
    db.query(DefectStatusLog).delete()
    db.query(Defect).delete()
    db.query(InfraStatusLog).delete()
    db.query(InfraMilestone).delete()
    db.query(InfraObject).delete()
    db.query(InspectionRoute).delete()
    db.query(RoadSection).delete()
    db.query(Road).delete()
    db.query(User).delete()
    db.query(Contractor).delete()
    db.commit()

    print("[2/5] Sozdanie podryadnykh organizatsiy...")
    contractors_data = [
        {
            "id": 1,
            "name": "ТОО «Сарыарқа Жол Құрылыс»",
            "bin": "180440012345",
            "director_name": "Ахметов Бауыржан Касымович",
            "phone": "+7 (7162) 55-44-33",
            "email": "info@saryarka-road.kz",
            "address": "г. Көкшетау, ул. Абая, 142",
            "is_systemic_problem": True,
            "rating_score": 38.5,
            "systemic_reason": "СИСТЕМНЫЙ СБОЙ: срыв сроков по кап. ремонту дороги КВ-03 (отставание 24.0 п.п.) и 12 просроченных дефектов на закрепленных участках"
        },
        {
            "id": 2,
            "name": "ТОО «СтепьСтройСервис»",
            "bin": "190540023456",
            "director_name": "Калиев Серик Мухтарович",
            "phone": "+7 (7162) 77-88-99",
            "email": "office@stepstroy.kz",
            "address": "г. Көкшетау, промзона Северная, 8",
            "is_systemic_problem": True,
            "rating_score": 46.0,
            "systemic_reason": "СИСТЕМНЫЙ СБОЙ: отставание по строительству школы (16.0 п.п.) и задержка устранения дефектов разметки и знаков"
        },
        {
            "id": 3,
            "name": "ТОО «АстанаДорМост»",
            "bin": "170340034567",
            "director_name": "Смагулов Данияр Арманович",
            "phone": "+7 (7172) 44-33-22",
            "email": "contact@astana-dormost.kz",
            "address": "г. Астана, пр. Мангилик Ел, 28",
            "is_systemic_problem": False,
            "rating_score": 96.2,
            "systemic_reason": None
        },
        {
            "id": 4,
            "name": "ТОО «КазИнфраСтрой»",
            "bin": "200840045678",
            "director_name": "Жусупов Ербол Нургалиевич",
            "phone": "+7 (7162) 33-22-11",
            "email": "infrastroy@kazinfra.kz",
            "address": "г. Көкшетау, ул. Ауэзова, 75",
            "is_systemic_problem": False,
            "rating_score": 92.4,
            "systemic_reason": None
        },
        {
            "id": 5,
            "name": "ТОО «КокшеАвтоДор»",
            "bin": "210140056789",
            "director_name": "Оспанов Канат Болатович",
            "phone": "+7 (7162) 99-00-11",
            "email": "autodor@kokshe.kz",
            "address": "г. Көкшетау, ул. Гагарина, 12",
            "is_systemic_problem": False,
            "rating_score": 79.5,
            "systemic_reason": None
        }
    ]

    contractor_objs = {}
    for c_data in contractors_data:
        c = Contractor(**c_data)
        db.add(c)
        contractor_objs[c_data["id"]] = c
    db.commit()

    print("[3/5] Sozdanie polzovateley demo...")
    demo_password_hash = get_password_hash("demo123")
    users_data = [
        {
            "email": "akim@saryarka.gov.kz",
            "hashed_password": demo_password_hash,
            "full_name": "Аманжолов Нурлан Серикович",
            "role": UserRole.AKIM,
            "department": "Аппарат Акима Сарыаркинской области",
            "phone": "+7 (701) 111-22-33"
        },
        {
            "email": "head@saryarka.gov.kz",
            "hashed_password": demo_password_hash,
            "full_name": "Беков Асет Маратович",
            "role": UserRole.HEAD,
            "department": "Управление пассажирского транспорта и автомобильных дорог",
            "phone": "+7 (701) 222-33-44"
        },
        {
            "email": "curator@saryarka.gov.kz",
            "hashed_password": demo_password_hash,
            "full_name": "Темиров Айдос Куанышевич",
            "role": UserRole.CURATOR,
            "department": "Отдел инфраструктурных проектов",
            "phone": "+7 (701) 333-44-55"
        },
        {
            "email": "inspector@saryarka.gov.kz",
            "hashed_password": demo_password_hash,
            "full_name": "Сергазин Кайрат Бахытович",
            "role": UserRole.INSPECTOR,
            "department": "Дорожная инспекция Сарыаркинской области",
            "phone": "+7 (701) 444-55-66"
        },
        {
            "email": "contractor@saryarka.gov.kz",
            "hashed_password": demo_password_hash,
            "full_name": "Ахметов Бауыржан Касымович",
            "role": UserRole.CONTRACTOR,
            "department": "ТОО «Сарыарқа Жол Құрылыс»",
            "phone": "+7 (701) 555-66-77",
            "contractor_id": 1
        }
    ]

    for u_data in users_data:
        u = User(**u_data)
        db.add(u)
    db.commit()
    inspector_user = db.query(User).filter(User.role == UserRole.INSPECTOR).first()

    print("[4/5] Sozdanie dorozhnoy seti (20 dorog, rovno 1 588 km)...")
    # Список из 20 областных дорог
    # Координаты вокруг Акмолинской / Сарыаркинской области (Кокшетау ~53.28, 69.38; Зеренда ~52.9, 69.15; Бурабай ~53.08, 70.3; Есиль ~51.95, 66.4; Нұра ~50.25, 71.55)
    road_specs = [
        ("КВ-01", "Көкшетау — Зеренді — Атбасар", 147.0, "Зеренді ауданы", (53.28, 69.38), (51.81, 68.35)),
        ("КВ-02", "Щучинск — Бурабай — Степняк", 98.0, "Бурабай ауданы", (52.93, 70.20), (52.83, 71.30)),
        ("КВ-03", "Көкшетау — Рузаевка (гр. области)", 112.0, "Зеренді ауданы", (53.28, 69.38), (53.15, 67.20)),
        ("КВ-04", "Степняк — Валиханово", 85.0, "Бурабай ауданы", (52.83, 71.30), (53.40, 72.10)),
        ("КВ-05", "Есіл — Свободное — Раздольное", 74.0, "Есіл ауданы", (51.95, 66.40), (51.60, 66.85)),
        ("КВ-06", "Жалтыр — Макинск", 68.0, "Бурабай ауданы", (51.65, 70.52), (52.63, 70.42)),
        ("КВ-07", "Нұра — Киевка — Темиртау (подъезд)", 124.0, "Нұра ауданы", (50.25, 71.55), (50.05, 72.95)),
        ("КВ-08", "Атбасар — Кийма — Державинск", 136.0, "Есіл ауданы", (51.81, 68.35), (51.10, 66.30)),
        ("КВ-09", "Көкшетау — Красный Яр — Сейфуллина", 52.0, "Көкшетау қаласы", (53.28, 69.38), (53.45, 69.10)),
        ("КВ-10", "Зеренді — Викторовка — Боровское", 64.0, "Зеренді ауданы", (52.90, 69.15), (52.65, 68.80)),
        ("КВ-11", "Бурабай — Катарколь — Зеленый Бор", 48.0, "Бурабай ауданы", (53.08, 70.30), (52.95, 70.55)),
        ("КВ-12", "Есіл — Знаменка — Заречное", 58.0, "Есіл ауданы", (51.95, 66.40), (51.85, 65.90)),
        ("КВ-13", "Нұра — Шахтерское — Пржевальское", 76.0, "Нұра ауданы", (50.25, 71.55), (49.85, 71.20)),
        ("КВ-14", "Акколь — Азат — Минское", 62.0, "Бурабай ауданы", (52.00, 70.93), (52.35, 71.40)),
        ("КВ-15", "Жаксы — Державинск", 88.0, "Есіл ауданы", (51.90, 67.55), (51.10, 66.30)),
        ("КВ-16", "Көкшетау — Алексеевка — Купчановка", 45.0, "Көкшетау қаласы", (53.28, 69.38), (53.12, 69.80)),
        ("КВ-17", "Кургальджино — Баршын", 94.0, "Нұра ауданы", (50.45, 70.02), (49.60, 70.60)),
        ("КВ-18", "Аршалы — Ижевское — Бабатай", 56.0, "Нұра ауданы", (50.83, 72.17), (50.60, 72.45)),
        ("КВ-19", "Зеренді — Приречное — Еленовка", 63.0, "Зеренді ауданы", (52.90, 69.15), (53.10, 68.70)),
        ("КВ-20", "Бурабай — оз. Чебачье — Береке", 38.0, "Бурабай ауданы", (53.08, 70.30), (53.22, 70.15))
    ]

    total_roads_length = sum(item[2] for item in road_specs)
    print(f"Obschaya dlina dorog: {total_roads_length:.1f} km (Tselevoe: 1588.0 km)")

    road_records = []
    section_records = []
    sec_id_counter = 1

    for code, name, length, district, start_coor, end_coor in road_specs:
        road = Road(
            code=code,
            name=name,
            total_length_km=length,
            district=district,
            category="III техническая категория",
            start_point=name.split("—")[0].strip(),
            end_point=name.split("—")[-1].strip(),
            geometry_geojson=json.dumps([
                [start_coor[1], start_coor[0]],
                [(start_coor[1] + end_coor[1]) / 2, (start_coor[0] + end_coor[0]) / 2],
                [end_coor[1], end_coor[0]]
            ])
        )
        db.add(road)
        db.flush()
        road_records.append(road)

        # Разбиваем дорогу на 3 участка
        num_sections = 3
        sec_len = round(length / num_sections, 1)
        for s_idx in range(num_sections):
            s_start = s_idx * sec_len
            s_end = length if s_idx == num_sections - 1 else round((s_idx + 1) * sec_len, 1)
            actual_len = round(s_end - s_start, 1)

            # Назначение подрядчика:
            # На дорогу КВ-03 умышленно назначаем ТОО «Сарыарқа Жол Құрылыс» (подрядчик 1) для демонстрации системного сбоя!
            if code == "КВ-03":
                assigned_contractor_id = 1
            elif code in ["КВ-02", "КВ-11", "КВ-20"]:
                assigned_contractor_id = 2  # СтепьСтройСервис
            elif code in ["КВ-01", "КВ-07", "КВ-17"]:
                assigned_contractor_id = 3  # АстанаДорМост
            elif code in ["КВ-08", "КВ-13", "КВ-15"]:
                assigned_contractor_id = 4  # КазИнфраСтрой
            else:
                assigned_contractor_id = 5  # КокшеАвтоДор

            # Интерполяция координат центра участка
            frac = (s_idx + 0.5) / num_sections
            c_lat = start_coor[0] + frac * (end_coor[0] - start_coor[0])
            c_lon = start_coor[1] + frac * (end_coor[1] - start_coor[1])

            # Покрытие инспекцией в этом месяце: большинство осмотрено, несколько нет
            is_inspected = not (code in ["КВ-08", "КВ-17"] and s_idx == 2)
            last_insp = datetime.utcnow() - timedelta(days=random.randint(2, 12)) if is_inspected else datetime.utcnow() - timedelta(days=45)

            sec = RoadSection(
                road_id=road.id,
                section_code=f"{code}-УЧ-{s_idx + 1}",
                start_km=s_start,
                end_km=s_end,
                length_km=actual_len,
                contractor_id=assigned_contractor_id,
                inspector_id=inspector_user.id if inspector_user else 1,
                center_latitude=round(c_lat, 4),
                center_longitude=round(c_lon, 4),
                last_inspected_at=last_insp,
                is_inspected_this_month=is_inspected,
                geometry_geojson=json.dumps([
                    [round(c_lon - 0.05, 4), round(c_lat - 0.05, 4)],
                    [round(c_lon, 4), round(c_lat, 4)],
                    [round(c_lon + 0.05, 4), round(c_lat + 0.05, 4)]
                ])
            )
            db.add(sec)
            section_records.append(sec)

    db.commit()
    print(f"OK: Sozdano {len(road_records)} dorog i {len(section_records)} uchastkov.")

    print("[5/5] Sozdanie reestra 127 obektov infrastruktury...")
    districts = ["Есіл ауданы", "Нұра ауданы", "Бурабай ауданы", "Көкшетау қаласы", "Зеренді ауданы"]
    types_list = [
        ObjectType.CONSTRUCTION,
        ObjectType.MAJOR_REPAIR,
        ObjectType.MEDIUM_REPAIR,
        ObjectType.LANDSCAPING
    ]
    curators = [
        ("Темиров А. К.", "+7 (701) 333-44-55"),
        ("Жумабаев Е. С.", "+7 (701) 777-11-22"),
        ("Исмаилова Г. Б.", "+7 (701) 888-22-33"),
        ("Омаров С. Т.", "+7 (701) 999-33-44")
    ]

    objects_created = []

    # 1. СПЕЦИАЛЬНЫЕ ПРОБЛЕМНЫЕ ОБЪЕКТЫ ДЛЯ ДЕМОНСТРАЦИИ (Ключевой сценарий)
    # Объект 1: Капитальный ремонт дороги КВ-03 (ТОО Сарыарқа Жол Құрылыс) - КЛЮЧЕВОЙ ОБЪЕКТ ДЕМО
    kv03_road = next(r for r in road_records if r.code == "КВ-03")
    kv03_sec1 = next(s for s in section_records if s.road_id == kv03_road.id and "УЧ-1" in s.section_code)

    demo_key_obj = InfraObject(
        code="INF-2026-001",
        name="Капитальный ремонт автодороги КВ-03 (км 0 — 24)",
        type=ObjectType.MAJOR_REPAIR,
        category=ObjectCategory.ROAD,
        district="Зеренді ауданы",
        location_description="Трасса Көкшетау — Рузаевка, участок км 0 - 24",
        latitude=53.2500,
        longitude=69.2000,
        contractor_id=1,  # ТОО Сарыарқа Жол Құрылыс
        budget_allocated=1_850_000_000.0,
        budget_spent=1_200_000_000.0,
        source_of_financing="Республиканский бюджет",
        curator_name="Темиров А. К.",
        curator_phone="+7 (701) 333-44-55",
        stage=ObjectStage.CONSTRUCTION,
        planned_start_date=date(2025, 4, 15),
        planned_end_date=date(2026, 11, 1),
        actual_start_date=date(2025, 5, 2),
        planned_progress=78.0,
        actual_progress=54.0,  # Отставание 24.0 п.п.
        last_status_update_at=datetime.utcnow() - timedelta(days=5),
        linked_road_id=kv03_road.id,
        linked_road_section_id=kv03_sec1.id
    )
    FlagEngine.apply_flags_to_object(demo_key_obj)
    db.add(demo_key_obj)
    objects_created.append(demo_key_obj)

    # Вехи для ключевого объекта
    db.flush()
    m1 = InfraMilestone(
        object_id=demo_key_obj.id,
        title="Фрезерование старого асфальтобетонного покрытия",
        planned_date=date(2025, 7, 1),
        actual_date=date(2025, 7, 10),
        is_completed=True,
        is_overdue=False
    )
    m2 = InfraMilestone(
        object_id=demo_key_obj.id,
        title="Устройство нижнего слоя крупнозернистого асфальтобетона",
        planned_date=date(2026, 8, 15),
        is_completed=False,
        is_overdue=True  # Просрочена!
    )
    m3 = InfraMilestone(
        object_id=demo_key_obj.id,
        title="Устройство верхнего слоя из ЩМА-20",
        planned_date=date(2026, 10, 15),
        is_completed=False,
        is_overdue=False
    )
    db.add_all([m1, m2, m3])

    # Объект 2: Строительство школы в Бурабае (ТОО СтепьСтройСервис) - второй системный нарушитель
    demo_obj_2 = InfraObject(
        code="INF-2026-002",
        name="Строительство общеобразовательной школы на 600 мест в с. Бурабай",
        type=ObjectType.CONSTRUCTION,
        category=ObjectCategory.SOCIAL,
        district="Бурабай ауданы",
        location_description="с. Бурабай, мкр. Школьный",
        latitude=53.0850,
        longitude=70.3100,
        contractor_id=2,  # ТОО СтепьСтройСервис
        budget_allocated=2_400_000_000.0,
        budget_spent=1_500_000_000.0,
        source_of_financing="Областной бюджет",
        curator_name="Жумабаев Е. С.",
        curator_phone="+7 (701) 777-11-22",
        stage=ObjectStage.CONSTRUCTION,
        planned_start_date=date(2025, 3, 1),
        planned_end_date=date(2026, 12, 1),
        actual_start_date=date(2025, 3, 20),
        planned_progress=72.0,
        actual_progress=56.0,  # Отставание 16.0 п.п.
        last_status_update_at=datetime.utcnow() - timedelta(days=22)  # Не обновлялся > 14 дней!
    )
    FlagEngine.apply_flags_to_object(demo_obj_2)
    db.add(demo_obj_2)
    objects_created.append(demo_obj_2)

    # Объект 3: Водоснабжение с превышением сметы
    demo_obj_3 = InfraObject(
        code="INF-2026-003",
        name="Реконструкция водопроводных сетей в пос. Киевка",
        type=ObjectType.CONSTRUCTION,
        category=ObjectCategory.UTILITIES,
        district="Нұра ауданы",
        location_description="пос. Киевка, центральный сектор",
        latitude=50.2550,
        longitude=71.5600,
        contractor_id=4,
        budget_allocated=850_000_000.0,
        budget_spent=945_000_000.0,  # Превышение сметы на 95 млн
        source_of_financing="Местный бюджет",
        curator_name="Исмаилова Г. Б.",
        curator_phone="+7 (701) 888-22-33",
        stage=ObjectStage.CONSTRUCTION,
        planned_start_date=date(2025, 6, 1),
        planned_end_date=date(2026, 9, 30),
        actual_start_date=date(2025, 6, 10),
        planned_progress=60.0,
        actual_progress=55.0,
        last_status_update_at=datetime.utcnow() - timedelta(days=4)
    )
    FlagEngine.apply_flags_to_object(demo_obj_3)
    db.add(demo_obj_3)
    objects_created.append(demo_obj_3)

    # Генерация оставшихся 124 объектов до ровно 127
    names_pool = [
        ("Строительство физкультурно-оздоровительного комплекса", ObjectType.CONSTRUCTION, ObjectCategory.SOCIAL),
        ("Средний ремонт автодороги областного значения", ObjectType.MEDIUM_REPAIR, ObjectCategory.ROAD),
        ("Строительство врачебной амбулатории", ObjectType.CONSTRUCTION, ObjectCategory.SOCIAL),
        ("Капитальный ремонт мостового перехода", ObjectType.MAJOR_REPAIR, ObjectCategory.ROAD),
        ("Строительство сетей уличного освещения", ObjectType.CONSTRUCTION, ObjectCategory.UTILITIES),
        ("Благоустройство парковой зоны и сквера", ObjectType.LANDSCAPING, ObjectCategory.SOCIAL),
        ("Реконструкция канализационно-очистных сооружений", ObjectType.CONSTRUCTION, ObjectCategory.UTILITIES),
        ("Устройство водопропускных труб и водоотвода", ObjectType.MEDIUM_REPAIR, ObjectCategory.ROAD),
        ("Капитальный ремонт школы-гимназии", ObjectType.MAJOR_REPAIR, ObjectCategory.SOCIAL),
        ("Строительство котельной с тепловыми сетями", ObjectType.CONSTRUCTION, ObjectCategory.UTILITIES),
        ("Благоустройство набережной зоны", ObjectType.LANDSCAPING, ObjectCategory.SOCIAL),
        ("Текущий ремонт и восстановление дорожного полотна", ObjectType.MEDIUM_REPAIR, ObjectCategory.ROAD)
    ]

    stages_distribution = (
        [ObjectStage.PLANNING] * 14 +
        [ObjectStage.PROCUREMENT] * 21 +
        [ObjectStage.CONSTRUCTION] * 66 +
        [ObjectStage.ACCEPTANCE] * 12 +
        [ObjectStage.OPERATION] * 11
    )
    random.shuffle(stages_distribution)

    for i in range(4, 128):
        name_template, obj_type, obj_cat = random.choice(names_pool)
        district = random.choice(districts)
        stage = stages_distribution[i - 4]
        c_id = random.choice([1, 2, 3, 4, 5])
        curator = random.choice(curators)

        # Геопозиция в пределах района
        base_coords = {
            "Көкшетау қаласы": (53.28, 69.38),
            "Зеренді ауданы": (52.90, 69.15),
            "Бурабай ауданы": (53.08, 70.28),
            "Есіл ауданы": (51.95, 66.40),
            "Нұра ауданы": (50.25, 71.55)
        }
        b_lat, b_lon = base_coords[district]
        lat = b_lat + random.uniform(-0.18, 0.18)
        lon = b_lon + random.uniform(-0.25, 0.25)

        # Прогресс в зависимости от стадии
        if stage == ObjectStage.PLANNING:
            plan_p = random.uniform(5.0, 15.0)
            act_p = random.uniform(0.0, 10.0)
        elif stage == ObjectStage.PROCUREMENT:
            plan_p = random.uniform(15.0, 30.0)
            act_p = random.uniform(10.0, 25.0)
        elif stage == ObjectStage.CONSTRUCTION:
            plan_p = random.uniform(35.0, 90.0)
            # Заложим часть объектов с отставанием (> 10 п.п.)
            if i in [10, 15, 22, 28, 35, 42, 55, 63, 71, 80, 88, 95, 104, 112, 120]:
                act_p = max(5.0, plan_p - random.uniform(12.0, 26.0))
            else:
                act_p = max(0.0, plan_p - random.uniform(-2.0, 6.0))
        elif stage == ObjectStage.ACCEPTANCE:
            plan_p = 100.0
            act_p = random.uniform(92.0, 98.0)
        else:  # OPERATION
            plan_p = 100.0
            act_p = 100.0

        # Актуальность статуса (часть не обновлялась > 14 дней)
        if i in [12, 25, 39, 50, 61, 77, 85, 99, 108, 117, 123]:
            days_ago = random.randint(16, 42)
        else:
            days_ago = random.randint(1, 11)
        last_update = datetime.utcnow() - timedelta(days=days_ago)

        budget_alloc = round(random.uniform(180_000_000, 2_800_000_000), -6)
        # Часть с превышением сметы
        if i in [18, 31, 47, 65, 83]:
            budget_sp = budget_alloc + round(random.uniform(15_000_000, 120_000_000), -5)
        else:
            budget_sp = round(budget_alloc * (act_p / 100.0) * random.uniform(0.85, 1.0), -5)

        # Если дорожный объект, свяжем с ближайшей дорогой
        linked_r_id = None
        linked_s_id = None
        if obj_cat == ObjectCategory.ROAD:
            matched_sec = random.choice(section_records)
            linked_r_id = matched_sec.road_id
            linked_s_id = matched_sec.id

        obj = InfraObject(
            code=f"INF-2026-{i:03d}",
            name=f"{name_template} в {district}",
            type=obj_type,
            category=obj_cat,
            district=district,
            location_description=f"{district}, объект №{i}",
            latitude=round(lat, 4),
            longitude=round(lon, 4),
            contractor_id=c_id,
            budget_allocated=budget_alloc,
            budget_spent=budget_sp,
            source_of_financing=random.choice(["Областной бюджет", "Республиканский бюджет", "Местный бюджет"]),
            curator_name=curator[0],
            curator_phone=curator[1],
            stage=stage,
            planned_start_date=date(2025, 4, 1),
            planned_end_date=date(2026, 11, 30),
            actual_start_date=date(2025, 4, 15) if stage != ObjectStage.PLANNING else None,
            planned_progress=round(plan_p, 1),
            actual_progress=round(act_p, 1),
            last_status_update_at=last_update,
            linked_road_id=linked_r_id,
            linked_road_section_id=linked_s_id
        )
        FlagEngine.apply_flags_to_object(obj)
        db.add(obj)
        objects_created.append(obj)

    db.commit()
    print(f"OK: Sozdano rovno {len(objects_created)} obektov infrastruktury.")

    print("Sozdanie 300 dorozhnykh defektov s privazkoy k uchastkam...")
    defect_types_pool = [
        DefectType.POTHOLE, DefectType.POTHOLE, DefectType.CRACK,
        DefectType.MARKINGS, DefectType.SIGNAGE, DefectType.BARRIER, DefectType.OTHER
    ]
    severities_pool = [
        DefectSeverity.LOW, DefectSeverity.MEDIUM, DefectSeverity.MEDIUM,
        DefectSeverity.HIGH, DefectSeverity.EMERGENCY
    ]

    defects_created = []

    # 1. Специфические просроченные дефекты на участке КВ-03 ТОО «Сарыарқа Жол Құрылыс» (СИСТЕМНЫЙ СБОЙ)
    for d_idx in range(1, 13):
        reported_dt = datetime.utcnow() - timedelta(days=random.randint(6, 18))
        deadline_dt = reported_dt + timedelta(hours=48)  # уже просрочен
        
        defect = Defect(
            code=f"DEF-2026-SYS-{d_idx:02d}",
            road_id=kv03_road.id,
            road_section_id=kv03_sec1.id,
            contractor_id=1,  # ТОО Сарыарқа Жол Құрылыс
            inspector_id=inspector_user.id if inspector_user else 1,
            infra_object_id=demo_key_obj.id,  # СВЯЗАН С РЕМОНТОМ ОБЪЕКТА КВ-03!
            defect_type=DefectType.POTHOLE,
            severity=DefectSeverity.HIGH if d_idx % 2 == 0 else DefectSeverity.EMERGENCY,
            description=f"Глубокая выбоина асфальтобетонного покрытия на км {d_idx * 1.8:.1f}, площадь ~2.4 м², глубина более 7 см. Угроза безопасности движения.",
            latitude=53.2500 + random.uniform(-0.02, 0.02),
            longitude=69.2000 + random.uniform(-0.03, 0.03),
            address_reference=f"трасса КВ-03, км {d_idx * 1.8:.1f}, правая полоса",
            photo_before_url=f"/demo_photos/pothole_{((d_idx-1)%4)+1}.jpg",
            status=DefectStatus.ESCALATED,
            reported_at=reported_dt,
            assigned_to_contractor_at=reported_dt + timedelta(seconds=72),
            handover_duration_seconds=72,  # < 5 минут
            deadline_at=deadline_dt,
            is_overdue=True,
            escalation_level=2,  # Эскалировано в Управление дорог/Акимат
            has_systemic_flag=True,
            systemic_note="КРИТИЧЕСКАЯ ЭСКАЛАЦИЯ: дефект на участке кап. ремонта INF-2026-001 (отставание 24.0 п.п.). Подрядчик сорвал дедлайн!"
        )
        db.add(defect)
        defects_created.append(defect)

    # 2. Генерация еще 288 дефектов (итого ровно 300) вдоль участков дорог
    for d_idx in range(13, 301):
        sec = random.choice(section_records)
        c_id = sec.contractor_id
        d_type = random.choice(defect_types_pool)
        sev = random.choice(severities_pool)

        # Координаты рядом с участком
        lat = (sec.center_latitude or 53.0) + random.uniform(-0.03, 0.03)
        lon = (sec.center_longitude or 69.5) + random.uniform(-0.03, 0.03)

        # Статусы: часть новые, часть в работе, часть устранены, часть закрыты, часть просрочены
        dice = random.random()
        reported_dt = datetime.utcnow() - timedelta(days=random.randint(1, 25))
        assigned_dt = reported_dt + timedelta(seconds=random.randint(45, 240))
        handover_sec = int((assigned_dt - reported_dt).total_seconds())

        hours_allowed = 24 if sev == DefectSeverity.EMERGENCY else (48 if sev == DefectSeverity.HIGH else 120)
        deadline_dt = assigned_dt + timedelta(hours=hours_allowed)

        now = datetime.utcnow()

        if dice < 0.15:
            # Новый / передан
            st = DefectStatus.ASSIGNED
            is_over = now > deadline_dt
            fixed_dt = None
            ver_dt = None
            photo_after = None
        elif dice < 0.55:
            # В работе
            st = DefectStatus.IN_PROGRESS
            is_over = now > deadline_dt
            fixed_dt = None
            ver_dt = None
            photo_after = None
        elif dice < 0.80:
            # Устранено (на проверке или принято)
            st = DefectStatus.VERIFIED_CLOSED
            is_over = False
            fixed_dt = assigned_dt + timedelta(hours=random.randint(12, hours_allowed - 2))
            ver_dt = fixed_dt + timedelta(hours=6)
            photo_after = f"/demo_photos/fixed_{(d_idx % 3) + 1}.jpg"
        else:
            # Просрочено
            st = DefectStatus.ESCALATED
            is_over = True
            fixed_dt = None
            ver_dt = None
            photo_after = None

        esc_level = 0
        if is_over:
            esc_level = 1 if (now - deadline_dt).days < 2 else 2

        # Проверяем, есть ли на данном участке объект ремонта
        matched_obj = next((o for o in objects_created if o.linked_road_section_id == sec.id), None)

        def_obj = Defect(
            code=f"DEF-2026-{d_idx:04d}",
            road_id=sec.road_id,
            road_section_id=sec.id,
            contractor_id=c_id,
            inspector_id=inspector_user.id if inspector_user else 1,
            infra_object_id=matched_obj.id if matched_obj else None,
            defect_type=d_type,
            severity=sev,
            description=f"Выявлен дефект '{d_type.value}' на участке {sec.section_code}. Требуется нормативное устранение.",
            latitude=round(lat, 4),
            longitude=round(lon, 4),
            address_reference=f"{sec.section_code}, км {sec.start_km + 2.5:.1f}",
            photo_before_url=f"/demo_photos/defect_{(d_idx % 4) + 1}.jpg",
            photo_after_url=photo_after,
            status=st,
            reported_at=reported_dt,
            assigned_to_contractor_at=assigned_dt,
            handover_duration_seconds=handover_sec,
            deadline_at=deadline_dt,
            fixed_at=fixed_dt,
            verified_at=ver_dt,
            is_overdue=is_over,
            escalation_level=esc_level,
            has_systemic_flag=bool(c_id in [1, 2] and is_over)
        )
        db.add(def_obj)
        defects_created.append(def_obj)

    db.commit()
    print(f"OK: Sozdano {len(defects_created)} defektov dorozhnogo pokrytiya.")

    # Пересчет рейтингов всех подрядчиков
    print("Rasschet distsiplinarnykh reytingov podryadchikov...")
    all_objs = db.query(InfraObject).all()
    all_defs = db.query(Defect).all()
    for c_id, contractor in contractor_objs.items():
        c_objs = [o for o in all_objs if o.contractor_id == c_id]
        c_defs = [d for d in all_defs if d.contractor_id == c_id]
        RatingService.calculate_contractor_discipline(contractor, c_objs, c_defs)
    db.commit()

    print("USPESHNO: Demo-dannye sgenerirovany!")
    print(f"- Podryadchikov: {len(contractors_data)}")
    print(f"- Obektov v reestre: {len(objects_created)}")
    print(f"- Dorog: {len(road_records)} (dlina: {total_roads_length:.1f} km)")
    print(f"- Defektov: {len(defects_created)}")

if __name__ == "__main__":
    init_db()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
