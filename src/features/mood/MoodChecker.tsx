import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthGate';
import { saveMoodEntry, getMoodEntryForDate } from '../../lib/supabase';
import { useAchievements, checkAndUnlockAchievements } from '../achievements/AchievementManager';

const MOODS = [
  { emoji: '😊', label: 'Glücklich', color: '#ffd700' },
  { emoji: '😌', label: 'Entspannt', color: '#98fb98' },
  { emoji: '😐', label: 'Neutral', color: '#87ceeb' },
  { emoji: '😔', label: 'Traurig', color: '#dda0dd' },
  { emoji: '😤', label: 'Gestresst', color: '#ffb347' },
  { emoji: '😡', label: 'Wütend', color: '#ff69b4' }
];

export const MoodChecker: React.FC = () => {
  const { userData } = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [hasTrackedToday, setHasTrackedToday] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [currentMoodStreak, setCurrentMoodStreak] = useState(0);
  const { unlockAchievement, achievements } = useAchievements();

  useEffect(() => {
    if (!userData?.user_id) return;
    const today = new Date().toISOString().split('T')[0];
    // Mood für heute laden
    getMoodEntryForDate(userData.user_id, today).then(entry => {
      if (entry) {
        setHasTrackedToday(true);
        setTodayMood(Number(entry.mood));
        setNote(entry.note || '');
      } else {
        setHasTrackedToday(false);
        setTodayMood(null);
        setNote('');
      }
    });
    // Mood-Streak laden
    loadMoodStreak(userData.user_id, today);
  }, [userData]);

  const loadMoodStreak = async (user_id: string, today: string) => {
    // Hole alle Mood-Entries des Users, sortiert nach Datum absteigend
    const { data, error } = await (await import('../../lib/supabase')).supabase
      .from('user_mood_entries')
      .select('date')
      .eq('user_id', user_id)
      .order('date', { ascending: false });
    if (error || !data) {
      setCurrentMoodStreak(0);
      return;
    }
    // Berechne Streak: wie viele Tage in Folge (inkl. heute) gibt es einen Eintrag?
    let streak = 0;
    let date = new Date(today);
    for (let i = 0; i < data.length; i++) {
      const entryDate = new Date(data[i].date);
      if (date.toISOString().split('T')[0] === entryDate.toISOString().split('T')[0]) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }
    setCurrentMoodStreak(streak);
  };

  const handleMoodSelect = (moodIndex: number) => {
    if (!hasTrackedToday) {
      setSelectedMood(moodIndex);
    }
  };

  const handleSubmit = async () => {
    if (selectedMood !== null && !hasTrackedToday && userData?.user_id) {
      const today = new Date().toISOString().split('T')[0];
      const success = await saveMoodEntry(userData.user_id, today, selectedMood.toString(), note);
      if (success) {
        setHasTrackedToday(true);
        setTodayMood(selectedMood);
        setShowSuccess(true);
        loadMoodStreak(userData.user_id, today);
        
        // Mood-Streak in users Tabelle aktualisieren
        await updateMoodStreakInDatabase(userData.user_id, today);
        
        // Mood-Achievements prüfen
        // Gesamtzahl Mood-Entries laden
        const { count } = await (await import('../../lib/supabase')).supabase
          .from('user_mood_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userData.user_id);
        const moodCount = typeof count === 'number' ? count : 0;
        
        // Universelle Achievement-Prüfung verwenden
        checkAndUnlockAchievements('mood', moodCount, unlockAchievement, achievements);
        
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }
  };

  // Neue Funktion: Mood-Streak in users Tabelle aktualisieren
  const updateMoodStreakInDatabase = async (user_id: string, today: string) => {
    try {
      // Hole alle Mood-Entries des Users, sortiert nach Datum absteigend
      const { data, error } = await (await import('../../lib/supabase')).supabase
        .from('user_mood_entries')
        .select('date')
        .eq('user_id', user_id)
        .order('date', { ascending: false });
      
      if (error || !data) return;
      
      // Berechne Streak: wie viele Tage in Folge (inkl. heute) gibt es einen Eintrag?
      let streak = 0;
      let date = new Date(today);
      for (let i = 0; i < data.length; i++) {
        const entryDate = new Date(data[i].date);
        if (date.toISOString().split('T')[0] === entryDate.toISOString().split('T')[0]) {
          streak++;
          date.setDate(date.getDate() - 1);
        } else {
          break;
        }
      }
      
      // Streak in users Tabelle aktualisieren
      await (await import('../../lib/supabase')).supabase
        .from('users')
        .update({ mood_streak: streak })
        .eq('user_id', user_id);
        
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Mood-Streak:', error);
    }
  };

  const handleReset = async () => {
    if (!userData?.user_id) return;
    const today = new Date().toISOString().split('T')[0];
    // Lösche den Mood-Entry für heute
    await (await import('../../lib/supabase')).supabase
      .from('user_mood_entries')
      .delete()
      .eq('user_id', userData.user_id)
      .eq('date', today);
    setSelectedMood(null);
    setHasTrackedToday(false);
    setTodayMood(null);
    setNote('');
    loadMoodStreak(userData.user_id, today);
    
    // Mood-Streak in users Tabelle aktualisieren (nach dem Löschen)
    await updateMoodStreakInDatabase(userData.user_id, today);
  };

  if (showSuccess) {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(135deg, #98fb98 0%, #90ee90 100%)',
        borderRadius: 20,
        padding: 32,
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(152, 251, 152, 0.3)',
        zIndex: 1000,
        animation: 'bounce 0.6s ease-in-out'
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>😊</div>
        <h2 style={{ color: '#333', margin: '0 0 8px 0', fontSize: 24 }}>
          Stimmung gespeichert!
        </h2>
        <p style={{ color: '#666', margin: 0, fontSize: 16 }}>
          Du hast deine Stimmung {currentMoodStreak} Tage in Folge getrackt! 📊
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px 16px',
      maxWidth: 600,
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
        <div style={{ fontSize: 48, marginBottom: 16 }}>😊</div>
        <h1 style={{ 
          color: '#ff69b4', 
          margin: '0 0 8px 0', 
          fontSize: 28, 
          fontWeight: 'bold'
        }}>
          Wie fühlst du dich heute?
        </h1>
        <p style={{ 
          color: '#666', 
          margin: '0 0 16px 0', 
          fontSize: 16,
          lineHeight: 1.5
        }}>
          {hasTrackedToday ? 'Du hast deine Stimmung bereits getrackt!' : 'Wähle deine aktuelle Stimmung aus'}
        </p>
        
        {/* Progress */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
          border: '2px solid #ffb6c1'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <span style={{ 
              color: '#ff69b4',
              fontWeight: 'bold',
              fontSize: 16
            }}>
              Stimmung getrackt
            </span>
            <span style={{ 
              color: '#666',
              fontSize: 14
            }}>
              {currentMoodStreak} Tage in Folge
            </span>
          </div>
          <div style={{
            width: '100%',
            height: 8,
            background: '#f0f0f0',
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min((currentMoodStreak / 7) * 100, 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ff69b4 0%, #ff8da1 100%)',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Nächstes Achievement bei 7 Tagen in Folge
          </div>
        </div>
      </div>

      {/* Today's Mood Display */}
      {hasTrackedToday && todayMood !== null && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 20,
          padding: 24,
          marginBottom: 24,
          border: '2px solid #98fb98',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#333', margin: '0 0 16px 0', fontSize: 18 }}>
            Deine Stimmung heute:
          </h3>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {MOODS[todayMood].emoji}
          </div>
          <div style={{ 
            color: MOODS[todayMood].color,
            fontWeight: 'bold',
            fontSize: 16,
            marginBottom: 16
          }}>
            {MOODS[todayMood].label}
          </div>
          {note && (
            <div style={{
              background: `${MOODS[todayMood].color}15`,
              borderRadius: 12,
              padding: 12,
              fontSize: 14,
              color: '#666',
              fontStyle: 'italic'
            }}>
              "{note}"
            </div>
          )}
        </div>
      )}

      {/* Mood Selection */}
      {!hasTrackedToday && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 24,
          padding: 32,
          marginBottom: 24,
          border: '2px solid #ffb6c1',
          boxShadow: '0 8px 32px rgba(255, 182, 193, 0.2)'
        }}>
          <h2 style={{
            color: '#333',
            margin: '0 0 24px 0',
            fontSize: 20,
            textAlign: 'center'
          }}>
            Wähle deine Stimmung
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 16,
            marginBottom: 32
          }}>
            {MOODS.map((mood, index) => (
              <div
                key={index}
                onClick={() => handleMoodSelect(index)}
                style={{
                  background: selectedMood === index 
                    ? `linear-gradient(135deg, ${mood.color}15 0%, ${mood.color}25 100%)`
                    : 'rgba(255, 255, 255, 0.8)',
                  border: `2px solid ${selectedMood === index ? mood.color : '#ffb6c1'}`,
                  borderRadius: 16,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 8px 25px ${mood.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>
                  {mood.emoji}
                </div>
                <div style={{
                  color: selectedMood === index ? mood.color : '#333',
                  fontWeight: 'bold',
                  fontSize: 14
                }}>
                  {mood.label}
                </div>
              </div>
            ))}
          </div>

          {/* Note Input */}
          <div style={{ marginBottom: 32 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              color: '#ff69b4',
              fontWeight: 'bold',
              fontSize: 16
            }}>
              Möchtest du noch etwas hinzufügen? (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Wie war dein Tag? Was beschäftigt dich?"
              style={{
                width: '100%',
                minHeight: 80,
                padding: 16,
                borderRadius: 16,
                border: '2px solid #ffb6c1',
                fontSize: 16,
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.9)'
              }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={selectedMood === null}
              style={{
                background: selectedMood !== null 
                  ? 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)'
                  : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: 16,
                padding: '16px 32px',
                fontSize: 18,
                fontWeight: 'bold',
                cursor: selectedMood !== null ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                opacity: selectedMood !== null ? 1 : 0.6
              }}
            >
              Stimmung speichern 💾
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {hasTrackedToday && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleReset}
            style={{
              background: 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '16px 32px',
              fontSize: 18,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Stimmung ändern 🔄
          </button>
        </div>
      )}
    </div>
  );
}; 