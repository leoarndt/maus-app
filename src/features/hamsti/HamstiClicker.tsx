import React, { useState, useEffect } from 'react';
import { getHamstiClicks, setHamstiClicks, getHamstiSkin, setHamstiSkin, getUnlockedShopItems } from '../../lib/supabase';
import { useAuth } from '../auth/AuthGate';
import { useAchievements, checkAndUnlockAchievements } from '../achievements/AchievementManager';

const HAMSTI_KEY = 'hamsti_clicks';

// Hamsti image URLs
const hamsti1Url = '/src/assets/hamsti/hamsti_1.png';
const hamsti2Url = '/src/assets/hamsti/hamsti_2.png';
const hamsti3Url = '/src/assets/hamsti/hamsti_3.png';

// Available skins mapping
const HAMSTI_SKINS = {
  'hamsti_1': { name: 'Hamsti Classic', url: hamsti1Url, color: '#ffb347' },
  'hamsti_2': { name: 'Hamsti Alternative', url: hamsti2Url, color: '#ff69b4' },
  'hamsti_3': { name: 'Hamsti Stylisch', url: hamsti3Url, color: '#9370db' }
};

export const HamstiClicker: React.FC = () => {
  const { userData, isAdmin } = useAuth();
  const { achievements, unlockAchievement } = useAchievements();
  const [clicks, setClicks] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSkin, setCurrentSkin] = useState('hamsti_1');
  const [availableSkins, setAvailableSkins] = useState<Set<string>>(new Set(['hamsti_1']));
  const [showSkinSelector, setShowSkinSelector] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (userData?.user_id) {
        const dbClicks = await getHamstiClicks(userData.user_id);
        const userSkin = await getHamstiSkin(userData.user_id);
        const unlockedItems = await getUnlockedShopItems(userData.user_id);
        
        setClicks(dbClicks);
        setCurrentSkin(userSkin);
        
        // Check which skins are available (hamsti_1 is always available)
        const skins = new Set(['hamsti_1']);
        if (unlockedItems.includes('hamsti_skin_2')) {
          skins.add('hamsti_2');
        }
        if (unlockedItems.includes('hamsti_skin_3')) {
          skins.add('hamsti_3');
        }
        setAvailableSkins(skins);
      } else {
        const saved = localStorage.getItem(HAMSTI_KEY);
        setClicks(saved ? parseInt(saved) : 0);
        setCurrentSkin('hamsti_1');
      }
      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line
  }, [userData]);

  const handleClick = async () => {
    const newClicks = clicks + 1;
    setClicks(newClicks);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 200);
    if (userData?.user_id) {
      await setHamstiClicks(userData.user_id, newClicks);
      // Nach dem Setzen: Klicks aus der DB zählen
      const dbClicks = await getHamstiClicks(userData.user_id);
      // Achievements prüfen und ggf. vergeben
      checkAndUnlockAchievements('hamsti_clicker', dbClicks, unlockAchievement, achievements);
    } else {
      localStorage.setItem(HAMSTI_KEY, newClicks.toString());
    }
  };

  const handleSkinChange = async (skin: string) => {
    if (!availableSkins.has(skin)) return;
    
    setCurrentSkin(skin);
    setShowSkinSelector(false);
    
    if (userData?.user_id) {
      await setHamstiSkin(userData.user_id, skin);
    }
  };

  const handleResetClicks = async () => {
    setClicks(0);
    setCurrentSkin('hamsti_1'); // Reset to first hamsti
    if (userData?.user_id) {
      await setHamstiClicks(userData.user_id, 0);
      await setHamstiSkin(userData.user_id, 'hamsti_1');
    } else {
      localStorage.setItem(HAMSTI_KEY, '0');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 80, fontSize: 24, color: '#ff69b4' }}>Lade Hamsti-Klicks...</div>;
  }

  const currentSkinData = HAMSTI_SKINS[currentSkin as keyof typeof HAMSTI_SKINS];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fffbe6 0%, #ffe6f2 100%)',
      padding: 24
    }}>
      <h1 style={{
        color: '#ff69b4',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 16,
        textShadow: '0 2px 4px rgba(255, 105, 180, 0.1)'
      }}>
        Hamsti-Klicker 🐹
      </h1>
      <p style={{ color: '#666', fontSize: 18, marginBottom: 32 }}>
        Klicke auf Hamsti und sammle Klicks!
      </p>
      
      <button
        onClick={handleClick}
        style={{
          background: 'none',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          marginBottom: 24,
          transition: 'transform 0.2s',
          transform: isBouncing ? 'scale(1.15)' : 'scale(1)',
        }}
        aria-label="Hamsti klicken"
      >
        <img
          src={currentSkinData.url}
          alt="Hamsti"
          style={{
            width: 120,
            height: 120,
            objectFit: 'contain',
            filter: isBouncing ? 'drop-shadow(0 0 16px #ffb347)' : 'none',
            transition: 'filter 0.2s',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        />
      </button>
      <div style={{
        fontSize: 28,
        color: '#ffb347',
        fontWeight: 'bold',
        marginBottom: 8
      }}>
        {clicks} Klicks
      </div>
      <div style={{ color: '#999', fontSize: 14, marginBottom: 16 }}>
        Wie oft kannst du Hamsti klicken?
      </div>
      
      {/* Skin Selector Button */}
      <button
        onClick={() => setShowSkinSelector(!showSkinSelector)}
        style={{
          background: 'linear-gradient(135deg, #ffb347 0%, #ffd700 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 'bold',
          cursor: 'pointer',
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(255, 179, 71, 0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        🎨 Skin wechseln
      </button>

      {/* Skin Selector Modal */}
      {showSkinSelector && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ color: '#ff69b4', marginBottom: 20 }}>Wähle deinen Hamsti-Skin</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(HAMSTI_SKINS).map(([skinKey, skinData]) => (
                <button
                  key={skinKey}
                  onClick={() => handleSkinChange(skinKey)}
                  disabled={!availableSkins.has(skinKey)}
                  style={{
                    background: availableSkins.has(skinKey) 
                      ? (currentSkin === skinKey ? 'linear-gradient(135deg, #ff69b4 0%, #ff8e8e 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)')
                      : '#f8f9fa',
                    color: availableSkins.has(skinKey) ? (currentSkin === skinKey ? 'white' : '#333') : '#999',
                    border: `2px solid ${currentSkin === skinKey ? '#ff69b4' : '#dee2e6'}`,
                    borderRadius: 12,
                    padding: 12,
                    cursor: availableSkins.has(skinKey) ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <img
                    src={skinData.url}
                    alt={skinData.name}
                    style={{
                      width: 32,
                      height: 32,
                      objectFit: 'contain',
                      filter: availableSkins.has(skinKey) ? 'none' : 'grayscale(100%)'
                    }}
                  />
                  <span style={{ fontWeight: 'bold' }}>{skinData.name}</span>
                  {!availableSkins.has(skinKey) && (
                    <span style={{ fontSize: 12, color: '#999' }}>(Im Shop erhältlich)</span>
                  )}
                  {currentSkin === skinKey && <span>✅</span>}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSkinSelector(false)}
              style={{
                background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: 20
              }}
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {isAdmin && (
        <button
          onClick={handleResetClicks}
          style={{
            marginTop: 32,
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '12px 32px',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(255, 107, 107, 0.2)',
            transition: 'all 0.2s ease'
          }}
        >
          🔄 Hamsti-Klicks zurücksetzen
        </button>
      )}
    </div>
  );
}; 