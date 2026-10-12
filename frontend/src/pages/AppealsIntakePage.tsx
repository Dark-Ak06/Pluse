import React, { useState } from 'react';
import {
  Bot, Clock, AlertTriangle, CheckCircle2,
  Search, ShieldAlert, Sparkles, MapPin,
  Building, User, FileText, Check, Zap
} from 'lucide-react';

interface AppealTicket {
  id: string;
  number: string;
  channel: string;
  timeAgo: string;
  district: string;
  address: string;
  citizenName: string;
  phone: string;
  rawText: string;
  category: string;
  aiConfidence: number;
  urgency: 'critical' | 'high' | 'medium';
  urgencyLabel: string;
  suggestedService: string;
  slaLimit: string;
  slaRemaining: string;
  linkedObject?: string;
  linkedContractor?: string;
  status: 'pending_review' | 'routed';
}

const mockAppeals: AppealTicket[] = [
  {
    id: '1',
    number: '#109-8421',
    channel: 'Telegram 109',
    timeAgo: '14 мин назад',
    district: 'Бостандыкский район',
    address: 'ул. Сатпаева, 42 / уг. ул. Радостовца',
    citizenName: 'Амангельды Д. М.',
    phone: '+7 (701) 842-19-53',
    rawText: '«Здравствуйте! На перекрёстке ул. Сатпаева и Радостовца возле дома 42 из-под асфальта бьёт горячая вода, сильный пар, проваливается полотно! Машины объезжают по встречной. Срочно примите меры!»',
    category: 'ЖКХ: Тепловые сети и водоснабжение',
    aiConfidence: 99.1,
    urgency: 'critical',
    urgencyLabel: 'Критическая (Аварийный выезд 2 ч)',
    suggestedService: 'ТОО «Алматинские тепловые сети» (Алтс-Юг) + ДРС района',
    slaLimit: '2 ч 00 мин',
    slaRemaining: '01:46:12',
    linkedObject: 'Объект #Т-14 («Магистральная теплотрасса Сатпаева»)',
    linkedContractor: 'ТОО «ГорСервис-Строй» (отставание 14 дн.)',
    status: 'pending_review'
  },
  {
    id: '2',
    number: '#109-8420',
    channel: 'Колл-центр 109',
    timeAgo: '28 мин назад',
    district: 'Бостандыкский район',
    address: 'пр. Гагарина / уг. ул. Тимирязева',
    citizenName: 'Серікбаев А. К.',
    phone: '+7 (777) 319-40-12',
    rawText: '«Глубокая выбоина на правой полосе перед светофором. Торчит арматура, две машины пробили колеса. Срочно устранить!»',
    category: 'Дорожное покрытие: Аварийная яма',
    aiConfidence: 97.4,
    urgency: 'high',
    urgencyLabel: 'Высокая (Устранение 24 ч)',
    suggestedService: 'Управление городской мобильности (ДРС)',
    slaLimit: '24 ч 00 мин',
    slaRemaining: '23:32:00',
    linkedObject: 'Участок БОС-04 (Гагарина)',
    linkedContractor: 'ТОО «Жол-Строй-Алматы»',
    status: 'routed'
  },
  {
    id: '3',
    number: '#109-8419',
    channel: 'e-Otinish',
    timeAgo: '45 мин назад',
    district: 'Бостандыкский район',
    address: 'мкр. Алмагуль, ул. Жарокова, 280',
    citizenName: 'Иванова Е. В.',
    phone: '+7 (705) 551-78-90',
    rawText: '«Не горит уличное освещение вдоль тротуара у школы №125 уже третьи сутки. Дети идут со второй смены в темноте.»',
    category: 'Городское освещение: Наружные сети',
    aiConfidence: 96.2,
    urgency: 'medium',
    urgencyLabel: 'Средняя (Регламент 48 ч)',
    suggestedService: 'ГКП «Алматы Қала Жарық»',
    slaLimit: '48 ч 00 мин',
    slaRemaining: '47:15:00',
    status: 'routed'
  }
];

export const AppealsIntakePage: React.FC = () => {
  const [appeals, setAppeals] = useState<AppealTicket[]>(mockAppeals);
  const [selectedId, setSelectedId] = useState<string>('1');
  const [confirmedIds, setConfirmedIds] = useState<Record<string, boolean>>({});

  const selectedTicket = appeals.find((a) => a.id === selectedId) || appeals[0];
  const isConfirmed = !!confirmedIds[selectedTicket.id];

  const handleConfirmRouting = (ticketId: string) => {
    setConfirmedIds((prev) => ({ ...prev, [ticketId]: true }));
    setAppeals((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'routed' } : t))
    );
  };

  return (
    <div className="space-y-3 pb-4">
      {/* Верхний компактный инфо-бар */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-xl px-5 py-3 text-white shadow-md border border-sky-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                ОПЕРАЦИОННЫЙ КОНТУР ЕКЦ 109+
              </span>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ИИ-шлюз активен</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Пилот: Бостандыкский район
              </span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-white mt-0.5">
              Приём и маршрутизация обращений с ИИ-классификацией
            </h1>
          </div>
        </div>

        {/* 4 компактные метрики в шапке */}
        <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-5 text-left">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Входящие</div>
            <div className="text-base font-black text-white">482 <span className="text-[10px] text-emerald-400">+18%</span></div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Авто-ИИ</div>
            <div className="text-base font-black text-sky-300">94.8%</div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Обработка</div>
            <div className="text-base font-black text-emerald-400">1.8 мин</div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">SLA норма</div>
            <div className="text-base font-black text-indigo-300">98.6%</div>
          </div>
        </div>
      </div>

      {/* Основной двухколоночный контент */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Левая колонка: Очередь обращений */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <span>Очередь тикетов</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                {appeals.length}
              </span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Все каналы 109+</span>
          </div>

          <div className="space-y-2">
            {appeals.map((appeal) => {
              const isSelected = appeal.id === selectedTicket.id;
              const hasBeenConfirmed = !!confirmedIds[appeal.id];

              return (
                <div
                  key={appeal.id}
                  onClick={() => setSelectedId(appeal.id)}
                  className={`p-3 rounded-xl cursor-pointer transition border text-left relative ${
                    isSelected
                      ? 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-500 shadow-md ring-1 ring-sky-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-[11px] font-black text-sky-700 dark:text-sky-300">
                        {appeal.number}
                      </span>
                      <span className="text-[9px] text-slate-400">• {appeal.timeAgo}</span>
                    </div>

                    {appeal.urgency === 'critical' ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200">
                        КРИТИЧЕСКИЙ
                      </span>
                    ) : appeal.urgency === 'high' ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        ВЫСОКИЙ
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600">
                        СТАНДАРТ
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-bold text-slate-900 dark:text-white line-clamp-1">
                    {appeal.address}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {appeal.rawText}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-sky-700 dark:text-sky-300 font-medium truncate max-w-[160px]">
                      {appeal.category.split(':')[0]}
                    </span>
                    <span className="font-mono text-slate-400 flex items-center space-x-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{appeal.slaRemaining}</span>
                    </span>
                  </div>

                  {hasBeenConfirmed && (
                    <div className="absolute top-2.5 right-2 flex items-center space-x-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                      <Check className="w-2.5 h-2.5" />
                      <span>Маршрутизировано</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Правая колонка: Интеллектуальная карточка тикета с ИИ-маршрутизацией */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-4 space-y-3">
          {/* Заголовок тикета и таймер SLA */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-black text-sky-600 dark:text-sky-400">
                  {selectedTicket.number}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedTicket.channel}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedTicket.timeAgo}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Карточка входящего тикета и автоматическое назначение службы
              </h2>
            </div>

            <div className="text-right">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Остаток по SLA
              </div>
              <div className="font-mono text-base font-black text-rose-600 dark:text-rose-400 flex items-center justify-end space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{selectedTicket.slaRemaining}</span>
              </div>
              <div className="text-[9px] text-slate-500">Норма: {selectedTicket.slaLimit}</div>
            </div>
          </div>

          {/* Заявитель и Адрес */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/80 text-[11px]">
            <div>
              <span className="text-slate-400 font-semibold flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>Заявитель:</span>
              </span>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {selectedTicket.citizenName} <span className="font-mono font-normal text-slate-500">({selectedTicket.phone})</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>Локация инцидента:</span>
              </span>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                {selectedTicket.address} <span className="font-normal text-slate-500">({selectedTicket.district})</span>
              </div>
            </div>
          </div>

          {/* Исходный текст сообщения жителя */}
          <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 italic">
            {selectedTicket.rawText}
          </div>

          {/* Блок ИИ-Анализа и маршрутизации RegionPulse (КЛЮЧЕВОЙ) */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50/70 dark:from-sky-950/50 dark:to-indigo-950/30 border-2 border-sky-300 dark:border-sky-800 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-sky-600 text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  ИИ-Классификация и маршрутизация RegionPulse
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                Точность ИИ: {selectedTicket.aiConfidence}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/60">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">Тематика</span>
                <span className="font-bold text-sky-800 dark:text-sky-200">{selectedTicket.category}</span>
              </div>

              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/60">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">Срочность</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{selectedTicket.urgencyLabel}</span>
                </span>
              </div>
            </div>

            {/* Автоматически предложенная служба */}
            <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block flex items-center space-x-1">
                  <Building className="w-3 h-3 text-sky-500" />
                  <span>Рекомендованная исполнительная служба (маршрут):</span>
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">
                  {selectedTicket.suggestedService}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950">
                Автоназначено ✓
              </span>
            </div>

            {/* Связка с реестром */}
            {selectedTicket.linkedObject && (
              <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 text-[10px] flex items-center justify-between">
                <span className="text-amber-800 dark:text-amber-300 font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  <span>Связка с реестром: {selectedTicket.linkedObject} ({selectedTicket.linkedContractor})</span>
                </span>
                <span className="text-amber-700 font-medium">Штрафной контроль активен</span>
              </div>
            )}
          </div>

          {/* Кнопка утверждения в 1 клик */}
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Статус: {isConfirmed ? (
                <strong className="text-emerald-600">Маршрутизировано в службу</strong>
              ) : (
                <strong className="text-amber-600">Ожидает подтверждения</strong>
              )}
            </span>

            <button
              type="button"
              onClick={() => handleConfirmRouting(selectedTicket.id)}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition ${
                isConfirmed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
              }`}
            >
              {isConfirmed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Маршрут утвержден</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Подтвердить маршрутизацию ИИ (1 клик)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
