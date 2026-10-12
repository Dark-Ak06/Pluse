import React from 'react';
import { useI18n } from '../../context/I18nContext';
import { LayoutDashboard, MapPin, Navigation, Smartphone, Users, ChevronRight } from 'lucide-react';

export type NavTab = 'dashboard' | 'objects' | 'roads' | 'inspector' | 'contractors';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { t } = useI18n();

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'objects', label: t.nav.objects, icon: MapPin },
    { id: 'roads', label: t.nav.roads, icon: Navigation },
    { id: 'inspector', label: t.nav.inspector, icon: Smartphone, highlight: true },
    { id: 'contractors', label: t.nav.contractors, icon: Users },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 flex-shrink-0 hidden md:flex">
      <nav className="space-y-1.5">
        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
          Модули управления
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.highlight ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  PWA
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-sky-500" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Инфо-блок связки */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
        <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          <span>Сквозная связка G-TON</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
          Объект ремонта в реестре и дорожные ямы объединены через общего подрядчика и участок дороги.
        </p>
      </div>
    </aside>
  );
};
