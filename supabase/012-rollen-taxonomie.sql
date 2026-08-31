-- Migration 012: Rollen-Umbau (Punkt 56) - "Mitglied" wird durch die zwei
-- spezifischeren Rollen "Aktivmitglied"/"Passivmitglied" ersetzt, neu dazu
-- kommt "Gönner". "keine Rolle" ist jetzt ein gueltiger Zustand (siehe
-- js/mitglieder.js, die bisherige "mindestens eine Rolle"-Pruefung ist
-- entfernt) und der neue Standard fuer frisch angelegte Profile.
--
-- Nur der Spalten-Default aendert sich hier - rollen ist eine Freitext-
-- text[]-Spalte ohne Enum/CHECK-Constraint (siehe Kommentar in
-- schema.sql), das Anpassen der Toggle-Optionen selbst ist ein reiner
-- UI-Eingriff ohne Migration (gleiches Vorgehen wie beim Entfernen von
-- "Vorstand", siehe Punkt 49).
--
-- Bewusst KEINE Daten-Migration fuer bereits vorhandene "Mitglied"-Zeilen:
-- ob die einer bestehenden Person eher "Aktivmitglied" oder
-- "Passivmitglied" entspricht, ist eine inhaltliche Entscheidung des
-- Vorstands, keine technische - das bisherige "Mitglied" bleibt in der
-- Datenbank so lange stehen, bis es im Rollen-Editor manuell durch eine
-- der neuen Rollen ersetzt wird (verschwindet dann automatisch aus der
-- Anzeige, sobald keine Checkbox mehr dafuer existiert).

alter table public.profiles
    alter column rollen set default '{}';
