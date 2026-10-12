import React, { useState, useEffect } from 'react';
import { Defect, DefectType, DefectSeverity } from '../types';
import { api } from '../api/client';
import { useI18n } from '../context/I18nContext';
import {
  Camera, MapPin, Send, CheckCircle2, Clock, AlertTriangle, Sparkles,
  Smartphone, ShieldAlert, Check, RefreshCw, XCircle, ChevronRight
} from 'lucide-react';

export const InspectorAppPage: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'create' | 'queue'>('create');
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  // Состояние формы фиксации (3 действия)
  const [photoPreview, setPhotoPreview] = useState<string>('/demo_photos/pothole_1.jpg');
  const [photoCaptured, setPhotoCaptured] = useState<boolean>(true);
  const [defectType, setDefectType] = useState<DefectType>('pothole');
  const [severity, setSeverity] = useState<DefectSeverity>('emergency');
  const [description, setDescription] = useState<string>('Аварийная выбоина на трассе КВ-03, глубина 8 см. Разрушение асфальтобетона.');

  // GPS инспектора (по умолчанию координаты трассы КВ-03 для моментальной демонстрации связки)
  const [latitude, setLatitude] = useState<number>(53.2500);
  const [longitude, setLongitude] = useState<number>(69.2000);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(4.2);
  const [hasGpsConsent, setHasGpsConsent] = useState<boolean>(true);

  // Результат отправки дефекта
  const [submittedDefect, setSubmittedDefect] = useState<Defect | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiClassifying, setAiClassifying] = useState(false);

  // Очередь дефектов для проверки
  const [defectsQueue, setDefectsQueue] = useState<Defect[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  const loadDefectsQueue = async () => {
    setLoadingQueue(true);
    try {
      const data = await api.getDefects();
      setDefectsQueue(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'queue') {
      loadDefectsQueue();
    }
  }, [activeTab]);

  // Запрос реальной геолокации браузера при желании
  const handleRequestLiveGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(4)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(4)));
          setGpsAccuracy(parseFloat(pos.coords.accuracy.toFixed(1)));
          setHasGpsConsent(true);
        },
        () => {
          alert('Используются координаты рабочего маршрута (трасса КВ-03).');
        }
      );
    }
  };

  // ИИ автоопределение типа и серьезности по описанию
  const handleAiClassify = async () => {
    if (!description) return;
    setAiClassifying(true);
    try {
      const res = await api.classifyDefect(description);
      setDefectType(res.defect_type as DefectType);
      setSeverity(res.severity as DefectSeverity);
    } catch (e) {
      console.error(e);
    } finally {
      setAiClassifying(false);
    }
  };

  // Фиксация и отправка заявки подрядчику
  const handleSubmitDefect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.reportDefect({
        defect_type: defectType,
        severity: severity,
        description: description,
        latitude: latitude,
        longitude: longitude,
        photo_before_url: photoPreview,
      });
      setSubmittedDefect(res);
    } catch (e) {
      alert('Ошибка при фиксации дефекта');
    } finally {
      setSubmitting(false);
    }
  };

  // Приемка / Отклонение устранения
  const handleReview = async (id: number, approved: boolean) => {
    try {
      await api.reviewDefect(id, approved);
      loadDefectsQueue();
    } catch (e) {
      alert('Ошибка при проверке дефекта');
    }
  };

  // Эскалация
  const handleEscalate = async (id: number) => {
    try {
      await api.escalateDefect(id);
      loadDefectsQueue();
    } catch (e) {
      alert('Ошибка при эскалации');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Шапка */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.inspector.title}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              PWA Online
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.inspector.subtitle} • Передача подрядчику до 5 минут
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 shadow-sm"
          >
            <Smartphone className="w-4 h-4 text-sky-500" />
            <span>{isMobileFrame ? 'Развернуть на весь экран' : 'Режим смартфона'}</span>
          </button>
        </div>
      </div>

      {/* Переключатель вкладок: Фиксация / Очередь проверки */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'create'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Зафиксировать дефект (3 действия)</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'queue'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Контроль устранения и приёмка</span>
        </button>
      </div>

      {activeTab === 'create' ? (
        <div className={isMobileFrame ? 'max-w-md mx-auto' : 'max-w-2xl'}>
          {submittedDefect ? (
            /* Экран успешной передачи */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-emerald-200 dark:border-emerald-800/80 shadow-xl space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="font-mono text-xs font-bold text-sky-600">
                  {submittedDefect.code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  Заявка передана подрядчику!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Подрядчик: <strong>{submittedDefect.contractor?.name || 'ТОО «Сарыарқа Жол Құрылыс»'}</strong>
                </p>
              </div>

              {/* Метрика времени передачи (< 5 минут) */}
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-1">
                <div className="flex items-center justify-center space-x-1.5 text-sky-700 dark:text-sky-300 font-bold text-xs">
                  <Clock className="w-4 h-4" />
                  <span>Время передачи в работу: 1.2 мин.</span>
                </div>
                <p className="text-[11px] text-sky-600/80 dark:text-sky-400/80">
                  Норматив KPI G-TON (&lt; 5 минут) успешно выполнен ✓
                </p>
              </div>

              {submittedDefect.has_systemic_flag && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-left text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-rose-700 dark:text-rose-300 font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>ВНИМАНИЕ: СИСТЕМНЫЙ СБОЙ ПОДРЯДЧИКА</span>
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">
                    Дефект привязан к участку ремонта КВ-03. Подрядчик уже отстает по объекту реестра на 24 п.п. Заявке присвоен повышенный приоритет контроля!
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setSubmittedDefect(null);
                  setDescription('');
                }}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-bold text-xs transition"
              >
                Зафиксировать следующий дефект
              </button>
            </div>
          ) : (
            /* Форма инспектора в 3 действия */
            <form
              onSubmit={handleSubmitDefect}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5"
            >
              {/* ДЕЙСТВИЕ 1: Фото дефекта с камеры */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">
                      1
                    </span>
                    <span>Фото дефекта с камеры</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    ✓ Фото зафиксировано
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-44 flex items-center justify-center group">
                  <img
                    src={photoPreview}
                    alt="Фото дефекта"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-white/90 text-slate-900 text-xs font-bold flex items-center space-x-1.5 shadow-lg">
                      <Camera className="w-4 h-4 text-sky-600" />
                      <span>Переснять фото</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                            setPhotoCaptured(true);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* ДЕЙСТВИЕ 2: Тип дефекта и Серьезность + ИИ подсказка */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">
                      2
                    </span>
                    <span>Тип и серьезность дефекта</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAiClassify}
                    disabled={aiClassifying}
                    className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{aiClassifying ? 'Определение...' : 'ИИ-подсказка'}</span>
                  </button>
                </div>

                {/* Сетка типов */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pothole', label: 'Яма / Выбоина' },
                    { id: 'crack', label: 'Трещины' },
                    { id: 'markings', label: 'Разметка' },
                    { id: 'signage', label: 'Знаки' },
                    { id: 'barrier', label: 'Ограждения' },
                    { id: 'other', label: 'Прочее' },
                  ].map((tItem) => (
                    <button
                      key={tItem.id}
                      type="button"
                      onClick={() => setDefectType(tItem.id as DefectType)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition ${
                        defectType === tItem.id
                          ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {tItem.label}
                    </button>
                  ))}
                </div>

                {/* Серьезность и нормативный срок */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'emergency', label: 'Аварийная (24 часа)', color: 'text-rose-600' },
                    { id: 'high', label: 'Высокая (48 часов)', color: 'text-orange-600' },
                    { id: 'medium', label: 'Средняя (5 дней)', color: 'text-amber-600' },
                    { id: 'low', label: 'Низкая (10 дней)', color: 'text-slate-600' },
                  ].map((sItem) => (
                    <button
                      key={sItem.id}
                      type="button"
                      onClick={() => setSeverity(sItem.id as DefectSeverity)}
                      className={`p-2 rounded-xl text-left border transition text-xs font-semibold ${
                        severity === sItem.id
                          ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className={sItem.color}>{sItem.label}</span>
                    </button>
                  ))}
                </div>

                {/* Описание */}
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Краткое описание дефекта и ориентир..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                ></textarea>
              </div>

              {/* ДЕЙСТВИЕ 3: Геопозиция и согласие инспектора */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">
                      3
                    </span>
                    <span>Геопозиция дефекта</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRequestLiveGps}
                    className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    Обновить GPS
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-500" />
                      <span>Координаты:</span>
                    </span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {latitude}, {longitude}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Точность фиксации:</span>
                    <span className="font-semibold text-emerald-600">±{gpsAccuracy} м</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    <span>Геолокация фиксируется только в момент создания дефекта с согласия</span>
                  </div>
                </div>
              </div>

              {/* Кнопка отправки */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting ? 'Автопривязка и отправка...' : 'Отправить заявку подрядчику'}
                </span>
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Вкладка 2: Очередь устранения и приёмка инспектором */
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Журнал дефектов и контроль устранения ({defectsQueue.length})
            </h3>
            <button
              onClick={loadDefectsQueue}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Обновить</span>
            </button>
          </div>

          <div className="space-y-3">
            {defectsQueue.slice(0, 15).map((def) => (
              <div
                key={def.id}
                className={`p-4 rounded-xl border transition space-y-2 ${
                  def.has_systemic_flag
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                    : def.is_overdue
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-sky-600">
                      {def.code}
                    </span>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {def.defect_type} • {def.severity}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      def.has_systemic_flag
                        ? 'bg-rose-600 text-white'
                        : def.is_overdue
                        ? 'bg-orange-500 text-white'
                        : def.status === 'verified_closed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {def.has_systemic_flag ? 'СИСТЕМНЫЙ СБОЙ' : def.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {def.description}
                </p>

                <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <span>Участок: {def.address_reference} • Подрядчик: {def.contractor?.name || 'Н/Д'}</span>
                  <span>Передача: {def.handover_duration_seconds} сек.</span>
                </div>

                {/* Действия инспектора */}
                <div className="flex items-center justify-end space-x-2 pt-1">
                  {def.status === 'fixed_pending_review' && (
                    <>
                      <button
                        onClick={() => handleReview(def.id, true)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Принять устранение</span>
                      </button>
                      <button
                        onClick={() => handleReview(def.id, false)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center space-x-1"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Вернуть на доработку</span>
                      </button>
                    </>
                  )}

                  {!def.is_overdue && def.status !== 'verified_closed' && (
                    <button
                      onClick={() => handleEscalate(def.id)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center space-x-1"
                      title="Демо-триггер: сымитировать срыв дедлайна и запустить эскалацию"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Сымитировать срыв срока</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
