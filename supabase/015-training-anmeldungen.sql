-- Migration 015: Trainings-Anmeldung (Zusagen/Absagen fuers jeweils
-- naechste Training). Kein eigener Trainingstermin-Kalender - das
-- naechste Datum wird im Frontend per getNextTrainingWindow() berechnet
-- (js/main.js), exakt wie beim bestehenden Countdown auf der Startseite.
--
-- Bewusst "unique (profile_id)" statt "unique (profile_id,
-- training_datum)": jedes Mitglied hat dauerhaft genau eine Zeile, die bei
-- jeder Zu-/Absage einfach ueberschrieben wird (Upsert) - verhindert
-- unbegrenztes Zeilen-Wachstum ueber die Zeit. Der woechentliche Reset
-- passiert trotzdem automatisch: Abfragen filtern immer auf das aktuell
-- berechnete Datum, eine veraltete Zeile (altes Datum) taucht fuer die
-- neue Woche einfach nicht mehr in der Zusagen-Liste auf, ohne dass etwas
-- geloescht werden muss.

create table public.training_anmeldungen (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null unique references public.profiles (id) on delete cascade,
    training_datum date not null,
    status text not null check (status in ('zugesagt', 'abgesagt')),
    geantwortet_am timestamptz not null default now()
);

alter table public.training_anmeldungen enable row level security;

create policy "Mitglieder duerfen alle Trainings-Anmeldungen lesen"
    on public.training_anmeldungen for select
    to authenticated
    using (true);

create policy "Mitglieder duerfen nur die eigene Anmeldung anlegen"
    on public.training_anmeldungen for insert
    to authenticated
    with check (profile_id = auth.uid());

create policy "Mitglieder duerfen nur die eigene Anmeldung aendern"
    on public.training_anmeldungen for update
    to authenticated
    using (profile_id = auth.uid())
    with check (profile_id = auth.uid());

grant select, insert, update on public.training_anmeldungen to authenticated;
