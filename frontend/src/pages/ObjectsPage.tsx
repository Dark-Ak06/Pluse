import React, { useEffect, useState } from 'react';
import { InfraObject } from '../types';
import { api } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { RegionMap } from '../components/map/RegionMap';
import { HealthBadge, StageBadge } from '../components/common/Badge';
import { ObjectDrawer } from '../components/objects/ObjectDrawer';
import { StatusUpdateModal } from '../components/objects/StatusUpdateModal';
import { CsvImportModal } from '../components/objects/CsvImportModal';
import { ThresholdsModal } from '../components/objects/ThresholdsModal';
import {
  Search, Filter, Download, Upload, Sliders, AlertTriangle, Clock,
  MapPin, CheckCircle2, ChevronRight, FileSpreadsheet, FileDown
} from 'lucide-react';

export const ObjectsPage: React.FC = () => {
  const { t } = useI18n();
  const [objects, setObjects] = useState<InfraObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<InfraObject | null>(null);
  const [updatingObject, setUpdatingObject] = useState<InfraObject | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isThresholdsOpen, setIsThresholdsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Фильтры
  const [district, setDistrict] = useState<string>('');
  const [stage, setStage] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [hasLag, setHasLag] = useState<boolean>(false);
  const [hasFreshnessIssue, setHasFreshnessIssue] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'table'>('both');

  const loadObjects = async () => {
    setLoading(true);
    try {
      const data = await api.getObjects({
        district: district || undefined,
        stage: stage || undefined,
        category: category || undefined,
        has_lag: hasLag ? true : undefined,
        has_freshness_issue: hasFreshnessIssue ? true : undefined,
        search: search || undefined,
      });
      setObjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObjects();
  }, [district, stage, category, hasLag, hasFreshnessIssue]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadObjects();
  };

  const delayedCount = objects.filter((o) => o.has_lag_flag).length;
  const staleCount = objects.filter((o) => o.has_freshness_flag).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Шапка страницы */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.objects.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.objects.subtitle} (всего {objects.length} в выборке)
          </p>
        </div>

        {/* Экспорт и сервисные кнопки */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsThresholdsOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm transition"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-500" />
            <span>{t.objects.thresholdsBtn}</span>
          </button>

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm transition"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t.objects.importCsv}</span>
          </button>

          <a
            href="/api/v1/objects/export/excel"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center space-x-1.5 shadow-sm transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </a>

          <a
            href="/api/v1/objects/export/pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center space-x-1.5 shadow-sm transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Официальный PDF</span>
          </a>
        </div>
      </div>

      {/* Панель фильтрации */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Поиск */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder={t.objects.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          {/* Район */}
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Все районы области</option>
            <option value="Зеренді ауданы">Зеренді ауданы</option>
            <option value="Бурабай ауданы">Бурабай ауданы</option>
            <option value="Есіл ауданы">Есіл ауданы</option>
            <option value="Нұра ауданы">Нұра ауданы</option>
            <option value="Көкшетау қаласы">Көкшетау қаласы</option>
          </select>

          {/* Стадия */}
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Все стадии проекта</option>
            <option value="planning">1. Планирование</option>
            <option value="procurement">2. Закупка</option>
            <option value="construction">3. Строительство / Ремонт</option>
            <option value="acceptance">4. Приёмка</option>
            <option value="operation">5. Эксплуатация</option>
          </select>

          {/* Категория */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Все категории</option>
            <option value="road">Дорожные объекты</option>
            <option value="social">Социальные (школы, больницы)</option>
            <option value="utilities">ЖКХ и водоснабжение</option>
          </select>
        </div>

        {/* Быстрые фильтры-флаги */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={hasLag}
                onChange={(e) => setHasLag(e.target.checked)}
                className="rounded text-rose-600 focus:ring-0"
              />
              <span className={hasLag ? 'text-rose-600 font-bold' : ''}>
                Только с отставанием ({delayedCount})
              </span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={hasFreshnessIssue}
                onChange={(e) => setHasFreshnessIssue(e.target.checked)}
                className="rounded text-amber-500 focus:ring-0"
              />
              <span className={hasFreshnessIssue ? 'text-amber-600 font-bold' : ''}>
                Не обновлялись &gt;14 дней ({staleCount})
              </span>
            </label>
          </div>

          {/* Режимы вида */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                viewMode === 'both' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Карта + Реестр
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                viewMode === 'map' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Только карта
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Только реестр
            </button>
          </div>
        </div>
      </div>

      {/* Карта объектов */}
      {(viewMode === 'both' || viewMode === 'map') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <RegionMap
            objects={objects}
            onSelectObject={(obj) => setSelectedObject(obj)}
            heightClass="h-[420px]"
          />
        </div>
      )}

      {/* Таблица реестра */}
      {(viewMode === 'both' || viewMode === 'table') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Код</th>
                  <th className="py-3 px-4">Наименование объекта</th>
                  <th className="py-3 px-4">Район</th>
                  <th className="py-3 px-4">Стадия</th>
                  <th className="py-3 px-4">Подрядчик</th>
                  <th className="py-3 px-4 text-center">План / Факт</th>
                  <th className="py-3 px-4 text-center">Статус здоровья</th>
                  <th className="py-3 px-4 text-center">Обновление</th>
                  <th className="py-3 px-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {objects.map((obj) => (
                  <tr
                    key={obj.id}
                    onClick={() => setSelectedObject(obj)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {obj.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-[280px]">
                      <div className="line-clamp-2">{obj.name}</div>
                      {obj.flag_summary && obj.has_lag_flag && (
                        <span className="text-[10px] text-rose-500 font-normal block mt-0.5">
                          {obj.flag_summary}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {obj.district}
                    </td>
                    <td className="py-3 px-4">
                      <StageBadge stage={obj.stage} />
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {obj.contractor?.name || 'Не назначен'}
                      {obj.contractor?.is_systemic_problem && (
                        <span className="block text-[10px] font-bold text-rose-600">
                          🚨 Системный сбой
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {obj.actual_progress}%
                      </div>
                      <div className="text-[10px] text-slate-400">План: {obj.planned_progress}%</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <HealthBadge status={obj.health_status} lagPoints={obj.lag_points} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[11px] font-medium ${
                          obj.has_freshness_flag
                            ? 'text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded'
                            : 'text-slate-500'
                        }`}
                      >
                        {obj.days_since_update} дн. назад
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUpdatingObject(obj);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition"
                      >
                        Статус
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Карточка объекта */}
      <ObjectDrawer
        object={selectedObject}
        onClose={() => setSelectedObject(null)}
        onOpenUpdateStatus={(obj) => setUpdatingObject(obj)}
      />

      {/* Модальные окна */}
      <StatusUpdateModal
        object={updatingObject}
        onClose={() => setUpdatingObject(null)}
        onSuccess={() => {
          loadObjects();
          if (selectedObject) {
            api.getObjectDetail(selectedObject.id).then(setSelectedObject);
          }
        }}
      />

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={loadObjects}
      />

      <ThresholdsModal
        isOpen={isThresholdsOpen}
        onClose={() => setIsThresholdsOpen(false)}
        onSaved={loadObjects}
      />
    </div>
  );
};
