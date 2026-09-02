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

// Generischer lokaler Formular-Entwurf: haelt eingetippte, aber noch nicht
// abgeschickte Werte in localStorage fest, damit sie nicht verloren gehen,
// wenn z.B. auf dem Handy der Tab geschlossen wird, bevor ein Formular
// abgesendet wurde (analog zu TikTok/Instagram). Bewusst NIE fuer
// Passwort-Felder verwenden - localStorage ist Klartext und fuer jedes
// Skript auf der Seite lesbar, ein Passwort dort waere ein unnoetiges
// Sicherheitsrisiko (z.B. bei einem kuenftigen XSS-Bug oder auf einem
// gemeinsam genutzten Geraet).
function wireDraftInputs(storageKey, fieldIds) {
    const felder = fieldIds
        .map(id => document.getElementById(id))
        .filter(Boolean);

    let entwurf;
    try {
        entwurf = JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {
        entwurf = {};
    }

    felder.forEach(feld => {
        if (!(feld.id in entwurf)) return;
        if (feld.type === 'checkbox') {
            feld.checked = !!entwurf[feld.id];
        } else {
            feld.value = entwurf[feld.id];
        }
    });

    function entwurfSpeichern() {
        const werte = {};
        felder.forEach(feld => {
            werte[feld.id] = feld.type === 'checkbox' ? feld.checked : feld.value;
        });
        localStorage.setItem(storageKey, JSON.stringify(werte));
    }

    felder.forEach(feld => {
        feld.addEventListener(feld.type === 'checkbox' ? 'change' : 'input', entwurfSpeichern);
    });
}

function clearDraft(storageKey) {
    localStorage.removeItem(storageKey);
}

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

class SiteTopbar extends HTMLElement {
    connectedCallback() {
        // Beides muss hier im Custom Element selbst gesetzt werden, nicht am
        // Aufrufort in jeder Seite: (1) class="topbar" - components.css haengt
        // Position/Hintergrund/z-index daran auf (siehe .topbar dort), sonst
        // muesste jede der 9 Seiten das Attribut einzeln mitschleppen. (2)
        // role="banner" - das entfernte <header class="topbar"> war direktes
        // Kind von <body> und hatte dadurch implizit die ARIA-Landmark-Rolle
        // "banner" (Screenreader-Sprungmarke); ein autonomes Custom Element
        // hat keine implizite Rolle, das muss also explizit nachgezogen werden.
        this.classList.add('topbar');
        this.setAttribute('role', 'banner');
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
                            <a href="${base}pages/mein-profil.html#postfach">Postfach</a>
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
                    <p class="form-hint">Noch kein Konto? <a href="#" onclick="openAccountRequestDialog(event)">Zugang anfragen</a></p>
                </div>
            </div>

            <div id="account-request-modal" class="modal-overlay">
                <div class="modal-content">
                    <button class="modal-close" onclick="closeAccountRequestDialog()" aria-label="Schliessen">&times;</button>
                    <h3>Zugang anfragen</h3>
                    <p class="form-hint">Deine Anfrage wird innerhalb der nächsten 72 Stunden bearbeitet. Wenn du berechtigt bist, einen Zugang zu erhalten, bekommst du eine Nachricht per E-Mail.</p>
                    <form id="accountRequestForm" onsubmit="return handleAccountRequestSubmit(event)">
                        <div class="field">
                            <label for="requestName">Name</label>
                            <input type="text" id="requestName" name="name" required autocomplete="name">
                        </div>
                        <div class="field">
                            <label for="requestEmail">E-Mail</label>
                            <input type="email" id="requestEmail" name="email" required autocomplete="email">
                        </div>
                        <p id="accountRequestNotice" class="form-hint" hidden></p>
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">Anfrage senden</button>
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
        wireDraftInputs('login-entwurf', ['loginEmail']);
        wireDraftInputs('konto-anfrage-entwurf', ['requestName', 'requestEmail']);
    }
}

customElements.define('site-topbar', SiteTopbar);
customElements.define('site-account-modals', SiteAccountModals);
