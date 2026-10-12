import React, { useEffect, useState } from 'react';
import { Road, NetworkCoverage } from '../types';
import { api } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { RegionMap } from '../components/map/RegionMap';
import { Navigation, CheckCircle2, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';

export const RoadsPage: React.FC = () => {
  const { t } = useI18n();
  const [roads, setRoads] = useState<Road[]>([]);
  const [coverage, setCoverage] = useState<NetworkCoverage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getRoads(), api.getNetworkCoverage()])
      .then(([rds, cov]) => {
        setRoads(rds);
        setCoverage(cov);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Загрузка дорожной сети области...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Шапка */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {t.roads.title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t.roads.subtitle} • 60 участков с назначенными подрядчиками
        </p>
      </div>

      {/* Шкала KPI покрытия сети */}
      {coverage && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t.roads.coverageKpi}
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {coverage.inspected_km.toLocaleString()} из {coverage.total_km.toLocaleString()} км ({coverage.coverage_percent}%)
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 self-start sm:self-auto">
              {t.roads.targetKpi}
            </span>
          </div>

          {/* Индикатор */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, coverage.coverage_percent)}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="flex items-center space-x-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Осмотрено: {coverage.inspected_km} км</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-600 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Не осмотрено участков: {coverage.uninspected_sections_count}</span>
            </span>
          </div>
        </div>
      )}

      {/* Карта дорог */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-sky-500" />
          <span>Геометрия трасс областного значения (1 588 км)</span>
        </h3>
        <RegionMap roads={roads} heightClass="h-[440px]" />
      </div>

      {/* Таблица 20 дорог */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Реестр 20 областных дорог
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Индекс</th>
                <th className="py-3 px-4">Наименование трассы</th>
                <th className="py-3 px-4">Протяженность</th>
                <th className="py-3 px-4">Район прохождения</th>
                <th className="py-3 px-4">Участков</th>
                <th className="py-3 px-4">Генподрядчик</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {roads.map((road) => (
                <tr key={road.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-sky-600">
                    {road.code}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {road.name}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                    {road.total_length_km} км
                  </td>
                  <td className="py-3 px-4 text-slate-500">{road.district || 'Область'}</td>
                  <td className="py-3 px-4 text-slate-600 font-semibold">{road.sections.length} уч.</td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {road.sections[0]?.contractor?.name || 'ТОО «Сарыарқа Жол Құрылыс»'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
