import React from 'react';
import { ObjectHealth, ObjectStage } from '../../types';

export const HealthBadge: React.FC<{ status: ObjectHealth; lagPoints?: number }> = ({ status, lagPoints }) => {
  if (status === 'delayed') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
        <span>ОТСТАВАНИЕ {lagPoints ? `(${lagPoints} п.п.)` : ''}</span>
      </span>
    );
  }
  if (status === 'at_risk') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span>РИСК</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      <span>В ГРАФИКЕ</span>
    </span>
  );
};

export const StageBadge: React.FC<{ stage: ObjectStage }> = ({ stage }) => {
  const map: Record<ObjectStage, { text: string; bg: string }> = {
    planning: { text: '1. Планирование', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    procurement: { text: '2. Закупка', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
    construction: { text: '3. Строительство', bg: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
    acceptance: { text: '4. Приёмка', bg: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
    operation: { text: '5. Эксплуатация', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  };

  const current = map[stage] || { text: stage, bg: 'bg-slate-100 text-slate-700' };

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${current.bg}`}>
      {current.text}
    </span>
  );
};

export const SystemicBadge: React.FC<{ reason?: string }> = ({ reason }) => {
  return (
    <span
      title={reason || 'Системное отставание по проектам и дорожным дефектам'}
      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white shadow-sm shadow-rose-500/30 border border-rose-400 animate-pulse"
    >
      <span>🚨 СИСТЕМНЫЙ СБОЙ</span>
    </span>
  );
};
