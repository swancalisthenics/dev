-- Migration 010: Admins duerfen alle Konto-Anfragen lesen (Punkt 54,
-- Admin-Ansicht "Ausstehende Anfragen" auf pages/mitglieder.html).
-- konto_anfragen hatte bisher bewusst gar keine SELECT-Policy (siehe
-- supabase/008-konto-anfragen.sql) - jetzt eine, genau nach demselben
-- Admin-Check-Muster wie die bestehende "Admins duerfen alle Profile
-- bearbeiten"-Policy auf profiles. Loeschen/Bearbeiten bleibt weiterhin
-- ein separater, spaeterer Task ohne eigene Policy.

create policy "Admins duerfen alle Konto-Anfragen lesen"
    on public.konto_anfragen for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and 'Admin' = any(p.rollen)
        )
    );

grant select on public.konto_anfragen to authenticated;
