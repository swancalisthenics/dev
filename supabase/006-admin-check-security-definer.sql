-- Migration 006: Zweiter Versuch fuer den Bug aus CLAUDE.md Punkt 46 - der
-- erste Fix (005, beide UPDATE-Policies zu einer zusammengelegt) hat das
-- Problem NICHT geloest, per EXPLAIN bestaetigt trat exakt derselbe
-- zusaetzliche, nicht mit OR verknuepfte "auth.uid() = id"-Bedingungsteil
-- weiterhin auf, obwohl nur noch eine einzige Policy existiert. Einmalig im
-- Supabase SQL-Editor ausfuehren, NACH 005.
--
-- Zweite Ursachen-Vermutung: Ein RLS-Policy-Ausdruck, der per Subquery auf
-- dieselbe Tabelle zugreift, die er selbst schuetzt ("Admin"-Check liest aus
-- profiles, waehrend profiles per UPDATE bearbeitet wird), ist ein bekanntes,
-- oft dokumentiertes Muster fuer genau solche unerwarteten
-- Query-Planer-Interaktionen. Der uebliche Fix: die Pruefung in eine
-- `SECURITY DEFINER`-Funktion auslagern, die fuer den Query-Planer eine
-- vollstaendig undurchsichtige "Blackbox" ist (er kann nicht mehr versuchen,
-- Teile davon in den Scan-Filter hineinzuoptimieren). WICHTIGE FALLE dabei:
-- eine `SECURITY DEFINER`-Funktion in `language sql` (nicht plpgsql) kann von
-- Postgres beim Planen "inline" ersetzt werden - dabei geht der
-- SECURITY-DEFINER-Schutz wieder verloren und man ist exakt wieder beim
-- Ausgangsproblem. Deshalb hier bewusst `language plpgsql` (wird nie
-- inline-optimiert), im selben Stil wie die bereits bestehende
-- `protect_rollen_column()`-Funktion in diesem Projekt.

create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
    return exists (
        select 1 from public.profiles
        where id = auth.uid() and 'Admin' = any(rollen)
    );
end;
$$;

drop policy "Mitglieder und Admins duerfen Profile bearbeiten" on public.profiles;

create policy "Mitglieder und Admins duerfen Profile bearbeiten"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id or public.is_admin())
    with check (auth.uid() = id or public.is_admin());
