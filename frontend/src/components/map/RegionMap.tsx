import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { InfraObject, Defect, Road } from '../../types';
import { AlertTriangle, Clock, Layers, Navigation } from 'lucide-react';

interface RegionMapProps {
  objects?: InfraObject[];
  defects?: Defect[];
  roads?: Road[];
  onSelectObject?: (obj: InfraObject) => void;
  onSelectDefect?: (defect: Defect) => void;
  heightClass?: string;
}

// Кастомные SVG-иконки для Leaflet
const createPinIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 10px;
          font-weight: bold;
        ">${label}</div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const createDefectIcon = (isOverdue: boolean, hasSystemic: boolean) => {
  const bg = hasSystemic ? '#ef4444' : (isOverdue ? '#f97316' : '#eab308');
  return L.divIcon({
    className: 'custom-defect-pin',
    html: `
      <div style="
        background-color: ${bg};
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 ${hasSystemic ? '10px #ef4444' : '4px rgba(0,0,0,0.4)'};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: white;
        "></div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
};

export const RegionMap: React.FC<RegionMapProps> = ({
  objects = [],
  defects = [],
  roads = [],
  onSelectObject,
  onSelectDefect,
  heightClass = 'h-[520px]',
}) => {
  const [showObjects, setShowObjects] = useState(true);
  const [showDefects, setShowDefects] = useState(true);
  const [showRoads, setShowRoads] = useState(true);

  // Координаты центра Сарыаркинской области (район Кокшетау / Зеренды)
  const centerLat = 52.8;
  const centerLon = 69.6;

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm`}>
      {/* Контролы слоев */}
      <div className="absolute top-3 right-3 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-2.5 shadow-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
        <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
          <Layers className="w-3.5 h-3.5 text-sky-500" />
          <span>Слои карты</span>
        </div>
        <label className="flex items-center space-x-2 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
          <input
            type="checkbox"
            checked={showObjects}
            onChange={(e) => setShowObjects(e.target.checked)}
            className="rounded text-sky-600 focus:ring-0"
          />
          <span>Объекты реестра ({objects.length})</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
          <input
            type="checkbox"
            checked={showDefects}
            onChange={(e) => setShowDefects(e.target.checked)}
            className="rounded text-amber-500 focus:ring-0"
          />
          <span>Дефекты дорог ({defects.length})</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
          <input
            type="checkbox"
            checked={showRoads}
            onChange={(e) => setShowRoads(e.target.checked)}
            className="rounded text-indigo-500 focus:ring-0"
          />
          <span>Трассы ({roads.length})</span>
        </label>
      </div>

      {/* Легенда цветов */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl px-3 py-2 shadow-lg border border-slate-200 dark:border-slate-700 text-[11px] flex items-center space-x-3 text-slate-700 dark:text-slate-300">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>В графике</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Риск</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>Отставание</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600 border border-white"></span>
          <span>Дефект / Яма</span>
        </div>
      </div>

      <MapContainer
        center={[centerLat, centerLon]}
        zoom={8}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Дорожные полилинии */}
        {showRoads &&
          roads.map((road) => {
            const positions: [number, number][] = [];
            road.sections.forEach((s) => {
              if (s.center_latitude && s.center_longitude) {
                positions.push([s.center_latitude, s.center_longitude]);
              }
            });
            if (positions.length < 2) return null;

            return (
              <Polyline
                key={road.id}
                positions={positions}
                pathOptions={{
                  color: '#0284c7',
                  weight: 3.5,
                  opacity: 0.7,
                  dashArray: '6, 6',
                }}
              />
            );
          })}

        {/* Маркеры объектов реестра */}
        {showObjects &&
          objects.map((obj) => {
            const isDelayed = obj.health_status === 'delayed' || obj.has_lag_flag;
            const isRisk = obj.health_status === 'at_risk';
            const color = isDelayed ? '#ef4444' : isRisk ? '#f59e0b' : '#10b981';
            const icon = createPinIcon(color, obj.type === 'construction' ? 'С' : 'Р');

            return (
              <Marker
                key={`obj-${obj.id}`}
                position={[obj.latitude, obj.longitude]}
                icon={icon}
              >
                <Popup>
                  <div className="p-1 min-w-[220px] max-w-[280px] text-xs font-sans">
                    <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-200">
                      <span className="font-bold text-sky-700">{obj.code}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isDelayed
                            ? 'bg-rose-100 text-rose-700'
                            : isRisk
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isDelayed ? 'ОТСТАВАНИЕ' : isRisk ? 'РИСК' : 'В ГРАФИКЕ'}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-900 text-xs mb-1 line-clamp-2">
                      {obj.name}
                    </h4>

                    <div className="space-y-1 text-slate-600 mb-2">
                      <div>
                        Район: <strong className="text-slate-800">{obj.district}</strong>
                      </div>
                      <div>
                        Подрядчик:{' '}
                        <strong className="text-slate-800">
                          {obj.contractor?.name || 'Не назначен'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span>
                          План: <strong>{obj.planned_progress}%</strong>
                        </span>
                        <span>
                          Факт:{' '}
                          <strong className={isDelayed ? 'text-rose-600' : 'text-slate-800'}>
                            {obj.actual_progress}%
                          </strong>
                        </span>
                      </div>
                      {obj.has_lag_flag && (
                        <div className="text-rose-600 font-semibold flex items-center space-x-1 pt-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Отставание на {obj.lag_points} п.п.</span>
                        </div>
                      )}
                    </div>

                    {onSelectObject && (
                      <button
                        onClick={() => onSelectObject(obj)}
                        className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-center transition"
                      >
                        Открыть карточку объекта
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Маркеры дорожных дефектов */}
        {showDefects &&
          defects.map((def) => {
            const icon = createDefectIcon(def.is_overdue, def.has_systemic_flag);

            return (
              <Marker
                key={`def-${def.id}`}
                position={[def.latitude, def.longitude]}
                icon={icon}
              >
                <Popup>
                  <div className="p-1 min-w-[200px] text-xs font-sans">
                    <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-200">
                      <span className="font-bold text-amber-700">{def.code}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          def.has_systemic_flag
                            ? 'bg-rose-100 text-rose-700 border border-rose-300'
                            : def.is_overdue
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {def.has_systemic_flag ? 'СИСТЕМНЫЙ СБОЙ' : def.status}
                      </span>
                    </div>

                    <p className="text-slate-800 font-medium mb-1 line-clamp-2">
                      {def.description}
                    </p>

                    <div className="text-[11px] text-slate-500 space-y-0.5 mb-2">
                      <div>Участок: {def.address_reference}</div>
                      <div>
                        Подрядчик: <strong>{def.contractor?.name || 'Н/Д'}</strong>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-600">
                        <Clock className="w-3 h-3 text-sky-500" />
                        <span>Передача: {def.handover_duration_seconds} сек. (&lt;5 мин)</span>
                      </div>
                    </div>

                    {onSelectDefect && (
                      <button
                        onClick={() => onSelectDefect(def)}
                        className="w-full py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-center transition"
                      >
                        Посмотреть дефект
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};
