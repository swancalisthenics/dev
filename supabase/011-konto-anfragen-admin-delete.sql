-- Migration 011: Admins duerfen Konto-Anfragen loeschen (Punkt 55,
-- "Löschen"-Button + Bestätigungsdialog in der "Ausstehende Anfragen"-
-- Ansicht auf pages/mitglieder.html). Gleiches Admin-Check-Muster wie die
-- SELECT-Policy aus supabase/010-konto-anfragen-admin-select.sql.

create policy "Admins duerfen Konto-Anfragen loeschen"
    on public.konto_anfragen for delete
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and 'Admin' = any(p.rollen)
        )
    );

grant delete on public.konto_anfragen to authenticated;
