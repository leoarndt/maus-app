import React, { useEffect, useState } from 'react';

interface AchievementPopupProps {
  achievement: {
    name: string;
    description: string;
    rarity: string;
    reward_points: number;
    unlocked?: boolean;
    unlocked_at?: string;
  };
  onClose: () => void;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start entrance animation
    setIsVisible(true);

    // Auto-close after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Wait for exit animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#a0a0a0';
      case 'rare': return '#4a90e2';
      case 'epic': return '#9b59b6';
      case 'legendary': return '#f39c12';
      default: return '#a0a0a0';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Gewöhnlich';
      case 'rare': return 'Selten';
      case 'epic': return 'Episch';
      case 'legendary': return 'Legendär';
      default: return 'Gewöhnlich';
    }
  };

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'all 0.5s cubic-bezier(.4,2,.6,1)',
        position: 'fixed',
        top: '10%',
        left: '50%',
        zIndex: 9999,
        minWidth: 320,
        maxWidth: 400,
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: 32,
        textAlign: 'center',
        border: `3px solid ${getRarityColor(achievement.rarity)}`
      }}
    >
      <h2 style={{ color: getRarityColor(achievement.rarity), margin: '0 0 12px 0', fontSize: 24, fontWeight: 'bold' }}>{achievement.name}</h2>
      <div style={{ fontSize: 16, color: getRarityColor(achievement.rarity), fontWeight: 'bold', marginBottom: 8 }}>{getRarityText(achievement.rarity)}</div>
      <p style={{ color: '#666', margin: '0 0 20px 0', fontSize: 16, lineHeight: 1.5 }}>{achievement.description}</p>
      <div style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', color: '#8b4513', padding: '12px 20px', borderRadius: 12, fontSize: 18, fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)', marginBottom: 12 }}>
        <span>🐭</span>
        +{achievement.reward_points} Mausi-Punkte
      </div>
      {achievement.unlocked_at && (
        <div style={{ marginTop: 12, fontSize: 13, color: getRarityColor(achievement.rarity), fontWeight: 'bold' }}>
          🎉 Freigeschaltet am {new Date(achievement.unlocked_at).toLocaleDateString('de-DE')}
        </div>
      )}
      <button onClick={onClose} style={{ marginTop: 24, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#ff69b4', color: '#fff', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>Schließen</button>
    </div>
  );
}; 