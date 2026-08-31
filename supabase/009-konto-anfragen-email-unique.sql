-- Migration 009: Doppelte Konto-Anfragen verhindern (nach Punkt 52/
-- supabase/008-konto-anfragen.sql). konto_anfragen hat keine SELECT-Policy
-- fuer anon/authenticated (siehe 008) - ein client-seitiger "existiert die
-- Mail schon?"-Check per .select() waere durch RLS blockiert und wuerde
-- immer "nein" liefern, egal ob wirklich schon eine Anfrage existiert.
-- Stattdessen ein Unique-Index auf lower(email) direkt in der DB: der
-- INSERT-Versuch schlaegt bei einer bereits vorhandenen Mail mit Postgres-
-- Fehlercode 23505 (unique_violation) fehl, den handleAccountRequestSubmit()
-- in js/main.js gezielt abfaengt und in eine freundliche Meldung uebersetzt.
-- lower(email) statt email direkt, damit z.B. "Test@example.com" und
-- "test@example.com" als dieselbe Anfrage gelten.

create unique index konto_anfragen_email_lower_idx
    on public.konto_anfragen (lower(email));
