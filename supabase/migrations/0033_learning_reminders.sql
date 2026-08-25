-- Hikma — Phase 80 : rappels d'apprentissage in-app V1.
--
-- Ajout additif et non destructif :
--   - reminder_enabled : opt-in (défaut false = aucun rappel pour les comptes existants).
--   - reminder_time    : heure locale HH:MM (défaut "19:00").
--
-- Aucune nouvelle table, aucun seed, aucune modification de données existantes.
-- RLS déjà protégée par auth.uid() via les politiques user_settings existantes.

alter table public.user_settings
  add column if not exists reminder_enabled boolean not null default false;

alter table public.user_settings
  add column if not exists reminder_time text not null default '19:00';

comment on column public.user_settings.reminder_enabled is
  'Rappel quotidien activé par l''utilisateur. Défaut false (opt-in).';

comment on column public.user_settings.reminder_time is
  'Heure locale du rappel (HH:MM, 24h). Défaut 19:00.';