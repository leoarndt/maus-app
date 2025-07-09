import React, { useState } from 'react';
import { useAchievements } from '../achievements/AchievementManager';
import { getUserPurchases, addPurchase, supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthGate';
import { AchievementsPage } from '../achievements/AchievementsPage';

interface Treasure {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockDate?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: 'achievement' | 'treasure';
  progress?: number;
  maxProgress?: number;
  mausiPointsCost?: number; // Cost to purchase this treasure
  mausiPoints?: number;
}

// Unified interface for both achievements and treasures
interface DisplayItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockDate?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: 'achievement' | 'treasure';
  mausiPointsCost?: number;
  mausiPoints?: number;
}

const TREASURES: Treasure[] = [
  // Treasures (not achievements)
  {
    id: 'love_letter',
    title: 'Liebesbrief',
    description: 'Ein süßer Brief voller Liebe und Zuneigung',
    icon: '💌',
    color: '#ff69b4',
    unlocked: true,
    unlockDate: '2024-01-15',
    rarity: 'common',
    type: 'treasure',
    mausiPointsCost: 0 // Already unlocked
  },
  {
    id: 'photo_memory',
    title: 'Foto-Erinnerung',
    description: 'Ein besonderes Foto von uns zusammen',
    icon: '📸',
    color: '#ffb347',
    unlocked: true,
    unlockDate: '2024-01-20',
    rarity: 'rare',
    type: 'treasure',
    mausiPointsCost: 0 // Already unlocked
  },
  {
    id: 'virtual_hug',
    title: 'Virtuelle Umarmung',
    description: 'Eine warme, liebevolle Umarmung für dich',
    icon: '🤗',
    color: '#87ceeb',
    unlocked: false,
    rarity: 'common',
    type: 'treasure',
    mausiPointsCost: 25
  },
  {
    id: 'love_poem',
    title: 'Liebesgedicht',
    description: 'Ein Gedicht, das von meiner Liebe zu dir erzählt',
    icon: '📝',
    color: '#dda0dd',
    unlocked: false,
    rarity: 'epic',
    type: 'treasure',
    mausiPointsCost: 100
  },
  {
    id: 'special_song',
    title: 'Unser Lied',
    description: 'Ein Lied, das nur für dich geschrieben wurde',
    icon: '🎵',
    color: '#98fb98',
    unlocked: false,
    rarity: 'legendary',
    type: 'treasure',
    mausiPointsCost: 300
  },
  {
    id: 'future_plan',
    title: 'Zukunftsplan',
    description: 'Unsere Träume und Pläne für die Zukunft',
    icon: '🌟',
    color: '#f0e68c',
    unlocked: false,
    rarity: 'epic',
    type: 'treasure',
    mausiPointsCost: 150
  },
  {
    id: 'coffee_treat',
    title: 'Kaffee-Treat',
    description: 'Gönn dir einen leckeren Kaffee!',
    icon: '☕',
    color: '#8B4513',
    unlocked: false,
    rarity: 'common',
    type: 'treasure',
    mausiPointsCost: 15
  },
  {
    id: 'movie_night',
    title: 'Filmabend',
    description: 'Ein gemütlicher Filmabend für dich',
    icon: '🎬',
    color: '#FF6B6B',
    unlocked: false,
    rarity: 'rare',
    type: 'treasure',
    mausiPointsCost: 75
  },
  {
    id: 'book_treat',
    title: 'Buch-Treat',
    description: 'Kauf dir ein schönes Buch',
    icon: '📚',
    color: '#4A90E2',
    unlocked: false,
    rarity: 'rare',
    type: 'treasure',
    mausiPointsCost: 80
  },
  {
    id: 'weekend_trip',
    title: 'Wochenendausflug',
    description: 'Ein kleiner Ausflug am Wochenende',
    icon: '🚗',
    color: '#50C878',
    unlocked: false,
    rarity: 'legendary',
    type: 'treasure',
    mausiPointsCost: 500
  }
];

const RARITY_COLORS = {
  common: '#ff69b4',
  rare: '#ffb347',
  epic: '#dda0dd',
  legendary: '#ffd700'
};

const RARITY_LABELS = {
  common: 'Gewöhnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendär'
};

// Helper function to get rarity color for achievements
const getAchievementRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return '#a0a0a0';
    case 'rare': return '#4a90e2';
    case 'epic': return '#9b59b6';
    case 'legendary': return '#f39c12';
    default: return '#a0a0a0';
  }
};

// Helper function to get icon for achievements
const getAchievementIcon = (type: string) => {
  switch (type) {
    case 'login': return '🔑';
    case 'puzzle': return '🧩';
    case 'mood': return '💭';
    case 'message': return '💌';
    case 'manual': return '✋';
    case 'points': return '🐭';
    case 'date': return '📅';
    case 'meta': return '🏆';
    case 'hamsti_clicker': return '🐹';
    default: return '🏆';
  }
};

export const Treasure: React.FC<{ onlyShop?: boolean }> = ({ onlyShop }) => {
  const { achievements, getUserPoints } = useAchievements();
  const { userData } = useAuth();
  const [selectedTreasure, setSelectedTreasure] = useState<DisplayItem | null>(null);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseTreasure, setPurchaseTreasure] = useState<DisplayItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'achievements' | 'treasures'>('all');
  const [unlockedTreasures, setUnlockedTreasures] = useState<Set<string>>(new Set());
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  const unlocked = achievements.filter(a => a.unlocked);
  const totalPoints = getUserPoints();

  // Gekaufte Schätze aus Supabase laden
  React.useEffect(() => {
    const fetchPurchases = async () => {
      if (userData?.user_id) {
        setLoadingPurchases(true);
        const purchases = await getUserPurchases(userData.user_id);
        setUnlockedTreasures(new Set(purchases));
        setLoadingPurchases(false);
      }
    };
    fetchPurchases();
  }, [userData]);

  // Convert achievements to DisplayItem format
  const achievementItems: DisplayItem[] = achievements.map(achievement => ({
    id: achievement.name,
    title: achievement.name,
    description: achievement.description,
    icon: getAchievementIcon(achievement.type),
    color: getAchievementRarityColor(achievement.rarity),
    unlocked: achievement.unlocked || false,
    unlockDate: achievement.unlocked_at,
    rarity: achievement.rarity as 'common' | 'rare' | 'epic' | 'legendary',
    type: 'achievement' as const,
    mausiPoints: achievement.reward_points
  }));

  // Convert treasures to DisplayItem format
  const treasureItems: DisplayItem[] = TREASURES.map(treasure => ({
    ...treasure,
    unlocked: treasure.unlocked || unlockedTreasures.has(treasure.id),
    unlockDate: treasure.unlockDate || (unlockedTreasures.has(treasure.id) ? new Date().toISOString() : undefined)
  }));

  // Combine achievements and treasures
  const allItems: DisplayItem[] = onlyShop
    ? treasureItems
    : [...achievementItems, ...treasureItems];
  
  const unlockedCount = unlocked.length;
  const totalCount = allItems.length;
  const achievementsCount = achievements.length;
  const treasuresCount = TREASURES.length;

  const filteredItems = allItems.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'achievements') return item.type === 'achievement';
    if (activeTab === 'treasures') return item.type === 'treasure';
    return true;
  });

  const handleTreasureClick = (item: DisplayItem) => {
    const isUnlocked = item.unlocked || unlockedTreasures.has(item.id);
    
    if (isUnlocked) {
      // Show detail modal for unlocked items
      setSelectedTreasure(item);
    } else if (item.type === 'treasure' && item.mausiPointsCost) {
      // Show purchase modal for locked treasures
      setPurchaseTreasure(item);
      setShowPurchaseModal(true);
    } else if (item.type === 'achievement' && !isUnlocked) {
      // Show progress modal for locked achievements
      setSelectedTreasure(item);
    } else {
      // Fallback for any other locked items
      setShowUnlockAnimation(true);
      setTimeout(() => {
        setShowUnlockAnimation(false);
      }, 2000);
    }
  };

  // Kauf-Logik mit Supabase
  const handlePurchase = async (treasure: DisplayItem) => {
    if (!userData?.user_id) return;
    if (!treasure.mausiPointsCost) return;
    
    try {
      // 1. Aktuelle Punkte aus der Datenbank holen
      const { data: currentUserData, error: fetchError } = await supabase
        .from('users')
        .select('points')
        .eq('user_id', userData.user_id)
        .single();
      
      if (fetchError || !currentUserData) {
        alert('Fehler beim Laden der aktuellen Punkte. Bitte versuche es erneut.');
        return;
      }
      
      const currentPoints = currentUserData.points || 0;
      
      // 2. Überprüfen, ob genug Punkte vorhanden sind
      if (currentPoints < treasure.mausiPointsCost) {
        alert(`Du hast nicht genug Mausi-Punkte! Du brauchst ${treasure.mausiPointsCost} Punkte.`);
        return;
      }
      
      // 3. Kauf in DB speichern
      const success = await addPurchase(userData.user_id, treasure.id);
      if (success) {
        // 4. Punkte abziehen (mit aktuellen Daten aus DB)
        const newPoints = currentPoints - treasure.mausiPointsCost;
        const { error } = await supabase
          .from('users')
          .update({ points: newPoints })
          .eq('user_id', userData.user_id);
        
        if (!error) {
          setUnlockedTreasures(prev => new Set([...prev, treasure.id]));
          setShowPurchaseModal(false);
          setPurchaseTreasure(null);
          setShowUnlockAnimation(true);
          setTimeout(() => {
            setShowUnlockAnimation(false);
          }, 2000);
        } else {
          alert('Fehler beim Abziehen der Punkte. Bitte versuche es erneut.');
        }
      } else {
        alert('Fehler beim Kauf. Bitte versuche es erneut.');
      }
    } catch (error) {
      alert('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.');
    }
  };

  const handleCloseModal = () => {
    setSelectedTreasure(null);
    setShowPurchaseModal(false);
    setPurchaseTreasure(null);
  };

  // Ladezustand anzeigen
  if (loadingPurchases) {
    return <div>Shop wird geladen...</div>;
  }

  return (
    <div style={{ 
      padding: '20px 16px',
      maxWidth: 800,
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffe6f2 0%, #fff0f6 50%, #f8e6ff 100%)'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 32,
        padding: '20px 0'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗝️</div>
        <h1 style={{ 
          color: '#ff69b4', 
          margin: '0 0 8px 0', 
          fontSize: 28, 
          fontWeight: 'bold'
        }}>
          Schatztruhe & Achievements
        </h1>
        <p style={{ 
          color: '#666', 
          margin: '0 0 16px 0', 
          fontSize: 16,
          lineHeight: 1.5
        }}>
          Sammle Erfolge und entdecke besondere Schätze! 💎
        </p>
        <div style={{
          background: '#fff3cd',
          color: '#b8860b',
          borderRadius: 12,
          padding: '12px 20px',
          margin: '16px auto 0 auto',
          maxWidth: 400,
          fontWeight: 'bold',
          fontSize: 16,
          border: '2px solid #ffe066',
          boxShadow: '0 2px 8px rgba(255, 215, 0, 0.08)'
        }}>
          💐 Kleiner Tipp: Du solltest mal wieder Blumen verschenken!
        </div>
        
        {/* Mausi Points Display */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          border: '2px solid #ffd700'
        }}>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: '#ffd700',
            marginBottom: 8
          }}>
            🐭 {totalPoints} Mausi-Punkte
          </div>
          <p style={{ 
            fontSize: 14, 
            color: '#666',
            margin: 0
          }}>
            Sammle Punkte durch Achievements und kaufe dir Schätze!
          </p>
        </div>
        
        {/* Progress Overview */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          border: '2px solid #ffb6c1'
        }}>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: '#ff69b4',
            marginBottom: 8
          }}>
            {unlockedCount} / {totalCount} freigeschaltet
          </div>
          <div style={{
            width: '100%',
            height: 12,
            background: '#f0f0f0',
            borderRadius: 6,
            overflow: 'hidden',
            marginBottom: 8
          }}>
            <div style={{
              width: `${(unlockedCount / totalCount) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ff69b4 0%, #ff8da1 100%)',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>
            {Math.round((unlockedCount / totalCount) * 100)}% abgeschlossen
          </div>
        </div>
      </div>

      {/* Tabs */}
      {!onlyShop && (
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 16,
          padding: 4,
          marginBottom: 24,
          border: '2px solid #ffb6c1'
        }}>
          {[
            { key: 'all', label: 'Alle', count: totalCount },
            { key: 'achievements', label: 'Achievements', count: achievementsCount },
            { key: 'treasures', label: 'Schätze', count: treasuresCount }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                background: activeTab === tab.key 
                  ? 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)'
                  : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#666',
                border: 'none',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      )}

      {/* Items Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleTreasureClick(item)}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 20,
              padding: 24,
              border: `2px solid ${item.unlocked ? item.color : '#ffb6c1'}`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              transform: item.unlocked ? 'scale(1)' : 'scale(0.98)',
              opacity: item.unlocked ? 1 : 0.8,
              boxShadow: item.unlocked 
                ? '0 8px 32px rgba(255, 182, 193, 0.2)' 
                : '0 4px 16px rgba(255, 182, 193, 0.1)'
            }}
            onMouseEnter={(e) => {
              if (item.unlocked) {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 182, 193, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (item.unlocked) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 182, 193, 0.2)';
              }
            }}
          >
            {/* Type badge */}
            <div style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: item.type === 'achievement' ? '#ff69b4' : '#ffb347',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {item.type === 'achievement' ? '🏆' : '💎'}
            </div>

            {/* Rarity badge */}
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: RARITY_COLORS[item.rarity],
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {RARITY_LABELS[item.rarity]}
            </div>

            {/* Mausi Points Cost for locked treasures */}
            {!item.unlocked && item.type === 'treasure' && item.mausiPointsCost && (
              <div style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                background: '#ffd700',
                color: '#333',
                padding: '4px 8px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                🐭 {item.mausiPointsCost}
              </div>
            )}

            <div style={{ 
              textAlign: 'center',
              marginTop: 20
            }}>
              <div style={{ 
                fontSize: 48, 
                marginBottom: 16,
                filter: item.unlocked ? 'none' : 'grayscale(100%)'
              }}>
                {item.icon}
              </div>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                color: item.unlocked ? item.color : '#999',
                fontSize: 18,
                fontWeight: 'bold'
              }}>
                {item.title}
              </h3>
              <p style={{ 
                margin: 0, 
                color: item.unlocked ? '#666' : '#999',
                fontSize: 14,
                lineHeight: 1.4
              }}>
                {item.description}
              </p>
            </div>

            {/* Unlock date for unlocked items */}
            {item.unlocked && item.unlockDate && (
              <div style={{
                marginTop: 16,
                padding: '8px 12px',
                background: `${item.color}20`,
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <span style={{ 
                  fontSize: 12, 
                  color: item.color,
                  fontWeight: 'bold'
                }}>
                  Freigeschaltet am {new Date(item.unlockDate).toLocaleDateString('de-DE')}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && purchaseTreasure && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 32,
            maxWidth: 400,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              {purchaseTreasure.icon}
            </div>
            <h2 style={{ 
              color: purchaseTreasure.color, 
              margin: '0 0 16px 0',
              fontSize: 24,
              fontWeight: 'bold'
            }}>
              {purchaseTreasure.title}
            </h2>
            <p style={{ 
              color: '#666', 
              margin: '0 0 24px 0',
              fontSize: 16,
              lineHeight: 1.5
            }}>
              {purchaseTreasure.description}
            </p>
            
            <div style={{
              background: '#fff3cd',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              border: '2px solid #ffd700'
            }}>
              <div style={{ 
                fontSize: 20, 
                fontWeight: 'bold', 
                color: '#ffd700',
                marginBottom: 8
              }}>
                🐭 {purchaseTreasure.mausiPointsCost} Mausi-Punkte
              </div>
              <div style={{ fontSize: 14, color: '#666' }}>
                Dein Kontostand: {totalPoints} Punkte
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleCloseModal}
                style={{
                  flex: 1,
                  background: '#f8f9fa',
                  color: '#666',
                  border: '2px solid #dee2e6',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => handlePurchase(purchaseTreasure)}
                disabled={totalPoints < (purchaseTreasure.mausiPointsCost || 0)}
                style={{
                  flex: 1,
                  background: totalPoints >= (purchaseTreasure.mausiPointsCost || 0)
                    ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
                    : '#f8f9fa',
                  color: totalPoints >= (purchaseTreasure.mausiPointsCost || 0) ? '#333' : '#999',
                  border: '2px solid #ffd700',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: totalPoints >= (purchaseTreasure.mausiPointsCost || 0) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease'
                }}
              >
                Kaufen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Animation */}
      {showUnlockAnimation && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 32,
            textAlign: 'center',
            animation: 'bounce 0.6s ease-in-out'
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ 
              color: '#ff69b4', 
              margin: '0 0 16px 0',
              fontSize: 24,
              fontWeight: 'bold'
            }}>
              Achievement freigeschaltet!
            </h2>
            <p style={{ 
              color: '#666', 
              margin: 0,
              fontSize: 16
            }}>
              Du hast ein neues Achievement erreicht!
            </p>
          </div>
        </div>
      )}

      {/* Treasure Detail Modal */}
      {selectedTreasure && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 32,
            maxWidth: 500,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ 
              fontSize: 64, 
              marginBottom: 16,
              filter: selectedTreasure.unlocked ? 'none' : 'grayscale(50%)'
            }}>
              {selectedTreasure.icon}
            </div>
            <h2 style={{ 
              color: selectedTreasure.unlocked ? selectedTreasure.color : '#999', 
              margin: '0 0 16px 0',
              fontSize: 24,
              fontWeight: 'bold'
            }}>
              {selectedTreasure.title}
            </h2>
            <p style={{ 
              color: selectedTreasure.unlocked ? '#666' : '#999', 
              margin: '0 0 24px 0',
              fontSize: 16,
              lineHeight: 1.5
            }}>
              {selectedTreasure.description}
            </p>
            
            {/* Unlock date for unlocked items */}
            {selectedTreasure.unlocked && selectedTreasure.unlockDate && (
              <div style={{
                background: `${selectedTreasure.color}20`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 24
              }}>
                <span style={{ 
                  fontSize: 14, 
                  color: selectedTreasure.color,
                  fontWeight: 'bold'
                }}>
                  Freigeschaltet am {new Date(selectedTreasure.unlockDate).toLocaleDateString('de-DE')}
                </span>
              </div>
            )}

            <button
              onClick={handleCloseModal}
              style={{
                background: 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 32px',
                fontSize: 16,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-30px);
          }
          60% {
            transform: translateY(-15px);
          }
        }
      `}</style>
    </div>
  );
}; 