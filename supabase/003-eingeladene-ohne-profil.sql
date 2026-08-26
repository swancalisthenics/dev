-- Migration fuer das schon laufende "homepage"-Projekt (analog zu
-- 002-admin-rollen.sql) - im Supabase-Dashboard unter "SQL Editor" einmalig
-- ausfuehren.
--
-- Zeigt Admins in der Mitgliederliste zusaetzlich Accounts an, die zwar
-- schon eingeladen wurden (existieren in auth.users), sich aber noch nie
-- eingeloggt und ihr Profil gespeichert haben (noch keine Zeile in
-- public.profiles - siehe "Mitgliederbereich mit Supabase" in CLAUDE.md).
-- Bewusst KEIN Trigger auf auth.users, der automatisch eine Profil-Zeile
-- anlegt: ein fehlerhafter Trigger dort wuerde sonst jede kuenftige
-- Einladung fehlschlagen lassen, nicht nur die aktuelle. Diese View liest
-- auth.users stattdessen nur lesend, ganz ohne Trigger.
--
-- Admin-Beschraenkung sitzt direkt in der View (nicht nur im Frontend
-- versteckt): Nicht-Admins bekommen von dieser Abfrage immer 0 Zeilen
-- zurueck, weil der exists()-Check dann nie zutrifft. Rollen lassen sich
-- fuer diese Accounts bewusst noch nicht vergeben - das ist erst moeglich,
-- sobald die Person sich einmal eingeloggt und ihr Profil gespeichert hat
-- (dann existiert eine echte Zeile in profiles, ganz normal ueber das
-- bestehende Rollen-UI im Mitglied-Modal).
create view public.eingeladene_ohne_profil as
    select u.id, u.email, u.created_at as eingeladen_am
    from auth.users u
    where not exists (select 1 from public.profiles p where p.id = u.id)
      and exists (
          select 1 from public.profiles me
          where me.id = auth.uid() and 'Admin' = any(me.rollen)
      );

grant select on public.eingeladene_ohne_profil to authenticated;
