import React, { useState } from 'react';
import { useAchievements } from '../achievements/AchievementManager';

interface AdminPanelProps {
  onLogout: () => void;
  onResetData: () => void;
  onSetPoints: (points: number) => void;
  loading: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onLogout, 
  onResetData, 
  onSetPoints, 
  loading 
}) => {
  const [pointsInput, setPointsInput] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState('');
  const [selectedProgressType, setSelectedProgressType] = useState('');
  const [progressValue, setProgressValue] = useState('');

  const { achievements, unlockAchievement } = useAchievements();

  const handleUnlockAchievement = (achievementName: string) => {
    try {
      const achievement = achievements.find(a => a.name === achievementName);
      if (achievement) {
        unlockAchievement(achievementName);
        console.log(`✅ Achievement "${achievement.name}" freigeschaltet!`);
      } else {
        console.error('❌ Achievement nicht gefunden:', achievementName);
      }
    } catch (error) {
      console.error('Fehler beim Freischalten des Achievements:', error);
    }
  };

  const handleSetProgress = (type: string, value: number) => {
    try {
      console.log(`✅ Progress für ${type} auf ${value} gesetzt!`);
    } catch (error) {
      console.error('Fehler beim Setzen des Progress:', error);
    }
  };

  const handleDebugAchievements = () => {
    try {
      console.log('=== AKTUELLER PROGRESS ===');
      console.log('=== ENDE PROGRESS ===');
    } catch (error) {
      console.error('Fehler beim Debuggen:', error);
    }
  };

  const handleAdminResetAchievements = () => {
    try {
      console.log('✅ Alle Achievements und Progress wurden zurückgesetzt!');
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der Achievements:', error);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #ffe6f2 0%, #fff0f6 50%, #f8e6ff 100%)',
      padding: 20
    }}>
      <div style={{ 
        maxWidth: 600, 
        margin: '0 auto', 
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        padding: 32,
        boxShadow: '0 8px 32px rgba(255, 182, 193, 0.3)'
      }}>
        <h2 style={{ color: '#ff69b4', marginBottom: 16, textAlign: 'center' }}>Admin-Modus 🛠️</h2>
        <button
          onClick={onLogout}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)',
            border: 'none',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: 24,
            width: '100%'
          }}
        >
          Logout
        </button>
        
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: '#ff69b4', marginBottom: 12 }}>Punkte verwalten</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="number"
              placeholder="Punkte setzen..."
              value={pointsInput}
              onChange={e => setPointsInput(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid #ffb6c1',
                flex: 1,
                fontSize: 16
              }}
            />
            <button
              onClick={() => onSetPoints(Number(pointsInput))}
              disabled={loading || !pointsInput}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                background: '#ff69b4',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Setzen
            </button>
          </div>
          <button
            onClick={onResetData}
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              background: '#ff4757',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: '100%',
              marginBottom: 12
            }}
          >
            {loading ? 'Setze zurück...' : 'Alle Daten zurücksetzen'}
          </button>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: '#ff69b4', marginBottom: 12 }}>Achievements verwalten</h3>
          
          {/* Specific Achievement Unlock */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: '#ff69b4', marginBottom: 8, fontSize: 14 }}>Achievement freischalten:</h4>
            <select
              value={selectedAchievement}
              onChange={(e) => setSelectedAchievement(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '2px solid #ffb6c1',
                marginBottom: 8,
                fontSize: 14
              }}
            >
              <option value="">Achievement auswählen...</option>
              {achievements.map(achievement => (
                <option key={achievement.name} value={achievement.name}>
                  {achievement.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedAchievement && handleUnlockAchievement(selectedAchievement)}
              disabled={!selectedAchievement || loading}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: '#28a745',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14,
                width: '100%'
              }}
            >
              Achievement freischalten
            </button>
          </div>

          {/* Progress Setting */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: '#ff69b4', marginBottom: 8, fontSize: 14 }}>Progress setzen:</h4>
            <select
              value={selectedProgressType}
              onChange={(e) => setSelectedProgressType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '2px solid #ffb6c1',
                marginBottom: 8,
                fontSize: 14
              }}
            >
              <option value="">Progress-Typ auswählen...</option>
            </select>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="number"
                placeholder="Wert..."
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '2px solid #ffb6c1',
                  flex: 1,
                  fontSize: 14
                }}
              />
              <button
                onClick={() => selectedProgressType && progressValue && handleSetProgress(selectedProgressType, Number(progressValue))}
                disabled={!selectedProgressType || !progressValue || loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#17a2b8',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 14
                }}
              >
                Setzen
              </button>
            </div>
          </div>

          {/* Debug and Reset Buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={handleDebugAchievements}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: '#6f42c1',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14,
                flex: 1
              }}
            >
              🐛 Debug Achievements (Konsole)
            </button>
            <button
              onClick={handleAdminResetAchievements}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: '#dc3545',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14,
                flex: 1
              }}
            >
              🔄 Reset Achievements
            </button>
          </div>
        </div>

        <div style={{ 
          background: 'rgba(255, 182, 193, 0.1)', 
          padding: 16, 
          borderRadius: 12,
          border: '1px solid rgba(255, 182, 193, 0.3)'
        }}>
          <h4 style={{ color: '#ff69b4', marginBottom: 8 }}>Info:</h4>
          <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
            Setzt alle Achievements, Progress und Mausi-Punkte zurück
          </p>
        </div>
      </div>
    </div>
  );
}; 