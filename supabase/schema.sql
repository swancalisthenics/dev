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
    -- Freitext statt Postgres-ENUM, damit neue Rollen jederzeit ohne
    -- Schema-Migration ergaenzt werden koennen. Aktuell verwendet: "Admin",
    -- "Vorstand", "Mitglied", "Ehrenmitglied" - wird vom Vorstand vergeben,
    -- nicht vom Mitglied selbst (siehe UPDATE-Policy unten).
    rolle text not null default 'Mitglied',
    instagram text,
    tiktok text,
    profilbild_url text,
    erstellt_am timestamptz not null default now()
);

alter table public.profiles enable row level security;

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
-- die eigene `rolle`-Spalte selbst zu aendern (z.B. sich selbst auf "Admin"
-- zu setzen) - das darf in der echten Umsetzung nicht so bleiben. Vor dem
-- produktiven Einsatz entweder per Trigger absichern (Aenderung an `rolle`
-- nur erlauben, wenn der ausfuehrende User bereits Admin/Vorstand ist) oder
-- `rolle` in eine eigene, nur vom Vorstand beschreibbare Tabelle auslagern.
create policy "Mitglieder duerfen nur ihr eigenes Profil bearbeiten"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Oeffentliche Sicht fuer die Mitgliederliste (pages/mitglieder.html):
-- E-Mail ist standardmaessig privat (email_oeffentlich = false) - die View
-- gibt die E-Mail-Spalte nur aus, wenn das einzelne Mitglied das per Toggle
-- im eigenen Profil ("E-Mail mit anderen teilen") aktiviert hat, sonst NULL
-- (dieselbe "nicht anzeigen, wenn nicht gesetzt"-Logik wie bei Instagram/
-- TikTok in der App). Die View gehoert dem View-Ersteller (nicht dem
-- einzelnen Mitglied) und umgeht dadurch die einschraenkende RLS-Policy der
-- Tabelle - das ist hier gewollt, sie gibt ja ohnehin nur unkritische bzw.
-- bewusst freigegebene Spalten aus allen Zeilen weiter.
create view public.public_profiles as
    select
        id,
        name,
        case when email_oeffentlich then email else null end as email,
        rolle,
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
