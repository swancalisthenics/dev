-- Migration 019: Fehlende Laengenbegrenzungen nachtragen. 017/018 haben
-- nur "kontakt_nachrichten.nachricht" bzw. "konto_anfragen.name" begrenzt -
-- beim vollstaendigen Durchgehen aller offenen Punkte fehlten noch
-- "kontakt_nachrichten.name"/".kategorie"/".email" sowie
-- "konto_anfragen.email". Gleiche Begruendung wie in 017/018: beide
-- Insert-Policies sind bewusst "with check (true)", ein direkter
-- API-Aufruf am jeweiligen Formular vorbei koennte sonst beliebig lange
-- Werte einschicken. 100 Zeichen fuer Name/Kategorie (analog zu
-- konto_anfragen.name in 018), 254 Zeichen fuer E-Mail (praktisches
-- Maximum nach RFC 5321).

alter table public.kontakt_nachrichten
    add constraint name_max_100 check (char_length(name) <= 100),
    add constraint kategorie_max_100 check (char_length(kategorie) <= 100),
    add constraint email_max_254 check (char_length(email) <= 254);

alter table public.konto_anfragen
    add constraint email_max_254 check (char_length(email) <= 254);
