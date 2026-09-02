-- Migration 018: Laengenbegrenzung fuer konto_anfragen.name, analog zu
-- supabase/017-kontakt-nachricht-laenge.sql. Das Formular selbst hat seit
-- heute "maxlength=100" (site-chrome.js, account-request-modal), schuetzt
-- aber nur den normalen Formular-Weg - die Insert-Policy auf
-- konto_anfragen ist bewusst "with check (true)" (siehe
-- supabase/008-konto-anfragen.sql), ein direkter API-Aufruf am Formular
-- vorbei koennte also einen beliebig langen Namen einschicken.

alter table public.konto_anfragen
    add constraint name_max_100 check (char_length(name) <= 100);
