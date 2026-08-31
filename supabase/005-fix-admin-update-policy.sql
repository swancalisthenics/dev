-- Migration 005: Behebt den Bug aus CLAUDE.md Punkt 46 (Rollen-Speichern fuer
-- ein fremdes Profil schlaegt fehl). Einmalig im Supabase SQL-Editor ausfuehren.
--
-- Ursache (per EXPLAIN (ANALYZE, VERBOSE) auf dem echten UPDATE bestaetigt):
-- Mit zwei getrennten permissiven UPDATE-Policies ("Mitglieder duerfen ihr
-- eigenes Profil bearbeiten" und "Admins duerfen alle Profile bearbeiten")
-- baute Postgres den tatsaechlichen Scan-Filter nicht als sauberes
-- "(auth.uid() = id) OR admin_check", sondern ergaenzte zusaetzlich, ausserhalb
-- des OR, nochmal "auth.uid() = id" als eigene, zwingende UND-Bedingung -
-- dadurch war ein UPDATE auf eine fremde Zeile durch einen Admin nie moeglich,
-- obwohl jede Policy fuer sich allein gelesen korrekt aussah (mehrere
-- permissive UPDATE-Policies auf derselben Tabelle sind ein bekannt
-- tueckischer Bereich in Postgres, siehe z.B. den "[HACKERS] Row Level
-- Security UPDATE Confusion"-Thread). Fix: beide Policies zu einer einzigen
-- zusammenlegen, mit dem OR direkt innerhalb einer Policy statt ueber
-- Postgres' Mehrfach-Policy-Kombination - das umgeht die fragile Interaktion
-- komplett, statt sie zu reparieren.
--
-- Trigger protect_rollen_column_trigger (schuetzt den Admin-Status selbst)
-- bleibt unveraendert - der war laut Untersuchung nie das Problem.

drop policy "Mitglieder duerfen ihr eigenes Profil bearbeiten" on public.profiles;
drop policy "Admins duerfen alle Profile bearbeiten" on public.profiles;

create policy "Mitglieder und Admins duerfen Profile bearbeiten"
    on public.profiles for update
    to authenticated
    using (
        auth.uid() = id
        or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and 'Admin' = any(p.rollen)
        )
    )
    with check (
        auth.uid() = id
        or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and 'Admin' = any(p.rollen)
        )
    );
