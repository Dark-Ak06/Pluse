import React, { useEffect, useState } from 'react';
import { Contractor } from '../types';
import { api } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { SystemicBadge } from '../components/common/Badge';
import { Users, AlertOctagon, CheckCircle2, ShieldAlert, Award, FileText } from 'lucide-react';

export const ContractorsPage: React.FC = () => {
  const { t } = useI18n();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getContractors()
      .then(setContractors)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Загрузка рейтинга подрядчиков...</div>;
  }

  const systemicContractors = contractors.filter((c) => c.is_systemic_problem);

  return (
    <div className="space-y-6 pb-12">
      {/* Шапка */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {t.contractors.title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t.contractors.subtitle}
        </p>
      </div>

      {/* Выделенный блок системных нарушителей */}
      {systemicContractors.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-sm">
              {t.contractors.systemicTitle} ({systemicContractors.length} подрядчика)
            </h3>
          </div>
          <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
            {t.contractors.systemicDesc}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {systemicContractors.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 shadow-sm space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-slate-900 dark:text-white">
                    {c.name}
                  </strong>
                  <SystemicBadge />
                </div>
                <div className="text-[11px] text-slate-500">
                  БИН: <span className="font-mono">{c.bin}</span> • Руководитель: {c.director_name}
                </div>
                <div className="text-xs text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg">
                  {c.systemic_reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Полная таблица рейтинга */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <Award className="w-4 h-4 text-sky-500" />
            <span>Сводная таблица дисциплинарного рейтинга</span>
          </h3>
          <span className="text-xs text-slate-500">
            Расчет по формуле G-TON (макс 100 баллов)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Подрядная организация</th>
                <th className="py-3 px-4">БИН</th>
                <th className="py-3 px-4">Руководство</th>
                <th className="py-3 px-4 text-center">Объекты стройки / срыв</th>
                <th className="py-3 px-4 text-center">Дорожные дефекты / просрочено</th>
                <th className="py-3 px-4 text-center">Балл дисциплины</th>
                <th className="py-3 px-4 text-right">Статус контроля</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {contractors.map((c) => (
                <tr
                  key={c.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                    c.is_systemic_problem ? 'bg-rose-50/25 dark:bg-rose-950/10' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {c.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{c.bin}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    <div>{c.director_name}</div>
                    <div className="text-[11px] text-slate-400">{c.phone}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold">{c.active_projects_count}</span>
                    <span className="text-slate-400"> / </span>
                    <span
                      className={`font-bold ${
                        c.delayed_projects_count > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {c.delayed_projects_count}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold">{c.active_defects_count}</span>
                    <span className="text-slate-400"> / </span>
                    <span
                      className={`font-bold ${
                        c.overdue_defects_count > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {c.overdue_defects_count}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-sm font-black ${
                        c.rating_score < 60
                          ? 'text-rose-600'
                          : c.rating_score < 85
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {c.rating_score}
                    </span>
                    <span className="text-slate-400 text-[10px]"> / 100</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {c.is_systemic_problem ? (
                      <SystemicBadge />
                    ) : c.rating_score >= 90 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        НАДЕЖНЫЙ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        В НОРМЕ
                      </span>
                    )}
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
