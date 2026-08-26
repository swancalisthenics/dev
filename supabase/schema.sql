-- Schema fuer den Mitgliederbereich (Supabase Auth + Postgres).
-- Einmalig im Supabase-Dashboard unter "SQL Editor" ausfuehren, nachdem
-- das Projekt angelegt wurde (siehe CLAUDE.md, Abschnitt "Geplant:
-- Mitgliederbereich mit Supabase", Schritt 1).
--
-- Setzt voraus, dass Mitglieder ueber Supabase Auth eingeladen wurden
-- (auth.users existiert bereits als eingebaute Tabelle) - hier wird nur
-- die Profil-Tabelle ergaenzt, die zusaetzlich zum Auth-Konto Name,
-- Social-Links und Profilbild haelt.

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    name text not null,
    email text not null,
    email_oeffentlich boolean not null default false,
    -- text[] statt Postgres-ENUM, damit neue Rollen jederzeit ohne
    -- Schema-Migration ergaenzt werden koennen UND ein Mitglied mehrere
    -- Rollen gleichzeitig haben kann (z.B. "Vorstand" + "Trainer"). Aktuell
    -- verwendet: "Admin", "Vorstand", "Mitglied", "Ehrenmitglied" - wird vom
    -- Vorstand vergeben, nicht vom Mitglied selbst (siehe UPDATE-Policy
    -- unten).
    rollen text[] not null default array['Mitglied'],
    instagram text,
    tiktok text,
    profilbild_url text,
    beigetreten_am timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Noetig, weil das Projekt mit deaktiviertem "Automatically expose new
-- tables" angelegt wurde (empfohlene, bewusste Einstellung): ohne dieses
-- GRANT haette die Rolle "authenticated" gar keine Basis-Rechte an der
-- Tabelle, unabhaengig von den RLS-Policies unten - RLS schraenkt nur ein,
-- *welche* Zeilen sichtbar sind, ersetzt aber nicht das grundlegende
-- Tabellen-Recht.
grant select, insert, update on public.profiles to authenticated;

-- E-Mail ist privat: die Tabelle selbst ist nur fuer den Besitzer lesbar
-- (fuers eigene "Mein Profil"-Formular). Alle anderen Mitglieder lesen die
-- Mitgliederliste ueber die public_profiles-View weiter unten, die die
-- E-Mail-Spalte bewusst nicht mit ausgibt.
create policy "Mitglieder duerfen nur ihr eigenes vollstaendiges Profil lesen"
    on public.profiles for select
    to authenticated
    using (auth.uid() = id);

-- Ein Mitglied darf nur sein eigenes Profil anlegen ...
create policy "Mitglieder duerfen nur ihr eigenes Profil anlegen"
    on public.profiles for insert
    to authenticated
    with check (auth.uid() = id);

-- ... und nur sein eigenes Profil bearbeiten.
-- ACHTUNG / NOCH OFFEN: Diese Policy erlaubt einem Mitglied aktuell auch,
-- die eigene `rollen`-Spalte selbst zu aendern (z.B. sich selbst auf "Admin"
-- zu setzen) - das darf in der echten Umsetzung nicht so bleiben. Vor dem
-- produktiven Einsatz entweder per Trigger absichern (Aenderung an `rollen`
-- nur erlauben, wenn der ausfuehrende User bereits Admin/Vorstand ist) oder
-- `rollen` in eine eigene, nur vom Vorstand beschreibbare Tabelle auslagern.
create policy "Mitglieder duerfen nur ihr eigenes Profil bearbeiten"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Oeffentliche Sicht fuer die Mitgliederliste (pages/mitglieder.html):
-- E-Mail ist standardmaessig privat (email_oeffentlich = false) - die View
-- gibt die E-Mail-Spalte nur aus, wenn das einzelne Mitglied das per Toggle
-- im eigenen Profil ("E-Mail mit anderen teilen") aktiviert hat, sonst NULL.
-- Die View gehoert dem View-Ersteller (nicht dem einzelnen Mitglied) und
-- umgeht dadurch die einschraenkende RLS-Policy der Tabelle - das ist hier
-- gewollt, sie gibt ja ohnehin nur unkritische bzw. bewusst freigegebene
-- Spalten aus allen Zeilen weiter.
create view public.public_profiles as
    select
        id,
        name,
        case when email_oeffentlich then email else null end as email,
        rollen,
        instagram,
        tiktok,
        profilbild_url
    from public.profiles;

grant select on public.public_profiles to authenticated;

-- Profilbilder: eigener Storage-Bucket, Policies analog zur Tabelle oben.
-- Erst noetig, sobald der Foto-Upload (Schritt 9) umgesetzt wird - Bucket
-- "profilbilder" im Dashboard unter Storage anlegen, dann:
--
-- create policy "Profilbilder sind fuer eingeloggte Mitglieder lesbar"
--     on storage.objects for select
--     to authenticated
--     using (bucket_id = 'profilbilder');
--
-- create policy "Mitglieder duerfen nur ihr eigenes Profilbild hochladen"
--     on storage.objects for insert
--     to authenticated
--     with check (bucket_id = 'profilbilder' and (storage.foldername(name))[1] = auth.uid()::text);
