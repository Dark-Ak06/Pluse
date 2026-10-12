import React, { useState } from 'react';
import { api } from '../../api/client';
import { X, Sparkles, Copy, Check, FileDown } from 'lucide-react';

interface AiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiSummaryModal: React.FC<AiSummaryModalProps> = ({ isOpen, onClose }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSummary(null);
      api.generateAiSummary()
        .then((res) => setSummary(res.summary))
        .catch(() => setSummary('Ошибка генерации аналитической сводки.'))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Единая аналитическая сводка Акима
              </h3>
              <p className="text-[11px] text-slate-500">
                Сформировано ИИ-аналитиком по 127 объектам и 1 588 км дорожной сети области
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 mx-auto text-sky-500 animate-spin" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Генерация оперативной сводки для Акима области...
            </p>
            <p className="text-[11px] text-slate-400">
              Сведение данных реестра инфраструктуры, дорожных участков и дисциплины подрядчиков
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 max-h-[380px] overflow-y-auto text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <a
            href="/api/v1/objects/export/pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition flex items-center space-x-1.5"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Скачать официальный PDF</span>
          </a>

          <div className="flex space-x-2">
            <button
              onClick={handleCopy}
              disabled={!summary}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition flex items-center space-x-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
