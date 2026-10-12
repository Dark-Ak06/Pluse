import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';
import { Shield, Sun, Moon, Globe, Sparkles, UserCheck } from 'lucide-react';

interface HeaderProps {
  onOpenAiSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAiSearch }) => {
  const { currentRole, switchRole } = useAuth();
  const { lang, setLang, t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const roleLabels: Record<UserRole, string> = {
    akim: t.roles.akim,
    head: t.roles.head,
    curator: t.roles.curator,
    inspector: t.roles.inspector,
    contractor: t.roles.contractor,
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Демо-баннер */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1 text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>{t.demoBanner}</span>
        </div>
        <span className="hidden sm:inline font-semibold">{t.regionName}</span>
      </div>

      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Бренд */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                {t.appName}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                G-TON
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
              {t.appSubname}
            </p>
          </div>
        </div>

        {/* Действия: Роль, ИИ поиск, Язык, Тема */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* ИИ Поиск */}
          <button
            onClick={onOpenAiSearch}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-slate-700 text-xs font-medium border border-sky-200/60 dark:border-slate-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">ИИ-Поиск</span>
          </button>

          {/* Переключатель ролей для демонстрации */}
          <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <UserCheck className="w-4 h-4 ml-1.5 text-slate-500 dark:text-slate-400 hidden sm:block" />
            <select
              value={currentRole}
              onChange={(e) => switchRole(e.target.value as UserRole)}
              className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 pl-1.5 pr-6 py-1 focus:outline-none cursor-pointer"
            >
              <option value="akim" className="dark:bg-slate-800">👑 {roleLabels.akim}</option>
              <option value="head" className="dark:bg-slate-800">🏛️ {roleLabels.head}</option>
              <option value="curator" className="dark:bg-slate-800">📋 {roleLabels.curator}</option>
              <option value="inspector" className="dark:bg-slate-800">📱 {roleLabels.inspector}</option>
              <option value="contractor" className="dark:bg-slate-800">🚜 {roleLabels.contractor}</option>
            </select>
          </div>

          {/* Язык RU / KK */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setLang('ru')}
              className={`px-2 py-1 rounded-md font-medium transition ${
                lang === 'ru'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              RU
            </button>
            <button
              onClick={() => setLang('kk')}
              className={`px-2 py-1 rounded-md font-medium transition ${
                lang === 'kk'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ҚАЗ
            </button>
          </div>

          {/* Тема */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Переключить тему"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
