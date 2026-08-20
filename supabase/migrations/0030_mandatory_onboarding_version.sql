-- Phase 32D — version explicite de l’onboarding obligatoire.
-- Les lignes créées par le backfill historique restent compatibles mais
-- doivent repasser par la nouvelle expérience avant d’être considérées comme
-- complètement configurées.

alter table public.user_settings
  add column if not exists onboarding_version integer not null default 1;

update public.user_settings
set onboarding_version = 1
where onboarding_version is null;

alter table public.user_settings
  drop constraint if exists user_settings_onboarding_version_check,
  add constraint user_settings_onboarding_version_check
    check (onboarding_version between 1 and 2);

comment on column public.user_settings.onboarding_version is
  'Version de la configuration onboarding : 1 historique, 2 expérience personnalisée Phase 32D.';
