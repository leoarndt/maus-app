-- ALLE TABELLEN LÖSCHEN (Reihenfolge wegen Foreign Keys beachten)
DROP TABLE IF EXISTS user_shop_items CASCADE;
DROP TABLE IF EXISTS shop_items CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS mood_entries CASCADE;
DROP TABLE IF EXISTS daily_messages_read CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS user_quests CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS countdowns CASCADE;

-- 1. Statistiken
CREATE TABLE user_stats (
  user_id TEXT PRIMARY KEY,
  login_streak INTEGER DEFAULT 0,
  mood_streak INTEGER DEFAULT 0,
  raetsel_streak INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0
);

-- 2. Quests & Rätsel
CREATE TABLE quests (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- z.B. 'quest' oder 'raetsel'
  solution TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_quests (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open', -- z.B. 'open', 'solved', 'skipped'
  solved_at TIMESTAMP,
  UNIQUE(user_id, quest_id)
);

-- 3. Nachrichten (Daily Messages)
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'daily' -- z.B. 'daily', 'special', etc.
);

CREATE TABLE daily_messages_read (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  message_date DATE NOT NULL REFERENCES messages(date) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, message_date)
);

-- 4. Mood-Checker
CREATE TABLE mood_entries (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  mood TEXT NOT NULL, -- z.B. 'happy', 'sad', etc.
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 5. Achievements
CREATE TABLE achievements (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  reward_points INTEGER DEFAULT 0,
  type TEXT DEFAULT 'achievement',
  condition JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_key TEXT NOT NULL REFERENCES achievements(key) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- 6. Shop
CREATE TABLE shop_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  category TEXT NOT NULL CHECK (category IN ('romantic', 'treats', 'experiences', 'special')),
  mausi_points_cost INTEGER NOT NULL,
  rarity_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_shop_items (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- 7. Countdown
CREATE TABLE countdowns (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  target_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexe für Performance
CREATE INDEX idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_shop_items_user_id ON user_shop_items(user_id);
CREATE INDEX idx_countdowns_user_id ON countdowns(user_id);

-- Beispiel-Insert für Shop-Items (optional, kann entfernt werden)
INSERT INTO shop_items (id, title, description, icon, color, rarity, category, mausi_points_cost, rarity_order) VALUES
('love_letter', 'Liebesbrief', 'Ein süßer Brief voller Liebe und Zuneigung', '💌', '#ff69b4', 'common', 'romantic', 0, 1),
('photo_memory', 'Foto-Erinnerung', 'Ein besonderes Foto von uns zusammen', '📸', '#ffb347', 'rare', 'romantic', 0, 2)
ON CONFLICT (id) DO NOTHING; 