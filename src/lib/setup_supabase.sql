-- Erweiterung für HTTP-Requests aktivieren (nur einmal nötig)
create extension if not exists http;

-- Bestehende Tabellen löschen (falls vorhanden)
DROP TABLE IF EXISTS daily_messages_read CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS mood_streaks CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS event_log CASCADE;

-- Tabelle für Users
CREATE TABLE users (
  user_id text PRIMARY KEY,
  points int DEFAULT 0,
  ownedTreasures text[] DEFAULT '{}'
);

-- Tabelle für Purchases
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  treasure_id text NOT NULL,
  purchased_at timestamp with time zone DEFAULT now()
);

-- Tabelle für Achievements
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  key text NOT NULL,
  unlocked_at timestamp with time zone DEFAULT now()
);

-- Tabelle für Mood-Streaks
CREATE TABLE mood_streaks (
  user_id text PRIMARY KEY,
  current_streak int DEFAULT 0,
  last_mood text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabelle für gelesene Nachrichten
CREATE TABLE daily_messages_read (
  user_id text NOT NULL,
  message_date date,
  read_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, message_date)
);

-- (Optional) Event-Log
CREATE TABLE event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  type text,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Funktion für Telegram-Benachrichtigung bei Achievement
CREATE OR REPLACE FUNCTION notify_telegram_achievement()
RETURNS trigger AS $$
BEGIN
  BEGIN
    PERFORM
      http_post(
        'https://api.telegram.org/bot7609212291:AAEXP3UzJGdF5kni09qiDK8-Dn5oA1wU7K4/sendMessage',
        json_build_object(
          'chat_id', '5458722688',
          'text', '🎉 Deine Freundin hat ein Achievement freigeschaltet: ' || NEW.key
        )::text,
        'application/json'
      );
  EXCEPTION WHEN OTHERS THEN
    -- Ignore HTTP errors silently
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für Achievements
CREATE TRIGGER on_achievement_insert
AFTER INSERT ON achievements
FOR EACH ROW EXECUTE FUNCTION notify_telegram_achievement();

-- Funktion für Telegram-Benachrichtigung bei Mood-Streak
CREATE OR REPLACE FUNCTION notify_telegram_streak()
RETURNS trigger AS $$
BEGIN
  BEGIN
    PERFORM
      http_post(
        'https://api.telegram.org/bot7609212291:AAEXP3UzJGdF5kni09qiDK8-Dn5oA1wU7K4/sendMessage',
        json_build_object(
          'chat_id', '5458722688',
          'text', '🔥 Mood-Streak erreicht: ' || NEW.current_streak
        )::text,
        'application/json'
      );
  EXCEPTION WHEN OTHERS THEN
    -- Ignore HTTP errors silently
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für Mood-Streaks
CREATE TRIGGER on_streak_update
AFTER UPDATE ON mood_streaks
FOR EACH ROW
WHEN (NEW.current_streak > OLD.current_streak)
EXECUTE FUNCTION notify_telegram_streak();

-- Funktion für Telegram-Benachrichtigung bei gelesener Nachricht
CREATE OR REPLACE FUNCTION notify_telegram_message()
RETURNS trigger AS $$
BEGIN
  BEGIN
    PERFORM
      http_post(
        'https://api.telegram.org/bot7609212291:AAEXP3UzJGdF5kni09qiDK8-Dn5oA1wU7K4/sendMessage',
        json_build_object(
          'chat_id', '5458722688',
          'text', '📬 Tägliche Nachricht gelesen am: ' || NEW.message_date
        )::text,
        'application/json'
      );
  EXCEPTION WHEN OTHERS THEN
    -- Ignore HTTP errors silently
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für gelesene Nachrichten
CREATE TRIGGER on_message_read
AFTER INSERT ON daily_messages_read
FOR EACH ROW EXECUTE FUNCTION notify_telegram_message();
