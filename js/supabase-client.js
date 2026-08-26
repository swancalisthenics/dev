// Supabase-Client: einmalig hier initialisiert (URL + Public-Key aus dem
// Supabase-Dashboard, "homepage"-Projekt), von main.js/mitglieder.js
// wiederverwendet, sobald die jeweilige "echte Version" (siehe CLAUDE.md,
// Abschnitt "Demo- vs. echte Version") aktiviert wird. Der Public-Key ist
// bewusst nicht geheim - er landet immer im Frontend, der eigentliche
// Datenschutz laeuft ueber Row-Level-Security in der Datenbank
// (supabase/schema.sql), nicht ueber Geheimhaltung dieses Keys.
const SUPABASE_URL = 'https://auffdqkkeempnaygdtrl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ft09qDi0crW5FgUk-LA4Ig_J7C_6rRQ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
