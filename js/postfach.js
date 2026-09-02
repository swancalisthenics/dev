// Postfach fuer Kontaktformular-Nachrichten (siehe
// docs/superpowers/specs/2026-09-02-kontaktformular-postfach-design.md).
// Abschnitt ist fuer jedes eingeloggte Mitglied sichtbar, bleibt aber dank
// RLS auf kontakt_nachrichten fuer alle ausser aktuellen Praesidenten
// automatisch leer - kein eigener Rollen-Check hier noetig.

let alleKontaktNachrichten = [];
let gelesenIds = new Set();

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

    const { data: { user } } = await supabaseClient.auth.getUser();
    const { data: statusZeilen } = await supabaseClient
        .from('kontakt_nachrichten_status')
        .select('nachricht_id')
        .eq('profile_id', user.id);
    gelesenIds = new Set((statusZeilen || []).map(z => z.nachricht_id));

    renderPostfachListe();
}

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

function leerePostfach() {
    alleKontaktNachrichten = [];
    document.getElementById('postfachListe').innerHTML = '';
    document.getElementById('postfachLayout')?.classList.remove('zeigt-detail');
}
