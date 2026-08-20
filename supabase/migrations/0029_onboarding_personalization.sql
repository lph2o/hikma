-- Phase 32C — profil pédagogique léger.
-- Colonnes additives et nullable : les utilisateurs existants restent compatibles.
-- Ces préférences ne pilotent ni le grading, ni le SRS, ni la mastery.

alter table public.user_settings
  add column if not exists display_name text,
  add column if not exists learning_goal text,
  add column if not exists arabic_reading_level text,
  add column if not exists quran_familiarity text,
  add column if not exists daily_duration integer,
  add column if not exists learning_pace text,
  add column if not exists preferred_surah_number integer;

alter table public.user_settings
  drop constraint if exists user_settings_display_name_length_check,
  add constraint user_settings_display_name_length_check
    check (display_name is null or char_length(trim(display_name)) between 1 and 60),
  drop constraint if exists user_settings_learning_goal_check,
  add constraint user_settings_learning_goal_check
    check (learning_goal is null or learning_goal in (
      'understand_recitation', 'memorize_vocabulary', 'understand_surahs',
      'build_vocabulary', 'start_gently'
    )),
  drop constraint if exists user_settings_arabic_reading_level_check,
  add constraint user_settings_arabic_reading_level_check
    check (arabic_reading_level is null or arabic_reading_level in (
      'beginner', 'letters', 'slow', 'correct', 'fluent'
    )),
  drop constraint if exists user_settings_quran_familiarity_check,
  add constraint user_settings_quran_familiarity_check
    check (quran_familiarity is null or quran_familiarity in (
      'beginner', 'some_surahs', 'regular_recitation', 'many_surahs', 'complete_reading'
    )),
  drop constraint if exists user_settings_daily_duration_check,
  add constraint user_settings_daily_duration_check
    check (daily_duration is null or daily_duration in (5, 10, 15, 20, 30)),
  drop constraint if exists user_settings_learning_pace_check,
  add constraint user_settings_learning_pace_check
    check (learning_pace is null or learning_pace in (
      'daily_short', 'some_days', 'flexible', 'unknown'
    )),
  drop constraint if exists user_settings_preferred_surah_number_check,
  add constraint user_settings_preferred_surah_number_check
    check (preferred_surah_number is null or preferred_surah_number between 1 and 114);

comment on column public.user_settings.display_name is 'Nom d’affichage privé et facultatif.';
comment on column public.user_settings.daily_duration is 'Préférence de durée : 30 représente la catégorie « plus de 20 min ». '; 
