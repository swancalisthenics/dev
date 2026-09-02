# Kontaktformular-Postfach — Design

Status: geplant, noch nicht umgesetzt. Deckt bewusst nur den engeren Fall ab
(Kontaktformular-Nachrichten). Die aeltere, breitere Idee "Ein Postfach"
(Nachrichten zwischen Mitgliedern / Ankuendigungsbrett vom Vorstand) unter
"Offene Punkte fuer die Zukunft", Punkt 6, in CLAUDE.md bleibt davon
unberuehrt bestehen und wird durch dieses Feature nicht ersetzt.

## Ziel

Das Kontaktformular auf `pages/kontakt.html` sendet aktuell direkt per POST
an den Drittanbieter FormSubmit.co, der die Nachricht an eine private
Gmail-Adresse weiterleitet. Das steht nirgends in der Datenschutzerklaerung
- nicht mal ein vager Nebensatz hat den heutigen Umschreib-Durchgang
ueberlebt. Recherche dazu: FormSubmit.co selbst veroeffentlicht keinen
Speicherort, keinen Auftragsverarbeitungsvertrag und keine
Unterauftragnehmer-Liste - schlechte Transparenz beim Anbieter selbst, nicht
nur eine fehlende Erwaehnung bei uns.

Entscheidung: FormSubmit.co komplett entfernen. Nachrichten werden
stattdessen intern (Supabase) gespeichert und ausschliesslich fuer
Mitglieder mit der aktuellen Rolle "Präsident" sichtbar gemacht, im Stil
eines echten Mail-Postfachs (Liste + Leseansicht, pro Person ein eigener
gelesen/ungelesen-Status).

## Datenmodell

Zwei neue Tabellen.

**`public.kontakt_nachrichten`** (der eigentliche Nachrichteninhalt):
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `email text not null`
- `kategorie text not null` — Wert aus dem bestehenden Kategorie-Dropdown
- `nachricht text not null`
- `erstellt_am timestamptz not null default now()`

RLS:
- Einfuegen: `to anon, authenticated with check (true)` — jede/r darf eine
  Nachricht schicken, genau wie bisher bei FormSubmit.co kein Login noetig.
  Identisches Muster wie die bestehende Insert-Policy auf `konto_anfragen`.
- Lesen: `to authenticated using (exists (select 1 from public.profiles p
  where p.id = auth.uid() and 'Präsident' = any(p.rollen)))` — nur wer
  *aktuell* die Rolle "Präsident" traegt. Identisches Muster wie die
  bestehende "Admins duerfen alle Konto-Anfragen lesen"-Policy, nur mit
  anderer Rolle. Kein Zugriff fuer `anon`.
- Kein Update/Delete fuer Nutzer noetig (Loeschen laeuft ausschliesslich
  automatisiert, siehe unten).

**`public.kontakt_nachrichten_status`** (Pro-Person-Gelesen-Status - die
erste Tabelle in diesem Projekt mit echtem Pro-Nutzer-Zustand statt einer
von allen geteilten Zeile):
- `nachricht_id uuid not null references public.kontakt_nachrichten (id)
  on delete cascade`
- `profile_id uuid not null references public.profiles (id) on delete
  cascade`
- `gelesen_am timestamptz not null default now()`
- `primary key (nachricht_id, profile_id)`

Bewusst **kein** separates `gelesen boolean`: die blosse Existenz einer
Zeile fuer (Nachricht, Person) bedeutet bereits "gelesen"; fehlt die Zeile,
gilt die Nachricht fuer diese Person als ungelesen. Dadurch reicht ein
einziges Insert beim ersten Oeffnen - nie ein Update, nie ein "Ungelesen
machen" noetig.

RLS:
- Lesen: `to authenticated using (profile_id = auth.uid())` — nur eigene
  Zeilen.
- Einfuegen: `to authenticated with check (profile_id = auth.uid())` — nur
  fuer die eigene `profile_id`, passiert automatisch beim ersten Oeffnen
  einer Nachricht.
- Kein Update/Delete noetig: einmal gelesen bleibt gelesen; die Zeile
  verschwindet automatisch mit, sobald die zugehoerige Nachricht nach 2
  Monaten geloescht wird (`on delete cascade`).

**Automatisches Loeschen nach 2 Monaten (`pg_cron`):** `pg_cron` ist auf
jedem Supabase-Projekt (auch Gratis-Tier) standardmaessig aktiviert, kein
Edge Function/externer Dienst noetig. Ein taeglich laufender Job:

```sql
select cron.schedule(
    'kontakt-nachrichten-aufraeumen',
    '0 3 * * *', -- taeglich 03:00 UTC
    $$delete from public.kontakt_nachrichten where erstellt_am < now() - interval '2 months'$$
);
```

Zugehoerige `kontakt_nachrichten_status`-Zeilen verschwinden automatisch mit
(`on delete cascade`) - kein zweiter Job noetig.

Migration als neue Datei `supabase/016-kontakt-nachrichten.sql`, wie alle
bisherigen Migrationen manuell im Supabase-SQL-Editor auszufuehren.

## Kontaktformular (`pages/kontakt.html`)

- `<form action="https://formsubmit.co/..." method="POST">` wird zu einem
  normalen `<form onsubmit="return handleKontaktSubmit(event)">` - kein
  `action`/`method` mehr, kein serverseitiges POST an Dritte.
- Neue eigene Datei `js/kontakt.js` (analog zu `js/trainings-anmeldung.js` -
  eigene kleine Datei pro Seite mit eigenstaendiger Logik, passend zum
  bestehenden Projektmuster): liest Name/E-Mail/Kategorie/Nachricht aus den
  Formularfeldern, `supabaseClient.from('kontakt_nachrichten').insert({name,
  email, kategorie, nachricht})`. Bei Erfolg `showToast('Nachricht
  gesendet!')` und Formular zuruecksetzen; bei Fehler eine Fehlermeldung wie
  bei den uebrigen Formularen im Projekt.
- Die FormSubmit-spezifischen versteckten Felder (`_honey`, `_next`,
  `_subject`) entfallen komplett - reine FormSubmit-Mechanismen ohne
  Bedeutung fuer den neuen Weg.
- Das bestehende Kategorie-Dropdown bleibt unveraendert erhalten, sein Wert
  wandert nur in die neue Spalte `kategorie` statt in ein
  FormSubmit-`_subject`-Feld.

## Postfach in "Mein Profil" (`pages/mein-profil.html`)

- Neuer Abschnitt `<section id="postfach">`, direkt sichtbar fuer jedes
  eingeloggte Mitglied - kein eigenes Auth-Gate noetig, die Seite ist
  bereits komplett mitgliedergeschuetzt. Bleibt fuer alle ausser aktuellen
  Praesidenten automatisch leer (RLS liefert 0 Zeilen) - kein zusaetzlicher
  Rollen-Check im Frontend noetig, um den Abschnitt ein-/auszublenden.
- **Mail-Programm-Optik:** zweispaltig auf Desktop (Liste links,
  Leseansicht rechts). Auf Mobil zunaechst nur die Liste; Klick oeffnet die
  Nachricht als eigene Vollbild-Ansicht mit Zurueck-Pfeil (gleiches
  Zurueck-Symbol wie sonst im Projekt ueblich).
- Liste: pro Nachricht Absender-Name, Kategorie, Datum; ungelesene
  Nachrichten fett + Punkt-Indikator (uebliche Mail-Client-Konvention).
- Klick auf eine Nachricht zeigt Name/E-Mail/Kategorie/Nachrichtentext in
  der Leseansicht und loest (falls noch nicht vorhanden) einen Insert der
  eigenen Zeile in `kontakt_nachrichten_status` aus - markiert die
  Nachricht damit automatisch als gelesen, kein separater
  "Als gelesen markieren"-Button noetig.
- Die vom Absender angegebene E-Mail-Adresse wird als normaler `mailto:`-
  Link angezeigt - Antworten erfolgt darueber, genau wie bisher schon (die
  Antwort ging bisher ebenfalls per normaler E-Mail an die private
  Gmail-Adresse). Keine eigene In-App-Antwortfunktion.
- Kein manuelles Loeschen/Archivieren (siehe "Nicht Teil dieses Scopes").

## Navigation: Profil-Dropdown (`js/site-chrome.js`)

Der bestehende `#profileDropdown` (Avatar-Button oben rechts in der
Topbar) aendert sich von:

```html
<a href="${base}pages/mein-profil.html">Mein Profil</a>
<a href="${base}pages/mitglieder.html">Mitglieder</a>
<button type="button" onclick="openLogoutConfirm(event)">Abmelden</button>
```

zu:

```html
<a href="${base}pages/mein-profil.html">Mein Profil</a>
<a href="${base}pages/mein-profil.html#postfach">Postfach</a>
<button type="button" onclick="openLogoutConfirm(event)">Abmelden</button>
```

"Mitglieder" bleibt ueber den bestehenden Verein-Hub-Balken
(`pages/verein.html`) weiterhin erreichbar - der Link verschwindet nur aus
diesem Dropdown, nicht aus der Seite selbst.

## Datenschutzerklärung (`pages/rechtliches.html`)

Neue Section **"4. Kontaktformular"**, eingefuegt direkt nach der
bestehenden Section 3 ("Mitgliederbereich: Login und Profildaten") - die
bisherigen Sections 4-9 ruecken entsprechend auf 5-10. Inhalt:
- Kontaktformular-Nachrichten (Name, E-Mail, Kategorie, Nachricht) werden
  direkt bei uns ueber Supabase gespeichert (siehe Section "Technischer
  Dienstleister"), kein externer Formular-Anbieter mehr beteiligt.
- Ausschliesslich fuer die aktuellen Vereinspraesidenten einsehbar.
- Speicherdauer: automatische Loeschung 2 Monate nach Eingang.

Da FormSubmit.co dadurch vollstaendig entfaellt, loest die technische
Aenderung das urspruengliche Problem direkt - nicht nur eine nachtraegliche
Text-Ergaenzung ueber einen weiterhin genutzten Drittanbieter.

## CLAUDE.md

- Die bestehende Idee "Ein Postfach" unter "Offene Punkte fuer die
  Zukunft" (Punkt 6) bleibt unveraendert stehen - deckt weiterhin nur die
  breitere, unausgearbeitete Idee ab (Nachrichten zwischen Mitgliedern /
  Ankuendigungsbrett) und wird durch dieses Feature nicht ersetzt.
- Neuer nummerierter Punkt unter "Wichtige Implementierungs-Entscheidungen"
  nach Umsetzung, wie bei allen bisherigen Features.

## Nicht Teil dieses Scopes

- Die aeltere, breitere "Postfach"-Idee (Nachrichten zwischen Mitgliedern,
  Ankuendigungsbrett vom Vorstand an alle) - bleibt separates,
  unausgearbeitetes Zukunftsthema.
- Kein manuelles Loeschen oder Archivieren einzelner Nachrichten durch
  Praesidenten - die automatische 2-Monats-Loeschung deckt Aufraeumen
  vollstaendig ab.
- Keine In-App-Antwortfunktion - Antworten erfolgt weiterhin per normaler
  E-Mail (`mailto:`-Link) an die vom Absender angegebene Adresse.
- Keine aktive Benachrichtigung (z. B. E-Mail) bei neuer Nachricht an die
  Praesidenten - das Postfach muss von sich aus geoeffnet werden, genau wie
  bisher schon bei den Konto-Anfragen auf der Mitglieder-Seite.
- Keine Aenderung an der Rolle "Präsident" selbst - Rollenvergabe laeuft
  weiterhin unveraendert ueber die bestehende Mitglieder-Verwaltung.
