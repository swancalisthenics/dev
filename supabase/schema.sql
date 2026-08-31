-- Schema fuer den Mitgliederbereich (Supabase Auth + Postgres).
-- Einmalig im Supabase-Dashboard unter "SQL Editor" ausfuehren, nachdem
-- das Projekt angelegt wurde (siehe CLAUDE.md, Abschnitt "Geplant:
-- Mitgliederbereich mit Supabase", Schritt 1).
--
-- Zeigt den kompletten, aktuellen Soll-Zustand (fuer ein neues Projekt von
-- Grund auf). Das echte "homepage"-Projekt existiert aber schon laenger und
-- wurde stattdessen schrittweise per einzelnen Migrations-Dateien
-- (supabase/002-*.sql, 003-*.sql, ...) auf diesen Stand gebracht - bei
-- einem bereits laufenden Projekt nicht dieses Skript nochmal ausfuehren
-- (Fehler wegen bereits existierender Tabelle), sondern nur die noch nicht
-- ausgefuehrten Migrations-Dateien.
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
    -- Rollen gleichzeitig haben kann (z.B. "Präsident" + "Trainer"). Aktuell
    -- verwendet: "Admin", "Aktivmitglied", "Passivmitglied", "Ehrenmitglied",
    -- "Präsident", "Gönner" - wird vom Vorstand vergeben, nicht vom Mitglied
    -- selbst (siehe UPDATE-Policy unten). Default bewusst leer statt einer
    -- Mitgliedsart: ein frisch eingeladenes Konto hat noch keine vom Vorstand
    -- zugewiesene Rolle.
    rollen text[] not null default '{}',
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

-- ... und nur sein eigenes Profil bearbeiten ...
create policy "Mitglieder duerfen ihr eigenes Profil bearbeiten"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- ... Admins duerfen zusaetzlich auch fremde Profile bearbeiten (fuer die
-- Rollen-Vergabe im Mitglied-Modal, siehe pages/mitglieder.html). Der
-- eigentliche Schutz gegen Selbst-Befoerderung laeuft ueber den Trigger
-- weiter unten, nicht ueber diese Policy allein - ohne den Trigger koennte
-- sich sonst jedes Mitglied ueber die Policy oben weiterhin selbst zum
-- Admin machen.
create policy "Admins duerfen alle Profile bearbeiten"
    on public.profiles for update
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and 'Admin' = any(p.rollen)
        )
    )
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and 'Admin' = any(p.rollen)
        )
    );

-- Schliesst die Selbst-Befoerderungs-Luecke fuer beide Policies oben und
-- setzt zusaetzlich eine bewusste Grenze: Admins duerfen ueber die
-- Mitglieder-Seite alle Rollen ausser "Admin" selbst vergeben/entziehen -
-- fuer NIEMANDEN, auch nicht fuer sich selbst oder andere Admins. Wer neu
-- Admin werden oder Admin-Rechte verlieren soll, passiert bewusst nicht
-- über dieses UI, sondern direkt per SQL durch die Projektinhaberin/den
-- Projektinhaber. "Admin" in `new.rollen` wird deshalb immer wieder exakt
-- auf den Stand von `old.rollen` zurueckgesetzt, unabhaengig davon, wer die
-- Aenderung ausfuehrt. Alle anderen Rollen-Aenderungen (Vorstand,
-- Ehrenmitglied, frei erfundene wie "Präsident", ...) bleiben für Admins
-- normal moeglich. security definer, damit die Abfrage hier unabhaengig
-- von der RLS-Policy der aufrufenden Seite zuverlaessig funktioniert.
create or replace function public.protect_rollen_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    ausfuehrender_ist_admin boolean;
    war_admin boolean;
    ist_jetzt_admin boolean;
begin
    if new.rollen is distinct from old.rollen then
        select exists (
            select 1 from public.profiles
            where id = auth.uid() and 'Admin' = any(rollen)
        ) into ausfuehrender_ist_admin;

        if not ausfuehrender_ist_admin then
            new.rollen := old.rollen;
        else
            war_admin := 'Admin' = any(old.rollen);
            ist_jetzt_admin := 'Admin' = any(new.rollen);
            if war_admin and not ist_jetzt_admin then
                new.rollen := array_append(new.rollen, 'Admin');
            elsif ist_jetzt_admin and not war_admin then
                new.rollen := array_remove(new.rollen, 'Admin');
            end if;
        end if;
    end if;
    return new;
end;
$$;

create trigger protect_rollen_column_trigger
    before update on public.profiles
    for each row
    execute function public.protect_rollen_column();

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

-- Zeigt Admins zusaetzlich Accounts, die schon eingeladen wurden (existieren
-- in auth.users), aber noch nie ihr Profil gespeichert haben (noch keine
-- Zeile in public.profiles) - siehe pages/mitglieder.html. Bewusst KEIN
-- Trigger auf auth.users, der automatisch eine Profil-Zeile anlegt: ein
-- fehlerhafter Trigger dort wuerde sonst jede kuenftige Einladung
-- fehlschlagen lassen, nicht nur die aktuelle. Admin-Beschraenkung sitzt
-- direkt in der View: Nicht-Admins bekommen von dieser Abfrage immer 0
-- Zeilen zurueck. Rollen lassen sich fuer diese Accounts bewusst noch nicht
-- vergeben - erst moeglich, sobald die Person sich einmal eingeloggt und
-- ihr Profil gespeichert hat.
create view public.eingeladene_ohne_profil as
    select u.id, u.email, u.created_at as eingeladen_am
    from auth.users u
    where not exists (select 1 from public.profiles p where p.id = u.id)
      and exists (
          select 1 from public.profiles me
          where me.id = auth.uid() and 'Admin' = any(me.rollen)
      );

grant select on public.eingeladene_ohne_profil to authenticated;

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
