# Hikma — Phase UI/UX 1 — Design System Foundation

**Statut : `UI_UX_DESIGN_SYSTEM_COMPLETE_READY_FOR_APPROVAL`**  
**Date : 2026-08-16**  
**Périmètre : fondation UI/UX uniquement**

## Résumé

La fondation Hikma est implémentée sans modifier les pages métier, le backend, les données Quran, le grading, le SRS, le mastery, le curriculum, l’audio ou la phonétique.

La source de vérité reste `PHASE_UI_UX_GLOBAL_AUDIT.md`. La fondation applique sa direction : premium calme, warm, éditoriale, lisible, sans gradients gratuits, glassmorphism, ombres lourdes ni gamification.

## État avant

- Tokens Hikma déjà présents mais encore mélangés avec les neutres froids V1.
- Typographie Body/Caption/Display sous la cible V2.
- Primitives existantes nombreuses mais parfois visuellement génériques.
- `ArabicText` correct sur le RTL, mais sans échelle sémantique centralisée.
- Page `/design-system` limitée à palette, typographie et mascotte.
- Langue racine HTML définie à `en` malgré une interface française.

## Décisions et tokens

### Couleurs

Les neutres sont passés à la palette warm V2 :

- `--text-primary: #2E2A1C`
- `--text-secondary: #6B6354`
- `--surface: #F4EFE4`
- `--surface-elevated: #FFFFFF`
- `--surface-subtle: #FBF8F1`
- `--surface-interactive: #FFF1DF`
- `--surface-featured: #FFF7ED`
- `--border: #E8E0D2`
- `--border-subtle: #EFE8DC`
- `--focus: #C9501E`

Les couleurs sémantiques existantes sont conservées avec leurs variantes AA : `success-text`, `error-text`, `warning-text`, `info-text`, `primary-strong`.

### Typographie

- Display : 56px / 1.1.
- H1 : 32px / 1.2.
- H2 : 24px / 1.3.
- H3 : 20px / 1.3.
- H4 : 16px / 1.4.
- Body large : 17px / 1.6.
- Body : 15px / 1.6.
- Body small : 13px / 1.6.
- Caption : 12px / 1.4.
- Label : 12px / 1.3.

Poppins reste la police française/interface ; Amiri reste la police arabe.

### Surfaces, formes et motion

- Ombres `shadow-card`, `shadow-elevated` et `shadow-focus` chaudes, sans ombre noire dure.
- Cartes standard : border hairline, radius 2xl, surface élevée.
- Bouton primaire : pill, cible minimum 44px.
- Transitions limitées aux propriétés de couleur, ombre, transform et opacity.
- Easing via `--ease-hikma` et `--ease-soft-out`.
- `prefers-reduced-motion` déjà conservé.

## Composants modifiés

- `app/globals.css` : tokens warm V2, surfaces sémantiques, focus, typographie, ombres.
- `components/ui/typography.tsx` : Display/H1/H2/H3 alignés sur Poppins et la hiérarchie V2.
- `components/ui/button.tsx` : cibles tactiles, CTA primaire pill, focus sémantique et transitions contrôlées.
- `components/ui/card.tsx` : surface élevée et ombre Hikma, suppression des ombres noires génériques.
- `components/ui/arabic-text.tsx` : échelles `inline`, `small`, `word`, `verse`, `hero`, RTL local, line-height 1.9, aucun tracking/transformation.
- `app/layout.tsx` : langue racine `fr`.

## Composants Hikma créés

Dans `components/ui/hikma.tsx` :

- `HikmaWord` : arabe → translittération → sens → validation → audio optionnel.
- `HikmaProgress` : progression pédagogique avec libellé humain et détail.
- `HikmaFeedback` : états `correct`, `incorrect`, `ambiguous`, exprimés par texte, icône et couleur.
- `HikmaReveal` : aide volontairement masquée jusqu’à la demande.
- `HikmaLessonSection` : structure éditoriale de section.
- `HikmaExerciseShell` : compétence humaine, progression, contenu et footer séparés.

Ces primitives ne sont pas encore injectées dans les pages métier ; leur utilisation sera décidée dans les phases correspondantes pour éviter une refonte prématurée.

## Laboratoire visuel

`app/design-system/page.tsx` a été remplacée par un laboratoire interne couvrant :

- couleurs sémantiques et surfaces ;
- échelle typographique ;
- arabe vocalisé, RTL et badges de conformité ;
- mot Hikma ;
- boutons ;
- progress générique et pédagogique ;
- feedback correct/ambigu ;
- révélation progressive ;
- audio ;
- mascotte, signature et principes de motion.

La page reste une route interne de contrôle et ne modifie aucun parcours utilisateur.

## Architecture des skills

La formalisation est documentée dans `docs/ui-ux-skills/README.md` avec six responsabilités :

1. `hikma-design-system`
2. `hikma-component-design`
3. `hikma-arabic-typography`
4. `hikma-responsive-design`
5. `hikma-accessibility`
6. `hikma-motion-design`
7. `hikma-page-redesign`

Chaque fiche précise objectif, usage, inputs, workflow, règles, anti-patterns, validation et output attendu.

## Responsive

- Les primitives utilisent une cible tactile de 44px minimum.
- Les échelles arabes passent de 18px minimum pour `small` à des tailles adaptées aux mots/versets.
- Les composants conservent des variantes `sm` sans imposer une réduction desktop uniforme.
- Le laboratoire doit être vérifié à 375px, 768px et desktop lors des phases de page.

## Accessibilité

- `lang="fr"` est désormais correct à la racine.
- Le focus est rendu visible via le token `focus`.
- Les états de feedback utilisent simultanément icône, texte et couleur.
- Les cibles de boutons sont alignées sur 44px minimum.
- `ArabicText` conserve `dir="rtl"`, `lang="ar"`, la sélection native et les diacritiques.
- La réduction de mouvement globale est conservée.

## Validation

| Vérification | Résultat |
|---|---|
| `npm test` | **397/397 tests passés** |
| `npx tsc --noEmit` | **Réussi** |
| `npm run lint` | **Réussi** |
| `npm run build` | **Réussi** |
| Routes métier modifiées | **Non** |
| Backend / Supabase / migrations modifiés | **Non** |
| Données Quran / grading / SRS / mastery modifiés | **Non** |

Le build Next.js 16.3.0 a compilé et généré les routes existantes, avec `/design-system` statique et les routes métier inchangées.

## Risques connus

- Certains composants existants utilisent encore des classes historiques (`text-sm`, `rounded-lg`, couleurs sémantiques directes). Leur migration est volontairement reportée aux phases de page afin de ne pas élargir cette fondation.
- `HikmaProgress` utilise une transformation horizontale pour l’indicateur, avec origine LTR ; une adaptation RTL dédiée sera vérifiée lorsqu’il sera intégré à un écran arabe.
- La source audio de démonstration du laboratoire est volontairement une route placeholder ; aucune donnée audio réelle n’est introduite.
- Une vérification visuelle navigateur à 375px/768px reste à effectuer avant de considérer la foundation comme définitivement gelée.

## Reporté à la prochaine phase

- refonte du shell et de `AppNav` ;
- dashboard ;
- `/learn`, leçon, découverte, exercices et fin de leçon ;
- `/review`, profil, onboarding et fiches mots ;
- migration systématique des pages vers les nouvelles primitives ;
- audit navigateur mobile et capture visuelle de référence.

La Phase 2 n’est pas commencée automatiquement.

**Statut final : `UI_UX_DESIGN_SYSTEM_COMPLETE_READY_FOR_APPROVAL`**
