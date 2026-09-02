-- Migration 016: Kontaktformular-Nachrichten intern speichern statt per
-- FormSubmit.co an eine private Gmail-Adresse weiterzuleiten (siehe
-- docs/superpowers/specs/2026-09-02-kontaktformular-postfach-design.md).
--
-- kontakt_nachrichten: der eigentliche Nachrichteninhalt. Insert bewusst
-- fuer anon UND authenticated offen (oeffentliches Formular, kein Login
-- noetig - genau wie bisher bei FormSubmit.co). Select nur fuer
-- Mitglieder mit der aktuellen Rolle "Präsident", identisches Muster wie
-- die bestehende Admin-Select-Policy auf konto_anfragen.
create table public.kontakt_nachrichten (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    kategorie text not null,
    nachricht text not null,
    erstellt_am timestamptz not null default now()
);

alter table public.kontakt_nachrichten enable row level security;

create policy "Jeder darf eine Kontakt-Nachricht schicken"
    on public.kontakt_nachrichten for insert
    to anon, authenticated
    with check (true);

create policy "Praesidenten duerfen alle Kontakt-Nachrichten lesen"
    on public.kontakt_nachrichten for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and 'Präsident' = any(p.rollen)
        )
    );

grant insert on public.kontakt_nachrichten to anon, authenticated;
grant select on public.kontakt_nachrichten to authenticated;

-- kontakt_nachrichten_status: Pro-Person-Gelesen-Status. Bewusst KEIN
-- "gelesen boolean" - die blosse Existenz einer Zeile fuer (Nachricht,
-- Person) bedeutet bereits "gelesen"; fehlt die Zeile, gilt die
-- Nachricht fuer diese Person als ungelesen. Dadurch reicht ein Insert
-- beim ersten Oeffnen, nie ein Update noetig. "on delete cascade" auf
-- beiden Fremdschluesseln raeumt automatisch mit auf, sobald entweder
-- die Nachricht (siehe pg_cron-Job unten) oder das Profil geloescht wird.
create table public.kontakt_nachrichten_status (
    nachricht_id uuid not null references public.kontakt_nachrichten (id) on delete cascade,
    profile_id uuid not null references public.profiles (id) on delete cascade,
    gelesen_am timestamptz not null default now(),
    primary key (nachricht_id, profile_id)
);

alter table public.kontakt_nachrichten_status enable row level security;

create policy "Mitglieder duerfen nur den eigenen Gelesen-Status lesen"
    on public.kontakt_nachrichten_status for select
    to authenticated
    using (profile_id = auth.uid());

create policy "Mitglieder duerfen nur den eigenen Gelesen-Status anlegen"
    on public.kontakt_nachrichten_status for insert
    to authenticated
    with check (profile_id = auth.uid());

grant select, insert on public.kontakt_nachrichten_status to authenticated;

-- Automatisches Loeschen 2 Monate nach Eingang. pg_cron ist auf jedem
-- Supabase-Projekt (auch Gratis-Tier) nutzbar, muss aber pro Projekt
-- einmal aktiviert werden.
create extension if not exists pg_cron;

select cron.schedule(
    'kontakt-nachrichten-aufraeumen',
    '0 3 * * *', -- taeglich 03:00 UTC
    $$delete from public.kontakt_nachrichten where erstellt_am < now() - interval '2 months'$$
);
