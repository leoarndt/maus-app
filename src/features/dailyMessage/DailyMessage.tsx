import React, { useState, useEffect } from 'react';
import { useAchievements } from '../achievements/AchievementManager';
import { useAuth } from '../auth/AuthGate';
import { saveMessageRead } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { getDailyMessage } from '../../lib/supabase';
import { checkAndUnlockAchievements } from '../achievements/AchievementManager';

export const DailyMessage: React.FC = () => {
  const { userData } = useAuth();
  const [currentMessage, setCurrentMessage] = useState<any | null>(null);
  const [hasReadToday, setHasReadToday] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [totalMessagesRead, setTotalMessagesRead] = useState(0);
  const [loading, setLoading] = useState(true);
  const { achievements, unlockAchievement } = useAchievements();

  // Hilfsfunktion: Hole oder wähle und speichere die Daily Message für heute (nur eine pro Tag, keine Dopplung)
  async function getOrAssignTodaysMessage(): Promise<any | null> {
    if (!userData?.user_id) return null;
    const today = new Date().toISOString().split('T')[0];
    // 1. Prüfe, ob heute schon eine Nachricht assigned oder read ist
    const { data: todayMsgs } = await supabase
      .from('user_daily_messages')
      .select('message_id, status')
      .eq('user_id', userData.user_id)
      .eq('assigned_at', today)
      .in('status', ['assigned', 'read'])
      .order('id', { ascending: false })
      .limit(1);
    let messageId = null;
    if (todayMsgs && todayMsgs.length > 0) {
      messageId = todayMsgs[0].message_id;
    }
    // Alle bereits zugewiesenen Nachrichten IDs holen
    const { data: alreadyHad } = await supabase
      .from('user_daily_messages')
      .select('message_id')
      .eq('user_id', userData.user_id);
    const alreadyHadIds = alreadyHad ? alreadyHad.map(m => m.message_id) : [];
    // Alle daily messages laden, die der User noch NICHT hatte
    let { data: allMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('type', 'daily');
    if (!allMessages || allMessages.length === 0) return null;
    let availableMessages = allMessages.filter(m => !alreadyHadIds.includes(m.id));
    // Wenn alle durch sind, wieder von vorne anfangen (optional: oder Info anzeigen)
    if (availableMessages.length === 0) availableMessages = allMessages;
    let message: any = null;
    if (messageId) {
      message = allMessages.find(m => m.id === messageId);
    } else {
      // Noch keine Nachricht zugewiesen: Versuche, eine zuzuweisen (aus noch nicht gesehenen)
      const idx = Math.floor(Math.random() * availableMessages.length);
      message = availableMessages[idx];
      try {
        await supabase.from('user_daily_messages').insert({
          user_id: userData.user_id,
          message_id: message.id,
          status: 'assigned',
          assigned_at: today
        });
      } catch (e) {
        // Wenn Unique-Fehler: Lade die bereits zugewiesene Nachricht
        const { data: retry } = await supabase
          .from('user_daily_messages')
          .select('message_id')
          .eq('user_id', userData.user_id)
          .eq('assigned_at', today)
          .eq('status', 'assigned')
          .order('id', { ascending: false })
          .limit(1);
        if (retry && retry.length > 0) {
          message = allMessages.find(m => m.id === retry[0].message_id);
        }
      }
    }
    return message;
  }

  // Lade die zugewiesene Nachricht beim Mount
  useEffect(() => {
    const fetchMessage = async () => {
      setLoading(true);
      const msg = await getOrAssignTodaysMessage();
      setCurrentMessage(msg);
      // Anzahl gelesener Nachrichten laden
      if (userData?.user_id) {
        const { count } = await supabase
          .from('user_daily_messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userData.user_id)
          .eq('status', 'read');
        setTotalMessagesRead(count || 0);
      }
      setLoading(false);
    };
    fetchMessage();
    // eslint-disable-next-line
  }, [userData]);

  // Prüfe, ob die Nachricht heute schon gelesen wurde
  useEffect(() => {
    const fetchMessagesRead = async () => {
      if (userData?.user_id) {
        setLoading(true);
        // Prüfe, ob Status 'read' für heute existiert
        const today = new Date().toISOString().split('T')[0];
        const { data: todayRead } = await supabase
          .from('user_daily_messages')
          .select('*')
          .eq('user_id', userData.user_id)
          .eq('assigned_at', today)
          .eq('status', 'read');
        setHasReadToday(!!todayRead && todayRead.length > 0);
        setLoading(false);
      }
    };
    fetchMessagesRead();
  }, [userData, currentMessage]);

  // Beim Lesen: Status auf 'read' setzen
  const handleReadMessage = async () => {
    if (!hasReadToday && userData?.user_id && currentMessage?.id) {
      const today = new Date().toISOString().split('T')[0];
      await saveMessageRead(userData.user_id, today, currentMessage.id);
      // Nach dem Lesen: Anzahl gelesener Nachrichten aus der DB zählen
      const { count } = await supabase
        .from('user_daily_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.user_id)
        .eq('status', 'read');
      const total = count || 0;
      // Achievements prüfen und ggf. vergeben
      checkAndUnlockAchievements('message', total, unlockAchievement, achievements);
      setHasReadToday(true);
      setTotalMessagesRead(total);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 80, fontSize: 28, color: '#ff69b4', fontWeight: 700, letterSpacing: 1 }}>Nachricht wird geladen...</div>;
  }
  if (!currentMessage) {
    return <div style={{ textAlign: 'center', marginTop: 80, fontSize: 22, color: '#ff69b4', fontWeight: 600 }}>Keine Nachricht für heute gefunden.</div>;
  }

  if (showSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ffe6f2 0%, #fff0f6 50%, #f8e6ff 100%)',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)',
          borderRadius: 32,
          padding: 48,
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(255, 105, 180, 0.18)',
          color: '#fff',
          maxWidth: 420,
          width: '100%',
          animation: 'pop 0.5s',
        }}>
          <div style={{ fontSize: 80, marginBottom: 20, filter: 'drop-shadow(0 2px 8px #ff69b4aa)' }}>💌</div>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 28, fontWeight: 800, letterSpacing: 1 }}>Nachricht gelesen!</h2>
          <div style={{ fontSize: 18, margin: '0 0 8px 0', fontWeight: 500 }}>Du hast <span style={{ color: '#ffd700', fontWeight: 700 }}>{totalMessagesRead}</span> Nachrichten gelesen! 📚</div>
        </div>
        <style>{`@keyframes pop { 0%{transform:scale(0.8);} 80%{transform:scale(1.05);} 100%{transform:scale(1);} }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #ffe6f2 0%, #fff0f6 50%, #f8e6ff 100%)',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)',
        borderRadius: 32,
        padding: 48,
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(255, 105, 180, 0.18)',
        color: '#fff',
        maxWidth: 420,
        width: '100%',
        animation: 'fadein 0.5s',
      }}>
        <div style={{ fontSize: 80, marginBottom: 20, filter: 'drop-shadow(0 2px 8px #ff69b4aa)' }}>💌</div>
        <h2 style={{ margin: '0 0 12px 0', fontSize: 28, fontWeight: 800, letterSpacing: 1 }}>Deine Nachricht für heute:</h2>
        <div style={{ fontSize: 20, margin: '0 0 24px 0', fontWeight: 500, color: '#fff' }}>{currentMessage.text || currentMessage.content || 'Keine Nachrichtentext gefunden.'}</div>
        {hasReadToday ? (
          <div style={{ fontSize: 18, color: '#ffd700', fontWeight: 700 }}>Schon gelesen! ✅</div>
        ) : (
          <button
            style={{
              background: '#ffd700',
              color: '#ff69b4',
              fontWeight: 700,
              fontSize: 18,
              border: 'none',
              borderRadius: 16,
              padding: '12px 32px',
              cursor: 'pointer',
              marginTop: 16,
              boxShadow: '0 2px 8px #ff69b4aa',
              transition: 'background 0.2s',
            }}
            onClick={handleReadMessage}
          >
            Als gelesen markieren
          </button>
        )}
        <div style={{ fontSize: 16, marginTop: 32, color: '#fff', opacity: 0.7 }}>Du hast bisher <span style={{ color: '#ffd700', fontWeight: 700 }}>{totalMessagesRead}</span> Nachrichten gelesen.</div>
        <style>{`@keyframes fadein { from { opacity: 0; transform: translateY(40px);} to { opacity: 1; transform: none; }}`}</style>
      </div>
    </div>
  );
};