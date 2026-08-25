-- Hikma — Phase 77 : timezone utilisateur (fondation heure locale).
--
-- Ajout additif et non destructif : colonne nullable, sans valeur par défaut
-- côté base (null = UTC). Aucune modification des données existantes.
-- La détection automatique remplit cette colonne au premier rendu dashboard
-- (composant TimezoneInit), pas de backfill obligatoire.
--
-- RLS : déjà protégé par user_settings_select/insert/update (auth.uid()).

alter table public.user_settings
  add column if not exists timezone text;

comment on column public.user_settings.timezone is
  'Identifiant IANA du fuseau horaire de l''utilisateur (ex. Europe/Paris). Null = UTC.';