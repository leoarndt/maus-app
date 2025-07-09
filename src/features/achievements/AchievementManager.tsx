import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AchievementPopup } from './AchievementPopup';
import { setUserPoints, saveAchievement, supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthGate';

export interface Achievement {
  key: string; // Primärschlüssel/id
  name: string;
  description: string;
  rarity: string;
  reward_points: number;
  type: string;
  condition: any;
  unlocked?: boolean;
  unlocked_at?: string;
}

interface AchievementContextType {
  achievements: Achievement[];
  unlockAchievement: (key: string) => void;
  getUnlockedCount: () => number;
  getTotalCount: () => number;
  getUserPoints: () => number;
  // ... weitere Methoden wie benötigt ...
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [popupQueue, setPopupQueue] = useState<Achievement[]>([]);
  const [userPoints, setUserPointsState] = useState(0);
  const { userData } = useAuth();

  // Lädt alle Achievements und markiert freigeschaltete
  useEffect(() => {
    const fetchAchievements = async () => {
      console.log('🔍 Fetching achievements...');
      console.log('👤 User data:', userData);
      
      // 1. Alle Achievements aus der DB holen (mit reward_points)
      const { data: allAchievements, error: allError } = await supabase
        .from('achievements')
        .select('id, name, description, rarity, reward_points, type, condition');
      
      // Debug: IDs aller Achievements
      console.log('📊 All achievements from DB:', allAchievements);
      if (allAchievements) {
        console.log('All achievements IDs:', allAchievements.map((a: any) => a.id));
      }
      console.log('❌ All achievements error:', allError);
      
      // 2. Alle User-Achievements holen
      let unlocked: string[] = [];
      let unlockedMap: Record<string, string> = {};
      let userAchievements: any[] = [];
      if (userData?.user_id) {
        console.log('🔑 Fetching user achievements for user:', userData.user_id);
        const { data: userAchievementsData, error: userError } = await supabase
          .from('user_achievements')
          .select('achievement_id, achieved_at')
          .eq('user_id', userData.user_id);
        userAchievements = userAchievementsData || [];
        console.log('🎯 User achievements:', userAchievements);
        if (userAchievements) {
          console.log('User unlocked achievement_ids:', userAchievements.map((a: any) => a.achievement_id));
          unlocked = userAchievements.map((a: any) => String(a.achievement_id));
          unlockedMap = Object.fromEntries(userAchievements.map((a: any) => [String(a.achievement_id), a.achieved_at]));
        }
      }
      
      // 3. Achievements mit unlocked-Status zusammenbauen
      if (allAchievements) {
        allAchievements.forEach((a: any) => {
          const isUnlocked = unlocked.includes(String(a.id));
          console.log(`Achievement ${a.id} unlocked:`, isUnlocked);
        });
        const processedAchievements = allAchievements.map((a: any) => ({
          key: a.id,
          name: a.name,
          title: a.name,
          description: a.description,
          rarity: a.rarity,
          reward_points: a.reward_points || 0,
          type: a.type || 'achievement',
          condition: a.condition || {},
          unlocked: unlocked.includes(String(a.id)),
          unlocked_at: unlockedMap[String(a.id)] || undefined,
        }));
        console.log('✅ Processed achievements:', processedAchievements);
        setAchievements(processedAchievements);
        
        // Prüfe Datum-basierte Achievements nach dem Laden
        if (processedAchievements.length > 0) {
          // Temporäre unlockAchievement Funktion für den ersten Check
          const tempUnlockAchievement = async (key: string) => {
            if (!userData?.user_id) return;
            const achievement = processedAchievements.find(a => a.key === key);
            if (!achievement || achievement.unlocked) return;
            
            try {
              await saveAchievement(userData.user_id, Number(key));
              await setUserPoints(userData.user_id, achievement.reward_points);
              setUserPointsState(prev => prev + achievement.reward_points);
              setAchievements(prev => prev.map(a => a.key === key ? { ...a, unlocked: true, unlocked_at: new Date().toISOString() } : a));
              setPopupQueue(prev => [...prev, { ...achievement, unlocked: true, unlocked_at: new Date().toISOString() }]);
              console.log('✅ Date achievement successfully unlocked:', achievement.name);
            } catch (error) {
              console.error('❌ Fehler beim Freischalten des Date-Achievements:', error);
            }
          };
          
          checkAndUnlockDateAchievements(tempUnlockAchievement, processedAchievements);
        }
      } else {
        console.log('⚠️ No achievements found in database');
      }
    };
    fetchAchievements();
  }, [userData]);

  // Lädt die aktuellen Punkte des Users aus der Datenbank
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (!userData?.user_id) {
        console.log('Kein user_id vorhanden, Query wird übersprungen.');
        return;
      }
      console.log('user_id:', userData.user_id); // Debug: user_id vor Query
      // Nur noch users Tabelle verwenden
      const { data: userDataFromDB, error } = await supabase
        .from('users')
        .select('points')
        .eq('user_id', userData.user_id)
        .single();
      if (!error && userDataFromDB) {
        setUserPointsState(userDataFromDB.points || 0);
      }
    };
    fetchUserPoints();
  }, [userData]);

  const unlockAchievement = async (key: string) => {
    if (!userData?.user_id) return;
    console.log('🔓 Trying to unlock achievement:', key);
    const achievement = achievements.find(a => a.key === key);
    console.log('🎯 Achievement found:', achievement);
    if (!achievement) {
      console.log('❌ Achievement not found in local state');
      return;
    }
    if (achievement.unlocked) {
      console.log('✅ Achievement is already unlocked in local state!');
      return;
    }
    
    try {
      // Zusätzliche Prüfung: Ist das Achievement bereits in der Datenbank?
      const { data: existingAchievement } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userData.user_id)
        .eq('achievement_id', Number(key))
        .single();
      
      if (existingAchievement) {
        console.log('✅ Achievement already exists in database, updating local state only');
        setAchievements(prev => prev.map(a => a.key === key ? { ...a, unlocked: true } : a));
        return;
      }
      
      console.log('🎉 Achievement not in database, proceeding with unlock...');
      
      // 1. Achievement in der Datenbank speichern
      await saveAchievement(userData.user_id, Number(key)); // key ist die numerische id des Achievements
      // 2. Punkte des Users atomar addieren
      await setUserPoints(userData.user_id, achievement.reward_points);
      setUserPointsState(prev => prev + achievement.reward_points);
      // 3. Achievement im State als unlocked markieren
      setAchievements(prev => prev.map(a => a.key === key ? { ...a, unlocked: true, unlocked_at: new Date().toISOString() } : a));
      // 4. Popup in die Queue einreihen
      setPopupQueue(prev => [...prev, { ...achievement, unlocked: true, unlocked_at: new Date().toISOString() }]);
      
      // 5. Meta-Achievements prüfen (nach dem Freischalten des aktuellen Achievements)
      // Prüfe "Überfliegerin" - 10 Achievements an einem Tag
      const checkDailyAchievements = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const { count } = await supabase
            .from('user_achievements')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userData.user_id)
            .gte('unlocked_at', `${today}T00:00:00`)
            .lt('unlocked_at', `${today}T23:59:59`);
          
          const dailyCount = count || 0;
          console.log(`📅 Daily achievements unlocked today: ${dailyCount}`);
          
          // Finde das "Überfliegerin" Achievement
          const uberfliegerin = achievements.find(a => a.name === 'Überfliegerin' && a.type === 'meta');
          if (uberfliegerin && !uberfliegerin.unlocked && dailyCount >= 10) {
            console.log(`🎉 Unlocking meta achievement: Überfliegerin (${dailyCount} achievements today)`);
            unlockAchievement(uberfliegerin.key);
          }
        } catch (error) {
          console.error('❌ Error checking daily achievements:', error);
        }
      };
      
      // Prüfe "bro zieht durch" - Alle Achievements gesammelt
      const checkTotalAchievements = async () => {
        try {
          const unlockedCount = achievements.filter(a => a.unlocked).length;
          const totalCount = achievements.length;
          console.log(`📊 Total achievements unlocked: ${unlockedCount}/${totalCount}`);
          
          // Finde das "bro zieht durch" Achievement
          const broZiehtDurch = achievements.find(a => a.name === 'bro zieht durch' && a.type === 'meta');
          if (broZiehtDurch && !broZiehtDurch.unlocked && unlockedCount >= 60) {
            console.log(`🎉 Unlocking meta achievement: bro zieht durch (${unlockedCount}/${totalCount} achievements)`);
            unlockAchievement(broZiehtDurch.key);
          }
        } catch (error) {
          console.error('❌ Error checking total achievements:', error);
        }
      };
      
      // Beide Checks ausführen
      checkDailyAchievements();
      checkTotalAchievements();
      
      console.log('✅ Achievement successfully unlocked:', achievement.name);
    } catch (error) {
      console.error('❌ Fehler beim Freischalten des Achievements:', error);
    }
  };

  const getUnlockedCount = () => achievements.filter(a => a.unlocked).length;
  const getTotalCount = () => achievements.length;
  const getUserPoints = () => userPoints;

  return (
    <AchievementContext.Provider value={{
      achievements,
      unlockAchievement,
      getUnlockedCount,
      getTotalCount,
      getUserPoints,
    }}>
      {children}
      {popupQueue.length > 0 && (
        <AchievementPopup
          achievement={popupQueue[0]}
          onClose={() => setPopupQueue(prev => prev.slice(1))}
        />
      )}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievements must be used within AchievementProvider');
  return ctx;
};

/**
 * Utility: Prüft und vergibt automatisch alle Achievements eines Typs, deren Schwelle erreicht wurde.
 * @param type z.B. 'message', 'mood', 'puzzle', 'hamsti_clicker', 'points'
 * @param currentValue aktueller Wert (z.B. Nachrichten gelesen, Klicks, ...)
 * @param unlockAchievement Callback zum Freischalten
 * @param achievements Array aller Achievements (aus Context)
 *
 * Hinweis: Diese Funktion ruft unlockAchievement für JEDES Achievement auf, das noch nicht freigeschaltet ist und dessen Schwelle erreicht wurde.
 * Dadurch werden auch bei Massen-Freischaltungen (z.B. Streak auf 7 gesetzt) alle Punkte korrekt vergeben.
 */
export function checkAndUnlockAchievements(type: string, currentValue: number, unlockAchievement: (key: string) => void, achievements: Achievement[]) {
  console.log(`🔍 Checking achievements for type: ${type}, currentValue: ${currentValue}`);
  console.log(`📊 Total achievements loaded: ${achievements.length}`);
  
  // Finde alle Achievements mit passendem Typ
  const relevant = achievements.filter(a => a.type === type && a.condition && typeof a.condition === 'object');
  console.log(`🎯 Relevant achievements for type ${type}:`, relevant.length);
  
  relevant.forEach(a => {
    console.log(`🔍 Checking achievement: ${a.name} (key: ${a.key}), unlocked: ${a.unlocked}`);
    
    // Extrahiere die Bedingung (z.B. { messages_read: 10 } oder { points_earned: 100 })
    const condKey = Object.keys(a.condition)[0];
    const condValue = a.condition[condKey];
    
    console.log(`📋 Condition: ${condKey} = ${condValue}, currentValue = ${currentValue}`);
    
    // Prüfe ob Achievement bereits freigeschaltet ist
    if (a.unlocked) {
      console.log(`✅ Achievement ${a.name} already unlocked, skipping`);
      return;
    }
    
    // Für Punkte-Achievements: Feld heißt points_earned
    if (type === 'points' && condKey === 'points_earned' && typeof condValue === 'number' && currentValue >= condValue) {
      console.log(`🎉 Unlocking points achievement: ${a.name}`);
      unlockAchievement(a.key);
    }
    // Für Message-Achievements: Nur achievements mit messages_read Bedingung prüfen
    else if (type === 'message' && condKey === 'messages_read' && typeof condValue === 'number' && currentValue >= condValue) {
      console.log(`🎉 Unlocking message achievement: ${a.name}`);
      unlockAchievement(a.key);
    }
    // Standard: Zähl-Achievements (number) für andere Typen
    else if (type !== 'points' && type !== 'message' && typeof condValue === 'number' && currentValue >= condValue) {
      console.log(`🎉 Unlocking achievement: ${a.name}`);
      unlockAchievement(a.key);
    } else {
      console.log(`❌ Achievement ${a.name} not ready yet (${currentValue} < ${condValue}) or wrong condition type`);
    }
  });
}

/**
 * Utility: Prüft und vergibt automatisch Datum-basierte Achievements
 * @param unlockAchievement Callback zum Freischalten
 * @param achievements Array aller Achievements (aus Context)
 */
export function checkAndUnlockDateAchievements(unlockAchievement: (key: string) => void, achievements: Achievement[]) {
  console.log(`📅 Checking date-based achievements...`);
  console.log(`📊 Total achievements loaded: ${achievements.length}`);
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD Format
  console.log(`📅 Today's date: ${today}`);
  
  // Finde alle Datum-basierten Achievements
  const dateAchievements = achievements.filter(a => a.type === 'date' && a.condition && typeof a.condition === 'object');
  console.log(`🎯 Date-based achievements found: ${dateAchievements.length}`);
  
  dateAchievements.forEach(a => {
    console.log(`🔍 Checking date achievement: ${a.name} (key: ${a.key}), unlocked: ${a.unlocked}`);
    
    // Prüfe ob Achievement bereits freigeschaltet ist
    if (a.unlocked) {
      console.log(`✅ Date achievement ${a.name} already unlocked, skipping`);
      return;
    }
    
    // Extrahiere das Datum aus der Bedingung
    const dateUnlock = a.condition.date_unlock;
    if (dateUnlock && typeof dateUnlock === 'string') {
      console.log(`📋 Date condition: ${dateUnlock}, today: ${today}`);
      
      // Vergleiche das heutige Datum mit dem Freischaltdatum
      if (today >= dateUnlock) {
        console.log(`🎉 Unlocking date achievement: ${a.name} (${dateUnlock} reached)`);
        unlockAchievement(a.key);
      } else {
        console.log(`⏳ Date achievement ${a.name} not ready yet (${today} < ${dateUnlock})`);
      }
    } else {
      console.log(`❌ Invalid date condition for achievement ${a.name}:`, a.condition);
    }
  });
} 

/**
 * Utility: Prüft und vergibt automatisch Meta-Achievements
 * @param unlockAchievement Callback zum Freischalten
 * @param achievements Array aller Achievements (aus Context)
 * @param userData User-Daten für DB-Zugriff
 */
export function checkAndUnlockMetaAchievements(unlockAchievement: (key: string) => void, achievements: Achievement[], userData: any) {
  console.log(`🏆 Checking meta achievements...`);
  
  if (!userData?.user_id) {
    console.log('❌ No user data available for meta achievements check');
    return;
  }
  
  // 1. Prüfe "Überfliegerin" - 10 Achievements an einem Tag
  const checkDailyAchievements = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.user_id)
        .gte('unlocked_at', `${today}T00:00:00`)
        .lt('unlocked_at', `${today}T23:59:59`);
      
      const dailyCount = count || 0;
      console.log(`📅 Daily achievements unlocked today: ${dailyCount}`);
      
      // Finde das "Überfliegerin" Achievement
      const uberfliegerin = achievements.find(a => a.name === 'Überfliegerin' && a.type === 'meta');
      if (uberfliegerin && !uberfliegerin.unlocked && dailyCount >= 10) {
        console.log(`🎉 Unlocking meta achievement: Überfliegerin (${dailyCount} achievements today)`);
        unlockAchievement(uberfliegerin.key);
      }
    } catch (error) {
      console.error('❌ Error checking daily achievements:', error);
    }
  };
  
  // 2. Prüfe "bro zieht durch" - Alle Achievements gesammelt
  const checkTotalAchievements = async () => {
    try {
      const unlockedCount = achievements.filter(a => a.unlocked).length;
      const totalCount = achievements.length;
      console.log(`📊 Total achievements unlocked: ${unlockedCount}/${totalCount}`);
      
      // Finde das "bro zieht durch" Achievement
      const broZiehtDurch = achievements.find(a => a.name === 'bro zieht durch' && a.type === 'meta');
      if (broZiehtDurch && !broZiehtDurch.unlocked && unlockedCount >= 60) {
        console.log(`🎉 Unlocking meta achievement: bro zieht durch (${unlockedCount}/${totalCount} achievements)`);
        unlockAchievement(broZiehtDurch.key);
      }
    } catch (error) {
      console.error('❌ Error checking total achievements:', error);
    }
  };
  
  // Beide Checks ausführen
  checkDailyAchievements();
  checkTotalAchievements();
} 