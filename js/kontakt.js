// Kontaktformular: schickt Nachrichten seit der FormSubmit.co-Ablösung
// direkt in kontakt_nachrichten statt per POST an einen Drittanbieter
// (siehe docs/superpowers/specs/2026-09-02-kontaktformular-postfach-design.md).
// Honeypot + 180s-Abkuehlzeit als leichter Spam-Schutz gegen Bots bzw.
// wiederholtes manuelles Absenden - kein Ersatz fuer echte serverseitige
// IP-Rate-Begrenzung (bräuchte eine Edge Function, bewusst nicht gebaut).

const KONTAKT_COOLDOWN_MS = 180 * 1000;
const KONTAKT_COOLDOWN_KEY = 'kontakt-letzte-nachricht';
let kontaktWirdGesendet = false;

async function handleKontaktSubmit(event) {
    event.preventDefault();
    // Verhindert, dass ein schneller Doppelklick zwei parallele Absende-
    // Vorgaenge startet, die beide den Cooldown-Check bestehen wuerden,
    // weil der Zeitstempel erst NACH dem ersten abgeschlossenen Insert
    // gesetzt wird (per Test bestaetigt: ohne diese Sperre kamen beide
    // Anfragen durch).
    if (kontaktWirdGesendet) return false;
    kontaktWirdGesendet = true;
    try {
        // Honeypot: fuer Menschen unsichtbares Feld, das Bots aber
        // typischerweise trotzdem ausfuellen. Ist es befuellt, wird
        // nichts gespeichert, aber so getan als waere die Nachricht
        // gesendet worden - der Bot bekommt keinen Hinweis darauf, dass
        // er erkannt wurde.
        if (document.getElementById('form-honeypot').value) {
            beendeKontaktFormular();
            return false;
        }

        const letzteNachricht = Number(localStorage.getItem(KONTAKT_COOLDOWN_KEY) || 0);
        const wartezeitMs = KONTAKT_COOLDOWN_MS - (Date.now() - letzteNachricht);
        if (wartezeitMs > 0) {
            const wartezeitSekunden = Math.ceil(wartezeitMs / 1000);
            showToast(`Bitte warte noch ${wartezeitSekunden} Sekunden, bevor du eine weitere Nachricht sendest.`);
            return false;
        }

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

        localStorage.setItem(KONTAKT_COOLDOWN_KEY, String(Date.now()));
        beendeKontaktFormular();
        return false;
    } finally {
        kontaktWirdGesendet = false;
    }
}

function beendeKontaktFormular() {
    document.getElementById('form-name').value = '';
    document.getElementById('form-email').value = '';
    document.getElementById('form-message').value = '';
    showToast('Nachricht gesendet!');
}
