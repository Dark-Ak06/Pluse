import React, { useEffect, useState } from 'react';
import { DashboardData, InfraObject, Defect, Road } from '../types';
import { api } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { StatCard } from '../components/common/StatCard';
import { RegionMap } from '../components/map/RegionMap';
import { HealthBadge, SystemicBadge, StageBadge } from '../components/common/Badge';
import { ObjectDrawer } from '../components/objects/ObjectDrawer';
import { StatusUpdateModal } from '../components/objects/StatusUpdateModal';
import {
  Building2, CheckCircle2, AlertOctagon, Navigation, Wrench,
  Clock, Sparkles, TrendingUp, BarChart3, AlertTriangle, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

interface DashboardPageProps {
  onOpenAiSummary: () => void;
  onNavigateToObjects: () => void;
  onNavigateToContractors: () => void;
  onNavigateToInspector: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenAiSummary,
  onNavigateToObjects,
  onNavigateToContractors,
  onNavigateToInspector,
}) => {
  const { t } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [objects, setObjects] = useState<InfraObject[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [selectedObject, setSelectedObject] = useState<InfraObject | null>(null);
  const [updatingObject, setUpdatingObject] = useState<InfraObject | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [dash, objs, defs, rds] = await Promise.all([
        api.getDashboardOverview(),
        api.getObjects(),
        api.getDefects(),
        api.getRoads(),
      ]);
      setData(dash);
      setObjects(objs);
      setDefects(defs);
      setRoads(rds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500">Загрузка данных региона...</p>
        </div>
      </div>
    );
  }

  const { kpi } = data;

  const stageColors = ['#9333ea', '#3b82f6', '#0284c7', '#0d9488', '#10b981'];

  return (
    <div className="space-y-6 pb-12">
      {/* Шапка дашборда */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.dashboard.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.dashboard.subtitle}
          </p>
        </div>

        <button
          onClick={onOpenAiSummary}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white font-semibold text-xs shadow-md shadow-sky-500/25 transition transform hover:-translate-y-0.5"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.dashboard.aiSummaryBtn}</span>
        </button>
      </div>

      {/* 4 Ключевые KPI карточки (читаются за 15 секунд) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Объекты реестра */}
        <StatCard
          title="Объекты реестра"
          value={kpi.total_objects}
          icon={Building2}
          subtitle={`В графике: ${kpi.objects_on_schedule} • Риск: ${kpi.objects_at_risk}`}
          badge={{
            text: `${kpi.objects_delayed} с отставанием`,
            type: kpi.objects_delayed > 0 ? 'danger' : 'success',
          }}
          onClick={onNavigateToObjects}
        />

        {/* KPI 2: Актуальность статусов */}
        <StatCard
          title="Актуальность статусов"
          value={`${kpi.freshness_rate_percent}%`}
          icon={CheckCircle2}
          subtitle="Обновлены за последние 14 дней"
          badge={{
            text: kpi.freshness_rate_percent >= 90 ? 'Цель KPI 90% ✓' : 'Ниже норматива',
            type: kpi.freshness_rate_percent >= 90 ? 'success' : 'warning',
          }}
          onClick={onNavigateToObjects}
        />

        {/* KPI 3: Дорожная сеть */}
        <StatCard
          title="Покрытие дорог за месяц"
          value={`${kpi.coverage_rate_percent}%`}
          icon={Navigation}
          subtitle={`${kpi.inspected_roads_km.toLocaleString()} из ${kpi.total_roads_km.toLocaleString()} км`}
          badge={{
            text: 'Цель KPI 100%',
            type: kpi.coverage_rate_percent >= 90 ? 'info' : 'warning',
          }}
          onClick={onNavigateToInspector}
        />

        {/* KPI 4: Устранение дефектов и SLA */}
        <StatCard
          title="Дефекты дорог в срок"
          value={`${kpi.defects_on_time_percent}%`}
          icon={Wrench}
          subtitle={`Передача: ~${kpi.avg_handover_minutes} мин (цель <5 мин)`}
          badge={{
            text: `${kpi.defects_overdue} просрочено`,
            type: kpi.defects_overdue > 0 ? 'danger' : 'success',
          }}
          onClick={onNavigateToContractors}
        />
      </div>

      {/* Интерактивная карта региона */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-sky-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Единая интерактивная карта (127 объектов • 1 588 км дорог • дефекты)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Кликните по маркеру для просмотра карточки
          </span>
        </div>

        <RegionMap
          objects={objects}
          defects={defects}
          roads={roads}
          onSelectObject={(obj) => setSelectedObject(obj)}
          heightClass="h-[460px]"
        />
      </div>

      {/* Две ключевые колонки: Топ проблемных подрядчиков и Топ отстающих строек */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ проблемных подрядчиков */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t.dashboard.topContractorsTitle}
                </h3>
              </div>
              <button
                onClick={onNavigateToContractors}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
              >
                <span>Все подрядчики</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {data.top_problem_contractors.map((c, idx) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-xl border transition ${
                    c.is_systemic_problem
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {idx + 1}
                      </span>
                      <strong className="text-xs text-slate-900 dark:text-white font-bold">
                        {c.name}
                      </strong>
                    </div>
                    {c.is_systemic_problem ? (
                      <SystemicBadge reason={c.systemic_reason} />
                    ) : (
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {c.rating_score} / 100
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between pt-1">
                    <span>
                      Объекты ремонта: <strong>{c.delayed_projects_count}</strong> с отставанием из {c.active_projects_count}
                    </span>
                    <span>
                      Дорожные дефекты: <strong className="text-rose-600 font-bold">{c.overdue_defects_count}</strong> просрочено
                    </span>
                  </div>

                  {c.is_systemic_problem && (
                    <div className="mt-2 text-[11px] text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-900/40 px-2.5 py-1 rounded-lg">
                      {c.systemic_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Топ отстающих объектов */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t.dashboard.topLaggingTitle}
                </h3>
              </div>
              <button
                onClick={onNavigateToObjects}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
              >
                <span>Все 127 объектов</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {data.top_lagging_objects.map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => setSelectedObject(obj)}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:border-sky-400 dark:hover:border-sky-500 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                      {obj.code}
                    </span>
                    <HealthBadge status={obj.health_status} lagPoints={obj.lag_points} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
                    {obj.name}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{obj.district} • {obj.contractor?.name || 'Н/Д'}</span>
                    <span>
                      План: {obj.planned_progress}% / <strong>Факт: {obj.actual_progress}%</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Аналитические диаграммы: Жизненный цикл и Районы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Воронка стадий */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
            {t.dashboard.stagesTitle}
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            Распределение 127 проектов по этапам реализации
          </p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stage_breakdown} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {data.stage_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={stageColors[index % stageColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Районы области */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
            {t.dashboard.districtsTitle}
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            Количество объектов и срывов по 5 районам области
          </p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.district_breakdown}>
                <XAxis dataKey="district" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="objects_count" name="Всего объектов" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delayed_count" name="С отставанием" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Выдвижная карточка детального просмотра объекта */}
      <ObjectDrawer
        object={selectedObject}
        onClose={() => setSelectedObject(null)}
        onOpenUpdateStatus={(obj) => setUpdatingObject(obj)}
      />

      {/* Модальное окно обновления статуса */}
      <StatusUpdateModal
        object={updatingObject}
        onClose={() => setUpdatingObject(null)}
        onSuccess={() => {
          loadData();
          if (selectedObject) {
            api.getObjectDetail(selectedObject.id).then(setSelectedObject);
          }
        }}
      />
    </div>
  );
};
