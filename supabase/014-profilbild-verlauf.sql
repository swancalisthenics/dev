-- Migration 014: Verlauf frueherer Profilbilder (Admin-Log) - beim Aendern
-- oder Entfernen des eigenen Profilbilds wird die bisherige Datei zuerst
-- unter einer laufenden Nummer im selben, weiterhin oeffentlichen
-- avatars-Bucket archiviert (<user-id>-<nummer>.jpg), bevor sie ueberschrieben
-- bzw. geloescht wird - siehe archiviereAltesProfilbild() in js/main.js.
--
-- RLS: Lesen nur fuer Admins (gleiches Admin-Check-Muster wie bei
-- konto_anfragen, siehe 010-konto-anfragen-admin-select.sql) - Mitglieder
-- sehen den Verlauf nicht. Anlegen darf jedes Mitglied, aber nur fuer die
-- eigene profile_id. Bewusst keine Update-/Delete-Policy fuer irgendwen
-- (auch nicht fuer Admins) - der Verlauf ist unveraenderlich.

create table public.profilbild_verlauf (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles (id) on delete cascade,
    nummer int not null,
    bild_url text not null,
    archiviert_am timestamptz not null default now()
);

alter table public.profilbild_verlauf enable row level security;

create policy "Admins duerfen den Profilbild-Verlauf lesen"
    on public.profilbild_verlauf for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and 'Admin' = any(p.rollen)
        )
    );

create policy "Mitglieder duerfen nur fuer sich selbst archivieren"
    on public.profilbild_verlauf for insert
    to authenticated
    with check (profile_id = auth.uid());

grant select, insert on public.profilbild_verlauf to authenticated;

-- Storage-Policies erweitern: bisher durfte ein Mitglied nur exakt
-- "<user-id>.jpg" anlegen/ersetzen (siehe 013-avatar-storage-bucket.sql) -
-- jetzt zusaetzlich "<user-id>-<Zahl>.jpg" fuers Archivieren (per
-- storage.copy() beim Aendern/Entfernen). Die Delete-Policy bleibt bewusst
-- unveraendert nur auf "<user-id>.jpg" beschraenkt - ein Mitglied kann sein
-- aktuelles Bild loeschen, aber nie eine bereits archivierte Datei.

drop policy "Mitglieder duerfen nur ihr eigenes Profilbild hochladen" on storage.objects;
create policy "Mitglieder duerfen nur ihr eigenes Profilbild hochladen"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'avatars' and name ~ ('^' || auth.uid()::text || '(-[0-9]+)?\.jpg$'));

drop policy "Mitglieder duerfen nur ihr eigenes Profilbild ersetzen" on storage.objects;
create policy "Mitglieder duerfen nur ihr eigenes Profilbild ersetzen"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'avatars' and name ~ ('^' || auth.uid()::text || '(-[0-9]+)?\.jpg$'));
