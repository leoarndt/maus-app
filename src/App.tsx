import React, { useState } from 'react';
import { AuthGate } from './features/auth/AuthGate';
import { HomePage } from './features/home/HomePage';
import { Countdown } from './features/countdown/Countdown';
import { DailyMessage } from './features/dailyMessage/DailyMessage';
import { Sidequests } from './features/puzzle/Sidequests';
import { Treasure } from './features/treasure/Treasure';
import { ShopPage } from './features/treasure/ShopPage';
import { MoodChecker } from './features/mood/MoodChecker';
import { AchievementProvider } from './features/achievements/AchievementManager';
import { StatsPage } from './features/stats/StatsPage';
import { AchievementsPage } from './features/achievements/AchievementsPage';
import { HamstiClicker } from './features/hamsti/HamstiClicker';
import { useAuth } from './features/auth/AuthGate';

export default function App() {
  const [currentArea, setCurrentArea] = useState<string | null>(null);

  return (
    <AuthGate>
      <AchievementProvider>
        <InnerApp currentArea={currentArea} setCurrentArea={setCurrentArea} />
      </AchievementProvider>
    </AuthGate>
  );
}

function InnerApp({ currentArea, setCurrentArea }: { currentArea: string | null, setCurrentArea: (area: string | null) => void }) {
  const { unlocked, logout } = useAuth();
  const handleNavigate = (area: string) => {
    setCurrentArea(area);
  };

  const handleBackToHome = () => {
    setCurrentArea(null);
  };

  const renderCurrentArea = () => {
    switch (currentArea) {
      case 'message':
        return <DailyMessage />;
      case 'mood':
        return <MoodChecker />;
      case 'puzzle':
        return <Sidequests />;
      case 'treasure':
        return <ShopPage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'countdown':
        return <Countdown />;
      case 'stats':
        return <StatsPage />;
      case 'hamsti':
        return <HamstiClicker />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #ffe6f2 0%, #fff0f6 50%, #f8e6ff 100%)',
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* Header with back button when not on home */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: currentArea ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        backdropFilter: currentArea ? 'blur(10px)' : undefined,
        borderBottom: currentArea ? '1px solid rgba(255, 182, 193, 0.3)' : undefined,
        padding: '12px 16px',
        minHeight: 56
      }}>
        {currentArea && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleBackToHome}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#ff69b4',
                padding: 8,
                borderRadius: 8,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 105, 180, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              ←
            </button>
            <span style={{
              color: '#ff69b4',
              fontWeight: 'bold',
              fontSize: 18
            }}>
              {getAreaTitle(currentArea)}
            </span>
          </div>
        )}
        {/* Logout button on the right if logged in */}
        {unlocked && (
          <button
            onClick={logout}
            style={{
              background: 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '8px 20px',
              fontWeight: 'bold',
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255, 105, 180, 0.15)',
              marginLeft: 16
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            ❤️ Logout
          </button>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1 }}>
        {renderCurrentArea()}
      </div>
    </div>
  );
}

function getAreaTitle(area: string): string {
  const titles: Record<string, string> = {
    message: 'Nachricht',
    mood: 'Mood-Checker',
    puzzle: 'Sidequests',
    treasure: 'Shop',
    achievements: 'Achievements',
    countdown: 'Countdown',
    stats: 'Streaks/Punkte',
    hamsti: 'Hamsti-Klicker',
  };
  return titles[area] || 'Start';
} 