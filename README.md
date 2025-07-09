# Maus - Daily Message App

Eine React-basierte Anwendung für tägliche Nachrichten mit Achievement-System.

## 🚀 Features

- **Tägliche Nachrichten**: Erhalte jeden Tag eine neue inspirierende Nachricht
- **Achievement-System**: Sammle Achievements durch das Lesen von Nachrichten
- **Benutzerauthentifizierung**: Sichere Anmeldung und Benutzerverwaltung
- **Moderne UI**: Schönes, responsives Design mit Gradienten und Animationen
- **Supabase Integration**: Backend-Datenbank für Benutzer und Nachrichten

## 🛠️ Technologie-Stack

- **Frontend**: React 18 mit TypeScript
- **Build Tool**: Vite
- **Styling**: Inline CSS mit modernen Gradienten
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## 📦 Installation

1. **Repository klonen**:
   ```bash
   git clone <repository-url>
   cd maus
   ```

2. **Dependencies installieren**:
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**:
   Erstelle eine `.env` Datei im Root-Verzeichnis:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Entwicklungsserver starten**:
   ```bash
   npm run dev
   ```

## 🗄️ Datenbank-Setup

Die Anwendung verwendet Supabase als Backend. Führe die SQL-Skripte in der Supabase SQL Editor aus:

1. `reset_and_setup_maus_db.sql` - Hauptdatenbank-Setup
2. `consolidated_users_table.sql` - Benutzer-Tabelle
3. `migrate_users_data.sql` - Datenmigration (falls benötigt)

## 📁 Projektstruktur

```
src/
├── features/
│   ├── achievements/     # Achievement-System
│   ├── auth/            # Authentifizierung
│   ├── dailyMessage/    # Tägliche Nachrichten
│   └── ...
├── lib/
│   └── supabase.ts      # Supabase Client
└── ...
```

## 🎯 Verwendung

1. **Registrierung/Anmeldung**: Benutzer können sich registrieren oder anmelden
2. **Tägliche Nachricht**: Jeden Tag wird eine neue Nachricht zugewiesen
3. **Nachricht lesen**: Klicke auf "Als gelesen markieren" um die Nachricht zu lesen
4. **Achievements**: Sammle Achievements durch das Lesen von Nachrichten

## 🏗️ Build

```bash
# Production Build
npm run build

# Build Preview
npm run preview
```

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT Lizenz lizenziert.

## 👨‍💻 Autor

Entwickelt mit ❤️ für tägliche Inspiration. 