import React, { useState } from 'react';
import {
  TrendingUp, AlertTriangle, ShieldCheck, MapPin,
  Sparkles, Activity, Layers, Info
} from 'lucide-react';

interface RiskTerritory {
  id: string;
  rank: number;
  name: string;
  district: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium';
  keyFactors: {
    appealsSurge: string;
    networkWear: string;
    contractorLag: string;
  };
  forecastText: string;
  preventiveAction: string;
  recommendedService: string;
}

const mockTerritories: RiskTerritory[] = [
  {
    id: '1',
    rank: 1,
    name: 'Квадрат улиц Сатпаева — Розыбакиева — Жандосова',
    district: 'Бостандыкский район (Пилот)',
    riskScore: 88,
    riskLevel: 'critical',
    keyFactors: {
      appealsSurge: '+340% рост жалоб ЕКЦ 109+ за 14 дн.',
      networkWear: 'Износ теплосети 72% (год укладки: 1986)',
      contractorLag: 'Отставание «ГорСервис-Строй» на 14 дн.'
    },
    forecastText: 'Вероятность локального прорыва теплотрассы и просадки дорожного полотна в течение 7-10 дней составляет 84%.',
    preventiveAction: 'Внеплановая телеинспекция участка теплотрассы до 15 октября, превентивная герметизация стыков.',
    recommendedService: 'Алматинские тепловые сети (АлТС) + Дорожный отдел района'
  },
  {
    id: '2',
    rank: 2,
    name: 'Мкр. Орбита-3, ул. Мустафина — ул. Фрунзе',
    district: 'Бостандыкский район (Пилот)',
    riskScore: 76,
    riskLevel: 'high',
    keyFactors: {
      appealsSurge: '+180% жалоб на застой воды и ливневки',
      networkWear: 'Заиленность арычной сети 64%',
      contractorLag: 'Задержка очистки ливнестоков на 6 дн.'
    },
    forecastText: 'При выпадении осадков >15 мм прогнозируется подтопление проезжей части и перекрёстка с остановкой транспорта.',
    preventiveAction: 'Превентивная гидродинамическая прочистка коллектора до прогнозируемых дождей 16 октября.',
    recommendedService: 'ТОО «Eco Almaty» + Управление экологии'
  },
  {
    id: '3',
    rank: 3,
    name: 'Ул. Толе би (участок пр. Сейфуллина — ул. Байтурсынова)',
    district: 'Алмалинский район',
    riskScore: 69,
    riskLevel: 'high',
    keyFactors: {
      appealsSurge: '+120% обращений автомобилистов',
      networkWear: 'Интенсивность трафика (>35 тыс авто/сут)',
      contractorLag: '4 гарантийных дефекта не устранены в срок'
    },
    forecastText: 'Прогрессирующее разрушение верхнего слоя асфальта в зоне трамвайных путей.',
    preventiveAction: 'Гарантийное предписание подрядчику с дедлайном 72 часа, ямочный ремонт.',
    recommendedService: 'Управление городской мобильности (ДРС)'
  },
  {
    id: '4',
    rank: 4,
    name: 'Пр. Достык выше пр. Аль-Фараби (предгорье)',
    district: 'Медеуский район',
    riskScore: 61,
    riskLevel: 'medium',
    keyFactors: {
      appealsSurge: '+45% жалоб на смыв грунта',
      networkWear: 'Уклон рельефа >12 градусов',
      contractorLag: 'Регламент соблюдается'
    },
    forecastText: 'Риск выноса гравия и ила на полосу движения при сильных осадках.',
    preventiveAction: 'Укрепление водоотводных лотков и установка улавливающих барьеров.',
    recommendedService: 'ДЧС г. Алматы + Районный акимат'
  }
];

export const TerritoryRiskPage: React.FC = () => {
  const [territories] = useState<RiskTerritory[]>(mockTerritories);
  const [selectedId, setSelectedId] = useState<string>('1');

  const selectedTerritory = territories.find((t) => t.id === selectedId) || territories[0];

  return (
    <div className="space-y-3 pb-4">
      {/* Верхний компактный инфо-бар */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl px-5 py-3 text-white shadow-md border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                АНАЛИТИЧЕСКИЙ КОНТУР · PREDICTIVE ML
              </span>
              <span className="text-[10px] font-bold text-amber-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Пилот: Бостандыкский район</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Октябрь 2026
              </span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-white mt-0.5">
              Прогноз рисков по территориям и рейтинг участков
            </h1>
          </div>
        </div>

        {/* 4 компактные метрики в шапке */}
        <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-5 text-left">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Зоны риска</div>
            <div className="text-base font-black text-rose-400">4 <span className="text-[10px] text-slate-400">из 18</span></div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Бэктест ML</div>
            <div className="text-base font-black text-indigo-300">74.2%</div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Предотвращено</div>
            <div className="text-base font-black text-emerald-400">19 инцидентов</div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Экономия</div>
            <div className="text-base font-black text-sky-300">~14.2 млн ₸</div>
          </div>
        </div>
      </div>

      {/* Основной двухколоночный контент */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Левая колонка: Рейтинг территорий риска */}
        <div className="lg:col-span-5 space-y-2">
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Рейтинг территорий повышенного риска
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              Топ участков пилота
            </span>
          </div>

          <div className="space-y-2">
            {territories.map((item) => {
              const isSelected = item.id === selectedTerritory.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`p-3 rounded-xl cursor-pointer transition border text-left relative ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center font-black text-[10px] ${
                        item.rank === 1
                          ? 'bg-rose-600 text-white'
                          : item.rank === 2
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700'
                      }`}>
                        #{item.rank}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[9px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          <span>{item.district}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center space-x-1 justify-end">
                        <span className={`text-sm font-black font-mono ${
                          item.riskScore >= 80 ? 'text-rose-600' : 'text-amber-600'
                        }`}>
                          {item.riskScore}
                        </span>
                        <span className="text-[9px] text-slate-400">/100</span>
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-wider block ${
                        item.riskScore >= 80 ? 'text-rose-600' : 'text-amber-600'
                      }`}>
                        {item.riskScore >= 80 ? 'КРИТИЧЕСКИЙ' : 'ВЫСОКИЙ'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-1 truncate">
                      <TrendingUp className="w-2.5 h-2.5 text-rose-500 flex-shrink-0" />
                      <span className="truncate">{item.keyFactors.appealsSurge}</span>
                    </div>
                    <div className="flex items-center space-x-1 truncate">
                      <Activity className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{item.keyFactors.networkWear}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Правая колонка: Детализация прогноза и Explainable AI */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-4 space-y-3">
          <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  Зона риска #{selectedTerritory.rank}
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedTerritory.district}
                </span>
              </div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {selectedTerritory.name}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Индекс</span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {selectedTerritory.riskScore} <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
              </span>
            </div>
          </div>

          {/* Предупреждение прогноза ИИ */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-rose-50 to-amber-50/70 dark:from-rose-950/40 dark:to-amber-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1">
            <div className="flex items-center space-x-1.5 text-rose-800 dark:text-rose-300 font-bold text-[10px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Прогноз предиктивной модели RegionPulse:</span>
            </div>
            <p className="text-slate-900 dark:text-white text-xs font-semibold leading-relaxed">
              {selectedTerritory.forecastText}
            </p>
          </div>

          {/* Мультифакторный вклад (Explainable AI) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Мультифакторный вклад в оценку риска:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Веса модели ИИ</span>
            </div>

            <div className="space-y-1.5 text-[10px]">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>1. Всплеск обращений ЕКЦ 109+ ({selectedTerritory.keyFactors.appealsSurge})</span>
                  <span className="font-bold text-rose-600">35% веса (Критично)</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-0.5">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>2. Инфраструктурный износ ({selectedTerritory.keyFactors.networkWear})</span>
                  <span className="font-bold text-amber-600">25% веса</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-0.5">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>3. Дисциплина подрядчика ({selectedTerritory.keyFactors.contractorLag})</span>
                  <span className="font-bold text-indigo-600">25% веса</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-0.5">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>4. Сезонный фактор и перегрузка дорожного трафика (переход через 0°C)</span>
                  <span className="font-bold text-sky-600">15% веса</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-0.5">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: '50%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Превентивная мера */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 text-[11px] space-y-1">
            <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Рекомендованное превентивное действие для Акима:</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium leading-snug">
              {selectedTerritory.preventiveAction}
            </p>
            <div className="text-[9px] text-slate-500">
              Службы: <strong className="text-slate-800 dark:text-slate-200">{selectedTerritory.recommendedService}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
