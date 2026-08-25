# Hikma — Landing inspirée du design de l'onboarding

## Intent

Restyler la landing page marketing de Hikma en adoptant le langage visuel de l'onboarding (Phase 32E/71B), sans y transposer la structure d'onboarding. La landing conserve son architecture marketing (hero split, sections produit, CTA, footer) mais parle le même langage : cartes chaudes élevées, eyebrows dorés, halos radiaux or, rail de progression doré, tuiles d'icônes teal, motion `--ease-hikma`. Aucun changement de contenu marketing, aucune écriture DB, aucun import de dépendance.

## Direction visuelle

- Canvas ivoire conservé, atmosphère retunée sur la chaleur onboarding : halo radial doré en haut + halo teal très subtil (grammaire du gradient hero de l'onboarding, plus doux).
- Navigation en pilule flottante collante : `sticky top-4`, `rounded-full`, fond `surface-elevated/85` + `backdrop-blur` (élément sticky uniquement, conforme aux garde-fous performance), bordure `border-subtle`. Logo à gauche, « Première leçon » + bouton pilule « Se connecter » à droite.
- Hero split conservé : eyebrow pilule à pastille dorée, H1 `text-display`, CTA pilules avec flèche bouton-dans-bouton, sceau doré de réassurance. À droite : mascotte + aperçu produit en double-bezel (coquille externe `rounded-[2rem]` + cœur concentrique) avec halo doré.
- Rail de progression doré de l'onboarding réutilisé comme frise à 5 segments sous le hero : « Voir · Comprendre · Se rappeler · Produire · Recevoir un retour ».
- Sections existantes restylées : eyebrows `Caption` majuscules tracking `[0.16em]` doré, cartes `rounded-4xl border-border-subtle bg-surface-elevated` en double-bezel, tuiles d'icônes teal (grammaire des boutons de choix de l'onboarding), hover `-translate-y-px` + bordure `hikma-teal-500/48`.
- CTA final : grande carte `surface-featured` avec halo radial doré et étincelles dorées (écho de la carte hero de l'onboarding et de la célébration).
- Footer épuré conservé.

## Motion

- `Reveal` (IntersectionObserver) : apparition en cascade `translate-y-6 opacity-0 blur-[2px]` → visible sur ~800ms avec `--ease-hikma`, décalages en escalier (100–200ms). Pas de `scroll` listener.
- Boutons magnétiques : `active:scale-[0.98]`, cercle-flèche qui se translate en hover.
- Uniquement `transform`/`opacity` ; `backdrop-blur` réservé à la nav sticky ; repli statique sous `prefers-reduced-motion` (déjà global dans `globals.css`).
- Aucune nouvelle dépendance : IntersectionObserver natif + transitions CSS.

## Structure des composants

- `components/app/landing.tsx` — coquille, nav pilule, hero, rail, CTA final, footer.
- `components/app/landing-product-story.tsx` — sections produit restylées en langage onboarding.
- `components/app/landing-product-preview.tsx` — aperçu en double-bezel.
- `components/app/landing-reveal.tsx` — nouveau petit composant client (IntersectionObserver) pour les apparitions.
- `app/globals.css` — ajustements ciblés utilitaires landing uniquement (pas de modification des tokens existants).

## Garde-fous

- 100 % tokens Hikma existants : aucune nouvelle couleur ni police.
- Composants serveur conservés ; seul `Reveal` devient client.
- Contenu marketing inchangé ; l'onboarding reste strictement dans son parcours (`/onboarding`).
- Aucune écriture DB, aucune migration, aucun seed.
- Tests : Vitest existants, TypeScript, ESLint doivent rester verts.
- Responsive : repli propre sous `768px` (pilule → logo + bouton, sections en colonne, `w-full px-4`), `min-h-[100dvh]` jamais `h-screen`.

## Validation

- Typecheck (`tsc --noEmit`), ESLint (0 erreur / 0 warning), Vitest (954/954).
- Vérification visuelle navigateur à 390×844, 768×1024 et 1280×720 : overflow, CTA, réduction de mouvement, absence d'erreur console/hydratation.

Ce document est ajouté sans commit afin de préserver l'état de travail existant du dépôt.
