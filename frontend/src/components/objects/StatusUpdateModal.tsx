import React, { useState } from 'react';
import { InfraObject } from '../../types';
import { api } from '../../api/client';
import { X, Check } from 'lucide-react';

interface StatusUpdateModalProps {
  object: InfraObject | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  object,
  onClose,
  onSuccess,
}) => {
  if (!object) return null;

  const [progress, setProgress] = useState<number>(object.actual_progress);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateObjectStatus(object.id, progress, comment);
      onSuccess();
      onClose();
    } catch (err) {
      alert('Ошибка при обновлении статуса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Обновить статус объекта
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-slate-500">
          <span className="font-bold text-slate-800 dark:text-slate-200">{object.code}</span> — {object.name}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Фактический процент выполнения: {progress}% (План: {object.planned_progress}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={progress}
              onChange={(e) => setProgress(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0%</span>
              <input
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-0.5 text-center text-xs font-bold rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Комментарий куратора (работы за неделю)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Укажите выполненные объемы, задержки материалов или погодные условия..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? 'Сохранение...' : 'Зафиксировать статус'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
