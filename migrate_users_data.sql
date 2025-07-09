-- 1. Temporäre Tabellen erstellen um Daten zu sichern
CREATE TEMP TABLE temp_users AS SELECT * FROM users;
CREATE TEMP TABLE temp_user_stats AS SELECT * FROM user_stats;

-- 2. Bestehende Tabellen löschen
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. Neue konsolidierte users Tabelle erstellen
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  points INTEGER DEFAULT 0,
  ownedTreasures TEXT[] DEFAULT '{}',
  hamsti_clicks INTEGER DEFAULT 0,
  hamsti_skin TEXT DEFAULT 'hamsti_1',
  login_streak INTEGER DEFAULT 0,
  mood_streak INTEGER DEFAULT 0,
  raetsel_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Daten aus beiden Tabellen zusammenführen und einfügen
INSERT INTO users (user_id, points, ownedTreasures, hamsti_clicks, hamsti_skin, login_streak, mood_streak, raetsel_streak)
SELECT 
  COALESCE(u.user_id, us.user_id) as user_id,
  COALESCE(us.points, u.points, 0) as points,
  COALESCE(u.ownedTreasures, '{}') as ownedTreasures,
  COALESCE(u.hamsti_clicks, 0) as hamsti_clicks,
  COALESCE(u.hamsti_skin, 'hamsti_1') as hamsti_skin,
  COALESCE(us.login_streak, 0) as login_streak,
  COALESCE(us.mood_streak, 0) as mood_streak,
  COALESCE(us.raetsel_streak, 0) as raetsel_streak
FROM temp_users u
FULL OUTER JOIN temp_user_stats us ON u.user_id = us.user_id;

-- 5. Index und Trigger erstellen
CREATE INDEX idx_users_user_id ON users(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Temporäre Tabellen löschen
DROP TABLE temp_users;
DROP TABLE temp_user_stats; 