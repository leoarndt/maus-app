-- Bestehende Tabellen löschen
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Konsolidierte users Tabelle - ersetzt beide user_stats und users Tabellen
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

-- Index für Performance
CREATE INDEX idx_users_user_id ON users(user_id);

-- Trigger für updated_at
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