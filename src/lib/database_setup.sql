-- Shop Items Tabelle erstellen
CREATE TABLE IF NOT EXISTS shop_items (
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

-- User Shop Items Tabelle erstellen (freigeschaltete Items)
CREATE TABLE IF NOT EXISTS user_shop_items (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL REFERENCES shop_items(id),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Shop Items einfügen
INSERT INTO shop_items (id, title, description, icon, color, rarity, category, mausi_points_cost, rarity_order) VALUES
-- Romantic Items
('love_letter', 'Liebesbrief', 'Ein süßer Brief voller Liebe und Zuneigung', '💌', '#ff69b4', 'common', 'romantic', 0, 1),
('photo_memory', 'Foto-Erinnerung', 'Ein besonderes Foto von uns zusammen', '📸', '#ffb347', 'rare', 'romantic', 0, 2),
('virtual_hug', 'Virtuelle Umarmung', 'Eine warme, liebevolle Umarmung für dich', '🤗', '#87ceeb', 'common', 'romantic', 25, 1),
('love_poem', 'Liebesgedicht', 'Ein Gedicht, das von meiner Liebe zu dir erzählt', '📝', '#dda0dd', 'epic', 'romantic', 100, 3),
('special_song', 'Unser Lied', 'Ein Lied, das nur für dich geschrieben wurde', '🎵', '#98fb98', 'legendary', 'romantic', 300, 4),
('future_plan', 'Zukunftsplan', 'Unsere Träume und Pläne für die Zukunft', '🌟', '#f0e68c', 'epic', 'romantic', 150, 3),

-- Treats
('coffee_treat', 'Kaffee-Treat', 'Gönn dir einen leckeren Kaffee!', '☕', '#8B4513', 'common', 'treats', 15, 1),
('movie_night', 'Filmabend', 'Ein gemütlicher Filmabend für dich', '🎬', '#FF6B6B', 'rare', 'treats', 75, 2),
('book_treat', 'Buch-Treat', 'Kauf dir ein schönes Buch', '📚', '#4A90E2', 'rare', 'treats', 80, 2),
('dessert_treat', 'Dessert-Treat', 'Gönn dir etwas Süßes!', '🍰', '#FFB6C1', 'common', 'treats', 20, 1),

-- Experiences
('weekend_trip', 'Wochenendausflug', 'Ein kleiner Ausflug am Wochenende', '🚗', '#50C878', 'legendary', 'experiences', 500, 4),
('spa_day', 'Wellness-Tag', 'Ein entspannender Wellness-Tag', '🧖‍♀️', '#E6E6FA', 'epic', 'experiences', 200, 3),
('concert_tickets', 'Konzert-Tickets', 'Tickets für ein Konzert deiner Wahl', '🎤', '#FF69B4', 'legendary', 'experiences', 400, 4),

-- Special Items
('surprise_box', 'Überraschungsbox', 'Eine mysteriöse Box mit einer Überraschung', '🎁', '#FFD700', 'epic', 'special', 250, 3),
('wish_grant', 'Wunsch-Erfüllung', 'Ich erfülle dir einen besonderen Wunsch', '✨', '#9370DB', 'legendary', 'special', 1000, 4)
ON CONFLICT (id) DO NOTHING;

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_shop_items_rarity ON shop_items(rarity_order DESC, title ASC);
CREATE INDEX IF NOT EXISTS idx_user_shop_items_user_id ON user_shop_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_items_item_id ON user_shop_items(item_id); 