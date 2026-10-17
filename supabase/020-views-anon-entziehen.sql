-- Migration 020: Lesezugriff ohne Login (anon) auf die beiden Views entziehen
-- - im Supabase-Dashboard unter "SQL Editor" einmalig ausfuehren.
--
-- Anlass: Security Advisor meldet public_profiles und
-- eingeladene_ohne_profil als "Security Definer View" bzw. "Exposed Auth
-- Users". Beide Views laufen bewusst mit den Rechten des Erstellers (siehe
-- schema.sql: profiles gibt per RLS nur die eigene Zeile frei, die
-- Mitgliederliste braucht aber alle). Die Advisor-Meldungen bleiben daher
-- stehen - das eigentliche Problem war ein anderes:
--
-- schema.sql vergibt zwar nur "grant select ... to authenticated", Supabase
-- gibt neuen Objekten im Schema public per Default-Privileges aber
-- zusaetzlich auch Rechte an anon. Mit dem oeffentlichen Anon-Key aus dem
-- Website-JS liess sich public_profiles so ohne Login abfragen (Namen,
-- Social-Links, freigegebene E-Mails). Die Website liest beide Views nur
-- nach dem Login, fuer eingeloggte Mitglieder aendert sich nichts.
--
-- Rueckgaengig: grant select on public.<view> to anon;
revoke all on public.public_profiles from anon;
revoke all on public.eingeladene_ohne_profil from anon;

-- Kontrolle: muss 0 Zeilen liefern.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('public_profiles', 'eingeladene_ohne_profil')
  and grantee = 'anon';
