# Shared Site-Chrome via Custom Elements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the identically-duplicated topbar-navigation and login/logout-modal markup across all 9 HTML pages with two Custom Elements (`<site-topbar>`, `<site-account-modals>`), so future changes to either only need to happen in one place.

**Architecture:** A new `js/site-chrome.js` defines `SiteTopbar` and `SiteAccountModals` (both `HTMLElement` subclasses, no Shadow DOM) that fill their own `innerHTML` from a template string in `connectedCallback()`. Each page adds a `data-base` attribute to `<body>` (empty string / `"../"` / `"../../"` depending on folder depth) so the shared template can compute correct relative paths. No fetch, no build step, no new dependency.

**Tech Stack:** Vanilla JS (`customElements.define`), no framework, no npm, no test runner — this project has none of those. Verification happens by loading pages in a browser (both via the local static server and via a genuine `file://` URL) and checking the resulting DOM/console, matching how every other feature in this project has been verified so far.

**Spec:** [docs/superpowers/specs/2026-08-26-shared-site-chrome-design.md](../specs/2026-08-26-shared-site-chrome-design.md)

## Global Constraints

- Must keep working when a page is opened directly via `file://` — no `fetch()`/`XMLHttpRequest` of local files, no `<script type="module">` (both are blocked by CORS under `file://` in Chrome).
- No build step — the site remains plain static files, `js/site-chrome.js` ships as-is, nothing generates it.
- No Shadow DOM on the custom elements — existing global CSS in `css/components.css` must keep matching the injected markup unchanged (`.topbar`, `.profile-dropdown`, `.modal-overlay`, etc.).
- All links/assets inside the shared templates are written **root-relative**, prefixed with `data-base` — not "same folder"-relative like some of today's per-page markup.
- The "Home" nav link is a special case: on `index.html` itself it must stay `href="#home"` (same-document anchor, no reload); on every other page it is `href="{base}index.html#home"`. This preserves current behavior exactly — do not regress it to always reload.
- `js/site-chrome.js`'s `<script>` tag goes in `<head>`, directly after the existing inline theme-preference script, on every page — this guarantees the custom elements are defined before the parser reaches `<site-topbar>`/`<site-account-modals>` further down, with zero flash risk.
- Out of scope, do not touch: the footer, the mobile tab-bar (`<nav class="tabbar">`), and `index.html`'s `#set-password-modal`/`#auth-error-modal` (those two only exist on `index.html`, not duplicated, and are not part of `<site-account-modals>`).
- `CLAUDE.md` gets a new numbered entry documenting this change, following the existing convention (see any existing entry for the exact style/tone).

---

### Task 1: Create `js/site-chrome.js` and migrate `index.html` (depth 0)

**Files:**
- Create: `js/site-chrome.js`
- Modify: `index.html`

**Interfaces:**
- Produces: two custom elements usable on any page once `js/site-chrome.js` is loaded: `<site-topbar></site-topbar>` (reads `document.body.dataset.base` and `document.body.dataset.page`) and `<site-account-modals></site-account-modals>` (no inputs, fully static content). Both must be defined and connected before any script that queries `#profileToggle`, `#themeToggle`, `#login-modal`, etc. (i.e. before `main.js` runs) — this is why the script tag goes in `<head>`.

- [ ] **Step 1: Create `js/site-chrome.js`**

```js
// Gemeinsame Topbar- und Account-Modal-Vorlagen fuer alle 9 Seiten, als
// Custom Elements statt per fetch() einer HTML-Partial - fetch() einer
// lokalen Datei wird unter file:// per CORS blockiert, ein <script src>
// (wie dieses hier) dagegen nicht. Kein Shadow DOM, damit das bestehende
// globale CSS (components.css) unveraendert weiter greift.
//
// data-base auf <body> steuert die relativen Pfade: "" auf index.html,
// "../" unter pages/, "../../" unter pages/blog/. Alle Links im Template
// sind bewusst root-relativ geschrieben (z.B. "pages/team.html"), nicht
// "gleicher Ordner"-relativ wie es einzelne Seiten bisher waren - so
// funktioniert exakt eine Formel fuer alle Tiefen.

class SiteTopbar extends HTMLElement {
    connectedCallback() {
        const base = document.body.dataset.base || '';
        const page = document.body.dataset.page || '';
        // Sonderfall Home: auf index.html selbst ein reiner Anker (kein
        // Reload), auf allen anderen Seiten ein echter Seitenwechsel -
        // entspricht exakt dem bisherigen Verhalten, nicht regressieren.
        const homeHref = page === 'home' ? '#home' : `${base}index.html#home`;
        this.innerHTML = `
            <div class="topbar-inner">
                <a href="${base}index.html" class="brand">
                    <img src="${base}assets/images/logo.png" alt="Swan Calisthenics Logo">
                    <span>Swan Calisthenics</span>
                </a>
                <div class="topbar-right">
                    <nav class="desktop-nav" aria-label="Hauptnavigation">
                        <a href="${homeHref}" class="nav-link" data-page="home">Home</a>
                        <a href="${base}pages/blog/blog.html" class="nav-link" data-page="blog">Blog</a>
                        <a href="${base}pages/team.html" class="nav-link" data-page="team">Team</a>
                        <a href="${base}pages/verein.html" class="nav-link" data-page="verein">Verein</a>
                        <a href="${base}pages/kontakt.html" class="nav-link" data-page="kontakt">Kontakt</a>
                    </nav>
                    <button class="theme-toggle" id="themeToggle" aria-label="Dark Mode umschalten" aria-pressed="false">
                        <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    </button>
                    <div class="profile-menu-wrapper">
                        <button class="profile-toggle" id="profileToggle" onclick="handleProfileToggleClick(event)" aria-label="Mitglieder-Login">
                            <svg id="profileToggleIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>
                            <span class="profile-toggle-initial" id="profileToggleInitial" hidden></span>
                            <svg class="profile-toggle-chevron" id="profileToggleChevron" viewBox="0 0 24 24" fill="none" aria-hidden="true" hidden><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                        <div class="profile-dropdown" id="profileDropdown">
                            <a href="${base}pages/mein-profil.html">Mein Profil</a>
                            <a href="${base}pages/mitglieder.html">Mitglieder</a>
                            <button type="button" onclick="openLogoutConfirm(event)">Abmelden</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

class SiteAccountModals extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div id="login-modal" class="modal-overlay">
                <div class="modal-content">
                    <button class="modal-close" onclick="closeLoginDialog()" aria-label="Schliessen">&times;</button>
                    <h3>Mitglieder-Login</h3>
                    <form id="loginForm" onsubmit="return handleLoginSubmit(event)">
                        <div class="field">
                            <label for="loginEmail">E-Mail</label>
                            <input type="email" id="loginEmail" name="email" required autocomplete="email">
                        </div>
                        <div class="field">
                            <label for="loginPassword">Passwort</label>
                            <div class="password-input-wrap">
                                <input type="password" id="loginPassword" name="password" required autocomplete="current-password">
                                <button type="button" class="password-toggle-visibility" onclick="togglePasswordVisibility('loginPassword', this)" aria-label="Passwort anzeigen">
                                    <span class="icon icon-eye" aria-hidden="true"></span>
                                </button>
                            </div>
                        </div>
                        <p id="loginNotice" hidden>Anmeldung ist noch nicht aktiv – folgt in einem der nächsten Schritte.</p>
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">Anmelden</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="logout-confirm-modal" class="modal-overlay">
                <div class="modal-content">
                    <button class="modal-close" onclick="closeLogoutConfirm()" aria-label="Schliessen">&times;</button>
                    <h3>Wirklich abmelden?</h3>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-primary" onclick="confirmLogout()">Abmelden</button>
                        <button type="button" class="btn btn-secondary" onclick="closeLogoutConfirm()">Abbrechen</button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('site-topbar', SiteTopbar);
customElements.define('site-account-modals', SiteAccountModals);
```

- [ ] **Step 2: In `index.html`, add the script tag to `<head>`**

old_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>

    <title>Swan Calisthenics | Dein Outdoor-Training</title>
```

new_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>
    <script src="js/site-chrome.js"></script>

    <title>Swan Calisthenics | Dein Outdoor-Training</title>
```

- [ ] **Step 3: In `index.html`, add `data-base` to `<body>`**

old_string: `<body data-page="home">`
new_string: `<body data-page="home" data-base="">`

- [ ] **Step 4: In `index.html`, replace the topbar block**

old_string:
```html
<!-- NAVIGATION -->
<header class="topbar">
    <div class="topbar-inner">
        <a href="index.html" class="brand">
            <img src="assets/images/logo.png" alt="Swan Calisthenics Logo">
            <span>Swan Calisthenics</span>
        </a>
        <div class="topbar-right">
            <nav class="desktop-nav" aria-label="Hauptnavigation">
                <a href="#home" class="nav-link" data-page="home">Home</a>
                <a href="pages/blog/blog.html" class="nav-link" data-page="blog">Blog</a>
                <a href="pages/team.html" class="nav-link" data-page="team">Team</a>
                <a href="pages/verein.html" class="nav-link" data-page="verein">Verein</a>
                <a href="pages/kontakt.html" class="nav-link" data-page="kontakt">Kontakt</a>
            </nav>
            <button class="theme-toggle" id="themeToggle" aria-label="Dark Mode umschalten" aria-pressed="false">
                <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            <div class="profile-menu-wrapper">
                <button class="profile-toggle" id="profileToggle" onclick="handleProfileToggleClick(event)" aria-label="Mitglieder-Login">
                    <svg id="profileToggleIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>
                    <span class="profile-toggle-initial" id="profileToggleInitial" hidden></span>
                    <svg class="profile-toggle-chevron" id="profileToggleChevron" viewBox="0 0 24 24" fill="none" aria-hidden="true" hidden><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <div class="profile-dropdown" id="profileDropdown">
                    <a href="pages/mein-profil.html">Mein Profil</a>
                    <a href="pages/mitglieder.html">Mitglieder</a>
                    <button type="button" onclick="openLogoutConfirm(event)">Abmelden</button>
                </div>
            </div>
        </div>
    </div>
</header>
```

new_string:
```html
<!-- NAVIGATION -->
<site-topbar></site-topbar>
```

- [ ] **Step 5: In `index.html`, replace the login+logout modal block (leave `#set-password-modal`/`#auth-error-modal` untouched right after it)**

old_string:
```html
<!-- LOGIN-MODAL (Mitgliederbereich) -->
<div id="login-modal" class="modal-overlay">
    <div class="modal-content">
        <button class="modal-close" onclick="closeLoginDialog()" aria-label="Schliessen">&times;</button>
        <h3>Mitglieder-Login</h3>
        <form id="loginForm" onsubmit="return handleLoginSubmit(event)">
            <div class="field">
                <label for="loginEmail">E-Mail</label>
                <input type="email" id="loginEmail" name="email" required autocomplete="email">
            </div>
            <div class="field">
                <label for="loginPassword">Passwort</label>
                <div class="password-input-wrap">
                    <input type="password" id="loginPassword" name="password" required autocomplete="current-password">
                    <button type="button" class="password-toggle-visibility" onclick="togglePasswordVisibility('loginPassword', this)" aria-label="Passwort anzeigen">
                        <span class="icon icon-eye" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
            <p id="loginNotice" hidden>Anmeldung ist noch nicht aktiv – folgt in einem der nächsten Schritte.</p>
            <div class="modal-actions">
                <button type="submit" class="btn btn-primary">Anmelden</button>
            </div>
        </form>
    </div>
</div>

<div id="logout-confirm-modal" class="modal-overlay">
    <div class="modal-content">
        <button class="modal-close" onclick="closeLogoutConfirm()" aria-label="Schliessen">&times;</button>
        <h3>Wirklich abmelden?</h3>
        <div class="modal-actions">
            <button type="button" class="btn btn-primary" onclick="confirmLogout()">Abmelden</button>
            <button type="button" class="btn btn-secondary" onclick="closeLogoutConfirm()">Abbrechen</button>
        </div>
    </div>
</div>

<div id="set-password-modal" class="modal-overlay">
```

new_string:
```html
<!-- LOGIN-/LOGOUT-MODAL (Mitgliederbereich) -->
<site-account-modals></site-account-modals>

<div id="set-password-modal" class="modal-overlay">
```

- [ ] **Step 6: Verify in the browser (local server)**

Load `http://localhost:8790/index.html` (start the server first if it isn't running), then run in the page console:

```js
JSON.stringify({
  topbarHTML_nonEmpty: document.querySelector('site-topbar').innerHTML.length > 100,
  profileToggleExists: !!document.getElementById('profileToggle'),
  homeHref: document.querySelector('.nav-link[data-page="home"]').getAttribute('href'),
  blogHref: document.querySelector('.nav-link[data-page="blog"]').getAttribute('href'),
  logoSrc: document.querySelector('.topbar .brand img').getAttribute('src'),
  loginModalExists: !!document.getElementById('login-modal'),
  logoutModalExists: !!document.getElementById('logout-confirm-modal'),
  setPasswordModalStillThere: !!document.getElementById('set-password-modal'),
  authErrorModalStillThere: !!document.getElementById('auth-error-modal')
})
```

Expected: `homeHref` is `"#home"` (not `"index.html#home"`), `blogHref` is `"pages/blog/blog.html"`, `logoSrc` is `"assets/images/logo.png"`, all four `*Exists`/`*StillThere` flags `true`.

Then click the theme toggle, open/close the login modal (`openLoginDialog()` / `closeLoginDialog()` via console), open/close the logout modal (`openLogoutConfirm()` / `closeLogoutConfirm()`) — all must work exactly as before. Check the console for errors (must be none).

- [ ] **Step 7: Verify under real `file://`**

Open `index.html` directly by double-clicking it (or navigate the browser tool to `file:///C:/Source/new-swan-design/index.html`). Re-run the same console check from Step 6. This is the actual point of the exercise — a pass only counts if this works, not just the localhost version.

- [ ] **Step 8: Commit**

```bash
git add js/site-chrome.js index.html
git commit -m "Add shared site-chrome custom elements, migrate index.html"
```

---

### Task 2: Migrate the 6 depth-1 pages (`pages/*.html`)

**Files:**
- Modify: `pages/team.html`, `pages/kontakt.html`, `pages/verein.html`, `pages/rechtliches.html`, `pages/mitglieder.html`, `pages/mein-profil.html`

**Interfaces:**
- Consumes: `<site-topbar>` / `<site-account-modals>` from `js/site-chrome.js` (Task 1) — no code changes to that file in this task, only HTML migration using the same pattern as `index.html`.

All 6 files currently share the exact same topbar/modal markup (only the page's own content in `<main>` differs, which stays untouched). For each file, apply the same 4 edits as Task 1, with `data-base="../"` and the script path `../js/site-chrome.js`.

- [ ] **Step 1: `pages/team.html`**

Add script tag — old_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>

    <title>Swan Calisthenics | Team</title>
```
new_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>
    <script src="../js/site-chrome.js"></script>

    <title>Swan Calisthenics | Team</title>
```

Add `data-base` — old_string: `<body data-page="team">` — new_string: `<body data-page="team" data-base="../">`

Replace topbar — old_string:
```html
<!-- NAVIGATION -->
<header class="topbar">
    <div class="topbar-inner">
        <a href="../index.html" class="brand">
            <img src="../assets/images/logo.png" alt="Swan Calisthenics Logo">
            <span>Swan Calisthenics</span>
        </a>
        <div class="topbar-right">
            <nav class="desktop-nav" aria-label="Hauptnavigation">
                <a href="../index.html#home" class="nav-link" data-page="home">Home</a>
                <a href="blog/blog.html" class="nav-link" data-page="blog">Blog</a>
                <a href="team.html" class="nav-link" data-page="team">Team</a>
                <a href="verein.html" class="nav-link" data-page="verein">Verein</a>
                <a href="kontakt.html" class="nav-link" data-page="kontakt">Kontakt</a>
            </nav>
            <button class="theme-toggle" id="themeToggle" aria-label="Dark Mode umschalten" aria-pressed="false">
                <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            <div class="profile-menu-wrapper">
                <button class="profile-toggle" id="profileToggle" onclick="handleProfileToggleClick(event)" aria-label="Mitglieder-Login">
                    <svg id="profileToggleIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>
                    <span class="profile-toggle-initial" id="profileToggleInitial" hidden></span>
                    <svg class="profile-toggle-chevron" id="profileToggleChevron" viewBox="0 0 24 24" fill="none" aria-hidden="true" hidden><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <div class="profile-dropdown" id="profileDropdown">
                    <a href="mein-profil.html">Mein Profil</a>
                    <a href="mitglieder.html">Mitglieder</a>
                    <button type="button" onclick="openLogoutConfirm(event)">Abmelden</button>
                </div>
            </div>
        </div>
    </div>
</header>
```
new_string:
```html
<!-- NAVIGATION -->
<site-topbar></site-topbar>
```

Replace modals — old_string:
```html
<!-- LOGIN-MODAL (Mitgliederbereich) -->
<div id="login-modal" class="modal-overlay">
    <div class="modal-content">
        <button class="modal-close" onclick="closeLoginDialog()" aria-label="Schliessen">&times;</button>
        <h3>Mitglieder-Login</h3>
        <form id="loginForm" onsubmit="return handleLoginSubmit(event)">
            <div class="field">
                <label for="loginEmail">E-Mail</label>
                <input type="email" id="loginEmail" name="email" required autocomplete="email">
            </div>
            <div class="field">
                <label for="loginPassword">Passwort</label>
                <div class="password-input-wrap">
                    <input type="password" id="loginPassword" name="password" required autocomplete="current-password">
                    <button type="button" class="password-toggle-visibility" onclick="togglePasswordVisibility('loginPassword', this)" aria-label="Passwort anzeigen">
                        <span class="icon icon-eye" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
            <p id="loginNotice" hidden>Anmeldung ist noch nicht aktiv – folgt in einem der nächsten Schritte.</p>
            <div class="modal-actions">
                <button type="submit" class="btn btn-primary">Anmelden</button>
            </div>
        </form>
    </div>
</div>

<div id="logout-confirm-modal" class="modal-overlay">
    <div class="modal-content">
        <button class="modal-close" onclick="closeLogoutConfirm()" aria-label="Schliessen">&times;</button>
        <h3>Wirklich abmelden?</h3>
        <div class="modal-actions">
            <button type="button" class="btn btn-primary" onclick="confirmLogout()">Abmelden</button>
            <button type="button" class="btn btn-secondary" onclick="closeLogoutConfirm()">Abbrechen</button>
        </div>
    </div>
</div>
```
new_string:
```html
<!-- LOGIN-/LOGOUT-MODAL (Mitgliederbereich) -->
<site-account-modals></site-account-modals>
```

The topbar and modal blocks below are byte-identical across all 6 depth-1 files (verified) — only the `data-page` value, `<title>`, and script-tag anchor line differ per file. Each step below still spells out the full old_string/new_string per file rather than saying "same as Step 1", so whichever step an engineer opens has everything it needs on its own.

- [ ] **Step 2: `pages/kontakt.html`**

Add script tag — old_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>

    <title>Swan Calisthenics | Kontakt</title>
```
new_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>
    <script src="../js/site-chrome.js"></script>

    <title>Swan Calisthenics | Kontakt</title>
```

Add `data-base` — old_string: `<body data-page="kontakt">` — new_string: `<body data-page="kontakt" data-base="../">`

Replace topbar — old_string:
```html
<!-- NAVIGATION -->
<header class="topbar">
    <div class="topbar-inner">
        <a href="../index.html" class="brand">
            <img src="../assets/images/logo.png" alt="Swan Calisthenics Logo">
            <span>Swan Calisthenics</span>
        </a>
        <div class="topbar-right">
            <nav class="desktop-nav" aria-label="Hauptnavigation">
                <a href="../index.html#home" class="nav-link" data-page="home">Home</a>
                <a href="blog/blog.html" class="nav-link" data-page="blog">Blog</a>
                <a href="team.html" class="nav-link" data-page="team">Team</a>
                <a href="verein.html" class="nav-link" data-page="verein">Verein</a>
                <a href="kontakt.html" class="nav-link" data-page="kontakt">Kontakt</a>
            </nav>
            <button class="theme-toggle" id="themeToggle" aria-label="Dark Mode umschalten" aria-pressed="false">
                <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            <div class="profile-menu-wrapper">
                <button class="profile-toggle" id="profileToggle" onclick="handleProfileToggleClick(event)" aria-label="Mitglieder-Login">
                    <svg id="profileToggleIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>
                    <span class="profile-toggle-initial" id="profileToggleInitial" hidden></span>
                    <svg class="profile-toggle-chevron" id="profileToggleChevron" viewBox="0 0 24 24" fill="none" aria-hidden="true" hidden><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <div class="profile-dropdown" id="profileDropdown">
                    <a href="mein-profil.html">Mein Profil</a>
                    <a href="mitglieder.html">Mitglieder</a>
                    <button type="button" onclick="openLogoutConfirm(event)">Abmelden</button>
                </div>
            </div>
        </div>
    </div>
</header>
```
new_string:
```html
<!-- NAVIGATION -->
<site-topbar></site-topbar>
```

Replace modals — old_string:
```html
<!-- LOGIN-MODAL (Mitgliederbereich) -->
<div id="login-modal" class="modal-overlay">
    <div class="modal-content">
        <button class="modal-close" onclick="closeLoginDialog()" aria-label="Schliessen">&times;</button>
        <h3>Mitglieder-Login</h3>
        <form id="loginForm" onsubmit="return handleLoginSubmit(event)">
            <div class="field">
                <label for="loginEmail">E-Mail</label>
                <input type="email" id="loginEmail" name="email" required autocomplete="email">
            </div>
            <div class="field">
                <label for="loginPassword">Passwort</label>
                <div class="password-input-wrap">
                    <input type="password" id="loginPassword" name="password" required autocomplete="current-password">
                    <button type="button" class="password-toggle-visibility" onclick="togglePasswordVisibility('loginPassword', this)" aria-label="Passwort anzeigen">
                        <span class="icon icon-eye" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
            <p id="loginNotice" hidden>Anmeldung ist noch nicht aktiv – folgt in einem der nächsten Schritte.</p>
            <div class="modal-actions">
                <button type="submit" class="btn btn-primary">Anmelden</button>
            </div>
        </form>
    </div>
</div>

<div id="logout-confirm-modal" class="modal-overlay">
    <div class="modal-content">
        <button class="modal-close" onclick="closeLogoutConfirm()" aria-label="Schliessen">&times;</button>
        <h3>Wirklich abmelden?</h3>
        <div class="modal-actions">
            <button type="button" class="btn btn-primary" onclick="confirmLogout()">Abmelden</button>
            <button type="button" class="btn btn-secondary" onclick="closeLogoutConfirm()">Abbrechen</button>
        </div>
    </div>
</div>
```
new_string:
```html
<!-- LOGIN-/LOGOUT-MODAL (Mitgliederbereich) -->
<site-account-modals></site-account-modals>
```

- [ ] **Step 3: `pages/verein.html`**

Add script tag — old_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>

    <title>Swan Calisthenics | Verein</title>
```
new_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>
    <script src="../js/site-chrome.js"></script>

    <title>Swan Calisthenics | Verein</title>
```

Add `data-base` — old_string: `<body data-page="verein">` — new_string: `<body data-page="verein" data-base="../">`

Replace topbar — old_string (identical to Step 2's topbar old_string above) — new_string:
```html
<!-- NAVIGATION -->
<site-topbar></site-topbar>
```

Replace modals — old_string (identical to Step 2's modals old_string above) — new_string:
```html
<!-- LOGIN-/LOGOUT-MODAL (Mitgliederbereich) -->
<site-account-modals></site-account-modals>
```

- [ ] **Step 4: `pages/rechtliches.html`**

Add script tag — old_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>

    <title>Swan Calisthenics | Rechtliches</title>
```
new_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>
    <script src="../js/site-chrome.js"></script>

    <title>Swan Calisthenics | Rechtliches</title>
```

Add `data-base` — old_string: `<body data-page="rechtliches">` — new_string: `<body data-page="rechtliches" data-base="../">`

Replace topbar — old_string (identical to Step 2's topbar old_string above) — new_string:
```html
<!-- NAVIGATION -->
<site-topbar></site-topbar>
```

Replace modals — old_string (identical to Step 2's modals old_string above) — new_string:
```html
<!-- LOGIN-/LOGOUT-MODAL (Mitgliederbereich) -->
<site-account-modals></site-account-modals>
```

- [ ] **Step 5: `pages/mitglieder.html`**

Add script tag — old_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>

    <title>Swan Calisthenics | Mitglieder</title>
```
new_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>
    <script src="../js/site-chrome.js"></script>

    <title>Swan Calisthenics | Mitglieder</title>
```

Add `data-base` — old_string: `<body data-page="mitglieder">` — new_string: `<body data-page="mitglieder" data-base="../">`

Replace topbar — old_string (identical to Step 2's topbar old_string above) — new_string:
```html
<!-- NAVIGATION -->
<site-topbar></site-topbar>
```

Replace modals — old_string (identical to Step 2's modals old_string above) — new_string:
```html
<!-- LOGIN-/LOGOUT-MODAL (Mitgliederbereich) -->
<site-account-modals></site-account-modals>
```

This file has extra unrelated content (`#mitglied-modal`, `#email-modal`, `#eingeladeneListe`, etc.) between the topbar and the login-modal, and possibly further edits from other in-progress work on this file — search for the exact old_string blocks above rather than assuming fixed line numbers, and do not touch anything outside those two blocks.

- [ ] **Step 6: `pages/mein-profil.html`**

Add script tag — old_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>

    <title>Swan Calisthenics | Mein Profil</title>
```
new_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>
    <script src="../js/site-chrome.js"></script>

    <title>Swan Calisthenics | Mein Profil</title>
```

Add `data-base` — old_string: `<body data-page="mein-profil">` — new_string: `<body data-page="mein-profil" data-base="../">`

Replace topbar — old_string (identical to Step 2's topbar old_string above) — new_string:
```html
<!-- NAVIGATION -->
<site-topbar></site-topbar>
```

Replace modals — old_string (identical to Step 2's modals old_string above) — new_string:
```html
<!-- LOGIN-/LOGOUT-MODAL (Mitgliederbereich) -->
<site-account-modals></site-account-modals>
```

- [ ] **Step 7: Verify all 6 pages in the browser (local server)**

For each of the 6 URLs (`http://localhost:8790/pages/team.html`, `.../kontakt.html`, `.../verein.html`, `.../rechtliches.html`, `.../mitglieder.html`, `.../mein-profil.html`), run:

```js
JSON.stringify({
  homeHref: document.querySelector('.nav-link[data-page="home"]').getAttribute('href'),
  blogHref: document.querySelector('.nav-link[data-page="blog"]').getAttribute('href'),
  logoSrc: document.querySelector('.topbar .brand img').getAttribute('src'),
  activeNavMatchesPage: document.querySelector(`.nav-link[data-page="${document.body.dataset.page}"]`).classList.contains('active'),
  loginModalExists: !!document.getElementById('login-modal')
})
```

Expected on every one of the 6 pages: `homeHref === "../index.html#home"`, `blogHref === "../pages/blog/blog.html"`, `logoSrc === "../assets/images/logo.png"`, `activeNavMatchesPage === true`, `loginModalExists === true`. No console errors on any of the 6.

- [ ] **Step 8: Verify all 6 under real `file://`**

Open each of the 6 files directly (or navigate the browser tool to e.g. `file:///C:/Source/new-swan-design/pages/team.html`). Re-run the same check from Step 7 on at least 2 of the 6 as a spot check (all 6 use byte-identical shared markup, so if 2 pass under `file://`, the mechanism is proven).

- [ ] **Step 9: Commit**

```bash
git add pages/team.html pages/kontakt.html pages/verein.html pages/rechtliches.html pages/mitglieder.html pages/mein-profil.html
git commit -m "Migrate depth-1 pages to shared site-chrome custom elements"
```

---

### Task 3: Migrate the 2 depth-2 pages (`pages/blog/*.html`)

**Files:**
- Modify: `pages/blog/blog.html`, `pages/blog/post.html`

**Interfaces:**
- Consumes: same as Task 2, `data-base="../../"` and script path `../../js/site-chrome.js`.

- [ ] **Step 1: `pages/blog/blog.html`**

Add script tag — old_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>

    <title>Blog | Swan Calisthenics</title>
```
new_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>
    <script src="../../js/site-chrome.js"></script>

    <title>Blog | Swan Calisthenics</title>
```

Add `data-base` — old_string: `<body data-page="blog">` — new_string: `<body data-page="blog" data-base="../../">`

Replace topbar — old_string:
```html
<!-- NAVIGATION -->
<header class="topbar">
    <div class="topbar-inner">
        <a href="../../index.html" class="brand">
            <img src="../../assets/images/logo.png" alt="Swan Calisthenics Logo">
            <span>Swan Calisthenics</span>
        </a>
        <div class="topbar-right">
            <nav class="desktop-nav" aria-label="Hauptnavigation">
                <a href="../../index.html#home" class="nav-link" data-page="home">Home</a>
                <a href="blog.html" class="nav-link" data-page="blog">Blog</a>
                <a href="../team.html" class="nav-link" data-page="team">Team</a>
                <a href="../verein.html" class="nav-link" data-page="verein">Verein</a>
                <a href="../kontakt.html" class="nav-link" data-page="kontakt">Kontakt</a>
            </nav>
            <button class="theme-toggle" id="themeToggle" aria-label="Dark Mode umschalten" aria-pressed="false">
                <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            <div class="profile-menu-wrapper">
                <button class="profile-toggle" id="profileToggle" onclick="handleProfileToggleClick(event)" aria-label="Mitglieder-Login">
                    <svg id="profileToggleIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>
                    <span class="profile-toggle-initial" id="profileToggleInitial" hidden></span>
                    <svg class="profile-toggle-chevron" id="profileToggleChevron" viewBox="0 0 24 24" fill="none" aria-hidden="true" hidden><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <div class="profile-dropdown" id="profileDropdown">
                    <a href="../mein-profil.html">Mein Profil</a>
                    <a href="../mitglieder.html">Mitglieder</a>
                    <button type="button" onclick="openLogoutConfirm(event)">Abmelden</button>
                </div>
            </div>
        </div>
    </div>
</header>
```
new_string:
```html
<!-- NAVIGATION -->
<site-topbar></site-topbar>
```

Replace modals — old_string:
```html
<!-- LOGIN-MODAL (Mitgliederbereich) -->
<div id="login-modal" class="modal-overlay">
    <div class="modal-content">
        <button class="modal-close" onclick="closeLoginDialog()" aria-label="Schliessen">&times;</button>
        <h3>Mitglieder-Login</h3>
        <form id="loginForm" onsubmit="return handleLoginSubmit(event)">
            <div class="field">
                <label for="loginEmail">E-Mail</label>
                <input type="email" id="loginEmail" name="email" required autocomplete="email">
            </div>
            <div class="field">
                <label for="loginPassword">Passwort</label>
                <div class="password-input-wrap">
                    <input type="password" id="loginPassword" name="password" required autocomplete="current-password">
                    <button type="button" class="password-toggle-visibility" onclick="togglePasswordVisibility('loginPassword', this)" aria-label="Passwort anzeigen">
                        <span class="icon icon-eye" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
            <p id="loginNotice" hidden>Anmeldung ist noch nicht aktiv – folgt in einem der nächsten Schritte.</p>
            <div class="modal-actions">
                <button type="submit" class="btn btn-primary">Anmelden</button>
            </div>
        </form>
    </div>
</div>

<div id="logout-confirm-modal" class="modal-overlay">
    <div class="modal-content">
        <button class="modal-close" onclick="closeLogoutConfirm()" aria-label="Schliessen">&times;</button>
        <h3>Wirklich abmelden?</h3>
        <div class="modal-actions">
            <button type="button" class="btn btn-primary" onclick="confirmLogout()">Abmelden</button>
            <button type="button" class="btn btn-secondary" onclick="closeLogoutConfirm()">Abbrechen</button>
        </div>
    </div>
</div>
```
new_string:
```html
<!-- LOGIN-/LOGOUT-MODAL (Mitgliederbereich) -->
<site-account-modals></site-account-modals>
```

- [ ] **Step 2: `pages/blog/post.html`**

`post.html`'s topbar/modal blocks and `<title>` text are byte-identical to `blog.html`'s (verified) — `data-page="blog"` also stays `"blog"` here (post.html shares the blog page-identity, unaffected by this change).

Add script tag — old_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>

    <title>Blog | Swan Calisthenics</title>
```
new_string:
```html
    <script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var lm=document.querySelector('meta[data-scheme="light"]'),dm=document.querySelector('meta[data-scheme="dark"]');if(t==='dark'){lm.media='not all';dm.media='all';}else if(t==='light'){lm.media='all';dm.media='not all';}})();</script>
    <script src="../../js/site-chrome.js"></script>

    <title>Blog | Swan Calisthenics</title>
```

Add `data-base` — old_string: `<body data-page="blog">` — new_string: `<body data-page="blog" data-base="../../">`

Replace topbar — old_string:
```html
<!-- NAVIGATION -->
<header class="topbar">
    <div class="topbar-inner">
        <a href="../../index.html" class="brand">
            <img src="../../assets/images/logo.png" alt="Swan Calisthenics Logo">
            <span>Swan Calisthenics</span>
        </a>
        <div class="topbar-right">
            <nav class="desktop-nav" aria-label="Hauptnavigation">
                <a href="../../index.html#home" class="nav-link" data-page="home">Home</a>
                <a href="blog.html" class="nav-link" data-page="blog">Blog</a>
                <a href="../team.html" class="nav-link" data-page="team">Team</a>
                <a href="../verein.html" class="nav-link" data-page="verein">Verein</a>
                <a href="../kontakt.html" class="nav-link" data-page="kontakt">Kontakt</a>
            </nav>
            <button class="theme-toggle" id="themeToggle" aria-label="Dark Mode umschalten" aria-pressed="false">
                <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
            <div class="profile-menu-wrapper">
                <button class="profile-toggle" id="profileToggle" onclick="handleProfileToggleClick(event)" aria-label="Mitglieder-Login">
                    <svg id="profileToggleIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>
                    <span class="profile-toggle-initial" id="profileToggleInitial" hidden></span>
                    <svg class="profile-toggle-chevron" id="profileToggleChevron" viewBox="0 0 24 24" fill="none" aria-hidden="true" hidden><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <div class="profile-dropdown" id="profileDropdown">
                    <a href="../mein-profil.html">Mein Profil</a>
                    <a href="../mitglieder.html">Mitglieder</a>
                    <button type="button" onclick="openLogoutConfirm(event)">Abmelden</button>
                </div>
            </div>
        </div>
    </div>
</header>
```
new_string:
```html
<!-- NAVIGATION -->
<site-topbar></site-topbar>
```

Replace modals — old_string:
```html
<!-- LOGIN-MODAL (Mitgliederbereich) -->
<div id="login-modal" class="modal-overlay">
    <div class="modal-content">
        <button class="modal-close" onclick="closeLoginDialog()" aria-label="Schliessen">&times;</button>
        <h3>Mitglieder-Login</h3>
        <form id="loginForm" onsubmit="return handleLoginSubmit(event)">
            <div class="field">
                <label for="loginEmail">E-Mail</label>
                <input type="email" id="loginEmail" name="email" required autocomplete="email">
            </div>
            <div class="field">
                <label for="loginPassword">Passwort</label>
                <div class="password-input-wrap">
                    <input type="password" id="loginPassword" name="password" required autocomplete="current-password">
                    <button type="button" class="password-toggle-visibility" onclick="togglePasswordVisibility('loginPassword', this)" aria-label="Passwort anzeigen">
                        <span class="icon icon-eye" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
            <p id="loginNotice" hidden>Anmeldung ist noch nicht aktiv – folgt in einem der nächsten Schritte.</p>
            <div class="modal-actions">
                <button type="submit" class="btn btn-primary">Anmelden</button>
            </div>
        </form>
    </div>
</div>

<div id="logout-confirm-modal" class="modal-overlay">
    <div class="modal-content">
        <button class="modal-close" onclick="closeLogoutConfirm()" aria-label="Schliessen">&times;</button>
        <h3>Wirklich abmelden?</h3>
        <div class="modal-actions">
            <button type="button" class="btn btn-primary" onclick="confirmLogout()">Abmelden</button>
            <button type="button" class="btn btn-secondary" onclick="closeLogoutConfirm()">Abbrechen</button>
        </div>
    </div>
</div>
```
new_string:
```html
<!-- LOGIN-/LOGOUT-MODAL (Mitgliederbereich) -->
<site-account-modals></site-account-modals>
```

- [ ] **Step 3: Verify both pages in the browser (local server)**

For `http://localhost:8790/pages/blog/blog.html` and `.../pages/blog/post.html?id=1`, run:

```js
JSON.stringify({
  homeHref: document.querySelector('.nav-link[data-page="home"]').getAttribute('href'),
  blogHref: document.querySelector('.nav-link[data-page="blog"]').getAttribute('href'),
  teamHref: document.querySelector('.nav-link[data-page="team"]').getAttribute('href'),
  logoSrc: document.querySelector('.topbar .brand img').getAttribute('src'),
  loginModalExists: !!document.getElementById('login-modal')
})
```

Expected: `homeHref === "../../index.html#home"`, `blogHref === "../../pages/blog/blog.html"` (note: this now points to itself via the long root-relative form — a valid, working link, just longer than the old `"blog.html"`), `teamHref === "../../pages/team.html"`, `logoSrc === "../../assets/images/logo.png"`, `loginModalExists === true`. No console errors.

- [ ] **Step 4: Verify both under real `file://`**

Navigate to `file:///C:/Source/new-swan-design/pages/blog/blog.html` and `file:///C:/Source/new-swan-design/pages/blog/post.html?id=1`, re-run the Step 3 check on both.

- [ ] **Step 5: Commit**

```bash
git add pages/blog/blog.html pages/blog/post.html
git commit -m "Migrate blog pages to shared site-chrome custom elements"
```

---

### Task 4: Full regression pass and documentation

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- None (documentation + verification only, no new code).

- [ ] **Step 1: Full click-through regression on at least 3 pages spanning all 3 depths**

Pick `index.html` (depth 0), `pages/mitglieder.html` (depth 1), `pages/blog/post.html` (depth 2). On each, via the browser tool:
- Toggle dark/light mode, confirm it still applies correctly.
- Resize to mobile width (375px) and back to desktop — confirm the topbar collapses to logo+theme-toggle under 768px and the tab-bar at the bottom is unaffected (it was never touched by this migration).
- Open the login modal, confirm the eye-icon password toggle still works (`togglePasswordVisibility('loginPassword', ...)`).
- Open the logout-confirmation modal, confirm cancel/confirm both still work without errors.
- Click through all 5 topbar nav links once each and confirm they land on the right page (this also exercises the root-relative path rewrite end to end).
- Check `read_console_messages` for errors on each of the 3 pages — must be empty.

- [ ] **Step 2: Update `CLAUDE.md`**

Add a new numbered entry (check the current highest number in the existing list and use the next one) documenting: the duplication problem, the Custom Element solution, the `data-base` mechanism including the Home-link special case, what was explicitly left untouched (footer, tab-bar, `index.html`'s set-password/auth-error modals), and that this closes out the item from CLAUDE.md's Punkt 41 discussion about repeated 9x manual edits. Follow the existing entries' style: German, explains the *why* not just the *what*, references file paths.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Document shared site-chrome migration in CLAUDE.md"
```

Do not push — only push when the user explicitly asks.
