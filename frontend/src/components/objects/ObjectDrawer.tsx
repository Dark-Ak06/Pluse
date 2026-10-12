import React, { useEffect, useState } from 'react';
import { InfraObject, InfraObjectDetail, Defect } from '../../types';
import { api } from '../../api/client';
import { HealthBadge, StageBadge } from '../common/Badge';
import { X, Calendar, DollarSign, User, AlertTriangle, CheckCircle2, Clock, Wrench } from 'lucide-react';

interface ObjectDrawerProps {
  object: InfraObject | null;
  onClose: () => void;
  onOpenUpdateStatus: (obj: InfraObject) => void;
}

export const ObjectDrawer: React.FC<ObjectDrawerProps> = ({
  object,
  onClose,
  onOpenUpdateStatus,
}) => {
  const [detail, setDetail] = useState<InfraObjectDetail | null>(null);
  const [linkedDefects, setLinkedDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!object) {
      setDetail(null);
      setLinkedDefects([]);
      return;
    }

    setLoading(true);
    Promise.all([
      api.getObjectDetail(object.id),
      api.getObjectDefects(object.id),
    ])
      .then(([d, defs]) => {
        setDetail(d);
        setLinkedDefects(defs);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [object]);

  if (!object) return null;

  const currentObj = detail || object;
  const isDelayed = currentObj.health_status === 'delayed' || currentObj.has_lag_flag;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform">
      {/* Шапка карточки */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
              {currentObj.code}
            </span>
            <StageBadge stage={currentObj.stage} />
            <HealthBadge status={currentObj.health_status} lagPoints={currentObj.lag_points} />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
            {currentObj.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{currentObj.district} • {currentObj.location_description}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Тело карточки */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-600 dark:text-slate-400">
        {/* Прогресс план vs факт */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">План: </span>
              <strong className="text-slate-900 dark:text-white">{currentObj.planned_progress}%</strong>
            </div>
            <div>
              <span className="text-slate-500">Факт: </span>
              <strong className={isDelayed ? 'text-rose-600 font-bold' : 'text-slate-900 dark:text-white'}>
                {currentObj.actual_progress}%
              </strong>
            </div>
            {currentObj.has_lag_flag && (
              <span className="text-rose-600 font-bold">
                Отставание: -{currentObj.lag_points} п.п.
              </span>
            )}
          </div>

          {/* Двойная полоса прогресса */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-slate-400 dark:bg-slate-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, currentObj.planned_progress)}%` }}
                title={`План: ${currentObj.planned_progress}%`}
              ></div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isDelayed ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, currentObj.actual_progress)}%` }}
                title={`Факт: ${currentObj.actual_progress}%`}
              ></div>
            </div>
          </div>

          {currentObj.flag_summary && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Флаги контроля:</strong>
                <span>{currentObj.flag_summary}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => onOpenUpdateStatus(currentObj)}
            className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition flex items-center justify-center space-x-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Обновить прогресс и статус</span>
          </button>
        </div>

        {/* Смета и Подрядчик */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Выделено по смете</span>
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              {currentObj.budget_allocated.toLocaleString('ru-RU')} ₸
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Освоено: {currentObj.budget_spent.toLocaleString('ru-RU')} ₸
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
              <User className="w-3.5 h-3.5" />
              <span>Генподрядчик</span>
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
              {currentObj.contractor?.name || 'Не назначен'}
            </div>
            {currentObj.contractor?.is_systemic_problem && (
              <span className="inline-block mt-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                🚨 Системный нарушитель
              </span>
            )}
          </div>
        </div>

        {/* СВЯЗКА МОДУЛЕЙ: Связанные дефекты на этом же участке дороги */}
        <div>
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-amber-500" />
              <span>Связанные дефекты дороги ({linkedDefects.length})</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Общий участок и подрядчик
            </span>
          </div>

          {linkedDefects.length === 0 ? (
            <div className="p-3 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              На закрепленном участке дорожные дефекты отсутствуют.
            </div>
          ) : (
            <div className="space-y-2">
              {linkedDefects.map((d) => (
                <div
                  key={d.id}
                  className={`p-3 rounded-xl border transition ${
                    d.has_systemic_flag
                      ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                      : d.is_overdue
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {d.code} • {d.defect_type}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        d.has_systemic_flag
                          ? 'bg-rose-600 text-white'
                          : d.is_overdue
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {d.has_systemic_flag ? 'СИСТЕМНЫЙ СБОЙ' : d.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs mb-1">
                    {d.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{d.address_reference}</span>
                    {d.is_overdue && <span className="text-rose-600 font-bold">Просрочено!</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Контрольные вехи */}
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-200 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-sky-500" />
            <span>Контрольные вехи графика ({detail?.milestones.length || 0})</span>
          </div>

          <div className="space-y-2">
            {(detail?.milestones || []).map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between"
              >
                <div className="space-y-0.5 pr-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {m.title}
                  </span>
                  <div className="text-[11px] text-slate-500">
                    План: {m.planned_date}
                    {m.actual_date && ` • Факт: ${m.actual_date}`}
                  </div>
                </div>
                {m.is_completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : m.is_overdue ? (
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                    ПРОСРОЧЕНО
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                    В РАБОТЕ
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
