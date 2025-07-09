import { useEffect } from 'react';
import { useAuth } from '../auth/AuthGate';
import { useAchievements, checkAndUnlockAchievements } from './AchievementManager';
import { supabase } from '../../lib/supabase';

export function LoginStreakAchievementChecker() {
  const { userData } = useAuth();
  const { achievements, unlockAchievement } = useAchievements();

  useEffect(() => {
    const check = async () => {
      if (!userData?.user_id) return;
      
      // Warte bis Achievements geladen sind
      if (achievements.length === 0) return;
      
      // Hole aktuellen Login-Streak aus der DB
      const { data } = await supabase
        .from('users')
        .select('login_streak')
        .eq('user_id', userData.user_id)
        .single();
      if (data && typeof data.login_streak === 'number') {
        checkAndUnlockAchievements('login', data.login_streak, unlockAchievement, achievements);
      }
    };
    check();
    // eslint-disable-next-line
  }, [userData?.user_id, achievements.length]); // Abhängigkeit von achievements.length hinzugefügt

  return null;
} 