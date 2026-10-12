import React, { useState } from 'react';
import { api } from '../../api/client';
import { X, Sparkles, Send, HelpCircle } from 'lucide-react';

interface AiSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiSearchModal: React.FC<AiSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (textToSearch?: string) => {
    const q = textToSearch || query;
    if (!q.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await api.askAssistant(q);
      setAnswer(res.answer);
    } catch (e) {
      setAnswer('Произошла ошибка при обращении к ИИ-помощнику.');
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    'какие объекты отстают в Есильском районе',
    'анализ подрядчика ТОО Сарыарқа Жол Құрылыс',
    'просроченные дефекты и ямы по области',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                ИИ-Помощник Акимата
              </h3>
              <p className="text-[11px] text-slate-500">
                Поиск на естественном языке и аналитические подсказки по региону
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Быстрые примеры */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Примеры запросов:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(sample);
                  handleSearch(sample);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Поле ввода */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Спросите о состоянии объектов, дорог или подрядчиков..."
            className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="absolute right-2 top-2 p-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50 transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ответ ИИ */}
        {loading && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500 space-y-2">
            <Sparkles className="w-5 h-5 mx-auto text-sky-500 animate-spin" />
            <span>ИИ-помощник анализирует 127 объектов и дорожные дефекты...</span>
          </div>
        )}

        {answer && !loading && (
          <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {answer}
          </div>
        )}

        {/* Дисклеймер */}
        <div className="flex items-start space-x-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            ИИ сформирован на базе абстракции LLMProvider (MockProvider по умолчанию). Все решения принимаются должностными лицами.
          </span>
        </div>
      </div>
    </div>
  );
};
