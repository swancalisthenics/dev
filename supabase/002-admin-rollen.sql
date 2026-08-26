-- Migration 002: Rollen-Vergabe fuer Admins im Mitglied-Modal
-- (pages/mitglieder.html) + schliesst dabei die von Anfang an bekannte
-- Selbst-Befoerderungs-Luecke (siehe schema.sql). Einmalig im Supabase
-- SQL-Editor ausfuehren, NACH schema.sql (das bereits einmal lief).

-- Ersetzt die bisherige "nur eigene Zeile"-Policy 1:1 (unveraendertes
-- Verhalten fuers eigene Profil) - noetig, um sie unten per Trigger absichern
-- zu koennen, ohne den Namen der alten Policy weiterzuverwenden.
drop policy "Mitglieder duerfen nur ihr eigenes Profil bearbeiten" on public.profiles;

create policy "Mitglieder duerfen ihr eigenes Profil bearbeiten"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Neu: Admins duerfen zusaetzlich auch fremde Profile bearbeiten (fuer die
-- Rollen-Vergabe). Der eigentliche Schutz gegen Selbst-Befoerderung laeuft
-- ueber den Trigger unten, nicht ueber diese Policy allein - ohne den
-- Trigger koennte sich sonst jedes Mitglied ueber die Policy oben
-- weiterhin selbst zum Admin machen.
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
-- normal moeglich.
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
            -- Nicht-Admin: Rollen-Aenderung komplett ignorieren.
            new.rollen := old.rollen;
        else
            -- Admin: darf alles ausser den Admin-Status selbst aendern.
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
