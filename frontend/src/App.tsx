import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/I18nContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ObjectsPage } from './pages/ObjectsPage';
import { RoadsPage } from './pages/RoadsPage';
import { InspectorAppPage } from './pages/InspectorAppPage';
import { ContractorsPage } from './pages/ContractorsPage';
import { AppealsIntakePage } from './pages/AppealsIntakePage';
import { TerritoryRiskPage } from './pages/TerritoryRiskPage';
import { AiSearchModal } from './components/assistant/AiSearchModal';
import { AiSummaryModal } from './components/assistant/AiSummaryModal';
import { LayoutDashboard, MapPin, Navigation, Smartphone, Users } from 'lucide-react';

const AppContent: React.FC = () => {
  const getInitialTab = (): NavTab => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as NavTab;
    const validTabs: NavTab[] = ['dashboard', 'appeals', 'risk', 'objects', 'roads', 'inspector', 'contractors'];
    return validTabs.includes(tab) ? tab : 'dashboard';
  };

  const [currentTab, setCurrentTabState] = useState<NavTab>(getInitialTab);
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState(false);

  const setCurrentTab = (tab: NavTab) => {
    setCurrentTabState(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState(null, '', url.toString());
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      <Header onOpenAiSearch={() => setIsAiSearchOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 w-full">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onOpenAiSummary={() => setIsAiSummaryOpen(true)}
              onNavigateToObjects={() => setCurrentTab('objects')}
              onNavigateToContractors={() => setCurrentTab('contractors')}
              onNavigateToInspector={() => setCurrentTab('inspector')}
            />
          )}
          {currentTab === 'appeals' && <AppealsIntakePage />}
          {currentTab === 'risk' && <TerritoryRiskPage />}
          {currentTab === 'objects' && <ObjectsPage />}
          {currentTab === 'roads' && <RoadsPage />}
          {currentTab === 'inspector' && <InspectorAppPage />}
          {currentTab === 'contractors' && <ContractorsPage />}
        </main>
      </div>

      {/* Мобильная нижняя навигация */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around p-2 text-[10px] text-slate-500">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center py-1 ${currentTab === 'dashboard' ? 'text-sky-600 font-bold' : ''}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Дашборд</span>
        </button>
        <button
          onClick={() => setCurrentTab('objects')}
          className={`flex flex-col items-center py-1 ${currentTab === 'objects' ? 'text-sky-600 font-bold' : ''}`}
        >
          <MapPin className="w-4 h-4" />
          <span>Объекты</span>
        </button>
        <button
          onClick={() => setCurrentTab('inspector')}
          className={`flex flex-col items-center py-1 ${currentTab === 'inspector' ? 'text-emerald-600 font-bold' : ''}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Инспектор</span>
        </button>
        <button
          onClick={() => setCurrentTab('roads')}
          className={`flex flex-col items-center py-1 ${currentTab === 'roads' ? 'text-sky-600 font-bold' : ''}`}
        >
          <Navigation className="w-4 h-4" />
          <span>Дороги</span>
        </button>
        <button
          onClick={() => setCurrentTab('contractors')}
          className={`flex flex-col items-center py-1 ${currentTab === 'contractors' ? 'text-sky-600 font-bold' : ''}`}
        >
          <Users className="w-4 h-4" />
          <span>Подрядчики</span>
        </button>
      </nav>

      {/* Модальные окна ИИ */}
      <AiSearchModal
        isOpen={isAiSearchOpen}
        onClose={() => setIsAiSearchOpen(false)}
      />
      <AiSummaryModal
        isOpen={isAiSummaryOpen}
        onClose={() => setIsAiSummaryOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};

export default App;
