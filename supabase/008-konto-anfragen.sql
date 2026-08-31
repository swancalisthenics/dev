-- Migration 008: Neue Tabelle fuer Konto-Anfragen ueber das Login-Modal
-- ("Noch kein Konto? Zugang anfragen") - Interessenten ohne eigenen Account
-- koennen Name + E-Mail hinterlassen, ein Admin liest/loescht sie spaeter
-- manuell (eigener, noch nicht gebauter Task - siehe CLAUDE.md).
--
-- RLS bewusst nur mit einer INSERT-Policy: jeder (auch anon, also nicht
-- eingeloggt - das ist hier der Normalfall, es geht ja gerade um Leute ohne
-- Konto) darf eine Anfrage anlegen, aber niemand kann sie ueber den
-- Anon-Key wieder lesen, aendern oder loeschen - RLS ohne eine passende
-- Policy fuer einen Befehlstyp verweigert diesen Befehlstyp komplett,
-- unabhaengig von der Rolle. Lesen/Loeschen fuer Admins bekommt eine eigene
-- Policy, sobald diese Ansicht gebaut wird.

create table public.konto_anfragen (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    erstellt_am timestamptz not null default now()
);

alter table public.konto_anfragen enable row level security;

create policy "Jeder darf eine Konto-Anfrage stellen"
    on public.konto_anfragen for insert
    to anon, authenticated
    with check (true);

grant insert on public.konto_anfragen to anon, authenticated;
