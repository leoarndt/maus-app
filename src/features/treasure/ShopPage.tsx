import React, { useState, useMemo, useEffect } from 'react';
import { useAchievements } from '../achievements/AchievementManager';
import { getShopItems, getUnlockedShopItems, unlockShopItem, supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthGate';

interface ShopItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockDate?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: 'treasure';
  mausiPointsCost: number;
  category: 'romantic' | 'treats' | 'experiences' | 'special';
}

const RARITY_COLORS = {
  common: '#95a5a6',
  rare: '#3498db',
  epic: '#9b59b6',
  legendary: '#f39c12'
};

const RARITY_LABELS = {
  common: 'Gewöhnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendär'
};

const CATEGORY_ICONS = {
  romantic: '💕',
  treats: '🍰',
  experiences: '🌟',
  special: '✨'
};

const CATEGORY_LABELS = {
  romantic: 'Romantisch',
  treats: 'Leckereien',
  experiences: 'Erlebnisse',
  special: 'Besonders'
};

export const ShopPage: React.FC = () => {
  const { userData, reloadUser } = useAuth();
  const { getUserPoints } = useAchievements();
  
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [unlockedItems, setUnlockedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'purchased' | 'not_purchased'>('all');

  const mausiPoints = getUserPoints();

  // Load shop items and user data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Load shop items from database
        const items = await getShopItems();
        setShopItems(items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          icon: item.icon,
          color: item.color,
          unlocked: item.unlocked || false,
          unlockDate: item.unlock_date,
          rarity: item.rarity,
          type: 'treasure' as const,
          mausiPointsCost: item.mausi_points_cost,
          category: item.category
        })));

        // Load user's unlocked items
        if (userData?.user_id) {
          const unlocked = await getUnlockedShopItems(userData.user_id);
          setUnlockedItems(new Set(unlocked));
        }
      } catch (error) {
        console.error('Fehler beim Laden der Shop-Daten:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userData]);

  const filteredAndSortedItems = useMemo(() => {
    // Filter items by status
    const filtered = shopItems.filter(item => {
      const isPurchased = unlockedItems.has(item.id);
      switch (statusFilter) {
        case 'purchased':
          return isPurchased;
        case 'not_purchased':
          return !isPurchased;
        case 'all':
        default:
          return true;
      }
    });

    // Sort items by price
    return filtered.sort((a, b) => {
      return a.mausiPointsCost - b.mausiPointsCost;
    });
  }, [shopItems, unlockedItems, statusFilter]);

  const handleItemClick = (item: ShopItem) => {
    const isUnlocked = unlockedItems.has(item.id);
    if (isUnlocked) {
      setSelectedItem(item);
      setShowPurchaseModal(true);
    } else {
      setSelectedItem(item);
      setShowPurchaseModal(true);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!userData?.user_id) {
      alert('Du musst eingeloggt sein, um Schätze zu kaufen!');
      return;
    }
    if (mausiPoints < item.mausiPointsCost) {
      alert(`Du hast nicht genug Mausi-Punkte! Du brauchst ${item.mausiPointsCost} Punkte.`);
      return;
    }
    if (unlockedItems.has(item.id)) {
      alert('Du besitzt diesen Schatz bereits!');
      return;
    }

    setPurchaseLoading(true);
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
      if (currentPoints < item.mausiPointsCost) {
        alert(`Du hast nicht genug Mausi-Punkte! Du brauchst ${item.mausiPointsCost} Punkte.`);
        return;
      }
      
      // 3. Kauf in DB speichern
      const success = await unlockShopItem(userData.user_id, item.id);
      if (success) {
        // 4. Punkte abziehen (mit aktuellen Daten aus DB)
        const newPoints = currentPoints - item.mausiPointsCost;
        const { error } = await supabase
          .from('users')
          .update({ points: newPoints })
          .eq('user_id', userData.user_id);
        
        if (!error) {
          setUnlockedItems(prev => new Set([...prev, item.id]));
          setShowPurchaseModal(false);
          setSelectedItem(null);
          // 5. User-Context neu laden
          reloadUser && reloadUser();
          
          // Show success animation
          const successElement = document.createElement('div');
          successElement.innerHTML = `
            <div style="
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: linear-gradient(135deg, #28a745, #20c997);
              color: white;
              padding: 20px 40px;
              border-radius: 20px;
              font-size: 18px;
              font-weight: bold;
              z-index: 9999;
              animation: purchaseSuccess 2s ease-in-out;
              box-shadow: 0 10px 30px rgba(40, 167, 69, 0.3);
            ">
              🎉 ${item.title} erfolgreich gekauft! 🎉
            </div>
          `;
          document.body.appendChild(successElement);
          setTimeout(() => document.body.removeChild(successElement), 2000);
        } else {
          alert('Fehler beim Abziehen der Punkte. Bitte versuche es erneut.');
        }
      } else {
        alert('Fehler beim Kauf. Bitte versuche es erneut.');
      }
    } catch (error) {
      alert('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setPurchaseLoading(false);
    }
  };



  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 24,
          border: '2px solid rgba(102, 126, 234, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            fontSize: 64, 
            marginBottom: 16,
            animation: 'pulse 2s infinite'
          }}>
            🛍️
          </div>
          <div style={{ fontSize: 18, color: '#666', fontWeight: 'bold' }}>
            Shop wird geladen...
          </div>
          <div style={{ 
            marginTop: 16,
            width: 200,
            height: 4,
            background: '#f0f0f0',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <div style={{
              width: '60%',
              height: '100%',
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
              animation: 'loading 1.5s ease-in-out infinite'
            }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '12px 8px'
    }}>
              {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: 16,
          padding: '16px 12px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 16,
          border: '2px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          maxWidth: '100%',
          margin: '0 auto 16px auto'
        }}>
                  <div style={{ 
            fontSize: 48, 
            marginBottom: 12,
            filter: 'drop-shadow(0 8px 16px rgba(102, 126, 234, 0.3))',
            animation: 'float 3s ease-in-out infinite'
          }}>
            🛍️
          </div>
          <h1 style={{ 
            color: '#667eea', 
            margin: '0 0 8px 0', 
            fontSize: 24, 
            fontWeight: 'bold',
            textShadow: '0 4px 8px rgba(102, 126, 234, 0.2)'
          }}>
            Mausi-Shop
          </h1>
          <p style={{ 
            color: '#666', 
            margin: '0 0 16px 0', 
            fontSize: 14, 
            lineHeight: 1.5,
            maxWidth: '100%',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Entdecke magische Schätze! ✨
          </p>

        {/* Mausi Points Display */}
        <div style={{
          background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
          borderRadius: 12,
          padding: 16,
          border: '2px solid #ffd700',
          boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)',
          maxWidth: '100%',
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            animation: 'float 4s ease-in-out infinite'
          }} />
                      <div style={{ 
              fontSize: 28, 
              fontWeight: 'bold', 
              color: '#8b4513',
              marginBottom: 6,
              position: 'relative',
              zIndex: 1
            }}>
              🐭 {mausiPoints.toLocaleString()} Punkte
            </div>
            <p style={{ 
              fontSize: 12, 
              color: '#8b4513',
              margin: 0,
              position: 'relative',
              zIndex: 1
            }}>
              Sammle Punkte und erweitere deine Sammlung!
            </p>
        </div>
      </div>

      {/* Controls Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        border: '2px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        maxWidth: '100%',
        margin: '0 auto 16px auto'
      }}>
        {/* View Mode and Sort Controls */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 16
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ 
                fontSize: 13, 
                fontWeight: 'bold', 
                color: '#667eea' 
              }}>
                Ansicht:
              </span>
              <div style={{
                display: 'flex',
                background: '#f8f9fa',
                borderRadius: 6,
                padding: 2,
                border: '1px solid #e9ecef'
              }}>
                {[
                  { key: 'grid', icon: '⊞', label: 'Grid' },
                  { key: 'list', icon: '☰', label: 'Liste' }
                ].map(mode => (
                  <button
                    key={mode.key}
                    onClick={() => setViewMode(mode.key as 'grid' | 'list')}
                    style={{
                      background: viewMode === mode.key 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'transparent',
                      color: viewMode === mode.key ? '#fff' : '#666',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}
                  >
                    <span>{mode.icon}</span>
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ 
                fontSize: 13, 
                fontWeight: 'bold', 
                color: '#667eea' 
              }}>
                Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #e9ecef',
                  fontSize: 11,
                  outline: 'none',
                  cursor: 'pointer',
                  background: '#fff'
                }}
              >
                <option value="all">Alle</option>
                <option value="purchased">Gekauft</option>
                <option value="not_purchased">Nicht gekauft</option>
              </select>
            </div>
          </div>
        </div>



                {/* Results Count */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <div style={{ 
            fontSize: 12, 
            color: '#666',
            padding: '8px 12px',
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(102, 126, 234, 0.2)',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {filteredAndSortedItems.length} von {shopItems.length} Schätzen angezeigt
          </div>
        </div>
      </div>

      {/* Shop Items */}
      <div style={{
        maxWidth: '100%',
        margin: '0 auto'
      }}>
        {viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12
          }}>
            {filteredAndSortedItems.map((item) => {
          const isUnlocked = unlockedItems.has(item.id);
          
          return (
            <div 
              key={item.id} 
                  onClick={() => handleItemClick(item)}
                                style={{
                    background: isUnlocked 
                      ? `linear-gradient(135deg, ${item.color}15 0%, ${item.color}25 100%)`
                      : 'rgba(255, 255, 255, 0.95)',
                    border: `2px solid ${isUnlocked ? item.color : '#e9ecef'}`,
                    borderRadius: 16,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    minHeight: 180,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.4s ease',
                    transform: isUnlocked ? 'scale(1)' : 'scale(0.98)',
                    opacity: isUnlocked ? 1 : 0.9,
                    boxShadow: isUnlocked 
                      ? `0 6px 20px ${item.color}30`
                      : '0 3px 12px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = isUnlocked 
                      ? `0 16px 50px ${item.color}40`
                      : '0 12px 32px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = isUnlocked ? 'scale(1)' : 'scale(0.98)';
                    e.currentTarget.style.boxShadow = isUnlocked 
                      ? `0 12px 40px ${item.color}30`
                      : '0 8px 24px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Rarity Badge */}
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: RARITY_COLORS[item.rarity],
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}>
                    {RARITY_LABELS[item.rarity]}
                  </div>

                  {/* Category Badge */}
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#667eea',
                    padding: '4px 8px',
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 'bold',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                  }}>
                    {CATEGORY_ICONS[item.category]}
                  </div>

              {/* Price Tag */}
              <div style={{
                position: 'absolute',
                    bottom: 12,
                    right: 12,
                background: isUnlocked ? '#28a745' : '#ffd700',
                color: isUnlocked ? '#fff' : '#333',
                    padding: '6px 12px',
                borderRadius: 12,
                    fontSize: 12,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}>
                    {isUnlocked ? '✅' : `🐭 ${item.mausiPointsCost.toLocaleString()}`}
              </div>

                                {/* Item Icon */}
                  <div style={{ 
                    fontSize: 48, 
                    marginBottom: 12,
                    filter: isUnlocked ? 'none' : 'grayscale(30%)',
                    transition: 'all 0.4s ease',
                    marginTop: 12
                  }}>
                    {item.icon}
                  </div>

                  {/* Title */}
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    color: isUnlocked ? item.color : '#999', 
                    fontSize: 16, 
                    fontWeight: 'bold',
                    lineHeight: 1.3
                  }}>
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p style={{ 
                    margin: '0 0 12px 0', 
                    color: isUnlocked ? '#666' : '#999', 
                    fontSize: 12, 
                    lineHeight: 1.4 
                  }}>
                    {item.description}
                  </p>

                                     {/* Unlock Date for unlocked items */}
                   {isUnlocked && item.unlockDate && (
                     <div style={{
                       marginTop: 'auto',
                       padding: '8px 12px',
                       background: `${item.color}20`,
                       borderRadius: 8,
                       textAlign: 'center',
                       border: `1px solid ${item.color}40`
                     }}>
                       <span style={{ 
                         fontSize: 12, 
                         color: item.color,
                         fontWeight: 'bold'
                       }}>
                         🎉 {new Date(item.unlockDate).toLocaleDateString('de-DE')}
                       </span>
                     </div>
                   )}
                </div>
              );
            })}
          </div>
                 ) : (
           <div style={{
             display: 'flex',
             flexDirection: 'column',
             gap: 12
           }}>
            {filteredAndSortedItems.map((item) => {
              const isUnlocked = unlockedItems.has(item.id);
              
              return (
                                 <div 
                   key={item.id} 
                   onClick={() => handleItemClick(item)}
                   style={{
                     background: isUnlocked 
                       ? `linear-gradient(135deg, ${item.color}15 0%, ${item.color}25 100%)`
                       : 'rgba(255, 255, 255, 0.95)',
                     border: `2px solid ${isUnlocked ? item.color : '#e9ecef'}`,
                     borderRadius: 16,
                     padding: 16,
                     display: 'flex',
                     alignItems: 'center',
                     gap: 16,
                     transition: 'all 0.3s ease',
                     cursor: 'pointer',
                     backdropFilter: 'blur(10px)',
                     boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                   }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(8px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                  }}
                >
                                     {/* Item Icon */}
                   <div style={{ 
                     fontSize: 40, 
                     filter: isUnlocked ? 'none' : 'grayscale(30%)',
                     flexShrink: 0
                   }}>
                     {item.icon}
                   </div>

                                     {/* Content */}
                   <div style={{ flex: 1 }}>
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: 8,
                       marginBottom: 6
                     }}>
                       <h3 style={{ 
                         margin: 0, 
                         color: isUnlocked ? item.color : '#999', 
                         fontSize: 16, 
                         fontWeight: 'bold'
                       }}>
                         {item.title}
                       </h3>
                       <div style={{
                         background: RARITY_COLORS[item.rarity],
                         color: '#fff',
                         padding: '3px 6px',
                         borderRadius: 6,
                         fontSize: 9,
                         fontWeight: 'bold',
                         textTransform: 'uppercase'
                       }}>
                         {RARITY_LABELS[item.rarity]}
                       </div>
                       <div style={{
                         background: 'rgba(255, 255, 255, 0.9)',
                         color: '#667eea',
                         padding: '3px 6px',
                         borderRadius: 6,
                         fontSize: 9,
                         fontWeight: 'bold',
                         border: '1px solid rgba(102, 126, 234, 0.2)'
                       }}>
                         {CATEGORY_ICONS[item.category]}
                       </div>
                     </div>
                     <p style={{ 
                       margin: 0, 
                       color: isUnlocked ? '#666' : '#999', 
                       fontSize: 12, 
                       lineHeight: 1.4 
                     }}>
                       {item.description}
                     </p>
                   </div>

                                     {/* Price and Status */}
                   <div style={{
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'flex-end',
                     gap: 6,
                     flexShrink: 0
                   }}>
                     <div style={{
                       background: isUnlocked ? '#28a745' : '#ffd700',
                       color: isUnlocked ? '#fff' : '#333',
                       padding: '6px 12px',
                       borderRadius: 10,
                       fontSize: 12,
                       fontWeight: 'bold',
                       display: 'flex',
                       alignItems: 'center',
                       gap: 4
                     }}>
                       {isUnlocked ? '✅' : `🐭 ${item.mausiPointsCost.toLocaleString()}`}
                     </div>
                     {isUnlocked && item.unlockDate && (
                       <div style={{
                         fontSize: 10,
                         color: item.color,
                         fontWeight: 'bold'
                       }}>
                         {new Date(item.unlockDate).toLocaleDateString('de-DE')}
                       </div>
                     )}
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            borderRadius: 28,
            padding: 40,
            maxWidth: 500,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <div style={{ 
              fontSize: 80, 
              marginBottom: 24,
              filter: unlockedItems.has(selectedItem.id) ? 'none' : 'grayscale(30%)'
            }}>
              {selectedItem.icon}
            </div>
            
            <h2 style={{ 
              color: unlockedItems.has(selectedItem.id) ? selectedItem.color : '#999', 
              margin: '0 0 16px 0',
              fontSize: 28,
              fontWeight: 'bold'
            }}>
              {selectedItem.title}
            </h2>
            
            <p style={{ 
              color: '#666', 
              margin: '0 0 24px 0',
              fontSize: 16,
              lineHeight: 1.6
            }}>
              {selectedItem.description}
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 16,
              marginBottom: 24
            }}>
              <div style={{
                background: RARITY_COLORS[selectedItem.rarity],
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {RARITY_LABELS[selectedItem.rarity]}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#667eea',
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 'bold',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>
                {CATEGORY_ICONS[selectedItem.category]} {CATEGORY_LABELS[selectedItem.category]}
              </div>
            </div>
            
            {unlockedItems.has(selectedItem.id) ? (
              <div style={{
                background: `${selectedItem.color}20`,
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                border: `2px solid ${selectedItem.color}40`
              }}>
                <div style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  color: selectedItem.color,
                  marginBottom: 8
                }}>
                  ✅ Du besitzt diesen Schatz bereits!
                </div>
                {selectedItem.unlockDate && (
                  <div style={{ fontSize: 14, color: '#666' }}>
                    Freigeschaltet am {new Date(selectedItem.unlockDate).toLocaleDateString('de-DE')}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: '#fff3cd',
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                border: '2px solid #ffd700'
              }}>
                <div style={{ 
                  fontSize: 20, 
                  fontWeight: 'bold', 
                  color: '#ffd700',
                  marginBottom: 8
                }}>
                  🐭 {selectedItem.mausiPointsCost.toLocaleString()} Mausi-Punkte
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>
                  Dein Kontostand: {mausiPoints.toLocaleString()} Punkte
                </div>
                {mausiPoints < selectedItem.mausiPointsCost && (
                  <div style={{ 
                    fontSize: 14, 
                    color: '#dc3545',
                    marginTop: 8,
                    fontWeight: 'bold'
                  }}>
                    ❌ Du brauchst noch {selectedItem.mausiPointsCost - mausiPoints} Punkte mehr!
                  </div>
                )}
              </div>
            )}
            
            <div style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setShowPurchaseModal(false);
                  setSelectedItem(null);
                }}
                style={{
                  background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 16,
                  padding: '14px 28px',
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Schließen
              </button>
              
              {!unlockedItems.has(selectedItem.id) && (
                <button
                  onClick={() => handlePurchase(selectedItem)}
                  disabled={mausiPoints < selectedItem.mausiPointsCost || purchaseLoading}
                  style={{
                    background: mausiPoints >= selectedItem.mausiPointsCost && !purchaseLoading
                      ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                      : '#f8f9fa',
                    color: mausiPoints >= selectedItem.mausiPointsCost && !purchaseLoading ? '#fff' : '#999',
                    border: 'none',
                    borderRadius: 16,
                    padding: '14px 28px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    cursor: mausiPoints >= selectedItem.mausiPointsCost && !purchaseLoading ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {purchaseLoading ? '🔄 Kaufen...' : 'Kaufen'}
                </button>
              )}
            </div>
          </div>
      </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes purchaseSuccess {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
};
