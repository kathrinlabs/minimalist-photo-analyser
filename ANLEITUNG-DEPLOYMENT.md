# Schritt-für-Schritt Deployment-Anleitung
## GitHub + Netlify — für Einsteiger

---

## Was du brauchst

- Deinen **Anthropic API-Key** (beginnt mit `sk-ant-...`)
- Einen Computer mit Internetverbindung
- Ca. 15 Minuten Zeit

---

## TEIL 1 — GitHub-Account erstellen

GitHub ist eine Plattform, auf der du deinen Code speicherst — wie eine Dropbox, aber für Programmierdateien.

### Schritt 1: Account erstellen

1. Gehe auf [github.com](https://github.com)
2. Klicke oben rechts auf **Sign up**
3. Gib eine E-Mail-Adresse, ein Passwort und einen Benutzernamen ein
4. Bestätige deine E-Mail-Adresse (GitHub schickt dir eine E-Mail)

### Schritt 2: Neues Repository erstellen

Ein "Repository" ist ein Ordner auf GitHub, der dein Projekt enthält.

1. Klicke oben rechts auf das **+** Symbol → **New repository**
2. Gib dem Repository einen Namen, z.B. `minimalist-photo-analyser`
3. Stelle sicher, dass **Public** ausgewählt ist
4. Klicke auf **Create repository**

### Schritt 3: Dateien hochladen

1. Auf der Repository-Seite siehst du einen Link **uploading an existing file** — klicke darauf
2. Entpacke das ZIP-Paket `minimalist-photo-analyser-netlify.zip` auf deinem Computer
3. Öffne den entpackten Ordner `netlify-photo-analyser`
4. Ziehe **alle Dateien und Ordner** aus diesem Ordner in das Upload-Fenster von GitHub:
   - `index.html`
   - `netlify.toml`
   - `package.json`
   - `.gitignore`
   - `README.md`
   - Den ganzen Ordner `netlify/` (mit `functions/analyse.js` und `functions/package.json` darin)
5. Scrolle nach unten und klicke auf **Commit changes**

> **Wichtig:** Der Ordner `netlify/functions/` muss genau so hochgeladen werden — GitHub zeigt ihn als Unterordner an.

---

## TEIL 2 — Netlify-Account erstellen und verbinden

Netlify ist der Hosting-Dienst, der deine App öffentlich zugänglich macht und die Serverless Function ausführt.

### Schritt 4: Netlify-Account erstellen

1. Gehe auf [app.netlify.com](https://app.netlify.com)
2. Klicke auf **Sign up**
3. Wähle **Sign up with GitHub** — so sind die beiden Konten direkt verbunden
4. Bestätige die Verbindung

### Schritt 5: Neue Site aus GitHub erstellen

1. Im Netlify Dashboard klicke auf **Add new site** → **Import an existing project**
2. Wähle **Deploy with GitHub**
3. Erlaube Netlify den Zugriff auf dein GitHub-Konto (falls gefragt)
4. Wähle dein Repository `minimalist-photo-analyser` aus der Liste
5. Im nächsten Schritt (Build settings) musst du **nichts ändern** — Netlify liest alles automatisch aus der `netlify.toml`
6. Klicke auf **Deploy site**

Netlify beginnt jetzt mit dem ersten Deployment. Das dauert ca. 1–2 Minuten.

### Schritt 6: Anthropic API-Key als Environment Variable setzen

Das ist der wichtigste Schritt — hier gibst du deinen API-Key ein, ohne dass er je im Code sichtbar ist.

1. Klicke im Netlify Dashboard auf deine neue Site
2. Gehe zu **Site configuration** (oder **Site settings**) in der linken Navigation
3. Klicke auf **Environment variables**
4. Klicke auf **Add a variable**
5. Fülle die Felder so aus:

   | Feld | Wert |
   |------|------|
   | **Key** | `ANTHROPIC_API_KEY` |
   | **Value** | `sk-ant-...` (dein kompletter API-Key) |

6. Klicke auf **Save**

### Schritt 7: Neues Deployment auslösen

Damit die Environment Variable aktiv wird, muss einmal neu deployed werden:

1. Gehe im Netlify Dashboard zu **Deploys**
2. Klicke auf **Trigger deploy** → **Deploy site**
3. Warte ca. 1–2 Minuten

### Schritt 8: App aufrufen

Nach dem Deployment siehst du oben im Dashboard eine URL wie:
`https://dein-name-12345.netlify.app`

Klicke darauf — deine App ist live! 🎉

---

## Fertig!

Deine App ist jetzt öffentlich zugänglich. Der Anthropic API-Key ist sicher in der Netlify-Umgebung gespeichert und wird **niemals** im Browser des Users angezeigt.

### Was passiert bei jeder Analyse:
1. User lädt Foto hoch → Browser
2. Browser sendet Foto an `/.netlify/functions/analyse` → Netlify Server
3. Netlify Server liest `ANTHROPIC_API_KEY` aus der Umgebung (unsichtbar für User)
4. Netlify Server fragt Claude Sonnet 4.6 → Anthropic API
5. Analyse kommt zurück → wird im Browser angezeigt

---

## Bei Problemen

- **"Function not found"**: Stelle sicher, dass der Ordner `netlify/functions/analyse.js` korrekt hochgeladen wurde
- **"API key not set"**: Überprüfe, ob `ANTHROPIC_API_KEY` korrekt als Environment Variable gesetzt ist (ohne Leerzeichen)
- **Analyse schlägt fehl**: Prüfe, ob dein Anthropic API-Key noch gültig ist und Guthaben vorhanden ist
