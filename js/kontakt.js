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
