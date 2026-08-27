-- Hikma — Phase F : CONTENT STUDIO VIDEO EDITOR — état d'édition.
--
-- Colonne ADDITIVE dédiée à la couche d'édition vidéo du studio.
--
-- Contexte (Phase F, audit avant migration) :
--   - `payload` reste le payload contractuel V1 (RevealPayloadV1 / QuizPayloadV1),
--     GELÉ et non muté : on n'y stocke JAMAIS d'état d'édition (déterminisme +
--     séparation contenu/édition).
--   - Cette colonne `editor_state` porte UNIQUEMENT la couche de MONTAGE :
--     les overrides par scène (durée en frames, textes éditables : hook, glose,
--     translittération, CTA, etc.) par-dessus le VideoSceneData dérivé.
--   - `null` = aucune édition → le rendu reste exactement le montage déterministe
--     de la pipeline (aucun changement de comportement pour les contenus existants).
--
-- Sécurité : RLS déjà activée sur content_items (zéro policy) → la nouvelle
-- colonne est couverte par la même politique d'accès serveur uniquement.
-- Aucune donnée sensible : l'état d'édition peut contenir du texte éditorial,
-- jamais de secrets/tokens.
--
-- Migration MINIMALE, ADDITIVE, IDEMPOTENTE. Aucune écriture de données.

alter table public.content_items
  add column if not exists editor_state jsonb;

comment on column public.content_items.editor_state is
  'Couche d''édition vidéo du studio (Phase F) : overrides de montage par scène (durées, textes éditables) sur le VideoSceneData dérivé. null = montage déterministe de la pipeline ; le payload contractuel reste immuable.';