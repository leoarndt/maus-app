import React, { useState, useEffect } from 'react';
import { supabase, setUserPoints } from '../../lib/supabase';
import { useAuth } from '../auth/AuthGate';
import { AchievementPopup } from '../achievements/AchievementPopup';
import { checkAndUnlockAchievements } from '../achievements/AchievementManager';
import { useAchievements } from '../achievements/AchievementManager';

export const Sidequests: React.FC = () => {
  const [sidequest, setSidequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [simDayOffset, setSimDayOffset] = useState(0);
  const { userData } = useAuth();
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [mcResult, setMcResult] = useState<null | 'correct' | 'wrong'>(null);
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const { achievements, unlockAchievement } = useAchievements();

  async function getOrAssignTodaysSidequest(): Promise<any | null> {
    if (!userData?.user_id) return null;
    const today = new Date().toISOString().split('T')[0];
    const { data: todayQuests } = await supabase
      .from('user_quests')
      .select('quest_id, status')
      .eq('user_id', userData.user_id)
      .eq('solved_at', today)
      .in('status', ['assigned', 'solved'])
      .order('id', { ascending: false })
      .limit(1);
    let questId = null;
    if (todayQuests && todayQuests.length > 0) {
      questId = todayQuests[0].quest_id;
    }
    let allQuests: any[] = await fetchAllQuests();
    if (!allQuests || allQuests.length === 0) return null;
    let quest: any = null;
    if (questId) {
      quest = allQuests.find(q => q.id === questId);
    } else {
      const idx = Math.floor(Math.random() * allQuests.length);
      quest = allQuests[idx];
      try {
        await supabase.from('user_quests').insert({
          user_id: userData.user_id,
          quest_id: quest.id,
          status: 'assigned',
          solved_at: today
        });
      } catch (e) {
        const { data: retry } = await supabase
          .from('user_quests')
          .select('quest_id')
          .eq('user_id', userData.user_id)
          .eq('solved_at', today)
          .eq('status', 'assigned')
          .order('id', { ascending: false })
          .limit(1);
        if (retry && retry.length > 0) {
          quest = allQuests.find(q => q.id === retry[0].quest_id);
        }
      }
    }
    return quest;
  }

  async function fetchSidequest(dayOffset = 0) {
    setLoading(true);
    setError(null);
    let quest: any = null;
    if (dayOffset === 0) {
      quest = await getOrAssignTodaysSidequest();
    } else {
      quest = await getDailySidequestWithOffset(dayOffset);
    }
    if (!quest) {
      setError('Keine Sidequest gefunden.');
    }
    setSidequest(quest);
    setLoading(false);
  }

  async function getDailySidequestWithOffset(offset: number): Promise<any | null> {
    const allQuests = await fetchAllQuests();
    if (!allQuests || allQuests.length === 0) return null;
    // IDs sortieren und nach Tag auswählen
    const sortedIds = allQuests.map(q => q.id).sort((a, b) => a - b);
    const today = new Date();
    today.setDate(today.getDate() + offset);
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = dayOfYear % sortedIds.length;
    const questId = sortedIds[index];
    return allQuests.find(q => q.id === questId) || allQuests[0];
  }

  async function fetchAllQuests() {
    const { data, error } = await supabase
      .from('quests')
      .select('*');
    if (error) return [];
    return data;
  }

  useEffect(() => {
    fetchSidequest(simDayOffset);
    // eslint-disable-next-line
  }, [simDayOffset]);

  useEffect(() => {
    supabase.from('quests').select('*').eq('id', 27).then(({ data, error }) => {
      console.log('Test-Query Quest 27:', data, error);
    });
  }, []);

  // Prüfe, ob die aktuelle Sidequest für den User heute schon erledigt wurde
  useEffect(() => {
    async function checkIfSolved() {
      if (!userData?.user_id || !sidequest?.id) return;
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('user_quests')
        .select('status, solved_at')
        .eq('user_id', userData.user_id)
        .eq('quest_id', sidequest.id)
        .eq('status', 'solved')
        .order('solved_at', { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        const solvedAt = data[0].solved_at;
        if (solvedAt && solvedAt.startsWith(today)) {
          setConfirmed(true);
        }
      }
    }
    checkIfSolved();
    // eslint-disable-next-line
  }, [sidequest, userData]);

  const handleSolveQuest = async () => {
    setConfirmed(true);
    if (sidequest.type === 'mc' && selectedOption !== null && parsedSolution !== null) {
      if (selectedOption === parsedSolution) {
        setMcResult('correct');
      } else {
        setMcResult('wrong');
      }
    }
    if (userData && sidequest?.id) {
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('user_quests')
        .update({ status: 'solved', solved_at: today })
        .eq('user_id', userData.user_id)
        .eq('quest_id', sidequest.id)
        .eq('solved_at', today)
        .eq('status', 'assigned');
      // Punktevergabe
      console.log('🎯 Sidequest data:', sidequest);
      console.log('💰 Reward points from quest:', sidequest.reward_points);
      const rewardPoints = sidequest.reward_points || 0;
      console.log('💎 Final reward points:', rewardPoints);
      if (rewardPoints > 0) {
        // Aktuelle Punkte holen
        const { data: userDb, error } = await supabase
          .from('users')
          .select('points')
          .eq('user_id', userData.user_id)
          .single();
        if (!error && userDb) {
          const newPoints = (userDb.points || 0) + rewardPoints;
          await setUserPoints(userData.user_id, newPoints, async () => {
            // Nach dem Setzen: Punkte aus der DB zählen
            const { data: pointsDb } = await supabase
              .from('users')
              .select('points')
              .eq('user_id', userData.user_id)
              .single();
            const totalPoints = pointsDb?.points || 0;
            // Achievements prüfen und ggf. vergeben
            checkAndUnlockAchievements('points', totalPoints, unlockAchievement, achievements);
          });
          setPointsAwarded(rewardPoints);
          setShowPointsPopup(true);
        }
      }
      // Nach dem Lösen: Anzahl gelöster Sidequests aus der DB zählen
      const { count } = await supabase
        .from('user_quests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.user_id)
        .eq('status', 'solved');
      const total = count || 0;
      // Achievements prüfen und ggf. vergeben
      checkAndUnlockAchievements('puzzle', total, unlockAchievement, achievements);
      
      // Rätsel-Streak in users Tabelle aktualisieren
      await updateRaetselStreakInDatabase(userData.user_id, today);
    }
  };

  // Neue Funktion: Rätsel-Streak in users Tabelle aktualisieren
  const updateRaetselStreakInDatabase = async (user_id: string, today: string) => {
    try {
      // Hole alle gelösten Quests des Users, sortiert nach solved_at absteigend
      const { data, error } = await supabase
        .from('user_quests')
        .select('solved_at')
        .eq('user_id', user_id)
        .eq('status', 'solved')
        .not('solved_at', 'is', null)
        .order('solved_at', { ascending: false });
      
      if (error || !data) return;
      
      // Berechne Streak: wie viele Tage in Folge (inkl. heute) gibt es eine gelöste Quest?
      let streak = 0;
      let currentDate = new Date(today);
      
      // Erstelle eine Map der gelösten Daten für schnellen Zugriff
      const solvedDates = new Set(data.map(item => item.solved_at.split('T')[0]));
      
      // Prüfe aufeinanderfolgende Tage, beginnend mit heute
      while (solvedDates.has(currentDate.toISOString().split('T')[0])) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
      
      console.log(`🎯 Rätsel-Streak berechnet: ${streak} Tage für User ${user_id}`);
      console.log(`📅 Gelöste Daten:`, Array.from(solvedDates));
      
      // Streak in users Tabelle aktualisieren
      await supabase
        .from('users')
        .update({ raetsel_streak: streak })
        .eq('user_id', user_id);
        
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Rätsel-Streak:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', fontSize: 24, color: '#ff69b4'
      }}>
        Sidequest wird geladen...
      </div>
    );
  }
  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>;
  }
  if (!sidequest) {
    return (
      <div style={{ color: '#888', textAlign: 'center', marginTop: 60, fontSize: 22 }}>
        Keine Sidequest gefunden.<br />
        Versuche es später erneut!
      </div>
    );
  }

  // Hilfsfunktion zum Parsen von options und solution
  function parseOptions(raw: any): string[] | null {
    if (!raw) return null;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        // Versuche JSON.parse, falls es ein JSON-Array ist
        if (raw.trim().startsWith('[')) return JSON.parse(raw);
        // Fallback: Split bei Komma, entferne Klammern und Anführungszeichen
        return raw.replace(/\[|\]|'/g, '').split(',').map(s => s.trim());
      } catch {
        return raw.split(',').map(s => s.trim());
      }
    }
    return null;
  }
  function parseSolution(raw: any): number | null {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') {
      const num = parseInt(raw);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  // Geparste Werte für die aktuelle Sidequest
  const parsedOptions = sidequest.type === 'mc' ? parseOptions(sidequest.options) : null;
  const parsedSolution = sidequest.type === 'mc' ? parseSolution(sidequest.solution) : null;

  return (
    <div style={{
      position: 'relative',
      padding: '32px 16px',
      maxWidth: 600,
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
      borderRadius: 24,
      boxShadow: '0 8px 32px rgba(255, 105, 180, 0.08)'
    }}>
      {/* Simulations-Button nur auf großen Bildschirmen */}
      <button
        onClick={() => setSimDayOffset((o) => o + 1)}
        style={{
          position: 'fixed',
          top: 32,
          right: 32,
          zIndex: 1000,
          display: 'none',
          background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
          color: '#333',
          border: 'none',
          borderRadius: 16,
          padding: '16px 24px',
          fontSize: 18,
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(255, 215, 0, 0.08)',
          transition: 'all 0.3s ease',
        }}
        className="sidequest-sim-btn"
      >
        Tag simulieren ➡️
      </button>
      <style>{`
        @media (min-width: 900px) {
          .sidequest-sim-btn { display: block !important; }
        }
      `}</style>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🗺️</div>
        <h1 style={{ color: '#ff69b4', fontSize: 32, fontWeight: 'bold', margin: 0 }}>Sidequest</h1>
        <p style={{ color: '#666', fontSize: 18, margin: '12px 0 0 0' }}>
          Deine heutige kleine Herausforderung wartet auf dich!
        </p>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 20,
        padding: 28,
        boxShadow: '0 2px 12px rgba(255, 182, 193, 0.08)',
        marginBottom: 24
      }}>
        <h2 style={{ color: '#ff69b4', fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>{sidequest.title}</h2>
        <p style={{ color: '#444', fontSize: 18, marginBottom: 20 }}>{sidequest.description}</p>
        {/* Antworttypen-Logik */}
        {sidequest.type === 'mc' && Array.isArray(parsedOptions) && (
          <div style={{ margin: '24px 0' }}>
            {parsedOptions.map((opt: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(idx)}
                disabled={confirmed}
                style={{
                  display: 'block',
                  width: '100%',
                  marginBottom: 12,
                  background: selectedOption === idx ? '#ff69b4' : '#f0f0f0',
                  color: selectedOption === idx ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 16px',
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: confirmed ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 4px rgba(255, 105, 180, 0.08)',
                  transition: 'all 0.2s',
                }}
              >
                {opt}
              </button>
            ))}
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                onClick={handleSolveQuest}
                disabled={confirmed || selectedOption === null}
                style={{
                  background: confirmed
                    ? 'linear-gradient(135deg, #b2f7b8 0%, #d0f5c7 100%)'
                    : 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)',
                  color: confirmed ? '#333' : '#fff',
                  border: 'none',
                  borderRadius: 16,
                  padding: '16px 32px',
                  fontSize: 18,
                  fontWeight: 'bold',
                  cursor: confirmed ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(255, 105, 180, 0.08)',
                  transition: 'all 0.3s ease',
                  marginBottom: 12
                }}
              >
                {confirmed ? 'Erledigt!' : 'Antwort absenden'}
              </button>
              {confirmed && mcResult === 'correct' && (
                <div style={{ color: '#32cd32', fontWeight: 'bold', marginTop: 16, fontSize: 18 }}>
                  Richtig! 🎉
                </div>
              )}
              {confirmed && mcResult === 'wrong' && parsedSolution !== null && (
                <div style={{ color: '#dc3545', fontWeight: 'bold', marginTop: 16, fontSize: 18 }}>
                  Leider falsch! Richtige Antwort: {parsedOptions[parsedSolution]}
                </div>
              )}
            </div>
          </div>
        )}
        {sidequest.type === 'text' && (
          <div style={{ margin: '24px 0' }}>
            <textarea
              value={userAnswer || ''}
              onChange={e => setUserAnswer(e.target.value)}
              disabled={confirmed}
              placeholder="Deine Antwort..."
              style={{ width: '100%', minHeight: 80, borderRadius: 12, border: '1px solid #ccc', padding: 12, fontSize: 16 }}
            />
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                onClick={handleSolveQuest}
                disabled={confirmed || !userAnswer}
                style={{
                  background: confirmed
                    ? 'linear-gradient(135deg, #b2f7b8 0%, #d0f5c7 100%)'
                    : 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)',
                  color: confirmed ? '#333' : '#fff',
                  border: 'none',
                  borderRadius: 16,
                  padding: '16px 32px',
                  fontSize: 18,
                  fontWeight: 'bold',
                  cursor: confirmed ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(255, 105, 180, 0.08)',
                  transition: 'all 0.3s ease',
                  marginBottom: 12
                }}
              >
                {confirmed ? 'Erledigt!' : 'Antwort absenden'}
              </button>
            </div>
          </div>
        )}
        {sidequest.type === 'whatsapp' && (
          <div style={{ margin: '24px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 18, color: '#888', marginBottom: 16 }}>
              Bestätigung auf Whatsapp erwünscht
            </div>
            <button
              onClick={handleSolveQuest}
              disabled={confirmed}
              style={{
                background: confirmed
                  ? 'linear-gradient(135deg, #b2f7b8 0%, #d0f5c7 100%)'
                  : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: confirmed ? '#333' : '#fff',
                border: 'none',
                borderRadius: 16,
                padding: '16px 32px',
                fontSize: 18,
                fontWeight: 'bold',
                cursor: confirmed ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(255, 105, 180, 0.08)',
                transition: 'all 0.3s ease',
                marginBottom: 12
              }}
            >
              {confirmed ? 'Erledigt!' : 'Erledigt?'}
            </button>
          </div>
        )}
        {sidequest.type === 'manual' && (
          <div style={{ margin: '24px 0', textAlign: 'center' }}>
            <button
              onClick={handleSolveQuest}
              disabled={confirmed}
              style={{
                background: confirmed
                  ? 'linear-gradient(135deg, #b2f7b8 0%, #d0f5c7 100%)'
                  : 'linear-gradient(135deg, #ffb347 0%, #ffd700 100%)',
                color: confirmed ? '#333' : '#fff',
                border: 'none',
                borderRadius: 16,
                padding: '16px 32px',
                fontSize: 18,
                fontWeight: 'bold',
                cursor: confirmed ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(255, 105, 180, 0.08)',
                transition: 'all 0.3s ease',
                marginBottom: 12
              }}
            >
              {confirmed ? 'Erledigt!' : 'Ja, ich mache das wirklich'}
            </button>
          </div>
        )}
        {confirmed && (
          <div style={{ color: '#32cd32', fontWeight: 'bold', marginTop: 12, fontSize: 18, textAlign: 'center' }}>
            Super gemacht! 💚
          </div>
        )}
      </div>
      {showPointsPopup && (
        <AchievementPopup
          achievement={{
            name: sidequest.title,
            description: `Du hast "${sidequest.title}" gelöst und ${pointsAwarded} Punkte verdient!`,
            rarity: 'common',
            reward_points: pointsAwarded,
          }}
          onClose={() => setShowPointsPopup(false)}
        />
      )}
    </div>
  );
}; 