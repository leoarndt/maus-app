INSERT INTO achievements (key, title, description, rarity, reward_points, type, condition) VALUES
('hihi 1. login', 'Erster gemeinsamer Login.', 'common', 50, 'login', '{"login_streak": 1}'::jsonb),
('Streaky Mouse', '7 Tage in Folge eingeloggt.', 'common', 100, 'login', '{"login_streak": 7}'::jsonb),
('keeping up', '14 Tage Streak. Wir halten durch!', 'rare', 150, 'login', '{"login_streak": 14}'::jsonb),
('daily vibes', '30 Tage hintereinander online.', 'rare', 250, 'login', '{"login_streak": 30}'::jsonb),
('Streak Machine', '50 Tage ununterbrochen aktiv.', 'epic', 400, 'login', '{"login_streak": 50}'::jsonb),
('going daily', '100 Tage – kein Tag vergessen.', 'epic', 600, 'login', '{"login_streak": 100}'::jsonb),
('Unstoppmaus', '150 Tage in Folge online. Wahnsinn!', 'legendary', 1000, 'login', '{"login_streak": 150}'::jsonb),
('First Contact', 'Erstes Login ever.', 'common', 60, 'login', '{"logins": 1}'::jsonb),
('Session Seeker', '10 Logins.', 'common', 120, 'login', '{"logins": 10}'::jsonb),
('Loyal Soul', '50 Mal verbunden.', 'rare', 250, 'login', '{"logins": 50}'::jsonb),
('Mausi logged in', '100 Logins insgesamt!', 'epic', 500, 'login', '{"logins": 100}'::jsonb),
('Rätselstarter', '7 Tage in Folge geknobelt.', 'rare', 150, 'puzzle', '{"puzzle_streak": 7}'::jsonb),
('Puzzle Marathon', '30 Tage Puzzle-Streak!', 'epic', 400, 'puzzle', '{"puzzle_streak": 30}'::jsonb),
('Mausi und das Rätsel', 'Dein erstes Rätsel gemeistert.', 'common', 80, 'puzzle', '{"puzzles_solved": 1}'::jsonb),
('Knobelqueen', '10 Rätsel gelöst.', 'rare', 200, 'puzzle', '{"puzzles_solved": 10}'::jsonb),
('Mausverstand', '50 Rätsel geknackt.', 'epic', 400, 'puzzle', '{"puzzles_solved": 50}'::jsonb),
('Rätsellegende', '100 Rätsel – Rekord!', 'legendary', 750, 'puzzle', '{"puzzles_solved": 100}'::jsonb),
('Mood Motion', '7 Tage am Stück deine Stimmung geteilt.', 'rare', 120, 'mood', '{"mood_streak": 7}'::jsonb),
('Echo Inside', 'Erste Stimmung festgehalten.', 'common', 60, 'mood', '{"moods_tracked": 1}'::jsonb),
('Gefühlsmensch', '10x Emotion geteilt.', 'rare', 150, 'mood', '{"moods_tracked": 10}'::jsonb),
('Heartcast', '50 Einträge im Stimmungsbuch.', 'epic', 300, 'mood', '{"moods_tracked": 50}'::jsonb),
('Emotionsexpertin', '100 Stimmungsupdates! Stark.', 'legendary', 600, 'mood', '{"moods_tracked": 100}'::jsonb),
('Liebeslink', '7 Tage in Folge Nachrichten gesendet.', 'rare', 120, 'message', '{"love_messages_streak": 7}'::jsonb),
('erste Zeile', 'Erste Nachricht gelesen.', 'common', 50, 'message', '{"messages_read": 1}'::jsonb),
('Post-Maus', '10 Nachrichten konsumiert.', 'common', 100, 'message', '{"messages_read": 10}'::jsonb),
('Augen auf', '50 Nachrichten durchstöbert.', 'rare', 250, 'message', '{"messages_read": 50}'::jsonb),
('Inbox Master', '100 Nachrichten gecheckt.', 'epic', 400, 'message', '{"messages_read": 100}'::jsonb),
('Offline Heartbeat', 'Gute-Nacht-Nachricht versendet.', 'rare', 180, 'message', '{"sent_goodnight": 1}'::jsonb),
('Ink and Intention', 'Handgeschriebener Brief geschickt. Beweisbild notwendig!', 'epic', 300, 'manual', '{"manual_event": "handwritten_letter"}'::jsonb),
('Liebe um die Welt', 'Brief international verschickt. Beweisbild notwendig!', 'legendary', 500, 'manual', '{"manual_event": "letter_abroad"}'::jsonb),
('Textkunst', 'Besonders poetische Nachricht verfasst. Beweisbild notwendig!', 'epic', 250, 'manual', '{"manual_event": "poetic_message"}'::jsonb),
('Couch Connection', 'Netflix Date durchgezogen. Beweisbild notwendig!', 'rare', 200, 'manual', '{"manual_event": "netflix_together"}'::jsonb),
('Call me Mausi', 'Gemeinsamer Anruf gestartet – Verbindung pur. Beweisbild notwendig!', 'rare', 200, 'manual', '{"manual_event": "call_started"}'::jsonb),
('Outfit-Check', 'Du hast dein Outfit gezeigt – Fashion Queen! Beweisbild notwendig!', 'rare', 180, 'manual', '{"manual_event": "outfit_photo"}'::jsonb),
('heh', 'Ja, du weißt was du geschickt hast. ;) Beweisbild notwendig!', 'epic', 300, 'manual', '{"manual_event": "boobs"}'::jsonb),
('Oskar Besuch 1', 'Oskar zum ersten Mal besucht. Beweisbild notwendig!', 'rare', 150, 'manual', '{"manual_event": "oskar_visited_1"}'::jsonb),
('Oskar Besuch 10', '10x Oskar besucht – das ist Liebe! Beweisbild notwendig!', 'epic', 300, 'manual', '{"manual_event": "oskar_visited_10"}'::jsonb),
('Oskar Besuch 30', '30x Oskar gesehen! 🐶 Du bist Stammgast. Beweisbild notwendig!', 'legendary', 700, 'manual', '{"manual_event": "oskar_visited_30"}'::jsonb),
('Mini Punkte', '100 Punkte erreicht.', 'common', 100, 'points', '{"points_earned": 100}'::jsonb),
('Belohnungskonto', '1000 Punkte – wow!', 'epic', 1000, 'points', '{"points_earned": 1000}'::jsonb),
('1250 Tage Liebe', 'Seit 1250 Tagen in Liebe verbunden.', 'epic', 800, 'date', '{"date_unlock": "2025-07-23"}'::jsonb),
('3,5 Jahre', '3,5 Jahre zusammen – krass!', 'legendary', 1500, 'date', '{"date_unlock": "2025-08-19"}'::jsonb),
('Überfliegerin', '10 Achievements an einem Tag!', 'epic', 600, 'meta', '{"daily_achievements": 10}'::jsonb),
('bro zieht durch', 'Alle Achievements gesammelt.', 'legendary', 5000, 'meta', '{"achievements_unlocked": 60}'::jsonb),
('Hamsti Klick 10', 'Du hast 10x den Hamsti geklickt!', 'common', 50, 'hamsti_clicker', '{"hamsti_clicks": 10}'::jsonb),
('Hamsti Klick 100', '100 Hamsti-Klicks – du bist im Flow!', 'common', 100, 'hamsti_clicker', '{"hamsti_clicks": 100}'::jsonb),
('Hamsti Klick 1K', '1000 Klicks auf Hamsti – Respekt!', 'rare', 200, 'hamsti_clicker', '{"hamsti_clicks": 1000}'::jsonb),
('Hamsti Wahnsinn', '2500 Klicks – deine Maus glüht!', 'epic', 400, 'hamsti_clicker', '{"hamsti_clicks": 2500}'::jsonb),
('Hamsti Heldin', '5000 Klicks – wow.', 'epic', 600, 'hamsti_clicker', '{"hamsti_clicks": 5000}'::jsonb),
('Hamsti Göttin', '10.000 Klicks – du bist nicht zu stoppen!', 'legendary', 1200, 'hamsti_clicker', '{"hamsti_clicks": 10000}'::jsonb);
