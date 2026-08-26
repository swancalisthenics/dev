// Rendert die Mitgliederliste als kompaktes Karten-Raster (bewusst viel
// kleiner als die Team-Karten, da hier potenziell viel mehr Personen stehen
// können) inkl. Rollen-Filter und Namenssuche. Eine Karte zeigt nur Foto,
// Name und Rolle - ein Klick/Tap öffnet #mitglied-modal mit den vollständigen
// Details (Social-Links etc.) für genau diese eine Person.

let alleMitglieder = [];
let currentUserIsAdmin = false;
let viewAsNormalMember = false;
let editingMitgliedId = null;

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
    const btn = document.getElementById('viewAsToggle');
    if (btn) btn.hidden = true;
    const notice = document.getElementById('viewAsNotice');
    if (notice) notice.hidden = true;
    const rollenEditor = document.getElementById('mitgliedRollenEditor');
    if (rollenEditor) rollenEditor.hidden = true;
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
            const weitereRollen = m.rollen.filter(r => !BEKANNTE_ROLLEN.includes(r) && r !== 'Admin');
            document.getElementById('mitgliedRollenExtra').value = weitereRollen.join(', ');
            const notice = document.getElementById('mitgliedRollenNotice');
            notice.hidden = true;
        }
    }

    modal.classList.add('active');
    updateBodyScrollLock();
}

// Checkboxen fuer diese drei, "Admin" bewusst nie als Option (siehe
// saveMitgliedRollen unten) - alles andere (auch frei Erfundenes wie
// "Präsident") ueber das zusaetzliche Textfeld.
const BEKANNTE_ROLLEN = ['Vorstand', 'Mitglied', 'Ehrenmitglied'];

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
    const ausgewaehlt = Array.from(editor.querySelectorAll('.mitglied-rollen-checkbox:checked')).map(cb => cb.value);
    const weitere = document.getElementById('mitgliedRollenExtra').value.split(',').map(r => r.trim()).filter(Boolean);
    let neueRollen = [...ausgewaehlt, ...weitere];

    if (!neueRollen.length) {
        notice.textContent = 'Mindestens eine Rolle auswählen oder eintragen.';
        notice.hidden = false;
        return;
    }

    const mitglied = alleMitglieder.find(m => m.id === editingMitgliedId);
    if (mitglied?.rollen.includes('Admin')) {
        neueRollen.push('Admin');
    }

    const { error } = await supabaseClient
        .from('profiles')
        .update({ rollen: neueRollen })
        .eq('id', editingMitgliedId);

    if (error) {
        notice.textContent = 'Fehler: ' + error.message;
        notice.hidden = false;
        return;
    }

    if (mitglied) mitglied.rollen = neueRollen;
    notice.textContent = 'Gespeichert!';
    notice.hidden = false;
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
}

initAuthGate('mitgliederContent', loadMitgliederListe, resetAdminUI);
