// Rendert die Mitgliederliste als kompaktes Karten-Raster (bewusst viel
// kleiner als die Team-Karten, da hier potenziell viel mehr Personen stehen
// können) inkl. Rollen-Filter und Namenssuche. Eine Karte zeigt nur Foto,
// Name und Rolle - ein Klick/Tap öffnet #mitglied-modal mit den vollständigen
// Details (Social-Links etc.) für genau diese eine Person.

let alleMitglieder = [];

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
                <span class="badge badge-category">${m.rolle}</span>
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
        <span class="badge badge-category">${m.rolle}</span>
        ${m.isSelf ? '<span class="badge badge-pending">Das bist du</span>' : ''}
    `;

    document.getElementById('mitgliedModalSelfLink').hidden = !m.isSelf;

    document.getElementById('mitgliedModalLinks').innerHTML = `
        ${m.instagram ? `<a href="${m.instagram}" target="_blank" rel="noopener" title="Instagram"><span class="icon icon-instagram" aria-hidden="true"></span></a>` : ''}
        ${m.tiktok ? `<a href="${m.tiktok}" target="_blank" rel="noopener" title="TikTok"><span class="icon icon-tiktok" aria-hidden="true"></span></a>` : ''}
        ${m.email ? `<a href="#" title="E-Mail" onclick="openEmailDialog(event, '${m.email}')"><span class="icon icon-envelope" aria-hidden="true"></span></a>` : ''}
    `;

    modal.classList.add('active');
    updateBodyScrollLock();
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

    const rollen = ['Alle', ...new Set(mitglieder.map(m => m.rolle))];
    filterBar.innerHTML = rollen.map((rolle, i) => `
        <button class="filter-btn${i === 0 ? ' active' : ''}" data-rolle="${rolle}">${rolle}</button>
    `).join('');

    function applyFilter() {
        const activeRolle = filterBar.querySelector('.filter-btn.active').dataset.rolle;
        const suchtext = (searchInput?.value || '').trim().toLowerCase();
        const gefiltert = mitglieder.filter(m =>
            (activeRolle === 'Alle' || m.rolle === activeRolle) &&
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

// DEMO-VERSION (aktiv) - liest DEMO_MITGLIEDER aus js/mitglieder-data.js.
alleMitglieder = DEMO_MITGLIEDER;
renderMitgliederGrid(alleMitglieder);
initMitgliederFilter(alleMitglieder);

// ECHTE VERSION (auskommentiert) - braucht js/supabase-client.js (Plan-
// Schritt 2, noch nicht angelegt) mit einem global verfügbaren
// `supabaseClient`. Ersetzt die drei Zeilen oben. Liest bewusst aus der
// `public_profiles`-View (nicht direkt aus `profiles`), da die View private
// E-Mails automatisch ausblendet (siehe supabase/schema.sql) - `email` ist
// darin bereits NULL, wenn das Mitglied sie nicht geteilt hat, die
// Render-Funktion oben muss dafür nicht angepasst werden. `isSelf` kommt
// hier aus dem Vergleich mit der eigenen User-ID, nicht aus den Daten.
// (async function () {
//     const { data: { user } } = await supabaseClient.auth.getUser();
//     const { data, error } = await supabaseClient
//         .from('public_profiles')
//         .select('id, name, email, rolle, instagram, tiktok, profilbild_url');
//     if (error) return;
//     alleMitglieder = data.map(p => ({
//         name: p.name,
//         initial: p.name.charAt(0).toUpperCase(),
//         isSelf: p.id === user.id,
//         rolle: p.rolle,
//         email: p.email,
//         instagram: p.instagram,
//         tiktok: p.tiktok
//     }));
//     renderMitgliederGrid(alleMitglieder);
//     initMitgliederFilter(alleMitglieder);
// })();
