import math
import json
from typing import List, Tuple, Optional
from app.models.road import RoadSection
from app.models.infrastructure import InfraObject

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Расстояние между двумя точками на сфере (в км)."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class RoadMatcher:
    @staticmethod
    def find_nearest_section(
        latitude: float,
        longitude: float,
        sections: List[RoadSection]
    ) -> Tuple[Optional[RoadSection], float]:
        """
        Находит ближайший участок дороги по координатам инспектора.
        Возвращает (RoadSection, расстояние в км).
        """
        if not sections:
            return None, float("inf")

        best_section = None
        min_dist = float("inf")

        for sec in sections:
            # Сначала проверяем центр участка
            if sec.center_latitude and sec.center_longitude:
                dist = haversine_distance_km(latitude, longitude, sec.center_latitude, sec.center_longitude)
                if dist < min_dist:
                    min_dist = dist
                    best_section = sec

            # Если есть GeoJSON линии участка, проверяем вершины
            if sec.geometry_geojson:
                try:
                    coords = json.loads(sec.geometry_geojson)
                    # coords: [[lon, lat], ...]
                    for pt in coords:
                        if len(pt) >= 2:
                            pt_lon, pt_lat = pt[0], pt[1]
                            dist_pt = haversine_distance_km(latitude, longitude, pt_lat, pt_lon)
                            if dist_pt < min_dist:
                                min_dist = dist_pt
                                best_section = sec
                except Exception:
                    pass

        return best_section, min_dist

    @staticmethod
    def match_defect_to_infrastructure(
        road_section_id: Optional[int],
        road_id: Optional[int],
        active_objects: List[InfraObject]
    ) -> Optional[InfraObject]:
        """
        Сквозная связка: если на данном участке дороги или на этой дороге
        в данный момент ведется ремонт по реестру инфраструктурных проектов,
        возвращаем соответствующий объект.
        """
        if not active_objects:
            return None

        # Приоритет 1: прямое совпадение по участку
        if road_section_id:
            for obj in active_objects:
                if obj.linked_road_section_id == road_section_id:
                    return obj

        # Приоритет 2: совпадение по дороге
        if road_id:
            for obj in active_objects:
                if obj.linked_road_id == road_id:
                    return obj

        return None
