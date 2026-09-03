// Trainings-Anmeldung: Zu-/Absage fuers jeweils naechste Training (siehe
// docs/superpowers/specs/2026-09-02-trainings-anmeldung-design.md).
// getNextTrainingWindow() kommt aus main.js (dort global gemacht).

let aktuellesTrainingDatum = null; // 'YYYY-MM-DD' des naechsten Sonntags
let eigeneAnmeldung = null; // null oder { status: 'zugesagt' | 'abgesagt' }

// profiles.name wird unten roh in innerHTML eingesetzt (Teilnehmerliste) -
// jedes Mitglied kann seinen eigenen Namen frei per API setzen (die
// Formular-Prüfung in main.js ist nur clientseitig), ohne Escaping waere das
// gespeichertes XSS gegen jeden, der die Trainings-Anmeldung oeffnet.
// Gleiches Muster wie escapeHtml() in js/mitglieder.js (dort nicht
// wiederverwendbar, da beide Dateien nur auf unterschiedlichen Seiten
// geladen werden).
function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatiereTrainingDatum(datum) {
    return datum.toLocaleDateString('de-CH', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

async function ladeTrainingsAnmeldungen() {
    const { start } = getNextTrainingWindow(new Date());
    aktuellesTrainingDatum = start.toISOString().slice(0, 10);

    document.getElementById('trainingsDatum').textContent =
        `Nächstes Training: ${formatiereTrainingDatum(start)}, 18:00–20:00 Uhr`;

    const { data: { user } } = await supabaseClient.auth.getUser();

    const { data: alleAnmeldungen } = await supabaseClient
        .from('training_anmeldungen')
        .select('profile_id, status')
        .eq('training_datum', aktuellesTrainingDatum)
        .eq('status', 'zugesagt');

    const eigene = (alleAnmeldungen || []).find(a => a.profile_id === user.id);
    eigeneAnmeldung = eigene ? { status: 'zugesagt' } : null;
    if (!eigene) {
        const { data: eigeneZeile } = await supabaseClient
            .from('training_anmeldungen')
            .select('training_datum, status')
            .eq('profile_id', user.id)
            .maybeSingle();
        if (eigeneZeile && eigeneZeile.training_datum === aktuellesTrainingDatum) {
            eigeneAnmeldung = { status: eigeneZeile.status };
        }
    }

    aktualisiereButtonZustand();
    await renderTeilnehmerListe(alleAnmeldungen || []);
}

function aktualisiereButtonZustand() {
    const zusagenBtn = document.getElementById('zusagenBtn');
    const absagenBtn = document.getElementById('absagenBtn');
    const status = eigeneAnmeldung?.status || null;
    zusagenBtn.disabled = status === 'zugesagt';
    absagenBtn.disabled = status === 'abgesagt';
}

async function renderTeilnehmerListe(zugesagtRows) {
    const grid = document.getElementById('trainingsTeilnehmerListe');
    if (!zugesagtRows.length) {
        grid.innerHTML = '<p class="section-lead">Noch niemand zugesagt - sei die/der Erste!</p>';
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    const ids = zugesagtRows.map(r => r.profile_id);
    const { data: profile } = await supabaseClient
        .from('public_profiles')
        .select('id, name, profilbild_url')
        .in('id', ids);

    grid.innerHTML = (profile || []).map((p, i) => `
        <div class="glass-card trainings-teilnehmer-card" data-index="${i}">
            <div class="trainings-teilnehmer-avatar" aria-hidden="true">${escapeHtml(p.name.charAt(0).toUpperCase())}</div>
            <h3>${escapeHtml(p.name)}</h3>
            ${p.id === user.id ? '<span class="badge badge-pending">Das bist du</span>' : ''}
        </div>
    `).join('');

    grid.querySelectorAll('.trainings-teilnehmer-card').forEach((card, i) => {
        setAvatarDisplay(card.querySelector('.trainings-teilnehmer-avatar'), profile[i].profilbild_url, profile[i].name.charAt(0).toUpperCase());
    });
}

async function setzeTrainingsStatus(status) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { error } = await supabaseClient
        .from('training_anmeldungen')
        .upsert({
            profile_id: user.id,
            training_datum: aktuellesTrainingDatum,
            status,
            geantwortet_am: new Date().toISOString()
        }, { onConflict: 'profile_id' });
    if (error) return;

    eigeneAnmeldung = { status };
    aktualisiereButtonZustand();
    showToast('Änderung gespeichert.');
    await ladeTrainingsAnmeldungen();
}

async function handleTrainingsZusage() {
    await setzeTrainingsStatus('zugesagt');
}

async function handleTrainingsAbsage() {
    await setzeTrainingsStatus('abgesagt');
}

if (document.getElementById('trainingsContent')) {
    initAuthGate('trainingsContent', ladeTrainingsAnmeldungen);
}
