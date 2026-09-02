-- Migration 017: Laengenbegrenzung fuer kontakt_nachrichten.nachricht.
-- Das Formular selbst hat seit heute "maxlength=1000" (pages/kontakt.html),
-- schuetzt aber nur den normalen Formular-Weg - die Insert-Policy auf
-- kontakt_nachrichten ist bewusst "with check (true)" (siehe
-- supabase/016-kontakt-nachrichten.sql), ein direkter API-Aufruf am
-- Formular vorbei koennte also beliebig lange Texte einschicken. Dieser
-- Constraint schliesst genau diese Luecke serverseitig.

alter table public.kontakt_nachrichten
    add constraint nachricht_max_1000 check (char_length(nachricht) <= 1000);
