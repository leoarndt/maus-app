import { createClient } from '@supabase/supabase-js';

// TODO: Ersetze diese Werte durch deine echten Supabase-URL und den Public Key
const SUPABASE_URL = 'https://eqibkwptsdguupkrtmfm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaWJrd3B0c2RndXVwa3J0bWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0OTAxODgsImV4cCI6MjA2NzA2NjE4OH0.S4oyO6OQyMFUb9cymuVuCxrta1fIag3eOpkKvjiInZk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 

export async function getUserPurchases(user_id: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('purchases')
      .select('treasure_id')
      .eq('user_id', user_id);
  
    if (error) {
      console.error('Fehler beim Laden der Käufe:', error);
      return [];
    }
    return data ? data.map((row: { treasure_id: string }) => row.treasure_id) : [];
  }
  
  /**
   * Fügt einen neuen Kauf hinzu
   */
  export async function addPurchase(user_id: string, treasureId: string): Promise<boolean> {
    const { error } = await supabase
      .from('purchases')
      .insert([{ user_id, treasure_id: treasureId }]);
  
    if (error) {
      console.error('Fehler beim Kauf:', error);
      return false;
    }
    return true;
  }

  /**
   * Erstellt einen User falls er nicht existiert
   */
  export async function createUserIfNotExists(user_id: string): Promise<boolean> {
    // Erst prüfen, ob der User bereits existiert
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', user_id)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = "No rows returned" - das ist normal wenn User nicht existiert
      console.error('Fehler beim Prüfen des Users:', fetchError);
      return false;
    }
    
    if (existingUser) {
      // User existiert bereits - nichts tun
      return true;
    }
    
    // User existiert nicht - erstelle ihn mit 0 Punkten
    const { error } = await supabase
      .from('users')
      .insert([{ user_id, points: 0 }]);
    if (error) {
      console.error('Fehler beim Erstellen des Users:', error);
      return false;
    }
    return true;
  }

  /**
   * Addiert die Mausi-Punkte für einen User atomar in der Datenbank
   * @param user_id
   * @param pointsDelta Anzahl der zu addierenden Punkte (kann auch negativ sein)
   * @param onPointsSet Optionaler Callback nach erfolgreichem Setzen
   */
  export async function setUserPoints(user_id: string, pointsDelta: number, onPointsSet?: () => void): Promise<boolean> {
    // Versuche zuerst die RPC-Function
    const { error } = await supabase.rpc('increment_user_points', { p_user_id: user_id, p_points: pointsDelta });
    if (!error) {
      if (onPointsSet) onPointsSet();
      return true;
    }
    // Fallback: Update direkt in der Tabelle
    console.warn('increment_user_points RPC fehlgeschlagen, versuche direktes Update:', error);
    // Hole aktuellen Punktestand
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('points')
      .eq('user_id', user_id)
      .single();
    if (fetchError || !data) {
      console.error('Fehler beim Laden der aktuellen Punkte:', fetchError);
      return false;
    }
    const newPoints = (data.points || 0) + pointsDelta;
    const { error: updateError } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('user_id', user_id);
    if (updateError) {
      console.error('Fehler beim direkten Update der Punkte:', updateError);
      return false;
    }
    if (onPointsSet) onPointsSet();
    return true;
  }

  /**
   * Speichert eine gelesene Nachricht in der Datenbank
   */
  export async function saveMessageRead(user_id: string, messageDate: string, messageId?: number): Promise<boolean> {
    // messageId ist optional, aber empfohlen für Eindeutigkeit
    const today = messageDate;
    let updateQuery = supabase
      .from('user_daily_messages')
      .update({ status: 'read' })
      .eq('user_id', user_id)
      .eq('assigned_at', today)
      .eq('status', 'assigned');
    if (messageId !== undefined) {
      updateQuery = updateQuery.eq('message_id', messageId);
    }
    const { error } = await updateQuery;
    if (error) {
      console.error('Fehler beim Setzen des Status auf read in user_daily_messages:', error);
      return false;
    }
    return true;
  }

  /**
   * Speichert ein freigeschaltetes Achievement in der Datenbank
   */
  export async function saveAchievement(user_id: string, achievementId: number): Promise<boolean> {
    const { error } = await supabase
      .from('user_achievements')
      .upsert([
        { user_id, achievement_id: achievementId, achieved_at: new Date().toISOString() }
      ], { onConflict: 'user_id,achievement_id' });
  
    if (error) {
      console.error('Fehler beim Speichern des Achievements:', error);
      return false;
    }
    return true;
  }

  /**
   * Lädt alle verfügbaren Shop-Items aus der Datenbank
   */
  export async function getShopItems(): Promise<any[]> {
    const { data, error } = await supabase
      .from('shop_items')
      .select('*')
      .order('rarity_order', { ascending: false })
      .order('title', { ascending: true });
  
    if (error) {
      console.error('Fehler beim Laden der Shop-Items:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Lädt die bereits freigeschalteten Shop-Items für einen User
   */
  export async function getUnlockedShopItems(user_id: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_shop_items')
      .select('item_id')
      .eq('user_id', user_id);
  
    if (error) {
      console.error('Fehler beim Laden der freigeschalteten Shop-Items:', error);
      return [];
    }
    return data ? data.map((row: { item_id: string }) => row.item_id) : [];
  }

  /**
   * Markiert ein Shop-Item als freigeschaltet für einen User
   */
  export async function unlockShopItem(user_id: string, itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_shop_items')
      .insert([{ user_id, item_id: itemId, unlocked_at: new Date().toISOString() }]);
  
    if (error) {
      console.error('Fehler beim Freischalten des Shop-Items:', error);
      return false;
    }
    return true;
  }

  /**
   * Lädt alle Countdowns für einen User aus der Datenbank
   */
  export async function getCountdowns(user_id: string): Promise<{ id: number; title: string; target_date: string; created_at: string }[]> {
    const { data, error } = await supabase
      .from('countdowns')
      .select('id, title, target_date, created_at')
      .eq('user_id', user_id)
      .order('target_date', { ascending: true });
    if (error) {
      console.error('Fehler beim Laden der Countdowns:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Lädt eine zufällige Sidequest (Quest oder Rätsel) aus der Datenbank
   */
  export async function getDailySidequest(): Promise<any | null> {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .order('random()');
    if (error) {
      console.error('Fehler beim Laden der Sidequests:', error);
      return null;
    }
    if (!data || data.length === 0) return null;
    // Zufällige Auswahl
    const index = Math.floor(Math.random() * data.length);
    return data[index];
  }

  /**
   * Lädt die tägliche Nachricht aus der Datenbank
   */
  export async function getDailyMessage(): Promise<any | null> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    // 1. Versuche, eine Nachricht für das heutige Datum zu finden
    let { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('date', todayStr)
      .eq('type', 'daily')
      .single();
    if (!error && data) return data;
    // 2. Wenn keine Nachricht für heute, alle Nachrichten holen und rotierend auswählen
    const { data: allMessages, error: allError } = await supabase
      .from('messages')
      .select('*')
      .eq('type', 'daily')
      .order('date', { ascending: true });
    if (allError || !allMessages || allMessages.length === 0) return null;
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = dayOfYear % allMessages.length;
    return allMessages[index];
  }

  /**
   * Setzt alle relevanten Datenbanktabellen zurück (löscht alle Userdaten, Reads, Mood, Countdowns, Purchases, User-Shop-Items, User-Quests, Messages)
   */
  export async function resetAllData() {
    // 1. Alle User-bezogenen Tabellen leeren
    const tablesToClear = [
      'daily_messages_read',
      'user_achievements',
      'countdowns',
      'purchases',
      'user_shop_items',
      'user_quests',
      'user_mood_entries'
    ];
    for (const table of tablesToClear) {
      await supabase.from(table).delete();
    }
    // 2. In messages alle date-Felder auf NULL setzen
    await supabase.from('messages').update({ date: null });
    // 3. Userdaten zurücksetzen (nur noch users Tabelle)
    await supabase.from('users').update({ points: 0, ownedtreasures: [], hamsti_clicks: 0 });
  }

  /**
   * Fügt einen Eintrag in user_quests hinzu oder aktualisiert ihn, wenn die Quest gelöst wurde
   */
  export async function addOrUpdateUserQuest(user_id: string, quest_id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_quests')
        .upsert([
          {
            user_id,
            quest_id,
            status: 'solved',
            solved_at: new Date().toISOString(),
          },
        ], { onConflict: 'user_id,quest_id' });
      if (error) {
        console.error('Fehler beim Hinzufügen/Aktualisieren der User-Quest:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Fehler beim Hinzufügen/Aktualisieren der User-Quest:', err);
      return false;
    }
  }

  /**
   * Lädt die Hamsti-Klicks für einen User
   */
  export async function getHamstiClicks(user_id: string): Promise<number> {
    // Verwende nur users Tabelle, da user_stats keine hamsti_clicks Spalte hat
    const { data, error } = await supabase
      .from('users')
      .select('hamsti_clicks')
      .eq('user_id', user_id)
      .single();
    
    if (error || !data) {
      return 0;
    }
    return data.hamsti_clicks || 0;
  }

  /**
   * Setzt die Hamsti-Klicks für einen User
   */
  export async function setHamstiClicks(user_id: string, clicks: number): Promise<boolean> {
    // Verwende nur users Tabelle, da user_stats keine hamsti_clicks Spalte hat
    const { error } = await supabase
      .from('users')
      .update({ hamsti_clicks: clicks })
      .eq('user_id', user_id);
    
    if (error) {
      console.error('Fehler beim Setzen der Hamsti-Klicks:', error);
      return false;
    }
    return true;
  }

  /**
   * Speichert einen Mood-Entry in der Datenbank
   */
  export async function saveMoodEntry(user_id: string, date: string, mood: string, note: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_mood_entries')
      .upsert([{ user_id, date, mood, note }], { onConflict: 'user_id,date' });
    if (error) {
      console.error('Fehler beim Speichern des Mood-Entries:', error);
      return false;
    }
    return true;
  }

  /**
   * Holt den Mood-Entry für einen User und ein bestimmtes Datum
   */
  export async function getMoodEntryForDate(user_id: string, date: string): Promise<{ mood: string; note: string } | null> {
    const { data, error } = await supabase
      .from('user_mood_entries')
      .select('mood, note')
      .eq('user_id', user_id)
      .eq('date', date)
      .single();
    if (error || !data) {
      return null;
    }
    return data;
  }

  /**
   * Lädt die ausgewählte Hamsti-Skin für einen User
   */
  export async function getHamstiSkin(user_id: string): Promise<string> {
    const { data, error } = await supabase
      .from('users')
      .select('hamsti_skin')
      .eq('user_id', user_id)
      .single();
    
    if (error || !data) {
      return 'hamsti_1'; // Default skin
    }
    return data.hamsti_skin || 'hamsti_1';
  }

  /**
   * Setzt die ausgewählte Hamsti-Skin für einen User
   */
  export async function setHamstiSkin(user_id: string, skin: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({ hamsti_skin: skin })
      .eq('user_id', user_id);
    
    if (error) {
      console.error('Fehler beim Setzen der Hamsti-Skin:', error);
      return false;
    }
    return true;
  }