-- Storage-Bucket fuer Profilbilder. profiles.profilbild_url existiert
-- bereits seit dem urspruenglichen schema.sql-Lauf (siehe Kommentar dort)
-- und wird bereits in public_profiles mit ausgegeben, war aber bisher
-- ungenutzt - dieser Bucket ist der fehlende zweite Teil (siehe
-- docs/superpowers/specs/2026-09-01-profilbild-upload-design.md).
--
-- Bewusst oeffentlich lesbar (kein RLS-Check beim Lesen): einfache,
-- direkte <img src="...">-URLs statt signierter/zeitlich begrenzter URLs -
-- gleiches Prinzip wie bei den ohnehin oeffentlichen Bildern in
-- assets/images/. Wer den direkten Link kennt, kann das Bild auch ohne
-- Login sehen - bewusst in Kauf genommener Kompromiss (siehe Spec).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Profilbilder sind oeffentlich lesbar"
    on storage.objects for select
    to public
    using (bucket_id = 'avatars');

-- Jede Datei heisst exakt "<user-id>.jpg" (fester Pfad, kein Unterordner,
-- siehe Spec) - ein Mitglied darf nur die Datei mit der eigenen User-ID
-- als Namen anlegen/ersetzen/loeschen, nie eine fremde.
create policy "Mitglieder duerfen nur ihr eigenes Profilbild hochladen"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');

create policy "Mitglieder duerfen nur ihr eigenes Profilbild ersetzen"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');

create policy "Mitglieder duerfen nur ihr eigenes Profilbild loeschen"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');
