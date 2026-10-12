import React, { useState } from 'react';
import { api } from '../../api/client';
import { X, Upload, FileText, CheckCircle2 } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResultMsg(null);
    try {
      const res = await api.importCsv(file);
      setResultMsg(res.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (e) {
      alert('Ошибка при импорте CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Upload className="w-4 h-4 text-sky-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Массовый импорт из CSV
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
          Загрузите CSV-файл с колонками: <code className="text-sky-600">code</code>, <code className="text-sky-600">actual_progress</code>, <code className="text-sky-600">comment</code> для пакетного обновления статусов объектов области.
        </p>

        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-sky-500 transition">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="csv-file-input"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-400 hover:text-sky-500" />
            <span className="text-xs font-semibold text-sky-600 block">
              {file ? file.name : 'Выберите CSV файл на диске'}
            </span>
            <span className="text-[11px] text-slate-400 block">Размер до 5 МБ</span>
          </label>
        </div>

        {resultMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{resultMsg}</span>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Отмена
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white transition"
          >
            {loading ? 'Загрузка...' : 'Импортировать'}
          </button>
        </div>
      </div>
    </div>
  );
};
