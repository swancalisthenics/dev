// Platzhalter-Mitgliederliste für die Demo-Version der Mitglieder-Seite.
// Sobald die Supabase-Anbindung steht (siehe CLAUDE.md, Abschnitt "Geplant:
// Mitgliederbereich mit Supabase"), ersetzt eine echte Abfrage gegen die
// `public_profiles`-View dieses Array - siehe js/mitglieder.js.
//
// `isSelf` simuliert hier nur fürs Demo, dass die Liste auch das eigene
// Profil enthält - in der echten Version kommt das nicht aus den Daten,
// sondern aus einem Vergleich mit `supabaseClient.auth.getUser()`.
//
// `email` ist nur gesetzt, wenn das Mitglied es (im echten Betrieb per
// Toggle "E-Mail mit anderen teilen") öffentlich gemacht hat - fehlt es,
// wird kein E-Mail-Icon angezeigt (gleiches Prinzip wie bei Instagram/TikTok).
//
// `rolle` ist Freitext (siehe supabase/schema.sql) - aktuell verwendete
// Werte: "Admin", "Vorstand", "Mitglied", "Ehrenmitglied". Wird vom Vorstand
// vergeben, nicht vom Mitglied selbst - deshalb kein Feld dafür in
// pages/mein-profil.html.
const DEMO_MITGLIEDER = [
    { name: 'Fiona', initial: 'F', isSelf: true, rolle: 'Admin', email: 'fiona@example.com', instagram: '#', tiktok: '#' },
    { name: 'Sarah', initial: 'S', rolle: 'Mitglied', email: null, instagram: '#', tiktok: '#' },
    { name: 'Marco', initial: 'M', rolle: 'Vorstand', email: 'marco@example.com', instagram: '#', tiktok: null },
    { name: 'Lea', initial: 'L', rolle: 'Mitglied', email: null, instagram: null, tiktok: '#' },
    { name: 'David', initial: 'D', rolle: 'Mitglied', email: null, instagram: '#', tiktok: '#' },
    { name: 'Fabienne', initial: 'F', rolle: 'Ehrenmitglied', email: 'fabienne@example.com', instagram: '#', tiktok: null },
    { name: 'Timo', initial: 'T', rolle: 'Mitglied', email: null, instagram: null, tiktok: '#' }
];
