# Profilbild-Upload — Design

Status: geplant, noch nicht umgesetzt (Task 9 in CLAUDE.md).

## Ziel

Mitglieder können auf "Mein Profil" ein eigenes Foto hochladen. Es ersetzt
den Buchstaben-Kreis-Platzhalter überall, wo er aktuell auftaucht: "Mein
Profil", Mitgliederliste (`pages/mitglieder.html`), Mitglied-Modal, und der
Profil-Button in der Topbar.

## Bestehende Grundlage

`profiles.profilbild_url` (text, nullable) existiert bereits seit dem
ursprünglichen `supabase/schema.sql`-Lauf und wird bereits in der
`public_profiles`-View mit ausgegeben (`select ... profilbild_url from
public.profiles`) — nur bisher von keiner UI genutzt. Es ist also **keine
neue Spalte** nötig, nur:

1. ein Storage-Bucket für die eigentlichen Bilddateien,
2. Frontend-Code, der hochlädt, verkleinert, die Spalte pflegt und das Bild
   anzeigt.

## Speicherung

- Neuer öffentlicher Bucket `avatars`. Jede Datei heisst exakt
  `<user-id>.jpg` (fester Pfad, kein Unterordner) — ein neuer Upload
  überschreibt die alte Datei automatisch, keine verwaisten Altdateien.
- **Bewusst öffentlich lesbar** (kein RLS-Check beim Lesen): einfache
  `<img src="...">`-URLs statt signierter, zeitlich begrenzter URLs. Wer den
  direkten Link kennt, kann das Bild auch ohne Login sehen — genau dieser
  Kompromiss wurde besprochen und akzeptiert (gleiches Prinzip wie bei den
  ohnehin öffentlichen Bildern in `assets/images/`). Innerhalb der Website
  ist das Bild trotzdem nur auf den bereits login-geschützten Seiten
  sichtbar.
- Schreiben (Hochladen/Ersetzen/Löschen) ist per RLS auf die eigene
  User-ID beschränkt (Dateiname muss `auth.uid()::text || '.jpg'`
  entsprechen).

## Bild-Verarbeitung

- Auswahl per verstecktem `<input type="file" accept="image/*">`, ausgelöst
  durch Klick auf den bestehenden Avatar-Platzhalter auf "Mein Profil".
- Verkleinerung/Zuschnitt läuft **komplett automatisch** per Canvas-API: das
  Bild wird zentriert auf ein Quadrat zugeschnitten und auf **200×200px**
  skaliert, als JPEG (~80% Qualität) — kein eigener Zuschneide-Dialog. 200px
  deckt auch die grösste aktuelle Anzeigegrösse (140px,
  `.person-img-placeholder` auf "Mein Profil") auf Retina-Displays ab.
- Client-seitige Grenzen vor der Verarbeitung: nur Bild-MIME-Typen
  akzeptiert, Originaldatei max. 10 MB (verhindert, dass ein exzessiv
  grosses Foto den Browser beim Decodieren blockiert) — beides mit
  freundlicher Fehlermeldung statt stillem Fehlschlag.
- Hochgeladen wird direkt per `supabaseClient.storage.from('avatars').upload(
  '<user-id>.jpg', blob, { upsert: true, contentType: 'image/jpeg' })`,
  danach `profiles.profilbild_url` per bestehendem Upsert-Muster (wie
  Name/Instagram/TikTok) auf die öffentliche URL
  (`getPublicUrl()`-Ergebnis) gesetzt.

## Entfernen

Ein "Entfernen"-Link/Button neben dem Foto auf "Mein Profil" löscht die
Datei aus dem Bucket (`storage.from('avatars').remove(['<user-id>.jpg'])`)
und setzt `profilbild_url` zurück auf `null` — danach erscheint wieder der
Buchstaben-Kreis überall.

## Anzeige

An jeder der vier Stellen (Mein Profil, Mitgliederliste, Mitglied-Modal,
Topbar-Profil-Button): wenn `profilbild_url` gesetzt ist, ein `<img>` mit
dieser URL anzeigen; sonst wie bisher den Buchstaben-Kreis. Die
bestehenden Platzhalter-Elemente (`.person-img-placeholder`,
`.mitglieder-avatar`, `.profile-toggle-initial` usw.) bleiben als
Fallback unverändert bestehen, es kommt nur ein bedingtes `<img>` daneben/
anstelle davon hinzu — kein Redesign der bestehenden Layouts nötig.

## Storage-Migration (SQL)

Neue Datei `supabase/013-avatar-storage-bucket.sql`, muss wie alle
bisherigen Migrationen manuell im Supabase-SQL-Editor ausgeführt werden
(siehe Projekt-Konvention, DB-Änderungen laufen nicht automatisiert).

## Nicht Teil dieses Scopes

- Kein eigener Zuschneide-/Positionierungs-Dialog (bewusst entschieden).
- Keine Bildschirm-übergreifende Synchronisierung/Caching-Invalidierung
  über die normale Browser-Bildcache-Logik hinaus (ein neuer Upload
  überschreibt zwar die Datei serverseitig, ein alter, bereits geladener
  Browser-Cache-Eintrag für dieselbe URL könnte kurzzeitig das alte Bild
  zeigen — für ein kleines Vereins-Tool kein relevantes Problem).
