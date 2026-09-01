# Profilbild-Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mitglieder können auf "Mein Profil" ein eigenes Foto hochladen; es ersetzt den Buchstaben-Kreis-Platzhalter auf "Mein Profil", in der Mitgliederliste, im Mitglied-Modal und im Topbar-Profil-Button.

**Architecture:** `profiles.profilbild_url` existiert bereits (siehe `supabase/schema.sql`) und wird bereits von `public_profiles` mit ausgegeben. Bilder liegen im neuen öffentlichen Storage-Bucket `avatars` (`supabase/013-avatar-storage-bucket.sql`, bereits committed) unter dem festen Pfad `<user-id>.jpg`. Ein neuer generischer Helfer `setAvatarDisplay(element, url, fallbackText)` in `js/site-chrome.js` schaltet an allen vier Anzeige-Orten zwischen Foto (CSS `background-image`) und Buchstaben-Kreis (Text) um — keine neuen `<img>`-Elemente nötig, die bestehenden Kreis-Elemente bekommen einfach ein Hintergrundbild. Hochladen läuft komplett clientseitig: Canvas-API schneidet zentriert zu und verkleinert auf 200×200px JPEG, dann `supabase.storage.from('avatars').upload(...)`.

**Tech Stack:** Vanilla JS, Supabase JS SDK (`supabaseClient` aus `js/supabase-client.js`), Canvas-API, kein Build-Schritt.

**Spec:** [docs/superpowers/specs/2026-09-01-profilbild-upload-design.md](../specs/2026-09-01-profilbild-upload-design.md)

## Global Constraints

- Bildgrösse: 200×200px, JPEG, ~80% Qualität (aus Spec).
- Bucket-Dateiname immer exakt `<user-id>.jpg` (aus Spec, Migration bereits so geschrieben).
- Client-seitige Grenzen vor der Verarbeitung: nur `image/*`-MIME-Typen, Originaldatei max. 10 MB.
- Kein eigener Zuschneide-Dialog (aus Spec, bewusst ausgeschlossen).
- 4-Leerzeichen-Einrückung, deutsche Kommentare/Texte, camelCase für JS (Projekt-Codestil aus `CLAUDE.md`).
- Dieses Projekt hat keine automatisierte Test-Suite (reine statische Seite ohne Build-Schritt) — Verifikation läuft überall manuell im Browser, wie im Rest von `CLAUDE.md` dokumentiert ("Getestet: ..."), nicht per `pytest`/`jest`.
- Die Storage-Migration `supabase/013-avatar-storage-bucket.sql` muss vor dem Testen des Uploads manuell im Supabase-Dashboard ausgeführt worden sein (liegt ausserhalb der Kontrolle dieses Plans — beim Testen prüfen, ob sie schon lief; falls nicht, den Nutzer bitten, sie auszuführen).

---

### Task 1: Generischer Avatar-Anzeige-Helfer

**Files:**
- Modify: `js/site-chrome.js` (neue Funktion, gleiche Stelle wie `wireDraftInputs`/`clearDraft`, ganz oben vor den Custom-Element-Klassen)

**Interfaces:**
- Produces: `setAvatarDisplay(element, url, fallbackText)` — globale Funktion. `element`: DOM-Element (z.B. ein `.person-img-placeholder`- oder `.mitglieder-avatar`-Div/Span). `url`: String oder `null`/`undefined`. `fallbackText`: String (Anfangsbuchstabe). Setzt bei vorhandener `url` `element.style.backgroundImage`/`backgroundSize`/`backgroundPosition` und leert `element.textContent`; bei fehlender `url` setzt es `element.style.backgroundImage = ''` zurück und schreibt `fallbackText` in `element.textContent`.

- [ ] **Step 1: Funktion ergänzen**

In `js/site-chrome.js`, direkt nach der bestehenden `clearDraft`-Funktion (vor `class SiteTopbar`):

```javascript
// Schaltet an allen Avatar-Anzeige-Orten (Mein Profil, Mitgliederliste,
// Mitglied-Modal, Topbar-Profil-Button) zwischen echtem Foto und dem
// bisherigen Buchstaben-Kreis um. Nutzt bewusst ein CSS-Hintergrundbild auf
// dem bestehenden Kreis-Element statt eines zusaetzlichen <img>-Tags - alle
// vier Orte haben schon ein rundes, fest bemassenes Element mit Text
// (Anfangsbuchstabe) drin, ein Hintergrundbild deckt das exakt gleich ab,
// ohne Markup-Aenderungen an den jeweiligen Templates.
function setAvatarDisplay(element, url, fallbackText) {
    if (!element) return;
    if (url) {
        element.style.backgroundImage = `url(${url})`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
        element.textContent = '';
    } else {
        element.style.backgroundImage = '';
        element.textContent = fallbackText;
    }
}
```

- [ ] **Step 2: Manuell im Browser pruefen**

`js/site-chrome.js` laedt vor allem anderen - kein separater Testschritt noetig, die Funktion wird erst in Task 2-4 tatsaechlich aufgerufen und dort mitgeprueft.

- [ ] **Step 3: Commit**

```bash
git add js/site-chrome.js
git commit -m "Generischen setAvatarDisplay()-Helfer fuer Profilbilder ergaenzen"
```

---

### Task 2: Upload/Verkleinerung/Entfernen auf "Mein Profil"

**Files:**
- Modify: `pages/mein-profil.html` (Datei-Eingabe + "Entfernen"-Button ergaenzen)
- Modify: `js/main.js` (Resize/Upload/Entfernen-Logik, `loadOwnProfileIntoForm`, `clearProfileForm`)
- Modify: `css/components.css` (Cursor/Klick-Optik fuer den Platzhalter, Styling fuer den neuen "Entfernen"-Link)

**Interfaces:**
- Consumes: `setAvatarDisplay(element, url, fallbackText)` aus Task 1.
- Produces: `handleAvatarFileSelected(event)`, `removeProfileAvatar()` — beide global, ans HTML verdrahtet. `resizeImageToJpeg(file)` — `async function`, nimmt ein `File`-Objekt, liefert `Promise<Blob>` (200×200 JPEG). Diese drei Funktionen werden von keiner anderen Task gebraucht.

- [ ] **Step 1: Markup in `pages/mein-profil.html` ergaenzen**

Ersetze:
```html
            <div class="person-img-placeholder" id="profileAvatarPlaceholder" aria-hidden="true"></div>
```
durch:
```html
            <div class="person-img-placeholder" id="profileAvatarPlaceholder" role="button" tabindex="0" aria-label="Profilbild ändern" onclick="document.getElementById('profileAvatarInput').click()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();document.getElementById('profileAvatarInput').click();}"></div>
            <input type="file" id="profileAvatarInput" accept="image/*" hidden onchange="handleAvatarFileSelected(event)">
            <button type="button" class="profile-avatar-remove" id="profileAvatarRemove" hidden onclick="removeProfileAvatar()">Foto entfernen</button>
            <p class="form-error" id="avatarError" hidden></p>
```

- [ ] **Step 2: CSS ergaenzen**

In `css/components.css`, direkt nach der bestehenden `.person-img-placeholder`-Regel:

```css
.person-img-placeholder[role="button"] {
    cursor: pointer;
}

.profile-avatar-remove {
    display: block;
    margin: 0 auto 18px;
    background: none;
    border: none;
    padding: 0;
    color: var(--aurora-red);
    font-size: 0.85rem;
    text-decoration: underline;
    cursor: pointer;
}
```

- [ ] **Step 3: Resize-Funktion in `js/main.js` ergaenzen**

Direkt vor `async function handleProfileSubmit(event) {`:

```javascript
// Schneidet das ausgewaehlte Bild zentriert auf ein Quadrat zu und
// verkleinert es auf 200x200px JPEG (~80% Qualitaet) - siehe Spec, deckt
// auch den groessten aktuellen Avatar-Anzeigeort (140px, Retina) komfortabel
// ab, ohne einen eigenen Zuschneide-Dialog zu brauchen.
async function resizeImageToJpeg(file) {
    const bitmap = await createImageBitmap(file);
    const seite = Math.min(bitmap.width, bitmap.height);
    const startX = (bitmap.width - seite) / 2;
    const startY = (bitmap.height - seite) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, startX, startY, seite, seite, 0, 0, 200, 200);

    return new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
}
```

- [ ] **Step 4: Upload-Handler ergaenzen**

Direkt nach `resizeImageToJpeg`:

```javascript
async function handleAvatarFileSelected(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;

    const errorEl = document.getElementById('avatarError');
    errorEl.hidden = true;

    if (!file.type.startsWith('image/')) {
        errorEl.textContent = 'Bitte eine Bilddatei auswaehlen.';
        errorEl.hidden = false;
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        errorEl.textContent = 'Die Datei ist zu gross (max. 10 MB).';
        errorEl.hidden = false;
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    const blob = await resizeImageToJpeg(file);
    const dateiname = `${user.id}.jpg`;

    const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(dateiname, blob, { upsert: true, contentType: 'image/jpeg' });
    if (uploadError) {
        errorEl.textContent = 'Hochladen fehlgeschlagen: ' + uploadError.message;
        errorEl.hidden = false;
        return;
    }

    // Cache-Buster als Query-Parameter, damit ein neu hochgeladenes Foto
    // sofort angezeigt wird, statt dass der Browser die alte Version unter
    // derselben URL aus dem Cache zeigt.
    const { data: { publicUrl } } = supabaseClient.storage.from('avatars').getPublicUrl(dateiname);
    const url = `${publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabaseClient
        .from('profiles')
        .update({ profilbild_url: url })
        .eq('id', user.id);
    if (dbError) {
        errorEl.textContent = 'Speichern fehlgeschlagen: ' + dbError.message;
        errorEl.hidden = false;
        return;
    }

    setAvatarDisplay(document.getElementById('profileAvatarPlaceholder'), url, '');
    document.getElementById('profileAvatarRemove').hidden = false;
}

async function removeProfileAvatar() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    await supabaseClient.storage.from('avatars').remove([`${user.id}.jpg`]);
    await supabaseClient.from('profiles').update({ profilbild_url: null }).eq('id', user.id);

    const name = document.getElementById('profileName').value;
    setAvatarDisplay(document.getElementById('profileAvatarPlaceholder'), null, (name || document.getElementById('profileEmail').value).charAt(0).toUpperCase());
    document.getElementById('profileAvatarRemove').hidden = true;
}
```

- [ ] **Step 5: `loadOwnProfileIntoForm` und `clearProfileForm` anpassen**

In `loadOwnProfileIntoForm`, das `select(...)` erweitern und die Avatar-Anzeige umstellen. Ersetze:
```javascript
        .select('name, email, email_oeffentlich, instagram, tiktok')
```
durch:
```javascript
        .select('name, email, email_oeffentlich, instagram, tiktok, profilbild_url')
```

Ersetze den bestehenden Avatar-Block:
```javascript
    const avatarPlaceholder = document.getElementById('profileAvatarPlaceholder');
    if (avatarPlaceholder) {
        avatarPlaceholder.textContent = (profile?.name || session.user.email).charAt(0).toUpperCase();
    }
```
durch:
```javascript
    const avatarPlaceholder = document.getElementById('profileAvatarPlaceholder');
    if (avatarPlaceholder) {
        setAvatarDisplay(avatarPlaceholder, profile?.profilbild_url, (profile?.name || session.user.email).charAt(0).toUpperCase());
    }
    document.getElementById('profileAvatarRemove').hidden = !profile?.profilbild_url;
```

(Der bereits bestehende zweite Avatar-Block direkt darunter, der nach dem `wireDraftInputs`-Aufruf den Anfangsbuchstaben aus dem gerade wiederhergestellten Namensfeld erneut setzt, bleibt unveraendert bestehen — er greift nur, wenn `avatarPlaceholder` existiert, und ueberschreibt den Buchstaben nach einem lokalen Namens-Entwurf; ein vorhandenes Foto wird dabei nicht beruehrt, da dieser Block nur `textContent` setzt und `setAvatarDisplay` das Hintergrundbild separat verwaltet.)

In `clearProfileForm`, direkt nach der bestehenden `avatarPlaceholder`-Zeile (`if (avatarPlaceholder) avatarPlaceholder.textContent = '';`) ergaenzen:
```javascript
    document.getElementById('profileAvatarRemove').hidden = true;
```

- [ ] **Step 6: Manuell im Browser pruefen**

Voraussetzung: `supabase/013-avatar-storage-bucket.sql` wurde im Supabase-Dashboard ausgefuehrt.

1. Lokalen Server starten (`node <scratchpad>/serve.js . 8834` o.ae.), `pages/mein-profil.html` im Browser oeffnen, einloggen.
2. Auf den Avatar-Kreis klicken, ein Testbild auswaehlen.
3. Pruefen: Avatar-Kreis zeigt danach das Foto, "Foto entfernen"-Link erscheint.
4. Seite neu laden - Foto bleibt sichtbar (kommt jetzt aus `profiles.profilbild_url`).
5. Im Supabase-Dashboard (Storage) pruefen: Datei `<user-id>.jpg` liegt im `avatars`-Bucket.
6. "Foto entfernen" klicken - Avatar-Kreis zeigt wieder den Buchstaben, Link verschwindet.
7. Eine Nicht-Bilddatei auswaehlen (z.B. eine `.txt`) - Fehlermeldung "Bitte eine Bilddatei auswaehlen." erscheint, kein Upload-Versuch.

- [ ] **Step 7: Commit**

```bash
git add pages/mein-profil.html js/main.js css/components.css
git commit -m "Profilbild-Upload auf Mein Profil ergaenzen (Verkleinerung, Speichern, Entfernen)"
```

---

### Task 3: Anzeige in Mitgliederliste und Mitglied-Modal

**Files:**
- Modify: `js/mitglieder.js`

**Interfaces:**
- Consumes: `setAvatarDisplay(element, url, fallbackText)` aus Task 1. Erwartet auf jedem Mitglieder-Objekt ein neues Feld `profilbildUrl` (String oder `null`), zusaetzlich zu den bereits vorhandenen Feldern (`id`, `name`, `initial`, `isSelf`, `rollen`, `email`, `instagram`, `tiktok`).

- [ ] **Step 1: `profilbildUrl` beim Laden mitgeben**

In `loadMitgliederListe`, im `.map(...)`-Aufruf (die `select(...)`-Query fragt `profilbild_url` bereits ab, muss nur noch ins Objekt uebernommen werden). Ersetze:
```javascript
    alleMitglieder = data.map(p => ({
        id: p.id,
        name: p.name,
        initial: p.name.charAt(0).toUpperCase(),
        isSelf: p.id === session.user.id,
        rollen: p.rollen,
        email: p.email,
        instagram: p.instagram,
        tiktok: p.tiktok
    }));
```
durch:
```javascript
    alleMitglieder = data.map(p => ({
        id: p.id,
        name: p.name,
        initial: p.name.charAt(0).toUpperCase(),
        isSelf: p.id === session.user.id,
        rollen: p.rollen,
        email: p.email,
        instagram: p.instagram,
        tiktok: p.tiktok,
        profilbildUrl: p.profilbild_url
    }));
```

- [ ] **Step 2: Karten in der Mitgliederliste**

In `renderMitgliederGrid`, den bestehenden Klick-Handler-Loop erweitern (die Avatar-Div bleibt im Template unveraendert, sie zeigt anfangs immer den Buchstaben - das Hintergrundbild wird direkt danach fuer die Mitglieder mit Foto nachgetragen). Ersetze:
```javascript
    grid.querySelectorAll('.mitglieder-card').forEach(card => {
        const member = mitglieder[Number(card.dataset.index)];
        const open = () => openMitgliedModal(member);
        card.addEventListener('click', open);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
            }
        });
    });
```
durch:
```javascript
    grid.querySelectorAll('.mitglieder-card').forEach(card => {
        const member = mitglieder[Number(card.dataset.index)];
        setAvatarDisplay(card.querySelector('.mitglieder-avatar'), member.profilbildUrl, member.initial);
        const open = () => openMitgliedModal(member);
        card.addEventListener('click', open);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
            }
        });
    });
```

- [ ] **Step 3: Mitglied-Modal**

In `openMitgliedModal`, ersetze:
```javascript
    document.getElementById('mitgliedModalAvatar').textContent = m.initial;
```
durch:
```javascript
    setAvatarDisplay(document.getElementById('mitgliedModalAvatar'), m.profilbildUrl, m.initial);
```

- [ ] **Step 4: Manuell im Browser pruefen**

1. `pages/mitglieder.html` eingeloggt oeffnen (Voraussetzung: mindestens ein Mitglied hat in Task 2 bereits ein Foto hochgeladen).
2. Pruefen: Die Karte dieses Mitglieds zeigt das Foto statt des Buchstabens, alle anderen Karten zeigen weiterhin ihren Buchstaben.
3. Auf die Foto-Karte klicken - das Modal zeigt ebenfalls das Foto (gross, `.mitglieder-avatar-lg`).
4. Auf eine Karte ohne Foto klicken - Modal zeigt weiterhin den Buchstaben.

- [ ] **Step 5: Commit**

```bash
git add js/mitglieder.js
git commit -m "Profilbild in Mitgliederliste und Mitglied-Modal anzeigen"
```

---

### Task 4: Anzeige im Topbar-Profil-Button

**Files:**
- Modify: `js/main.js` (`updateProfileToggleUI`)

**Interfaces:**
- Consumes: `setAvatarDisplay(element, url, fallbackText)` aus Task 1.

- [ ] **Step 1: `updateProfileToggleUI` anpassen**

Ersetze:
```javascript
    let displayChar = session.user.email.charAt(0).toUpperCase();
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('name')
        .eq('id', session.user.id)
        .single();
    if (profile && profile.name) {
        displayChar = profile.name.charAt(0).toUpperCase();
    }

    icon.setAttribute('hidden', '');
    initialEl.hidden = false;
    initialEl.textContent = displayChar;
```
durch:
```javascript
    let displayChar = session.user.email.charAt(0).toUpperCase();
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('name, profilbild_url')
        .eq('id', session.user.id)
        .single();
    if (profile && profile.name) {
        displayChar = profile.name.charAt(0).toUpperCase();
    }

    icon.setAttribute('hidden', '');
    initialEl.hidden = false;
    setAvatarDisplay(initialEl, profile?.profilbild_url, displayChar);
```

- [ ] **Step 2: Manuell im Browser pruefen**

1. Als Mitglied mit bereits hochgeladenem Foto (aus Task 2) einloggen bzw. die Seite neu laden.
2. Pruefen: Der Profil-Button oben rechts in der Topbar zeigt das Foto statt des Anfangsbuchstabens, auf allen Seiten (Topbar ist ueberall gleich, `site-chrome.js`).
3. Als Mitglied ohne Foto einloggen - Button zeigt weiterhin den Anfangsbuchstaben.
4. Abmelden - Button faellt korrekt auf das Login-Icon zurueck (unveraendertes Verhalten, `session`-Zweig oben in der Funktion wird nicht beruehrt).

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "Profilbild im Topbar-Profil-Button anzeigen"
```

---

### Task 5: CLAUDE.md aktualisieren

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Keine (reine Dokumentation).

- [ ] **Step 1: Task 9 in der Supabase-Task-Liste als umgesetzt markieren**

In der Sektion "Mitgliederbereich mit Supabase — in Arbeit", Task 9 (`9. Profilbild-Upload: ...`) um `— **umgesetzt**` ergaenzen, nach demselben Muster wie die anderen bereits umgesetzten Tasks in dieser Liste (z.B. Task 7, 8, 10). Kurzer Verweis auf den neuen nummerierten Punkt (siehe Step 2).

- [ ] **Step 2: Neuen nummerierten Punkt in der Projekt-Historie ergaenzen**

Direkt nach dem letzten bestehenden nummerierten Punkt (Punkt 61, siehe `wireDraftInputs`) einen neuen Punkt 62 ergaenzen, der zusammenfasst: `profiles.profilbild_url` existierte bereits ungenutzt seit dem urspruenglichen `schema.sql`, neuer oeffentlicher `avatars`-Storage-Bucket (`supabase/013-avatar-storage-bucket.sql`, RLS nur fuer eigene Datei `<user-id>.jpg` beschreibbar), Canvas-Verkleinerung auf 200x200 JPEG ohne eigenen Zuschneide-Dialog, neuer `setAvatarDisplay()`-Helfer in `site-chrome.js` (Hintergrundbild statt zusaetzlicher `<img>`-Tags) fuer alle vier Anzeige-Orte (Mein Profil, Mitgliederliste, Mitglied-Modal, Topbar), "Foto entfernen"-Link.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "CLAUDE.md: Profilbild-Upload als umgesetzt dokumentieren"
```

---

### Task 6: Push

- [ ] **Step 1: Alle Commits pushen**

```bash
git push
```

- [ ] **Step 2: Pruefen, dass die Migration ausgefuehrt wurde**

Falls `supabase/013-avatar-storage-bucket.sql` noch nicht im Supabase-Dashboard ausgefuehrt wurde: den Nutzer darauf hinweisen, dass der Upload sonst mit einem RLS-/"bucket not found"-Fehler fehlschlaegt.
