import React, { useState, useMemo } from 'react';
import { useAchievements } from './AchievementManager';

export const AchievementsPage: React.FC = () => {
  const { achievements, getUnlockedCount, getTotalCount } = useAchievements();
  const [selectedRarity, setSelectedRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unlocked' | 'locked'>('all');

  const unlockedCount = getUnlockedCount();
  const totalCount = getTotalCount();
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  console.log('🏆 AchievementsPage - Raw achievements:', achievements);
  console.log('📊 AchievementsPage - Unlocked count:', unlockedCount);
  console.log('📊 AchievementsPage - Total count:', totalCount);
  console.log('📊 AchievementsPage - Completion percentage:', completionPercentage);

  const filteredAchievements = useMemo(() => {
    const filtered = achievements.filter(achievement => {
      const matchesRarity = selectedRarity === 'all' || achievement.rarity === selectedRarity;
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'unlocked' && achievement.unlocked) ||
        (selectedStatus === 'locked' && !achievement.unlocked);
      return matchesRarity && matchesStatus;
    });
    // Sort by rarity: common > rare > epic > legendary
    const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
    return filtered.sort((a, b) => {
      const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      if (a.unlocked !== b.unlocked) return b.unlocked ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [achievements, selectedRarity, selectedStatus]);

  const rarityStats = useMemo(() => {
    const stats = { common: 0, rare: 0, epic: 0, legendary: 0 };
    achievements.forEach(achievement => {
      if (achievement.unlocked) {
        stats[achievement.rarity]++;
      }
    });
    return stats;
  }, [achievements]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#a0a0a0';
      case 'rare': return '#4a90e2';
      case 'epic': return '#9b59b6';
      case 'legendary': return '#f39c12';
      default: return '#a0a0a0';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Gewöhnlich';
      case 'rare': return 'Selten';
      case 'epic': return 'Episch';
      case 'legendary': return 'Legendär';
      default: return 'Gewöhnlich';
    }
  };

  return (
    <div style={{
      padding: '20px 16px',
      maxWidth: 1200,
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffe6f2 0%, #fff0f6 50%, #f8e6ff 100%)'
    }}>
      {/* Header Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: 32,
        padding: '32px 20px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 24,
        border: '2px solid rgba(255, 105, 180, 0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          🏆
        </div>
        <h1 style={{ color: '#ffd700', margin: '0 0 12px 0', fontSize: 36, fontWeight: 'bold', textShadow: '0 2px 4px rgba(255, 215, 0, 0.3)' }}>
          Achievements
        </h1>
        <p style={{ color: '#666', margin: '0 0 24px 0', fontSize: 18, lineHeight: 1.6 }}>
          Deine Erfolge & Meilensteine - Sammle sie alle! ✨
        </p>
        {/* Progress Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
          <div style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', borderRadius: 16, padding: 20, border: '2px solid #ffd700', boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🎯</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#8b4513' }}>
              {unlockedCount} / {totalCount}
            </div>
            <div style={{ fontSize: 14, color: '#8b4513' }}>Freigeschaltet</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)', borderRadius: 16, padding: 20, border: '2px solid #ff69b4', boxShadow: '0 4px 12px rgba(255, 105, 180, 0.2)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>
              {completionPercentage}%
            </div>
            <div style={{ fontSize: 14, color: '#fff' }}>Abgeschlossen</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #4a90e2 0%, #87ceeb 100%)', borderRadius: 16, padding: 20, border: '2px solid #4a90e2', boxShadow: '0 4px 12px rgba(74, 144, 226, 0.2)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⭐</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>
              {rarityStats.legendary}
            </div>
            <div style={{ fontSize: 14, color: '#fff' }}>Legendär</div>
          </div>
        </div>
        {/* Progress Bar */}
        <div style={{ background: 'rgba(255, 255, 255, 0.8)', borderRadius: 12, padding: 16, border: '2px solid rgba(255, 105, 180, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 'bold', color: '#ff69b4' }}>
              Gesamtfortschritt
            </span>
            <span style={{ fontSize: 16, fontWeight: 'bold', color: '#ff69b4' }}>
              {completionPercentage}%
            </span>
          </div>
          <div style={{ width: '100%', height: 16, background: '#f0f0f0', borderRadius: 8, overflow: 'hidden', border: '2px solid rgba(255, 105, 180, 0.2)' }}>
            <div style={{ width: `${completionPercentage}%`, height: '100%', background: 'linear-gradient(90deg, #ff69b4 0%, #ff8da1 100%)', transition: 'width 1s ease-in-out', boxShadow: '0 2px 8px rgba(255, 105, 180, 0.3)' }} />
          </div>
        </div>
      </div>
      {/* Filters Section */}
      <div style={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: 20, padding: 24, marginBottom: 24, border: '2px solid rgba(255, 105, 180, 0.2)', backdropFilter: 'blur(10px)' }}>
        <h3 style={{ color: '#ff69b4', margin: '0 0 16px 0', fontSize: 20, fontWeight: 'bold' }}>
          🔍 Filter
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          {/* Rarity Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 'bold', color: '#666' }}>
              Seltenheit
            </label>
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value as any)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #ffb6c1', fontSize: 14, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">Alle Seltenheiten</option>
              <option value="common">Gewöhnlich</option>
              <option value="rare">Selten</option>
              <option value="epic">Episch</option>
              <option value="legendary">Legendär</option>
            </select>
          </div>
          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 'bold', color: '#666' }}>
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #ffb6c1', fontSize: 14, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">Alle</option>
              <option value="unlocked">Freigeschaltet</option>
              <option value="locked">Gesperrt</option>
            </select>
          </div>
        </div>
        {/* Results Count */}
        <div style={{ fontSize: 14, color: '#666', textAlign: 'center', padding: '8px 16px', background: 'rgba(255, 182, 193, 0.1)', borderRadius: 8, border: '1px solid rgba(255, 182, 193, 0.3)' }}>
          {filteredAchievements.length} von {achievements.length} Achievements angezeigt
        </div>
      </div>
      {/* Achievements Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20,
        marginTop: 12,
        marginBottom: 32
      }}>
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.name}
            style={{
              background: achievement.unlocked
                ? `linear-gradient(135deg, ${getRarityColor(achievement.rarity)}15 0%, ${getRarityColor(achievement.rarity)}25 100%)`
                : 'rgba(255, 255, 255, 0.95)',
              border: `2.5px solid ${achievement.unlocked ? getRarityColor(achievement.rarity) : '#e0e0e0'}`,
              borderRadius: 18,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              minHeight: 180,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: achievement.unlocked
                ? `0 4px 16px ${getRarityColor(achievement.rarity)}30`
                : '0 2px 8px rgba(0,0,0,0.07)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: achievement.unlocked ? 1 : 0.7
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
              e.currentTarget.style.boxShadow = `0 8px 32px ${getRarityColor(achievement.rarity)}40`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = achievement.unlocked
                ? `0 4px 16px ${getRarityColor(achievement.rarity)}30`
                : '0 2px 8px rgba(0,0,0,0.07)';
            }}
          >
            {/* Rarity Badge */}
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: getRarityColor(achievement.rarity),
              color: '#fff',
              padding: '3px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 'bold',
              letterSpacing: 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>{getRarityLabel(achievement.rarity)}</div>

            {/* Name */}
            <h3 style={{
              color: achievement.unlocked ? getRarityColor(achievement.rarity) : '#bbb',
              margin: '0 0 8px 0',
              fontSize: 17,
              fontWeight: 'bold',
              lineHeight: 1.2
            }}>{achievement.name}</h3>

            {/* Description */}
            <p style={{
              margin: '0 0 10px 0',
              color: achievement.unlocked ? '#666' : '#aaa',
              fontSize: 13,
              lineHeight: 1.4
            }}>{achievement.description}</p>

            {/* Reward Points */}
            <div style={{
              background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
              borderRadius: 10,
              padding: '7px 14px',
              marginTop: 8,
              border: '1.5px solid #ffd700',
              fontSize: 13,
              color: '#8b4513',
              fontWeight: 'bold',
              boxShadow: '0 1px 4px rgba(255, 215, 0, 0.13)'
            }}>
              🐭 {achievement.reward_points} Punkte
            </div>

            {/* Unlock Date */}
            {achievement.unlocked && achievement.unlocked_at && (
              <div style={{
                marginTop: 10,
                padding: '6px 12px',
                background: `${getRarityColor(achievement.rarity)}20`,
                borderRadius: 8,
                textAlign: 'center',
                fontSize: 11,
                color: getRarityColor(achievement.rarity),
                fontWeight: 'bold',
                border: `1px solid ${getRarityColor(achievement.rarity)}40`
              }}>
                🎉 Freigeschaltet am {new Date(achievement.unlocked_at).toLocaleDateString('de-DE')}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255, 255, 255, 0.9)', borderRadius: 24, border: '2px solid rgba(255, 105, 180, 0.2)' }}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.5 }}>🔍</div>
          <h3 style={{ color: '#666', margin: '0 0 12px 0', fontSize: 20 }}>
            Keine Achievements gefunden
          </h3>
          <p style={{ color: '#999', margin: 0, fontSize: 16 }}>
            Versuche andere Filter-Einstellungen.
          </p>
        </div>
      )}
    </div>
  );
}; 