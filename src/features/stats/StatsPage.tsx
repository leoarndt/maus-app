import React from 'react';
import { useAchievements } from '../achievements/AchievementManager';
import { useAuth } from '../auth/AuthGate';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import { getCountdowns, getUnlockedShopItems, getHamstiClicks } from '../../lib/supabase';

export const StatsPage: React.FC = () => {
  const { achievements, getUnlockedCount, getUserPoints } = useAchievements();
  const unlocked = achievements.filter(a => a.unlocked);
  const totalPoints = getUserPoints();

  const { userData } = useAuth();
  const [moodCount, setMoodCount] = useState(0);
  const [moodStreak, setMoodStreak] = useState(0);
  const [raetselStreak, setRaetselStreak] = useState(0);
  const [messagesRead, setMessagesRead] = useState(0);
  const [sidequestsSolved, setSidequestsSolved] = useState(0);
  const [hamstiClicks, setHamstiClicks] = useState(0);
  const [countdowns, setCountdowns] = useState<any[]>([]);
  const [nextCountdown, setNextCountdown] = useState<any | null>(null);
  const [shopItems, setShopItems] = useState(0);

  useEffect(() => {
    if (!userData?.user_id) return;
    const today = new Date().toISOString().split('T')[0];
    
    // Mood-Streak direkt aus der Datenbank laden
    supabase
      .from('users')
      .select('mood_streak')
      .eq('user_id', userData.user_id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setMoodStreak(data.mood_streak || 0);
        }
      });
    
    // Rätsel-Streak direkt aus der Datenbank laden
    supabase
      .from('users')
      .select('raetsel_streak')
      .eq('user_id', userData.user_id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setRaetselStreak(data.raetsel_streak || 0);
        }
      });
    
    // Mood-Entries laden (nur noch für Gesamtanzahl)
    supabase
      .from('user_mood_entries')
      .select('date', { count: 'exact', head: false })
      .eq('user_id', userData.user_id)
      .then(({ data, error, count }) => {
        if (error || !data) {
          setMoodCount(0);
          return;
        }
        setMoodCount(count || data.length);
      });
    // Nachrichten gelesen
    supabase
      .from('user_daily_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user_id)
      .eq('status', 'read')
      .then(({ count }) => setMessagesRead(count || 0));
    // Sidequests gelöst
    supabase
      .from('user_quests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user_id)
      .eq('status', 'solved')
      .then(({ count }) => setSidequestsSolved(count || 0));
    // Hamsti-Klicks
    getHamstiClicks(userData.user_id).then(setHamstiClicks);
    // Countdowns
    getCountdowns(userData.user_id).then((cds) => {
      setCountdowns(cds);
      // Nächster Countdown
      const now = new Date().getTime();
      const next = cds
        .map((c: any) => ({ ...c, targetDate: new Date(c.target_date) }))
        .filter((c: any) => c.targetDate.getTime() > now)
        .sort((a: any, b: any) => a.targetDate.getTime() - b.targetDate.getTime())[0];
      setNextCountdown(next || null);
    });
    // Shop-Items
    getUnlockedShopItems(userData.user_id).then((items) => setShopItems(items.length));
  }, [userData]);

  return (
    <div style={{
      padding: '32px 16px',
      maxWidth: 600,
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffe6f2 0%, #fff0f6 50%, #f8e6ff 100%)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <h1 style={{ color: '#ff69b4', fontSize: 28, fontWeight: 'bold', margin: 0 }}>
          Deine Achievements & Stats
        </h1>
        <p style={{ color: '#666', fontSize: 16, margin: '8px 0 0 0' }}>
          Überblick über alle Aktivitäten, Punkte und Stimmungs-Statistiken
        </p>
      </div>
      {/* Mausi-Punkte Stats */}
      <div style={statBoxStyle('#ffd700')}>
        <h2 style={statTitleStyle('#ffd700')}>Mausi-Punkte</h2>
        <div style={{ fontSize: 32, color: '#b8860b', fontWeight: 'bold', marginBottom: 8 }}>
          🐭 {totalPoints}
        </div>
        <div style={{ color: '#b8860b', fontSize: 16 }}>Gesammelte Mausi-Punkte </div>
      </div>
      {/* Login-Streak Stats */}
      <div style={statBoxStyle('#ff69b4')}>
        <h2 style={statTitleStyle('#ff69b4')}>Login-Streak</h2>
        <div style={statValueStyle()}><span style={statHighlightStyle('#ff69b4')}>{userData?.login_streak || 0}</span> Tage in Folge eingeloggt</div>
        {userData?.last_login_date && (
          <div style={statValueStyle()}>
            <span style={statHighlightStyle('#ff69b4')}>Letzter Login: </span>
            {new Date(userData.last_login_date).toLocaleDateString('de-DE')}
          </div>
        )}
      </div>
      {/* Achievements Stats */}
      <div style={statBoxStyle('#ffb6c1')}>
        <h2 style={statTitleStyle('#ffb6c1')}>Achievements</h2>
        <div style={statValueStyle()}>
          <span style={statHighlightStyle('#ff69b4')}>{unlocked.length}</span> / <span style={statHighlightStyle('#ff69b4')}>{achievements.length}</span> freigeschaltet
        </div>
        <div style={{ margin: '16px 0 0 0' }}>
          <div style={{ width: '100%', height: 16, background: '#f0f0f0', borderRadius: 8, overflow: 'hidden', border: '2px solid #ffb6c1', marginBottom: 4 }}>
            <div style={{ width: `${achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0}%`, height: '100%', background: 'linear-gradient(90deg, #ffb6c1 0%, #ffd1dc 100%)', transition: 'width 1s', boxShadow: '0 2px 8px rgba(255, 182, 193, 0.3)' }} />
          </div>
          <div style={{ fontSize: 14, color: '#ff69b4', fontWeight: 'bold' }}>{achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0}% abgeschlossen</div>
        </div>
      </div>
      {/* Sidequest Stats */}
      <div style={statBoxStyle('#87ceeb')}>
        <h2 style={statTitleStyle('#87ceeb')}>Sidequests</h2>
        <div style={statValueStyle()}><span style={statHighlightStyle('#ff69b4')}>{sidequestsSolved}</span> Sidequests gelöst</div>
        <div style={statValueStyle()}><span style={statHighlightStyle('#ff69b4')}>{raetselStreak}</span> Tage Quest-Streak</div>
      </div>
      {/* Mood Stats */}
      <div style={statBoxStyle('#98fb98')}>
        <h2 style={statTitleStyle('#98fb98')}>Mood-Statistiken</h2>
        <div style={statValueStyle()}><span style={statHighlightStyle('#ff69b4')}>{moodStreak}</span> Tage Mood-Streak</div>
        <div style={statValueStyle()}><span style={statHighlightStyle('#ff69b4')}>{moodCount}</span> getrackte Stimmungen insgesamt</div>
      </div>
      {/* Nachrichten Stats */}
      <div style={statBoxStyle('#ffb6c1')}>
        <h2 style={statTitleStyle('#ffb6c1')}>Nachrichten</h2>
        <div style={statValueStyle()}><span style={statHighlightStyle('#ff69b4')}>{messagesRead}</span> Nachrichten gelesen</div>
      </div>
      {/* Shop Stats */}
      <div style={statBoxStyle('#98fb98')}>
        <h2 style={statTitleStyle('#98fb98')}>Shop</h2>
        <div style={statValueStyle()}><span style={statHighlightStyle('#ff69b4')}>{shopItems}</span> gekaufte Schätze</div>
      </div>
      {/* Hamsti Stats */}
      <div style={statBoxStyle('#ffb347')}>
        <h2 style={statTitleStyle('#ffb347')}>Hamsti-Klicker</h2>
        <div style={statValueStyle()}><span style={statHighlightStyle('#ff69b4')}>{hamstiClicks}</span> Hamsti-Klicks insgesamt</div>
      </div>
      {/* Countdown Stats */}
      <div style={statBoxStyle('#ffd700')}>
        <h2 style={statTitleStyle('#ffd700')}>Countdowns</h2>
        <div style={statValueStyle()}><span style={statHighlightStyle('#ff69b4')}>{countdowns.length}</span> aktive Countdowns</div>
        {nextCountdown && (
          <div style={statValueStyle()}>
            <span style={statHighlightStyle('#ff69b4')}>Nächster: </span>
            {nextCountdown.title} – noch {getCountdownString(nextCountdown.targetDate)}
          </div>
        )}
      </div>
    </div>
  );
};

// Hilfsfunktionen für Styles und Countdown-String
function statBoxStyle(color: string) {
  return {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    margin: '32px 0 0 0',
    border: `2px solid ${color}`,
    textAlign: 'center' as const,
    boxShadow: `0 8px 32px ${color}20`
  };
}
function statTitleStyle(color: string) {
  return { color, fontSize: 22, fontWeight: 'bold', margin: '0 0 12px 0' };
}
function statValueStyle() {
  return { fontSize: 18, color: '#333', marginBottom: 8 };
}
function statHighlightStyle(color: string) {
  return { fontWeight: 'bold', color };
}
function getCountdownString(targetDate: Date) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return 'abgelaufen';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days} Tage, ${hours} Stunden`;
} 