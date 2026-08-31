// Rendert die Mitgliederliste als kompaktes Karten-Raster (bewusst viel
// kleiner als die Team-Karten, da hier potenziell viel mehr Personen stehen
// können) inkl. Rollen-Filter und Namenssuche. Eine Karte zeigt nur Foto,
// Name und Rolle - ein Klick/Tap öffnet #mitglied-modal mit den vollständigen
// Details (Social-Links etc.) für genau diese eine Person.

let alleMitglieder = [];
let alleEingeladene = [];
let alleKontoAnfragen = [];
let currentUserIsAdmin = false;
let viewAsNormalMember = false;
let editingMitgliedId = null;
let anfrageZumLoeschenId = null;

// Rein lokale Simulation fuer die Dauer des Seitenaufrufs (kein Reload-
// sicherer Zustand, keine Datenbank-Aenderung) - ein Admin kann sich damit
// die Ansicht eines normalen Mitglieds anschauen, ohne die eigenen echten
// Admin-Rechte zu verlieren.
function toggleViewAsNormal() {
    viewAsNormalMember = !viewAsNormalMember;
    updateViewAsToggleUI();
    // Falls das Modal gerade offen ist, Editor-Sichtbarkeit sofort anpassen.
    const rollenEditor = document.getElementById('mitgliedRollenEditor');
    if (rollenEditor) {
        rollenEditor.hidden = !(currentUserIsAdmin && !viewAsNormalMember);
    }
    renderEingeladeneOhneProfil();
    renderKontoAnfragen();
    // Deutliche Rueckmeldung direkt beim Klick - der Button-Text allein
    // aendert sich zwar auch, ist aber leicht zu uebersehen, vor allem weil
    // der eigentliche Effekt (Rollen-Editor im Modal) erst beim naechsten
    // Oeffnen einer Karte sichtbar wird.
    const notice = document.getElementById('viewAsNotice');
    if (notice) {
        notice.textContent = viewAsNormalMember
            ? 'Testansicht aktiv: Du siehst die Seite jetzt wie ein normales Mitglied (Rollen-Bearbeitung im Modal ist ausgeblendet).'
            : 'Zurück in der normalen Admin-Ansicht.';
        notice.hidden = false;
    }
}

// Setzt den Admin-Zustand beim Abmelden wirklich zurueck - sonst blieben
// der Umschalter-Button und seine Meldung von der vorherigen (echten)
// Admin-Session sichtbar, obwohl currentUserIsAdmin/viewAsNormalMember
// laengst veraltet waeren (siehe initAuthGate-Aufruf ganz unten).
function resetAdminUI() {
    currentUserIsAdmin = false;
    viewAsNormalMember = false;
    alleEingeladene = [];
    alleKontoAnfragen = [];
    const btn = document.getElementById('viewAsToggle');
    if (btn) btn.hidden = true;
    const notice = document.getElementById('viewAsNotice');
    if (notice) notice.hidden = true;
    const rollenEditor = document.getElementById('mitgliedRollenEditor');
    if (rollenEditor) rollenEditor.hidden = true;
    const eingeladeneListe = document.getElementById('eingeladeneListe');
    if (eingeladeneListe) eingeladeneListe.hidden = true;
    const kontoAnfragenListe = document.getElementById('kontoAnfragenListe');
    if (kontoAnfragenListe) kontoAnfragenListe.hidden = true;
}

// Zeigt Accounts, die schon eingeladen wurden (existieren in auth.users),
// aber noch nie ihr Profil gespeichert haben - kommen aus der View
// `eingeladene_ohne_profil` (siehe supabase/003-eingeladene-ohne-profil.sql),
// die selbst schon nach Admin filtert (liefert fuer Nicht-Admins immer 0
// Zeilen). Nur eine E-Mail statt Name/Rollen, da noch keine echte
// profiles-Zeile existiert - bewusst nicht anklickbar, es gibt nichts zu
// bearbeiten. Zusaetzlich hier clientseitig an "als normales Mitglied
// testen" gekoppelt, damit dieser Testmodus die Seite wirklich wie ein
// normales Mitglied zeigt.
function renderEingeladeneOhneProfil() {
    const container = document.getElementById('eingeladeneListe');
    if (!container) return;
    const zeigen = currentUserIsAdmin && !viewAsNormalMember && alleEingeladene.length > 0;
    container.hidden = !zeigen;
    if (!zeigen) return;
    container.innerHTML = `
        <h3 class="eingeladene-heading">Ausstehende Einladungen</h3>
        ${alleEingeladene.map(e => `
            <div class="glass-card eingeladene-card">
                <span class="badge badge-pending">Einladung ausstehend</span>
                <span class="eingeladene-email">${e.email}</span>
            </div>
        `).join('')}
    `;
}

// Roh in innerHTML eingesetzter Text muss escaped werden, sonst waere ein
// <script>-Name in einer Konto-Anfrage gespeichertes XSS gegen jeden Admin,
// der diese Seite oeffnet - anders als z.B. profiles.name (nur von der
// eingeloggten Person selbst ueber ihr eigenes Profil setzbar) kommt
// name/email hier von einem voellig unauthentifizierten Formular, kann
// also von jedem im Internet frei befuellt werden.
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Zeigt Konto-Anfragen ueber "Zugang anfragen" im Login-Modal (siehe
// supabase/008-konto-anfragen.sql). Noch keine Annehmen-Aktion (dafuer
// muesste erst noch ein echter Einladungs-Trigger von hier aus gebaut
// werden) - nur Ansehen und Loeschen. Gleiches .eingeladene-*-Markup/CSS
// wie renderEingeladeneOhneProfil() wiederverwendet statt eigener Klassen,
// da optisch identisch gewuenscht.
function renderKontoAnfragen() {
    const container = document.getElementById('kontoAnfragenListe');
    if (!container) return;
    const zeigen = currentUserIsAdmin && !viewAsNormalMember && alleKontoAnfragen.length > 0;
    container.hidden = !zeigen;
    if (!zeigen) return;
    container.innerHTML = `
        <h3 class="eingeladene-heading">Ausstehende Anfragen</h3>
        ${alleKontoAnfragen.map(a => `
            <div class="glass-card eingeladene-card">
                <span class="badge badge-pending">Zugang angefragt</span>
                <span class="eingeladene-email">${escapeHtml(a.name)} – ${escapeHtml(a.email)}</span>
                <button type="button" class="btn btn-secondary anfrage-loeschen-btn" onclick="openDeleteAnfrageConfirm('${a.id}')">Löschen</button>
            </div>
        `).join('')}
    `;
}

// a.id ist ein server-generiertes UUID (gen_random_uuid()), nie
// Nutzereingabe - im Gegensatz zu name/email oben unbedenklich direkt ins
// onclick-Attribut interpoliert.
function openDeleteAnfrageConfirm(id) {
    anfrageZumLoeschenId = id;
    const errorEl = document.getElementById('deleteAnfrageError');
    if (errorEl) errorEl.hidden = true;
    const modal = document.getElementById('delete-anfrage-confirm-modal');
    if (!modal) return;
    modal.classList.add('active');
    updateBodyScrollLock();
}

function closeDeleteAnfrageConfirm() {
    anfrageZumLoeschenId = null;
    const modal = document.getElementById('delete-anfrage-confirm-modal');
    if (modal) modal.classList.remove('active');
    updateBodyScrollLock();
}

async function confirmDeleteAnfrage() {
    if (!anfrageZumLoeschenId) return;
    const { error } = await supabaseClient
        .from('konto_anfragen')
        .delete()
        .eq('id', anfrageZumLoeschenId);
    if (error) {
        const errorEl = document.getElementById('deleteAnfrageError');
        errorEl.textContent = 'Löschen fehlgeschlagen: ' + error.message;
        errorEl.hidden = false;
        return;
    }
    alleKontoAnfragen = alleKontoAnfragen.filter(a => a.id !== anfrageZumLoeschenId);
    renderKontoAnfragen();
    closeDeleteAnfrageConfirm();
}

function updateViewAsToggleUI() {
    const btn = document.getElementById('viewAsToggle');
    if (!btn) return;
    btn.hidden = !currentUserIsAdmin;
    btn.textContent = viewAsNormalMember
        ? 'Ansicht: normales Mitglied (zurück zu Admin)'
        : 'Ansicht: Admin (als normales Mitglied testen)';
}

function renderMitgliederGrid(mitglieder) {
    const grid = document.getElementById('mitgliederGrid');
    if (!grid) return;

    if (!mitglieder.length) {
        grid.innerHTML = '<p class="section-lead">Keine Mitglieder gefunden.</p>';
        return;
    }

    grid.innerHTML = mitglieder.map((m, i) => `
        <div class="glass-card mitglieder-card" role="button" tabindex="0" data-index="${i}">
            <div class="mitglieder-avatar" aria-hidden="true">${m.initial}</div>
            <h3>${m.name}</h3>
            <div class="mitglieder-badges">
                ${m.rollen.map(r => `<span class="badge badge-category">${r}</span>`).join('')}
                ${m.isSelf ? '<span class="badge badge-pending">Das bist du</span>' : ''}
            </div>
        </div>
    `).join('');

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
}

// --- MITGLIED-PROFIL-MODAL --- Fuellt #mitglied-modal mit den Daten der
// angeklickten Person und zeigt es an.
function openMitgliedModal(m) {
    const modal = document.getElementById('mitglied-modal');
    if (!modal) return;

    document.getElementById('mitgliedModalAvatar').textContent = m.initial;
    document.getElementById('mitgliedModalName').textContent = m.name;

    document.getElementById('mitgliedModalBadges').innerHTML = `
        ${m.rollen.map(r => `<span class="badge badge-category">${r}</span>`).join('')}
        ${m.isSelf ? '<span class="badge badge-pending">Das bist du</span>' : ''}
    `;

    document.getElementById('mitgliedModalSelfLink').hidden = !m.isSelf;

    document.getElementById('mitgliedModalLinks').innerHTML = `
        ${m.instagram ? `<a href="${m.instagram}" target="_blank" rel="noopener" title="Instagram"><span class="icon icon-instagram" aria-hidden="true"></span></a>` : ''}
        ${m.tiktok ? `<a href="${m.tiktok}" target="_blank" rel="noopener" title="TikTok"><span class="icon icon-tiktok" aria-hidden="true"></span></a>` : ''}
        ${m.email ? `<a href="#" title="E-Mail" onclick="openEmailDialog(event, '${m.email}')"><span class="icon icon-envelope" aria-hidden="true"></span></a>` : ''}
    `;

    const rollenEditor = document.getElementById('mitgliedRollenEditor');
    const zeigeAdminUI = currentUserIsAdmin && !viewAsNormalMember;
    if (rollenEditor) {
        rollenEditor.hidden = !zeigeAdminUI;
        if (zeigeAdminUI) {
            editingMitgliedId = m.id;
            rollenEditor.querySelectorAll('.mitglied-rollen-checkbox').forEach(cb => {
                cb.checked = m.rollen.includes(cb.value);
            });
            const notice = document.getElementById('mitgliedRollenNotice');
            notice.hidden = true;
        }
    }

    modal.classList.add('active');
    updateBodyScrollLock();
}

// Feste Toggle-Optionen im Rollen-Editor. "Admin" bewusst nie als Option
// (siehe saveMitgliedRollen unten) - Admin laesst sich nur direkt per
// Supabase SQL vergeben/entziehen, nie ueber dieses UI.
const BEKANNTE_ROLLEN = ['Mitglied', 'Ehrenmitglied', 'Präsident'];

// Nur sichtbar/nutzbar fuer Admins, die sich nicht gerade als normales
// Mitglied ausgeben (siehe openMitgliedModal oben). "Admin" taucht in den
// Checkboxen absichtlich gar nicht erst auf (statt es anzubieten und dann
// zu verwerfen) - der bisherige Admin-Status wird hier einfach unveraendert
// uebernommen. Die eigentliche Absicherung liegt trotzdem in der Datenbank
// (Trigger + Policies, siehe supabase/002-admin-rollen.sql), nicht hier im
// UI - falls doch mal direkt per API manipuliert wuerde.
async function saveMitgliedRollen() {
    const notice = document.getElementById('mitgliedRollenNotice');
    const editor = document.getElementById('mitgliedRollenEditor');
    const btn = editor.querySelector('.btn');
    let neueRollen = Array.from(editor.querySelectorAll('.mitglied-rollen-checkbox:checked')).map(cb => cb.value);

    const mitglied = alleMitglieder.find(m => m.id === editingMitgliedId);
    // Admin-Rueckergaenzung VOR der "mindestens eine Rolle"-Pruefung, nicht
    // danach - sonst kam die Meldung faelschlich auch bei einem Admin, der
    // alle sichtbaren Toggles abwaehlt: der behaelt ja ohnehin "Admin" und
    // landet nie wirklich bei 0 Rollen.
    if (mitglied?.rollen.includes('Admin')) {
        neueRollen.push('Admin');
    }

    if (!neueRollen.length) {
        notice.textContent = 'Mindestens eine Rolle auswählen.';
        notice.hidden = false;
        return;
    }

    // Laeuft ueber die SECURITY DEFINER-Funktion admin_set_rollen() statt
    // eines direkten .update() (siehe supabase/007-admin-set-rollen-rpc.sql
    // und CLAUDE.md Punkt 46) - ein direktes .update() unterlag einer
    // bisher ungeklaerten Postgres-RLS-Eigenheit bei selbstbezueglichen
    // Admin-Checks (auch nach zwei gezielten RLS-Fixversuchen weiterhin
    // reproduzierbar), die Admins am Bearbeiten fremder Zeilen hinderte.
    // Die Funktion prueft die Berechtigung selbst per einfachem
    // if-exists-Check und wirft bei fehlender Berechtigung eine klare
    // Exception, die hier als error.message ankommt - kein stilles
    // 0-Zeilen-Problem mehr moeglich.
    const { error } = await supabaseClient
        .rpc('admin_set_rollen', { target_id: editingMitgliedId, neue_rollen: neueRollen });

    if (error) {
        notice.textContent = 'Fehler: ' + error.message;
        notice.hidden = false;
        return;
    }

    if (mitglied) mitglied.rollen = neueRollen;
    // Gleiches Muster wie beim bestehenden "Kopiert!"-Button
    // (copyToClipboard() in main.js): Erfolg zeigt sich kurz im Button
    // selbst statt in einer zusaetzlichen Zeile darunter.
    const originalText = btn.textContent;
    btn.textContent = 'Gespeichert!';
    btn.classList.add('copied');
    setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('copied');
    }, 2000);
    renderMitgliederGrid(alleMitglieder);
    document.getElementById('mitgliedModalBadges').innerHTML = `
        ${neueRollen.map(r => `<span class="badge badge-category">${r}</span>`).join('')}
        ${mitglied?.isSelf ? '<span class="badge badge-pending">Das bist du</span>' : ''}
    `;
}

function closeMitgliedModal() {
    const modal = document.getElementById('mitglied-modal');
    if (modal) modal.classList.remove('active');
    updateBodyScrollLock();
}

// Baut die Rollen-Filterleiste aus den tatsächlich vorkommenden Rollen auf
// (kein festes Set), damit neue Rollen automatisch im Filter auftauchen.
function initMitgliederFilter(mitglieder) {
    const filterBar = document.getElementById('mitgliederFilterBar');
    const searchInput = document.getElementById('mitgliederSearch');
    if (!filterBar) return;

    const rollen = ['Alle', ...new Set(mitglieder.flatMap(m => m.rollen))];
    filterBar.innerHTML = rollen.map((rolle, i) => `
        <button class="filter-btn${i === 0 ? ' active' : ''}" data-rolle="${rolle}">${rolle}</button>
    `).join('');

    function applyFilter() {
        const activeRolle = filterBar.querySelector('.filter-btn.active').dataset.rolle;
        const suchtext = (searchInput?.value || '').trim().toLowerCase();
        const gefiltert = mitglieder.filter(m =>
            (activeRolle === 'Alle' || m.rollen.includes(activeRolle)) &&
            m.name.toLowerCase().includes(suchtext)
        );
        renderMitgliederGrid(gefiltert);
    }

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilter();
        });
    });

    if (searchInput) searchInput.addEventListener('input', applyFilter);
}

// Liest aus der `public_profiles`-View (nicht direkt aus `profiles`), da die
// View private E-Mails automatisch ausblendet (siehe supabase/schema.sql) -
// `email` ist darin bereits NULL, wenn das Mitglied sie nicht geteilt hat.
// `isSelf` kommt aus dem Vergleich mit der eigenen User-ID, nicht aus den
// Daten. `rollen` ist ein Array, ein Mitglied kann mehrere Rollen haben.
// Wird als onSession-Callback von initAuthGate() unten aufgerufen (nicht
// mehr als eigenstaendige IIFE) - dadurch laeuft das automatisch bei jedem
// Login/Logout neu, inkl. korrektem Reset ueber resetAdminUI() als
// onSignedOut-Callback (siehe weiter oben - ohne den blieb der
// Admin-Umschalter nach dem Abmelden faelschlich sichtbar).
async function loadMitgliederListe(session) {
    const { data, error } = await supabaseClient
        .from('public_profiles')
        .select('id, name, email, rollen, instagram, tiktok, profilbild_url');
    if (error) return;
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
    currentUserIsAdmin = alleMitglieder.some(m => m.isSelf && m.rollen.includes('Admin'));
    updateViewAsToggleUI();
    renderMitgliederGrid(alleMitglieder);
    initMitgliederFilter(alleMitglieder);

    // Nur der Vollstaendigkeit halber an currentUserIsAdmin gekoppelt (spart
    // normalen Mitgliedern die unnoetige Anfrage) - die eigentliche
    // Absicherung sitzt in der View selbst (siehe
    // supabase/003-eingeladene-ohne-profil.sql), die fuer Nicht-Admins
    // ohnehin immer 0 Zeilen liefert.
    if (currentUserIsAdmin) {
        const { data: eingeladeneData } = await supabaseClient
            .from('eingeladene_ohne_profil')
            .select('id, email, eingeladen_am');
        alleEingeladene = eingeladeneData || [];
        const { data: anfragenData } = await supabaseClient
            .from('konto_anfragen')
            .select('id, name, email, erstellt_am');
        alleKontoAnfragen = anfragenData || [];
    } else {
        alleEingeladene = [];
        alleKontoAnfragen = [];
    }
    renderEingeladeneOhneProfil();
    renderKontoAnfragen();
}

initAuthGate('mitgliederContent', loadMitgliederListe, resetAdminUI);
