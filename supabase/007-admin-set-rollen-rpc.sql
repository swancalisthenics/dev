-- Migration 007: Workaround fuer den Bug aus CLAUDE.md Punkt 46 - zwei
-- gezielte RLS-Policy-Fixversuche (005: Policies zusammengelegt, 006:
-- SECURITY DEFINER-Hilfsfunktion is_admin() statt Inline-Subquery) haben das
-- Problem NICHT geloest, per EXPLAIN jedes Mal bestaetigt trat weiterhin
-- derselbe, nicht mit OR verknuepfte zusaetzliche "auth.uid() = id"-Teil im
-- tatsaechlichen Filter auf. Einmalig im Supabase SQL-Editor ausfuehren.
--
-- Statt weiter an der RLS-Policy-Auswertung selbst zu suchen, umgeht diese
-- Migration das Problem: Die Rollen-Aenderung laeuft nicht mehr ueber einen
-- direkten Tabellen-.update() (der der ungeklaerten RLS-Eigenheit
-- unterliegt), sondern ueber eine eigene SECURITY DEFINER-Funktion, die die
-- Berechtigung selbst per einfachem if-exists-Check prueft (keine
-- RLS-Policy-Auswertung mehr fuer diesen Schreibzugriff noetig) und das
-- UPDATE danach direkt ausfuehrt. Der bestehende Trigger
-- protect_rollen_column_trigger (schuetzt den Admin-Status selbst) feuert
-- unveraendert weiter, unabhaengig davon, auf welchem Weg das UPDATE
-- ausgeloest wird.
--
-- js/mitglieder.js's saveMitgliedRollen() ruft diese Funktion per
-- supabaseClient.rpc('admin_set_rollen', {...}) auf, statt wie bisher
-- supabaseClient.from('profiles').update(...).

create or replace function public.admin_set_rollen(target_id uuid, neue_rollen text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not exists (
        select 1 from public.profiles
        where id = auth.uid() and 'Admin' = any(rollen)
    ) then
        raise exception 'Nur Admins duerfen Rollen anderer Mitglieder aendern.';
    end if;

    update public.profiles
    set rollen = neue_rollen
    where id = target_id;
end;
$$;

grant execute on function public.admin_set_rollen(uuid, text[]) to authenticated;
