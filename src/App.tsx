import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './components/OverviewPage';
import { CraterDashboardPage } from './components/CraterDashboardPage';
import { TopAndLandingPage } from './components/TopAndLandingPage';
import { RoverAndSummaryPage } from './components/RoverAndSummaryPage';
import { DataAndMethodsPage } from './components/DataAndMethodsPage';
import { SettingsPage } from './components/SettingsPage';
import { CRATERS_DATA } from './data/cratersData';
import { Crater } from './types/crater';

const initialCrater: Crater = CRATERS_DATA.find(c => c.classification === 'ICE_POSITIVE' && c.iceProbability > 85) || CRATERS_DATA[0]!;

export const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<string>('overview');
  const [selectedCrater, setSelectedCrater] = useState<Crater>(initialCrater);

  const handleSelectCrater = useCallback((crater: Crater) => {
    setSelectedCrater(crater);
  }, []);

  const handleNavigateToDetail = useCallback((crater: Crater) => {
    setSelectedCrater(crater);
    setActiveNav('dashboard');
  }, []);

  const handleBackToOverview = useCallback(() => {
    setActiveNav('overview');
  }, []);

  return (
    <div className="h-screen w-screen bg-[#060913] text-slate-100 flex overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

      {/* Main Full-Screen Page Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {activeNav === 'overview' && (
          <OverviewPage
            craters={CRATERS_DATA}
            selectedCrater={selectedCrater}
            onSelectCrater={handleNavigateToDetail}
          />
        )}

        {activeNav === 'dashboard' && (
          <CraterDashboardPage
            crater={selectedCrater}
            onBackToOverview={handleBackToOverview}
          />
        )}

        {(activeNav === 'top' || activeNav === 'landing') && (
          <TopAndLandingPage
            craters={CRATERS_DATA}
            selectedCrater={selectedCrater}
            onSelectCrater={handleSelectCrater}
            onNavigateToDetail={handleNavigateToDetail}
          />
        )}

        {(activeNav === 'rover' || activeNav === 'analytics') && (
          <RoverAndSummaryPage
            crater={selectedCrater}
            allCraters={CRATERS_DATA}
          />
        )}

        {activeNav === 'methods' && (
          <DataAndMethodsPage
            crater={selectedCrater}
          />
        )}

        {activeNav === 'settings' && (
          <SettingsPage />
        )}
      </main>
    </div>
  );
};

export default App;
