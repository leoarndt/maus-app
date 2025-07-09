import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthGate';

import { getHamstiSkin } from '../../lib/supabase';
import { LoginStreakAchievementChecker } from '../achievements/LoginStreakAchievementChecker';
import hamsti1Image from '../../assets/hamsti/hamsti_1.png';
import hamsti2Image from '../../assets/hamsti/hamsti_2.png';
import hamsti3Image from '../../assets/hamsti/hamsti_3.png';

interface AreaCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onClick: () => void;
  currentHamstiSkin?: string;
}

const AreaCard: React.FC<AreaCardProps> = ({ title, description, icon, color, onClick, currentHamstiSkin }) => (
  <div
    onClick={onClick}
    style={{
      background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
      border: `2px solid ${color}30`,
      borderRadius: 20,
      padding: 24,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      minHeight: 160,
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = `0 8px 25px ${color}30`;
      e.currentTarget.style.borderColor = color;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderColor = `${color}30`;
    }}
  >
    <div style={{ 
      fontSize: 48, 
      marginBottom: 16,
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {title === 'Hamsti-Klicker' ? (
        <img
          src={
            currentHamstiSkin === 'hamsti_2' ? hamsti2Image :
            currentHamstiSkin === 'hamsti_3' ? hamsti3Image :
            hamsti1Image
          }
          alt="Hamsti"
          style={{
            width: 48,
            height: 48,
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        />
      ) : (
        icon
      )}
    </div>
    <h3 style={{ 
      margin: '0 0 8px 0', 
      color: color, 
      fontSize: 20, 
      fontWeight: 'bold' 
    }}>
      {title}
    </h3>
    <p style={{ 
      margin: 0, 
      color: '#666', 
      fontSize: 14, 
      lineHeight: 1.4 
    }}>
      {description}
    </p>
  </div>
);

interface HomePageProps {
  onNavigate: (area: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { userData } = useAuth();
  const [currentHamstiSkin, setCurrentHamstiSkin] = useState('hamsti_1');

  // Load current hamster skin
  useEffect(() => {
    const loadHamstiSkin = async () => {
      if (userData?.user_id) {
        const skin = await getHamstiSkin(userData.user_id);
        setCurrentHamstiSkin(skin);
      }
    };
    loadHamstiSkin();
  }, [userData]);

  const areas = [
    {
      key: 'stats',
      title: 'Streaks/Punkte',
      description: 'Deine Streaks und Punkte auf einen Blick',
      icon: '📊',
      color: '#6ec6ff'
    },
    {
      key: 'puzzle',
      title: 'Sidequests',
      description: 'bro muss ackern',
      icon: '🧩',
      color: '#87ceeb'
    },
    {
      key: 'message',
      title: 'Nachricht',
      description: 'deine tägliche portion liebe',
      icon: '💌',
      color: '#ff69b4'
    },
    {
      key: 'mood',
      title: 'Mood-Checker',
      description: 'Wie fühlst du dich heute?',
      icon: '😊',
      color: '#ffb347'
    },
    {
      key: 'achievements',
      title: 'Achievements',
      description: 'leben auf einmal videospiel',
      icon: '🏆',
      color: '#ffd700'
    },
    {
      key: 'treasure',
      title: 'Shop',
      description: 'Kaufe besondere Dinge mit Mausi-Punkten',
      icon: '🛍️',
      color: '#98fb98'
    },
    {
      key: 'countdown',
      title: 'Countdown',
      description: 'Zeit bis zur next Step',
      icon: '⏰',
      color: '#f0e68c'
    },
    {
      key: 'hamsti',
      title: 'Hamsti-Klicker',
      description: 'Du checkst wie cookie clickers aber auf hamsti basis',
      icon: '🐹',
      color: '#ffb347'
    }
  ];

  return (
    <>
      <LoginStreakAchievementChecker />
      <div style={{ 
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ffe6f2 0%, #fff0f6 50%, #f8e6ff 100%)'
      }}>
        {/* Main content */}
        <div style={{ 
          flex: 1,
          padding: '20px 16px',
          maxWidth: 1200,
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: 32,
            padding: '20px 0'
          }}>
            <h1 style={{ 
              color: '#ff69b4', 
              fontSize: 32, 
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              textShadow: '0 2px 4px rgba(255, 105, 180, 0.2)'
            }}>
              Willkommen zurück! 💕
            </h1>
            <p style={{ 
              color: '#666', 
              fontSize: 16, 
              margin: 0,
              opacity: 0.8
            }}>
              Was möchtest du heute machen?
            </p>
          </div>

          {/* Area Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            marginBottom: 20
          }}>
            {areas.map((area) => (
              <AreaCard
                key={area.key}
                title={area.title}
                description={area.description}
                icon={area.icon}
                color={area.color}
                onClick={() => onNavigate(area.key)}
                currentHamstiSkin={currentHamstiSkin}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}; 