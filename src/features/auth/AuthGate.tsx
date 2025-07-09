import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../../lib/supabase';
import { createUserIfNotExists, resetAllData } from '../../lib/supabase';
import { AdminPanel } from './AdminPanel';

const PASSWORD = 'maus'; // Platzhalter, bitte ersetzen
const ADMIN_PASSWORD = 'admin';
const STORAGE_KEY = 'auth_passed';

const SWEET_MESSAGES = [
  'Willkommen zurück, meine Liebe! 💕',
  'Du bist da! Mein Herz schlägt höher! 💖',
  'Endlich bist du wieder hier! 🌸',
  'Meine Lieblingsmaus ist zurück! 🐭',
  'Du hast mich vermisst? Ich dich auch! 💝',
  'Willkommen in deiner kleinen Welt! ✨',
  'Bereit für neue Überraschungen? 🎁',
  'Du machst jeden Tag schöner! 🌟'
];

interface UserData {
  points: number;
  ownedtreasures: string[];
  user_id: string;
  login_streak?: number;
  last_login_date?: string;
}

interface AuthContextType {
  unlocked: boolean;
  isAdmin: boolean;
  userData: UserData | null;
  logout: () => void;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthGate');
  }
  return context;
};

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(
    typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true'
  );
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);


  const randomMessage = SWEET_MESSAGES[Math.floor(Math.random() * SWEET_MESSAGES.length)];
  const user_id = 'maus-user';

  useEffect(() => {
    if (unlocked && !userData) {
      loadUserData();
    }
  }, [unlocked]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Ensure user exists in database
      await createUserIfNotExists(user_id);
      // Nur noch users Tabelle verwenden
      const { data: userDataFromDB, error } = await supabase
        .from('users')
        .select('points, ownedtreasures, user_id, login_streak, last_login_date')
        .eq('user_id', user_id)
        .single();
      if (!error && userDataFromDB) {
        setUserData(userDataFromDB as UserData);
      } else {
        // Fallback für Offline-Modus
        setUserData({ points: 0, ownedtreasures: [], user_id, login_streak: 0 });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      // Fallback für Offline-Modus
      setUserData({ points: 0, ownedtreasures: [], user_id, login_streak: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Neue Funktion: Login-Streak aktualisieren
  const updateLoginStreak = async () => {
    if (!userData?.user_id) return;

    const today = new Date().toISOString().split('T')[0];
    const lastLoginDate = userData.last_login_date;
    const currentStreak = userData.login_streak || 0;

    let newStreak = currentStreak;
    let shouldUpdate = false;

    if (!lastLoginDate) {
      // Erster Login ever
      newStreak = 1;
      shouldUpdate = true;
    } else if (lastLoginDate === today) {
      // Bereits heute eingeloggt - kein Update nötig
      return;
    } else {
      // Prüfe, ob gestern eingeloggt wurde
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastLoginDate === yesterdayStr) {
        // Streak fortsetzen
        newStreak = currentStreak + 1;
        shouldUpdate = true;
      } else {
        // Streak unterbrochen - zurücksetzen
        newStreak = 1;
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ 
            login_streak: newStreak,
            last_login_date: today
          })
          .eq('user_id', user_id);
        
        if (!error) {
          setUserData(prev => prev ? {
            ...prev,
            login_streak: newStreak,
            last_login_date: today
          } : null);
        }
      } catch (error) {
        console.error('Fehler beim Aktualisieren des Login-Streaks:', error);
      }
    }
  };

  // handleSubmit wieder korrekt einfügen
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
      setError('');
      setIsAdmin(false);
      
      // Erst User-Daten laden
      await loadUserData();
      
      // Dann Login-Streak aktualisieren
      if (user_id) {
        await supabase.rpc('update_login_streak', { p_user_id: user_id });
        // Nach der Streak-Aktualisierung nochmal Daten laden
        await loadUserData();
        // Auch lokale Streak-Aktualisierung durchführen
        await updateLoginStreak();
      }
      
      // Punkte für Login vergeben (jetzt sollte userData verfügbar sein)
      if (userData) {
        const newPoints = userData.points + 1;
        await updatePoints(newPoints);
        setUserData(prev => prev ? { ...prev, points: newPoints } : null);
      }
    } else if (input === ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
      setError('');
      setIsAdmin(true);
      await loadUserData();
    } else {
      setError('Falsches Passwort!');
    }
  };

  const updatePoints = async (points: number) => {
    try {
      // Nur noch users Tabelle verwenden
      const { error } = await supabase
        .from('users')
        .update({ points })
        .eq('user_id', user_id);
      if (error) throw error;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Punkte:', error);
    }
  };

  const handleLogout = () => {
    setUnlocked(false);
    setInput('');
    setUserData(null);
    setIsAdmin(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleAdminReset = async () => {
    setLoading(true);
    try {
      await resetAllData();
      alert('Alle Daten wurden zurückgesetzt!');
      await loadUserData();
    } catch (error) {
      console.error('Fehler beim Zurücksetzen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetPoints = async (value: number) => {
    setLoading(true);
    try {
      await updatePoints(value);
      await loadUserData();
    } catch (error) {
      console.error('Fehler beim Setzen der Punkte:', error);
    } finally {
      setLoading(false);
    }
  };

  if (unlocked && isAdmin) {
    return (
      <AuthContext.Provider value={{ unlocked, isAdmin, userData, logout: handleLogout, reloadUser: loadUserData }}>
        <AdminPanel
          onLogout={handleLogout}
          onResetData={handleAdminReset}
          onSetPoints={handleAdminSetPoints}
          loading={loading}
        />
      </AuthContext.Provider>
    );
  }

  if (unlocked) return (
    <AuthContext.Provider value={{ unlocked, isAdmin, userData, logout: handleLogout, reloadUser: loadUserData }}>
      {children}
    </AuthContext.Provider>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: 'linear-gradient(135deg, #ffe6f2 0%, #fff0f6 50%, #f8e6ff 100%)',
      padding: 20
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 20, 
        background: 'rgba(255, 255, 255, 0.95)', 
        padding: 40, 
        borderRadius: 24, 
        boxShadow: '0 8px 32px rgba(255, 182, 193, 0.3)',
        backdropFilter: 'blur(10px)',
        maxWidth: 400,
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💝</div>
        <h1 style={{ 
          color: '#ff69b4', 
          margin: 0, 
          fontSize: 24, 
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(255, 105, 180, 0.2)'
        }}>
          {randomMessage}
        </h1>
        <p style={{ 
          color: '#666', 
          margin: '8px 0 24px 0', 
          fontSize: 16,
          lineHeight: 1.5
        }}>
          Gib das magische Wort ein, um deine Überraschungen zu entdecken ✨
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <input
              id="pw"
              type="password"
              value={input}
              onChange={e => { setInput(e.target.value); setError(''); }}
              placeholder="Magisches Wort..."
              style={{ 
                width: '100%',
                padding: '16px 20px', 
                borderRadius: 16, 
                border: '2px solid #ffb6c1', 
                fontSize: 18,
                background: '#fff',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ff69b4'}
              onBlur={(e) => e.target.style.borderColor = '#ffb6c1'}
              autoFocus
            />
          </div>
          
          <button 
            type="submit" 
            style={{ 
              background: 'linear-gradient(135deg, #ff69b4 0%, #ff8da1 100%)',
              color: '#fff', 
              border: 'none', 
              borderRadius: 16, 
              padding: '16px 24px', 
              fontSize: 18, 
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(255, 105, 180, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 105, 180, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 105, 180, 0.3)';
            }}
          >
            🔓 Entsperren
          </button>
          
          {error && (
            <div style={{ 
              color: '#ff1744', 
              marginTop: 8, 
              padding: '12px 16px',
              background: '#ffe6e6',
              borderRadius: 12,
              border: '1px solid #ffb3b3',
              fontSize: 14
            }}>
              {error}
            </div>
          )}
        </form>
        
        <div style={{ 
          marginTop: 20, 
          fontSize: 14, 
          color: '#999',
          fontStyle: 'italic'
        }}>
          Mit Liebe gemacht 💕
        </div>
      </div>
    </div>
  );
}; 