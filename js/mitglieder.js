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
            document.getElementById('mitgliedRollenInput').value = m.rollen.join(', ');
            const notice = document.getElementById('mitgliedRollenNotice');
            notice.hidden = true;
        }
    }

    modal.classList.add('active');
    updateBodyScrollLock();
}

// Nur sichtbar/nutzbar fuer Admins, die sich nicht gerade als normales
// Mitglied ausgeben (siehe openMitgliedModal oben). Die eigentliche
// Absicherung liegt aber in der Datenbank (Trigger + Policies, siehe
// supabase/002-admin-rollen.sql), nicht hier im UI - "Admin" selbst laesst
// sich damit bewusst weder vergeben noch entziehen, das laeuft nur direkt
// ueber Supabase. Die Korrektur hier spiegelt das nur clientseitig, damit
// sofort eine ehrliche Meldung statt eines stillen Server-Overrides kommt.
async function saveMitgliedRollen() {
    const input = document.getElementById('mitgliedRollenInput');
    const notice = document.getElementById('mitgliedRollenNotice');
    let neueRollen = input.value.split(',').map(r => r.trim()).filter(Boolean);

    if (!neueRollen.length) {
        notice.textContent = 'Mindestens eine Rolle angeben.';
        notice.hidden = false;
        return;
    }

    const mitglied = alleMitglieder.find(m => m.id === editingMitgliedId);
    const warAdmin = !!mitglied?.rollen.includes('Admin');
    const istJetztAdmin = neueRollen.includes('Admin');
    let adminHinweis = '';
    if (warAdmin && !istJetztAdmin) {
        neueRollen.push('Admin');
        adminHinweis = ' (Admin-Status kann hier nicht entzogen werden – nur direkt über Supabase.)';
    } else if (!warAdmin && istJetztAdmin) {
        neueRollen = neueRollen.filter(r => r !== 'Admin');
        if (!neueRollen.length) neueRollen = ['Mitglied'];
        adminHinweis = ' (Admin-Status kann hier nicht vergeben werden – nur direkt über Supabase.)';
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
    input.value = neueRollen.join(', ');
    notice.textContent = 'Gespeichert!' + adminHinweis;
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
(async function () {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { data, error } = await supabaseClient
        .from('public_profiles')
        .select('id, name, email, rollen, instagram, tiktok, profilbild_url');
    if (error) return;
    alleMitglieder = data.map(p => ({
        id: p.id,
        name: p.name,
        initial: p.name.charAt(0).toUpperCase(),
        isSelf: p.id === user.id,
        rollen: p.rollen,
        email: p.email,
        instagram: p.instagram,
        tiktok: p.tiktok
    }));
    currentUserIsAdmin = alleMitglieder.some(m => m.isSelf && m.rollen.includes('Admin'));
    updateViewAsToggleUI();
    renderMitgliederGrid(alleMitglieder);
    initMitgliederFilter(alleMitglieder);
})();
