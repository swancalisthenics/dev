# Kontaktformular-Postfach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das Kontaktformular speichert Nachrichten kuenftig intern (Supabase) statt sie per FormSubmit.co an eine private Gmail-Adresse weiterzuleiten. Aktuelle Vereinspraesidenten sehen und lesen diese Nachrichten in einem neuen "Postfach"-Abschnitt in "Mein Profil".

**Architecture:** Zwei neue Tabellen (`kontakt_nachrichten` fuer den Inhalt, `kontakt_nachrichten_status` fuer den Pro-Person-Gelesen-Status) mit RLS-Policies nach dem bestehenden `konto_anfragen`-Muster (Insert offen fuer alle, Select nur fuer eine bestimmte Rolle). Ein taeglicher `pg_cron`-Job loescht Nachrichten automatisch 2 Monate nach Eingang. `pages/kontakt.html` schickt Nachrichten per JS direkt in die neue Tabelle statt per FormSubmit-POST. Eine neue Datei `js/postfach.js` (eigene Datei pro substanzieller Seiten-Funktion, gleiches Muster wie `js/mitglieder.js`/`js/trainings-anmeldung.js`) rendert das Postfach als zweispaltige Mail-Client-Ansicht (Liste + Leseansicht) in "Mein Profil".

**Tech Stack:** Statisches HTML/CSS/Vanilla-JS (kein Build-Schritt), Supabase (Postgres + RLS + `pg_cron`) als Backend, `@supabase/supabase-js` v2 per CDN.

**Spec:** [docs/superpowers/specs/2026-09-02-kontaktformular-postfach-design.md](../specs/2026-09-02-kontaktformular-postfach-design.md)

## Global Constraints

- FormSubmit.co wird vollstaendig entfernt, nicht nur zusaetzlich dokumentiert.
- Rollen-Check fuer Postfach-Zugriff ist `'Präsident' = any(rollen)` - NICHT `'Admin'`.
- `kontakt_nachrichten_status` hat bewusst KEIN `gelesen boolean` - die blosse Existenz einer Zeile (Nachricht, Person) bedeutet "gelesen".
- Automatisches Loeschen nach 2 Monaten via `pg_cron` - kein manuelles Loeschen/Archivieren durch Praesidenten.
- Alle Werte aus `kontakt_nachrichten` (name, kategorie, nachricht) sind unauthentifiziert befuellbar und muessen beim Rendern per `innerHTML` escaped werden (`escapeHtml()`, gleiches Muster wie in `js/mitglieder.js`) - Ausnahme: Felder, die per `textContent` gesetzt werden, brauchen kein Escaping.
- Neue Supabase-Migrationen werden NIE automatisch ausgefuehrt - immer als `.sql`-Datei unter `supabase/` ablegen UND den vollen SQL-Text zusaetzlich direkt im Chat ausgeben, der Nutzer fuehrt sie manuell im Supabase-Dashboard aus.
- Alle neuen Dateien folgen der bestehenden Projekt-Konvention: 4-Leerzeichen-Einrueckung, deutsche Kommentare/Texte, Kebab-Case CSS-Klassen, camelCase JS-Bezeichner.

---

### Task 1: SQL-Migration fuer `kontakt_nachrichten` + Status-Tabelle + Auto-Loeschung

**Files:**
- Create: `supabase/016-kontakt-nachrichten.sql`

**Interfaces:**
- Produces: Tabellen `public.kontakt_nachrichten(id, name, email, kategorie, nachricht, erstellt_am)` und `public.kontakt_nachrichten_status(nachricht_id, profile_id, gelesen_am)`, RLS-Policies, `pg_cron`-Job `kontakt-nachrichten-aufraeumen`.

- [ ] **Step 1: Migration schreiben**

```sql
-- Migration 016: Kontaktformular-Nachrichten intern speichern statt per
-- FormSubmit.co an eine private Gmail-Adresse weiterzuleiten (siehe
-- docs/superpowers/specs/2026-09-02-kontaktformular-postfach-design.md).
--
-- kontakt_nachrichten: der eigentliche Nachrichteninhalt. Insert bewusst
-- fuer anon UND authenticated offen (oeffentliches Formular, kein Login
-- noetig - genau wie bisher bei FormSubmit.co). Select nur fuer
-- Mitglieder mit der aktuellen Rolle "Präsident", identisches Muster wie
-- die bestehende Admin-Select-Policy auf konto_anfragen.
create table public.kontakt_nachrichten (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    kategorie text not null,
    nachricht text not null,
    erstellt_am timestamptz not null default now()
);

alter table public.kontakt_nachrichten enable row level security;

create policy "Jeder darf eine Kontakt-Nachricht schicken"
    on public.kontakt_nachrichten for insert
    to anon, authenticated
    with check (true);

create policy "Praesidenten duerfen alle Kontakt-Nachrichten lesen"
    on public.kontakt_nachrichten for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and 'Präsident' = any(p.rollen)
        )
    );

grant insert on public.kontakt_nachrichten to anon, authenticated;
grant select on public.kontakt_nachrichten to authenticated;

-- kontakt_nachrichten_status: Pro-Person-Gelesen-Status. Bewusst KEIN
-- "gelesen boolean" - die blosse Existenz einer Zeile fuer (Nachricht,
-- Person) bedeutet bereits "gelesen"; fehlt die Zeile, gilt die
-- Nachricht fuer diese Person als ungelesen. Dadurch reicht ein Insert
-- beim ersten Oeffnen, nie ein Update noetig. "on delete cascade" auf
-- beiden Fremdschluesseln raeumt automatisch mit auf, sobald entweder
-- die Nachricht (siehe pg_cron-Job unten) oder das Profil geloescht wird.
create table public.kontakt_nachrichten_status (
    nachricht_id uuid not null references public.kontakt_nachrichten (id) on delete cascade,
    profile_id uuid not null references public.profiles (id) on delete cascade,
    gelesen_am timestamptz not null default now(),
    primary key (nachricht_id, profile_id)
);

alter table public.kontakt_nachrichten_status enable row level security;

create policy "Mitglieder duerfen nur den eigenen Gelesen-Status lesen"
    on public.kontakt_nachrichten_status for select
    to authenticated
    using (profile_id = auth.uid());

create policy "Mitglieder duerfen nur den eigenen Gelesen-Status anlegen"
    on public.kontakt_nachrichten_status for insert
    to authenticated
    with check (profile_id = auth.uid());

grant select, insert on public.kontakt_nachrichten_status to authenticated;

-- Automatisches Loeschen 2 Monate nach Eingang. pg_cron ist auf jedem
-- Supabase-Projekt (auch Gratis-Tier) nutzbar, muss aber pro Projekt
-- einmal aktiviert werden.
create extension if not exists pg_cron;

select cron.schedule(
    'kontakt-nachrichten-aufraeumen',
    '0 3 * * *', -- taeglich 03:00 UTC
    $$delete from public.kontakt_nachrichten where erstellt_am < now() - interval '2 months'$$
);
```

- [ ] **Step 2: Datei speichern und den vollen SQL-Text zusaetzlich direkt im Chat ausgeben**

Auf diesem Projekt gilt: eine Migration als Datei abzulegen reicht dem Nutzer nicht - der komplette SQL-Text muss zusaetzlich direkt in der Chat-Antwort stehen (in einem Code-Block), damit er ihn ohne Dateiwechsel in den Supabase-SQL-Editor kopieren kann. Beim Ausfuehren dieses Tasks: den obigen SQL-Text as-is in die Chat-Antwort uebernehmen.

- [ ] **Step 3: Commit**

```bash
git add supabase/016-kontakt-nachrichten.sql
git commit -m "Migration fuer kontakt_nachrichten + Postfach-Status ergaenzen (noch nicht im Dashboard ausgefuehrt)"
```

---

### Task 2: Kontaktformular auf Supabase umstellen (FormSubmit.co entfernen)

**Files:**
- Modify: `pages/kontakt.html:41-44` (Form-Tag + versteckte FormSubmit-Felder), `pages/kontakt.html` (Toast-Div + Script-Tag ergaenzen)
- Create: `js/kontakt.js`

**Interfaces:**
- Consumes: `supabaseClient`, `showToast(message)` (`js/main.js`).
- Produces: `handleKontaktSubmit(event)` (als `onsubmit`-Ziel).

- [ ] **Step 1: Form-Tag und FormSubmit-spezifische Felder entfernen**

In `pages/kontakt.html`, ersetze:

```html
<form action="https://formsubmit.co/nicolas.alexander.brand@gmail.com" method="POST" id="contact-form">
    <input type="text" name="_honey" style="display:none">
    <input type="hidden" name="_next" value="https://swancalisthenics.github.io/home/">
    <input type="hidden" name="_subject" value="Blog Anfrage: Allgemein">

    <div class="field">
```

durch:

```html
<form id="contact-form" onsubmit="return handleKontaktSubmit(event)">
    <div class="field">
```

- [ ] **Step 2: Kategorie-Feld referenzierbar machen**

In `pages/kontakt.html`, ergaenze eine `id` auf dem bisher nur per `name` referenzierten versteckten Kategorie-Feld - ersetze:

```html
<input type="hidden" name="category" value="Blog-Thema: Ernährung & Gesundheit">
```

durch:

```html
<input type="hidden" id="form-kategorie" name="category" value="Blog-Thema: Ernährung & Gesundheit">
```

- [ ] **Step 3: Toast-Element ergaenzen**

`pages/kontakt.html` hat noch kein Toast-Element (anders als `mein-profil.html`/`trainings-anmeldung.html`). Direkt vor dem Footer-Kommentar `<!-- FOOTER -->` ergaenzen:

```html
<!-- Kurze Bestaetigung nach Nachricht senden (siehe showToast() in main.js) -->
<div class="toast" id="toast" role="status" aria-live="polite"></div>

```

- [ ] **Step 4: `js/kontakt.js` anlegen**

```javascript
// Kontaktformular: schickt Nachrichten seit der FormSubmit.co-Ablösung
// direkt in kontakt_nachrichten statt per POST an einen Drittanbieter
// (siehe docs/superpowers/specs/2026-09-02-kontaktformular-postfach-design.md).

async function handleKontaktSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const kategorie = document.getElementById('form-kategorie').value;
    const nachricht = document.getElementById('form-message').value;

    const { error } = await supabaseClient
        .from('kontakt_nachrichten')
        .insert({ name, email, kategorie, nachricht });

    if (error) {
        showToast('Senden fehlgeschlagen: ' + error.message);
        return false;
    }

    document.getElementById('form-name').value = '';
    document.getElementById('form-email').value = '';
    document.getElementById('form-message').value = '';
    showToast('Nachricht gesendet!');
    return false;
}
```

- [ ] **Step 5: Script-Tag ergaenzen**

In `pages/kontakt.html`, direkt vor `</body>` (nach `main.js`):

```html
<script src="../js/main.js"></script>
<script src="../js/kontakt.js"></script>
```

- [ ] **Step 6: Verifizieren mit gemocktem Supabase-Client**

Static-Site-Preview starten, `pages/kontakt.html` oeffnen:

```javascript
// Browser-Konsole:
const realFrom = supabaseClient.from.bind(supabaseClient);
let insertAufruf = null;
supabaseClient.from = (table) => {
    if (table === 'kontakt_nachrichten') {
        return { insert: (payload) => { insertAufruf = payload; return Promise.resolve({ error: null }); } };
    }
    throw new Error('unerwartete Tabelle: ' + table);
};

document.getElementById('form-name').value = 'Test Person';
document.getElementById('form-email').value = 'test@example.com';
document.getElementById('form-message').value = 'Testnachricht';
await handleKontaktSubmit({ preventDefault: () => {} });

const result = JSON.stringify({
    insertAufruf,
    nameLeer: document.getElementById('form-name').value === '',
    toastText: document.getElementById('toast').textContent,
    toastSichtbar: document.getElementById('toast').classList.contains('is-visible')
});
supabaseClient.from = realFrom;
result;
```

Erwartet: `insertAufruf` enthaelt `{name: "Test Person", email: "test@example.com", kategorie: "Blog-Thema: Ernährung & Gesundheit", nachricht: "Testnachricht"}`, `nameLeer: true`, `toastText: "Nachricht gesendet!"`, `toastSichtbar: true`. Keine Konsolenfehler. Zusaetzlich pruefen: `document.querySelector('form[action]')` ergibt `null` (kein FormSubmit-POST mehr moeglich).

- [ ] **Step 7: Commit**

```bash
git add pages/kontakt.html js/kontakt.js
git commit -m "Kontaktformular von FormSubmit.co auf internes Speichern umstellen"
```

---

### Task 3: Postfach-Grundgeruest in "Mein Profil" (Liste anzeigen)

**Files:**
- Modify: `pages/mein-profil.html`
- Create: `css/pages/mein-profil.css`
- Create: `js/postfach.js`
- Modify: `js/main.js:783-785` (Gate-Aufruf erweitern)

**Interfaces:**
- Consumes: `supabaseClient`, `initAuthGate` (bereits vorhanden in `main.js`).
- Produces: `ladePostfach()`, `renderPostfachListe()`, `leerePostfach()`, `escapeHtml(text)`, globaler Zustand `let alleKontaktNachrichten` (von Task 4 weiterverwendet).

- [ ] **Step 1: Neuen Abschnitt in `pages/mein-profil.html` ergaenzen**

Direkt nach dem schliessenden `</details>` des Passwort-Formulars (vor dem schliessenden `</div>` von `#profileLayout`), ergaenze:

```html
        <div class="glass-card profile-form-card postfach-card" id="postfach">
            <h3>Postfach</h3>
            <div class="postfach-layout" id="postfachLayout">
                <div class="postfach-liste" id="postfachListe">
                    <p class="section-lead">Keine Nachrichten.</p>
                </div>
                <div class="postfach-detail" id="postfachDetail">
                    <button type="button" class="postfach-zurueck" id="postfachZurueck" onclick="schliessePostfachDetail()" aria-label="Zurück zur Liste">
                        <svg viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <p class="postfach-detail-meta" id="postfachDetailMeta"></p>
                    <p class="postfach-detail-text" id="postfachDetailText"></p>
                </div>
            </div>
        </div>
```

Auch die zugehoerige neue Stylesheet-Verlinkung im `<head>` ergaenzen, direkt nach `components.css`:

```html
    <link rel="stylesheet" href="../css/components.css">
    <link rel="stylesheet" href="../css/pages/mein-profil.css">
```

- [ ] **Step 2: `css/pages/mein-profil.css` anlegen**

```css
.postfach-card {
    padding: 0;
    overflow: hidden;
}

.postfach-card h3 {
    padding: 24px 24px 0;
}

.postfach-layout {
    display: grid;
    grid-template-columns: 1fr;
}

.postfach-liste {
    display: flex;
    flex-direction: column;
}

.postfach-liste .section-lead {
    padding: 14px 24px;
}

.postfach-nachricht {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 24px;
    border: none;
    border-top: 1px solid var(--glass-border);
    background: none;
    text-align: left;
    font: inherit;
    color: inherit;
    width: 100%;
    cursor: pointer;
}

.postfach-nachricht:hover {
    background: var(--glass-fill-strong);
}

.postfach-nachricht-kopf {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 0.85rem;
    color: var(--text-muted);
}

.postfach-nachricht.ist-ungelesen .postfach-nachricht-kopf span:first-child {
    font-weight: 700;
    color: var(--text-primary);
}

.postfach-nachricht.ist-ungelesen .postfach-nachricht-kopf span:first-child::before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--aurora-red);
    margin-right: 8px;
}

.postfach-detail {
    padding: 24px;
    border-top: 1px solid var(--glass-border);
    display: none;
}

.postfach-zurueck {
    display: none;
    background: none;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    padding: 4px;
    margin-bottom: 12px;
}

.postfach-zurueck svg {
    width: 24px;
    height: 24px;
}

.postfach-detail-meta {
    color: var(--text-muted);
    margin-bottom: 12px;
}

.postfach-detail-text {
    white-space: pre-wrap;
}

@media (max-width: 767px) {
    .postfach-zurueck {
        display: inline-flex;
    }
    .postfach-layout.zeigt-detail .postfach-liste {
        display: none;
    }
    .postfach-layout.zeigt-detail .postfach-detail {
        display: block;
    }
}

@media (min-width: 768px) {
    .postfach-layout {
        grid-template-columns: 320px 1fr;
    }
    .postfach-liste {
        border-right: 1px solid var(--glass-border);
        max-height: 480px;
        overflow-y: auto;
    }
    .postfach-detail {
        display: block;
    }
}
```

- [ ] **Step 3: `js/postfach.js` anlegen (Liste, noch ohne Klick-Verhalten)**

```javascript
// Postfach fuer Kontaktformular-Nachrichten (siehe
// docs/superpowers/specs/2026-09-02-kontaktformular-postfach-design.md).
// Abschnitt ist fuer jedes eingeloggte Mitglied sichtbar, bleibt aber dank
// RLS auf kontakt_nachrichten fuer alle ausser aktuellen Praesidenten
// automatisch leer - kein eigener Rollen-Check hier noetig.

let alleKontaktNachrichten = [];

// name/kategorie in kontakt_nachrichten kommen von einem voellig
// unauthentifizierten Formular (siehe supabase/016-kontakt-nachrichten.sql)
// - ohne Escaping waere ein <script>-Name dort XSS gegen jede Praesidentin/
// jeden Praesidenten, die/der das Postfach oeffnet. Gleiches Muster wie
// escapeHtml() in js/mitglieder.js (dort nicht wiederverwendbar, da beide
// Dateien nur auf unterschiedlichen Seiten geladen werden).
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatierePostfachDatum(iso) {
    return new Date(iso).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function ladePostfach() {
    const { data: nachrichten } = await supabaseClient
        .from('kontakt_nachrichten')
        .select('id, name, email, kategorie, nachricht, erstellt_am')
        .order('erstellt_am', { ascending: false });
    alleKontaktNachrichten = nachrichten || [];
    renderPostfachListe();
}

function renderPostfachListe() {
    const liste = document.getElementById('postfachListe');
    if (!alleKontaktNachrichten.length) {
        liste.innerHTML = '<p class="section-lead">Keine Nachrichten.</p>';
        return;
    }
    liste.innerHTML = alleKontaktNachrichten.map(n => `
        <button type="button" class="postfach-nachricht" data-id="${n.id}">
            <span class="postfach-nachricht-kopf">
                <span>${escapeHtml(n.name)}</span>
                <span>${formatierePostfachDatum(n.erstellt_am)}</span>
            </span>
            <span class="badge badge-category">${escapeHtml(n.kategorie)}</span>
        </button>
    `).join('');
}

function leerePostfach() {
    alleKontaktNachrichten = [];
    document.getElementById('postfachListe').innerHTML = '';
    document.getElementById('postfachLayout')?.classList.remove('zeigt-detail');
}
```

- [ ] **Step 4: Gate-Aufruf in `js/main.js` erweitern**

Ersetze in `js/main.js`:

```javascript
if (document.getElementById('profileLayout')) {
    initAuthGate('profileLayout', loadOwnProfileIntoForm, clearProfileForm);
}
```

durch:

```javascript
if (document.getElementById('profileLayout')) {
    initAuthGate('profileLayout', (session) => {
        loadOwnProfileIntoForm(session);
        ladePostfach();
    }, () => {
        clearProfileForm();
        leerePostfach();
    });
}
```

- [ ] **Step 5: Script-Tag in `pages/mein-profil.html` ergaenzen**

Direkt vor `</body>` (nach `main.js`):

```html
<script src="../js/main.js"></script>
<script src="../js/postfach.js"></script>
```

- [ ] **Step 6: Verifizieren mit gemocktem Supabase-Client**

Preview neu laden, `pages/mein-profil.html` oeffnen (simuliert eingeloggten Zustand, kein echter Login noetig):

```javascript
// Browser-Konsole:
const realFrom = supabaseClient.from.bind(supabaseClient);
supabaseClient.from = (table) => {
    if (table === 'kontakt_nachrichten') {
        return {
            select: () => ({
                order: () => Promise.resolve({ data: [
                    { id: 'n1', name: '<script>alert(1)</script>', email: 'a@b.com', kategorie: 'Feedback', nachricht: 'Testtext', erstellt_am: new Date().toISOString() }
                ] })
            })
        };
    }
    throw new Error('unerwartete Tabelle: ' + table);
};

await ladePostfach();

const liste = document.getElementById('postfachListe');
const result = JSON.stringify({
    zeigtScriptTag: liste.innerHTML.includes('<script>'),
    zeigtEscapedName: liste.textContent.includes('<script>alert(1)</script>'),
    zeigtKategorie: liste.textContent.includes('Feedback')
});
supabaseClient.from = realFrom;
result;
```

Erwartet: `zeigtScriptTag: false` (kein echtes `<script>`-Element im DOM - der Name wurde escaped), `zeigtEscapedName: true` (der Text ist als reiner Text sichtbar, nicht ausgefuehrt), `zeigtKategorie: true`. Keine Konsolenfehler, kein `alert()`-Popup.

- [ ] **Step 7: Commit**

```bash
git add pages/mein-profil.html css/pages/mein-profil.css js/postfach.js js/main.js
git commit -m "Postfach-Grundgeruest mit Nachrichtenliste in Mein Profil ergaenzen"
```

---

### Task 4: Leseansicht + Gelesen-Status pro Person

**Files:**
- Modify: `js/postfach.js`

**Interfaces:**
- Consumes: `alleKontaktNachrichten`, `escapeHtml`, `formatierePostfachDatum` (alle Task 3).
- Produces: `oeffnePostfachNachricht(id)`, `schliessePostfachDetail()` (bereits als `onclick`-Ziel in Task 3 verdrahtet).

- [ ] **Step 1: Gelesen-Status laden**

In `js/postfach.js`, ergaenze eine neue globale Variable direkt nach `let alleKontaktNachrichten = [];`:

```javascript
let gelesenIds = new Set();
```

Ersetze `ladePostfach()` durch:

```javascript
async function ladePostfach() {
    const { data: nachrichten } = await supabaseClient
        .from('kontakt_nachrichten')
        .select('id, name, email, kategorie, nachricht, erstellt_am')
        .order('erstellt_am', { ascending: false });
    alleKontaktNachrichten = nachrichten || [];

    const { data: { user } } = await supabaseClient.auth.getUser();
    const { data: statusZeilen } = await supabaseClient
        .from('kontakt_nachrichten_status')
        .select('nachricht_id')
        .eq('profile_id', user.id);
    gelesenIds = new Set((statusZeilen || []).map(z => z.nachricht_id));

    renderPostfachListe();
}
```

- [ ] **Step 2: Liste um Ungelesen-Markierung und Klick-Handler erweitern**

Ersetze `renderPostfachListe()` durch:

```javascript
function renderPostfachListe() {
    const liste = document.getElementById('postfachListe');
    if (!alleKontaktNachrichten.length) {
        liste.innerHTML = '<p class="section-lead">Keine Nachrichten.</p>';
        return;
    }
    liste.innerHTML = alleKontaktNachrichten.map(n => `
        <button type="button" class="postfach-nachricht ${gelesenIds.has(n.id) ? '' : 'ist-ungelesen'}" data-id="${n.id}" onclick="oeffnePostfachNachricht('${n.id}')">
            <span class="postfach-nachricht-kopf">
                <span>${escapeHtml(n.name)}</span>
                <span>${formatierePostfachDatum(n.erstellt_am)}</span>
            </span>
            <span class="badge badge-category">${escapeHtml(n.kategorie)}</span>
        </button>
    `).join('');
}
```

- [ ] **Step 3: Detail-Oeffnen + Gelesen-Markieren ergaenzen**

Ans Ende von `js/postfach.js`:

```javascript
async function oeffnePostfachNachricht(id) {
    const nachricht = alleKontaktNachrichten.find(n => n.id === id);
    if (!nachricht) return;

    document.getElementById('postfachDetailMeta').textContent =
        `${nachricht.name} <${nachricht.email}> – ${formatierePostfachDatum(nachricht.erstellt_am)}`;
    document.getElementById('postfachDetailText').textContent = nachricht.nachricht;
    document.getElementById('postfachLayout').classList.add('zeigt-detail');

    if (!gelesenIds.has(id)) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        await supabaseClient.from('kontakt_nachrichten_status').insert({ nachricht_id: id, profile_id: user.id });
        gelesenIds.add(id);
        renderPostfachListe();
    }
}

function schliessePostfachDetail() {
    document.getElementById('postfachLayout').classList.remove('zeigt-detail');
}
```

Wichtig: `postfachDetailMeta`/`postfachDetailText` werden per `textContent` gesetzt (nicht `innerHTML`) - Name/E-Mail/Nachrichtentext brauchen hier deshalb kein `escapeHtml()`, `textContent` fuehrt nie HTML aus.

- [ ] **Step 4: Verifizieren mit gemocktem Supabase-Client**

```javascript
// Browser-Konsole auf pages/mein-profil.html (im simulierten
// eingeloggten Zustand):
const realAuth = supabaseClient.auth.getUser.bind(supabaseClient.auth);
const realFrom = supabaseClient.from.bind(supabaseClient);
let insertAufruf = null;
supabaseClient.auth.getUser = () => Promise.resolve({ data: { user: { id: 'praesident-1' } } });
supabaseClient.from = (table) => {
    if (table === 'kontakt_nachrichten') {
        return { select: () => ({ order: () => Promise.resolve({ data: [
            { id: 'n1', name: 'Anna Test', email: 'anna@example.com', kategorie: 'Feedback', nachricht: 'Zeile 1\nZeile 2', erstellt_am: new Date().toISOString() }
        ] }) }) };
    }
    if (table === 'kontakt_nachrichten_status') {
        return {
            select: () => ({ eq: () => Promise.resolve({ data: [] }) }),
            insert: (payload) => { insertAufruf = payload; return Promise.resolve({ error: null }); }
        };
    }
    throw new Error('unerwartet: ' + table);
};

await ladePostfach();
const vorherUngelesen = document.querySelector('.postfach-nachricht').classList.contains('ist-ungelesen');
await oeffnePostfachNachricht('n1');
const nachherUngelesen = document.querySelector('.postfach-nachricht').classList.contains('ist-ungelesen');

const result = JSON.stringify({
    vorherUngelesen,
    nachherUngelesen,
    insertAufruf,
    detailText: document.getElementById('postfachDetailText').textContent,
    zeigtDetailKlasse: document.getElementById('postfachLayout').classList.contains('zeigt-detail')
});
supabaseClient.auth.getUser = realAuth;
supabaseClient.from = realFrom;
result;
```

Erwartet: `vorherUngelesen: true`, `nachherUngelesen: false`, `insertAufruf` enthaelt `{nachricht_id: 'n1', profile_id: 'praesident-1'}`, `detailText` enthaelt "Zeile 1" und "Zeile 2", `zeigtDetailKlasse: true`. Danach `schliessePostfachDetail()` in der Konsole aufrufen und pruefen, dass `postfachLayout.classList.contains('zeigt-detail')` wieder `false` ist. Keine Konsolenfehler.

- [ ] **Step 5: Commit**

```bash
git add js/postfach.js
git commit -m "Leseansicht und Pro-Person-Gelesen-Status fuers Postfach ergaenzen"
```

---

### Task 5: Profil-Dropdown anpassen ("Mitglieder" raus, "Postfach" rein)

**Files:**
- Modify: `js/site-chrome.js`

**Interfaces:**
- Keine neuen JS-Interfaces - reine Markup-Aenderung innerhalb der bestehenden `<site-topbar>`-Komponente.

- [ ] **Step 1: Dropdown-Links aendern**

In `js/site-chrome.js`, ersetze:

```html
<div class="profile-dropdown" id="profileDropdown">
    <a href="${base}pages/mein-profil.html">Mein Profil</a>
    <a href="${base}pages/mitglieder.html">Mitglieder</a>
    <button type="button" onclick="openLogoutConfirm(event)">Abmelden</button>
</div>
```

durch:

```html
<div class="profile-dropdown" id="profileDropdown">
    <a href="${base}pages/mein-profil.html">Mein Profil</a>
    <a href="${base}pages/mein-profil.html#postfach">Postfach</a>
    <button type="button" onclick="openLogoutConfirm(event)">Abmelden</button>
</div>
```

"Mitglieder" bleibt ueber den bestehenden Verein-Hub-Balken (`pages/verein.html`) weiterhin erreichbar - der Link verschwindet nur aus diesem Dropdown.

- [ ] **Step 2: Verifizieren**

Beliebige Seite laden (z. B. `index.html`), Profil-Icon oben rechts anklicken:

```javascript
// Browser-Konsole:
const links = Array.from(document.querySelectorAll('#profileDropdown a')).map(a => a.textContent.trim());
JSON.stringify(links);
// Erwartet: ["Mein Profil","Postfach"] - "Mitglieder" nicht mehr enthalten
```

Danach auf "Postfach" klicken und pruefen, dass die Seite zu `mein-profil.html#postfach` springt und der Postfach-Abschnitt sichtbar im Viewport landet.

- [ ] **Step 3: Commit**

```bash
git add js/site-chrome.js
git commit -m "Profil-Dropdown: Mitglieder-Link durch Postfach-Link ersetzen"
```

---

### Task 6: Datenschutzerklärung erweitern

**Files:**
- Modify: `pages/rechtliches.html`

**Interfaces:**
- Keine Code-Interfaces - reine Doku-Aenderung.

- [ ] **Step 1: Neue Section 4 einfuegen, bestehende 4-9 auf 5-10 verschieben**

Ersetze in `pages/rechtliches.html` den kompletten Block von `<h2>4. Technischer Dienstleister (Supabase)</h2>` bis `<h2>9. Ihre Rechte</h2>` (nur die Ueberschriften-Nummern und der neue Abschnitt aendern sich, die bestehenden Absaetze bleiben inhaltlich unveraendert):

```html
            <h2>4. Kontaktformular</h2>
            <p>Nachrichten über unser Kontaktformular (Name, E-Mail-Adresse, Kategorie, Nachrichtentext) werden direkt bei uns über unseren technischen Dienstleister Supabase gespeichert (siehe Abschnitt "Technischer Dienstleister" unten) - es ist kein externer Formular-Anbieter mehr beteiligt. Diese Nachrichten sind ausschliesslich für die aktuellen Vereinspräsidentinnen und -präsidenten einsehbar. Sie werden automatisch 2 Monate nach Eingang gelöscht.</p>

            <h2>5. Technischer Dienstleister (Supabase)</h2>
            <p>Für Login, Datenbank und die Speicherung von Profilbildern nutzen wir den Dienst Supabase. Die dabei anfallenden Daten werden auf Servern in Frankfurt am Main (Deutschland, EU) gespeichert und verarbeitet. Supabase handelt dabei ausschliesslich als technischer Dienstleister in unserem Auftrag.</p>
            <p>Profilbilder sind aus technischen Gründen über eine öffentlich erreichbare Adresse abrufbar - wer den genauen Link zu einem Bild kennt, kann es grundsätzlich auch ohne eigenen Login ansehen. Diesen Link veröffentlichen wir nicht aktiv; er ist ohne gezielte Weitergabe nicht auffindbar.</p>

            <h2>6. Cookies und lokaler Speicher</h2>
            <p>Diese Website verwendet keine klassischen Cookies. Für folgende Zwecke wird stattdessen der lokale Speicher Ihres Browsers (localStorage) genutzt, der ausschliesslich auf Ihrem eigenen Gerät liegt und nicht an uns übertragen wird:</p>
            <ul>
                <li>Ihre Anmeldesitzung im Mitgliederbereich, damit Sie nicht bei jedem Seitenaufruf erneut einloggen müssen</li>
                <li>Ihre gewählte Darstellung (heller oder dunkler Modus)</li>
                <li>Noch nicht abgeschickte Formulareingaben (z. B. ein angefangener, aber noch nicht gespeicherter Profiltext), damit diese nicht versehentlich verloren gehen</li>
            </ul>
            <p>Ihr Passwort wird zu keinem Zeitpunkt im lokalen Speicher abgelegt.</p>

            <h2>7. Web-Analyse (Umami)</h2>
            <p>Um grob nachzuvollziehen, wie oft und über welche Seiten unsere Website besucht wird, nutzen wir den Analyse-Dienst Umami. Umami verzichtet bewusst auf Cookies und erstellt keine individuellen Besucherprofile über die Zeit hinweg. Erhoben werden anonymisierte, zusammengefasste Zugriffszahlen (z. B. Seitenaufrufe, Gerätetyp sowie ein grober Standort bis auf Stadtebene). Nach eigenen Angaben des Anbieters wird die dafür kurz ausgewertete IP-Adresse dabei lediglich in Land/Region/Stadt umgewandelt und soll anschliessend nicht dauerhaft gespeichert werden. Nach Angaben des Anbieters betreibt er Server sowohl in der EU als auch in den USA; uns liegen keine gesicherten Informationen vor, welche Region für unser Konto konkret genutzt wird, weshalb eine Datenübermittlung in die USA nicht auszuschliessen ist. Eine im Browser aktivierte "Do Not Track"-Einstellung respektieren wir: Ist sie aktiv, erfolgt für diesen Besuch keine Zählung. Reine Anker-Sprünge innerhalb einer Seite (z. B. zu einem Seitenabschnitt) erzeugen dabei keinen separaten, zusätzlichen Eintrag.</p>

            <h2>8. Community- und Veranstaltungsfotos</h2>
            <p>Auf unserer Website veröffentlichen wir Bildmaterial von Communityaktivitäten und den Communitygründern. Dies geschieht auf Grundlage des berechtigten Interesses der Community an der Öffentlichkeitsarbeit sowie mit dem Einverständnis der abgebildeten Personen. Sollten Sie mit der Veröffentlichung eines Bildes, auf dem Sie erkennbar sind, nicht einverstanden sein, genügt eine kurze Mitteilung an die oben genannte E-Mail-Adresse, und wir werden das Bild umgehend entfernen.</p>

            <h2>9. Social-Media-Verweise</h2>
            <p>Die Verweise auf soziale Netzwerke (z. B. Instagram, WhatsApp) sind als rein statische Verlinkungen ausgestaltet. Das bedeutet: Beim reinen Besuch unserer Website werden keinerlei Daten an diese externen Plattformen übertragen. Erst wenn Sie aktiv auf einen solchen Link klicken, verlassen Sie unsere Website und werden auf die Plattform des jeweiligen Anbieters weitergeleitet. Ab diesem Zeitpunkt gelten die Datenschutzbestimmungen der jeweiligen Plattform.</p>

            <h2>10. Ihre Rechte</h2>
            <p>Sie haben nach dem Schweizer Datenschutzgesetz das Recht auf unentgeltliche Auskunft über die von uns zu Ihrer Person verarbeiteten Daten sowie ein Recht auf Berichtigung oder Löschung, soweit dem keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Dies umfasst auch Ihre Daten im Mitgliederbereich. Bei Fragen dazu können Sie uns jederzeit über die oben genannte E-Mail-Adresse kontaktieren.</p>
```

- [ ] **Step 2: Verifizieren**

`pages/rechtliches.html` im Preview laden:

```javascript
// Browser-Konsole:
Array.from(document.querySelectorAll('.legal-card h2')).map(h => h.textContent);
// Erwartet: ["1. Verantwortliche Stelle", "2. Hosting (Datenübertragung)",
// "3. Mitgliederbereich: Login und Profildaten", "4. Kontaktformular",
// "5. Technischer Dienstleister (Supabase)", "6. Cookies und lokaler Speicher",
// "7. Web-Analyse (Umami)", "8. Community- und Veranstaltungsfotos",
// "9. Social-Media-Verweise", "10. Ihre Rechte"]
```

Keine Konsolenfehler, keine doppelten Nummern.

- [ ] **Step 3: Commit**

```bash
git add pages/rechtliches.html
git commit -m "Datenschutzerklaerung: FormSubmit.co-Luecke schliessen, Kontaktformular-Abschnitt ergaenzen"
```

---

### Task 7: Dokumentation ergaenzen

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Keine Code-Interfaces - reine Doku-Aenderung.

- [ ] **Step 1: Neuen nummerierten Punkt ergaenzen**

Nach dem letzten bestehenden nummerierten Punkt unter "Wichtige Implementierungs-Entscheidungen" (Nummer = letzte bestehende Nummer + 1) einfuegen:

```markdown
NN. **Kontaktformular-Postfach umgesetzt** (siehe
    [docs/superpowers/specs/2026-09-02-kontaktformular-postfach-design.md](docs/superpowers/specs/2026-09-02-kontaktformular-postfach-design.md)
    fuer die volle Begruendung). FormSubmit.co (leitete Kontaktformular-
    Nachrichten an eine private Gmail-Adresse weiter, ohne Erwaehnung in
    der Datenschutzerklaerung und mit schlechter eigener Transparenz)
    komplett entfernt.
    - Zwei neue Tabellen
      ([supabase/016-kontakt-nachrichten.sql](supabase/016-kontakt-nachrichten.sql)):
      `kontakt_nachrichten` (Inhalt, lesbar nur fuer die Rolle
      "Präsident") und `kontakt_nachrichten_status` (Pro-Person-Gelesen-
      Status - bewusst kein Boolean-Feld, die blosse Existenz einer Zeile
      bedeutet "gelesen"). Ein taeglicher `pg_cron`-Job loescht Nachrichten
      automatisch 2 Monate nach Eingang.
    - `pages/kontakt.html`/[js/kontakt.js](js/kontakt.js): Formular
      schickt Nachrichten jetzt per `supabaseClient.insert()` statt per
      FormSubmit-POST.
    - Neuer "Postfach"-Abschnitt in `pages/mein-profil.html`
      ([js/postfach.js](js/postfach.js)): fuer jedes eingeloggte Mitglied
      sichtbar, bleibt aber dank RLS fuer alle ausser aktuellen
      Praesidenten automatisch leer. Mail-Programm-Optik (Liste +
      Leseansicht, zweispaltig auf Desktop, Drill-down auf Mobil).
      Untrusted Felder (`name`/`kategorie` aus einem unauthentifizierten
      Formular) werden per `escapeHtml()` escaped (gleiches Muster wie in
      `js/mitglieder.js`).
    - Profil-Dropdown (`js/site-chrome.js`): "Mitglieder"-Link entfernt
      (bleibt ueber den Verein-Hub erreichbar), "Postfach"-Link
      (`mein-profil.html#postfach`) ergaenzt.
    - Datenschutzerklaerung (`pages/rechtliches.html`): neue Section "4.
      Kontaktformular", bestehende Sections 4-9 auf 5-10 verschoben.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "CLAUDE.md: Kontaktformular-Postfach dokumentieren"
```
