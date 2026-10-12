import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { X, Sliders, Check } from 'lucide-react';

interface ThresholdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ThresholdsModal: React.FC<ThresholdsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [lagThresh, setLagThresh] = useState<number>(10.0);
  const [freshThresh, setFreshThresh] = useState<number>(14);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getThresholds().then((data) => {
        setLagThresh(data.lag_percent_threshold);
        setFreshThresh(data.freshness_days_threshold);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateThresholds(lagThresh, freshThresh);
      onSaved();
      onClose();
    } catch (e) {
      alert('Ошибка при сохранении порогов');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-sky-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Настройка порогов отставания
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Изменение порогов автоматически пересчитывает флаги контроля по всем 127 объектам области в реальном времени.
        </p>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>Критическое отставание (факт от плана):</span>
              <span className="font-bold text-sky-600">{lagThresh} п.п.</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={lagThresh}
              onChange={(e) => setLagThresh(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg accent-sky-600"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>Контроль актуальности (дней без обновления):</span>
              <span className="font-bold text-sky-600">{freshThresh} дней</span>
            </div>
            <input
              type="range"
              min="7"
              max="30"
              step="1"
              value={freshThresh}
              onChange={(e) => setFreshThresh(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg accent-sky-600"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition flex items-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{loading ? 'Применение...' : 'Применить пороги'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
