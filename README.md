# Patch Sheet — Komplett installations- och deploymentsguide

**Patch Sheet** är en enkel, realtidsbaserad webapp för att hantera "patch sheets" (t.ex. belysnings- eller scenpatchar) med delning, markeringar i realtid, historik och moderering.

Denna guide täcker **alla ändringar** som rekommenderats i felsökningen samt **steg-för-steg hur du lägger upp projektet på GitHub** och kopplar det till **Firebase + reCAPTCHA v3 (App Check)**.

---

## ✅ Vad har fixerats / förbättrats

1. **Firestore rules** (`firestore.rules`):
   - Förbättrad `update`-regel för `/state/marks` som är mer robust och inte förlitar sig på `diff()` (som kan vara opålitlig med `setDoc` + `merge: false`).
   - Tydligare kommentarer.
   - Skydd mot för stora maps.

2. **Cloud Functions** (`index.js`):
   - Cleanup-funktionen raderar nu korrekt både gamla `marks`-subcollection **och** nya `state`-subcollection + `history`.

3. **Admin-sidan** (`admin.html`):
   - Lösenordet är nu en tydlig placeholder som du **måste byta**.

4. **Allmänna förbättringar**:
   - Bättre dokumentation i koden.
   - Rekommendationer för App Check enforcement.

---

## 📋 Förutsättningar

- Node.js 20+ (för Firebase CLI och Functions)
- Git
- Ett Firebase-projekt (gratis Spark-plan räcker gott och väl)
- Google-reCAPTCHA v3 site key (gratis)

---

## 1. Skapa Firebase-projekt

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Skapa nytt projekt (t.ex. `patchsheet-dittnamn`)
3. **Välj region**: `europe-west1` (rekommenderas för Sverige/EU)
4. Aktivera **Firestore Database** (Native mode)
5. Aktivera **Authentication** → **Anonymous** (Sign-in method)
6. (Valfritt men rekommenderat) Aktivera **App Check** senare

---

## 2. Skapa Web App i Firebase

1. I Firebase Console → Project settings → **Your apps** → **Web app** (</> ikon)
2. Registrera appen (namn t.ex. "Patch Sheet Web")
3. Kopiera **Firebase config** (du behöver den senare)

---

## 3. Sätt upp reCAPTCHA v3 (App Check)

Detta skyddar din Firestore mot missbruk och är **krävt** för produktion.

1. Gå till [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin/create)
2. Välj **reCAPTCHA v3**
3. Lägg till domän(er):
   - `localhost` (för utveckling)
   - Din produktionsdomän (t.ex. `dittnamn.github.io` eller custom domain)
4. Kopiera **Site key** (du behöver den i `index.html`)
5. (Valfritt) Kopiera Secret key om du vill validera server-side senare

---

## 4. Uppdatera koden med dina värden

Öppna filerna i `/patchsheet/` och ersätt:

### `index.html` (längst upp i script-delen)

Hitta `FIREBASE_CONFIG` och `RECAPTCHA_V3_SITE_KEY`:

```js
const FIREBASE_CONFIG = {
  apiKey: "DIN_API_KEY",
  authDomain: "ditt-projekt.firebaseapp.com",
  projectId: "ditt-projekt-id",
  storageBucket: "ditt-projekt.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

const RECAPTCHA_V3_SITE_KEY = "DIN_RECAPTCHA_SITE_KEY";
```

**Viktigt**: App Check initieras tidigt i koden. Debug-token är aktiverat för localhost.

### `admin.html`

Byt ut:
- `FIREBASE_CONFIG` (samma som ovan)
- `ADMIN_PASSWORD = "BYT-DETTA-TILL-DITT-EGNA-LÖSENORD";`

---

## 5. Installera Firebase CLI och initiera projekt

```bash
npm install -g firebase-tools
firebase login
```

I projektmappen (`patchsheet/`):

```bash
firebase init
```

Välj:
- **Firestore** → Yes → välj befintligt projekt
- **Functions** → Yes (JavaScript) → välj `europe-west1`
- **Hosting** → Ja om du vill hosta på Firebase Hosting (rekommenderas)
- **Storage** → Nej (behövs inte)
- **Emulators** → Nej för nu

Detta skapar `firebase.json` och `.firebaserc`.

---

## 6. Deploya regler och funktioner

```bash
# Deploya Firestore rules + indexes
firebase deploy --only firestore

# Deploya Cloud Functions (cleanup + rapport-loggning)
firebase deploy --only functions
```

Kontrollera i Firebase Console → Functions att `cleanupOldPatches` och `onNewReport` finns.

---

## 7. Lägg upp på GitHub

### Steg-för-steg

1. Skapa nytt repo på GitHub (t.ex. `patchsheet`)
2. Initiera lokalt:

```bash
cd patchsheet
git init
git add .
git commit -m "Initial commit - Patch Sheet med Firebase + App Check"
git branch -M main
git remote add origin https://github.com/DITT_GITHUB/ditt-repo.git
git push -u origin main
```

### Rekommenderad `.gitignore`

Skapa filen `.gitignore` i roten:

```gitignore
# Firebase
.firebase/
firebase-debug.log

# Node / Functions
node_modules/
package-lock.json

# Lokala hemligheter / config (lägg ALDRIG upp riktiga nycklar)
.env
.env.local
config.local.js

# OS
.DS_Store
Thumbs.db

# Build / temporärt
dist/
build/
```

**Viktigt**: Lägg **aldrig** upp riktiga Firebase API-nycklar eller reCAPTCHA keys i GitHub om repot är publikt. Använd placeholders i koden + dokumentation hur man fyller i dem.

---

## 8. Firebase Hosting (rekommenderas)

Om du valde Hosting vid `firebase init`:

```bash
firebase deploy --only hosting
```

Din app blir tillgänglig på `https://ditt-projekt-id.web.app` eller `.firebaseapp.com`.

För custom domain:
- Firebase Console → Hosting → Add custom domain

---

## 9. GitHub Pages som alternativ (enklare men sämre prestanda)

1. Pusha koden till GitHub
2. Settings → Pages → Source: `main` branch → `/ (root)`
3. Appen blir tillgänglig på `https://dittnamn.github.io/patchsheet`

**Nackdel**: Inga serverless functions direkt (men Cloud Functions fungerar ändå eftersom de körs i Firebase).

---

## 10. Produktionshärdning (viktigt!)

### Aktivera App Check Enforce

1. Firebase Console → **App Check**
2. Välj Firestore → **Enforce**
3. Välj reCAPTCHA v3 provider
4. Sätt lämplig tröskel (t.ex. 0.5–0.7)

### Byt admin-lösenord

Uppdatera `admin.html` med ett starkt lösenord.

### Överväg Firebase Auth (bättre än klientsidigt lösenord)

För admin-sidan kan du senare lägga till email-länk eller custom claims istället för hårdkodat lösenord.

### Miljövariabler för Functions (valfritt)

Om du vill göra `MAX_AGE_DAYS` konfigurerbar:

```bash
firebase functions:config:set cleanup.max_age_days=30
```

Och läs i `index.js` med `functions.config()`.

---

## 11. Testning

### Lokalt

```bash
firebase emulators:start
```

Öppna `http://localhost:5000` (eller vad Hosting ger).

### Delad patch

1. Öppna `index.html`
2. Skapa en patch → **Dela**
3. Öppna länken i inkognito-fönster eller annan enhet
4. Markera fixtures → se realtidsuppdatering + historik

### Admin

Öppna `admin.html` → ange ditt lösenord → se statistik.

---

## 12. Vanliga problem & lösningar

| Problem | Lösning |
|---------|---------|
| App Check blockerar | Kontrollera att site key stämmer + debug token på localhost |
| Inga markeringar på gamla patches | De använder gamla schemat – nya patches funkar direkt |
| Cleanup raderar inte | Kontrollera att Functions är deployade i rätt region |
| För många reads | Använd `getCountFromServer` (redan gjort i admin) + App Check |
| reCAPTCHA error | Se till att domänen är registrerad i reCAPTCHA admin |

---

## Struktur efter setup

```
patchsheet/
├── index.html          # Huvudapp (klient)
├── admin.html          # Admin-vy (lösenordsskyddad)
├── firestore.rules     # Säkerhetsregler (uppdaterade)
├── firebase.json       # Firebase config
├── package.json        # Functions dependencies
├── index.js            # Cloud Functions (uppdaterade)
├── sw.js               # Service Worker
├── manifest.json       # PWA (lägg till om du vill)
├── icon-*.png          # App icons
└── README.md           # Denna guide
```

---

## Nästa steg / framtida förbättringar

- Lägg till Firebase Hosting + custom domain
- Implementera server-side validering av rapporter
- Bättre moderering (t.ex. auto-hide vid många rapporter)
- Dark/light mode toggle (redan delvis i koden)
- Exportera patch till PDF/Excel

---

**Lycka till!** Appen är nu säkrare, mer robust och redo för produktion.

Vid frågor eller vidareutveckling – kontakta utvecklaren eller öppna issue på GitHub-repot.

---

*Denna guide + alla kodändringar genererades 2026-06-30 baserat på fullständig felsökning av den ursprungliga implementationen.*
