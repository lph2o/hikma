# PHASE 7 — HIKMA LANDING PAGE PREMIUM REDESIGN AUDIT

**Statut : `PHASE_7_LANDING_AUDIT_COMPLETE_READY_FOR_APPROVAL`**  
**Mode : `AUDIT_FIRST / READ_ONLY`**  
**Source modified : 0 · Backend modified : 0 · Database modified : 0 · Design system modified : 0**

## Executive summary

La landing actuelle est propre, lisible et techniquement saine, mais elle ne vend pas encore Hikma comme une expérience d'apprentissage premium. Elle dit correctement « comprendre le Coran mot par mot », puis montre surtout une mascotte, du texte et une carte de mot statique. Elle ne montre presque pas le produit réel : chemin, rappel actif, feedback, audio, progression ou personnalisation.

Le défaut n'est donc pas principalement la palette ou la qualité des composants. C'est un défaut de narration et de preuve produit. À 1280/1440px, la page est enfermée dans une colonne de 720px et laisse un grand espace inutilisé; à mobile, elle est lisible et le CTA est visible, mais le hero devient très haut et monopolise le premier écran.

**First Impression : 5.5/10.**  
**Score visuel global : 5.2/10.**  
**Score UX Hikma global : 3.3/5.**

## Audit visuel réel

Viewport inspectés dans le navigateur : `1440×900`, `1280×720`, `390×844`, `375×812`.

Constats mesurés :

- `/` sert la landing anonyme; un utilisateur connecté est redirigé vers `/dashboard`.
- À `1440×900`, le contenu principal fait 720px de large; le hero commence à `y=148` et mesure environ 474px.
- À `390×844`, le document fait environ 2410px; le CTA principal est visible à `y≈721`, sans overflow horizontal.
- À `375×812`, le CTA principal reste visible et le document ne déborde pas horizontalement.
- L'ancre « Découvrir comment ça marche » fonctionne et défile vers `#comment-ca-marche`.
- La console navigateur était propre sur les viewport audités.

### Première impression — trois secondes

Le visiteur comprend : Hikma aide à comprendre le Coran mot par mot, la première action est de commencer une leçon, et la page est calme et chaleureuse.

Il ne comprend pas assez vite comment se déroule réellement une leçon, ce qui rend Hikma différent d'une bibliothèque ou d'un simple quiz, comment le feedback/audio/rappel/progression travaillent ensemble, ni pourquoi il devrait faire confiance au produit.

## Positionnement

Le positionnement actuel est juste mais trop générique : « vocabulaire coranique · mot à mot ». Il décrit une catégorie, pas une expérience. La landing doit faire comprendre :

> Hikma accompagne progressivement le passage du mot arabe au sens, du sens au rappel, puis du rappel à une compréhension plus solide du verset.

Cette formulation respecte la pédagogie existante sans transformer Hikma en produit gamifié ou en SaaS générique.

## Audit du Hero

### Ce qui fonctionne

- Headline courte et immédiatement compréhensible.
- CTA primaire dominant et visible au-dessus de la ligne de flottaison sur mobile et desktop.
- Ton calme, non agressif, cohérent avec Hikma.
- Poppins lisible et arabe rendu avec `ArabicText`.

### Ce qui affaiblit le Hero

- Composition strictement centrée, sans tension visuelle ni preuve produit.
- La mascotte occupe le rôle principal alors que le produit devrait être le héros.
- Le message « à ton rythme » est rassurant mais peu différenciant.
- Le CTA « Commencer avec Al-Fatiha » pointe vers `/learn/basmala` : incohérence P0.
- Le second CTA est une ancre de page, pas une preuve immédiate.
- À large écran, l'espace libre ressemble à une absence de composition plutôt qu'à du luxe éditorial.

## Direction artistique recommandée

### A — The Quranic Editorial Studio — recommandée

Composition éditoriale islamique contemporaine : ivoire, encre chaude, terracotta Hikma, cartes produit bien composées, arabe comme contenu central et une seule mascotte comme signe humain. Hero asymétrique desktop, empilé avec intention mobile.

### B — The Quiet Study Table

Table d'étude calme, tactile, composée de trois cartes : mot, contexte, exercice. Très cohérente avec le carnet de notes Hikma, mais moins spectaculaire en première impression large.

### C — A Living Learning Journey

Chemin visuel reliant voir → comprendre → se rappeler → feedback. Très narratif et vivant, mais à contrôler strictement pour ne pas dériver vers XP, badges ou gamification.

**Choix : A**, enrichie par la retenue de B et une petite dose du chemin narratif de C.

## Concept Hero recommandé

À `1440px`, utiliser un canvas 12 colonnes : copy sur 5 colonnes, preview produit sur 6, une colonne de respiration. Le copy contient eyebrow, H1, body court, CTA primaire et CTA secondaire discret. À droite, une Card signature montre un mot arabe, son sens, une progression, une option d'exercice et un fragment de feedback. L'arabe est fonctionnel : il matérialise le premier pas de l'apprentissage, il n'est pas un motif décoratif.

La mascotte apparaît une seule fois, petite à moyenne, à côté du preview comme marque de présence humaine. Le petit avatar du header actuel ne doit pas créer un second moment mascot. À `390px`, ordre : header → message → CTA → preview → preuve courte. Aucun split desktop comprimé.

## Architecture de sections

```text
Navigation
↓
Hero + product preview
↓
Learning loop : voir → comprendre → se rappeler → feedback
↓
Learning path / prochaine étape
↓
Arabic + contexte coranique
↓
Trust : méthode, rythme, confidentialité
↓
CTA final
↓
Footer sémantique
```

Chaque section a une fonction de preuve. Aucune statistique, certification, témoignage ou promesse de gratuité ne doit être inventée : `DATA_UNAVAILABLE` tant qu'une source produit réelle n'existe pas.

## Copywriting

### Points faibles

- « Vocabulaire coranique · mot à mot » est descriptif mais category-like.
- « à ton rythme » est exact mais générique.
- « Prêt à commencer ? » est interchangeable.
- « Commencer avec Al-Fatiha » vers `/learn/basmala` est incohérent.

### Proposition de ton

```text
Eyebrow : Apprendre le Coran, avec clarté et patience
Headline : Chaque mot compris ouvre un peu plus le verset.
Body : Hikma t’accompagne du mot arabe à son sens, puis du sens au rappel — avec des leçons courtes, des exercices qui respectent ton effort et un feedback qui t’explique vraiment.
CTA : Commencer la première leçon
Secondaire : Voir l’expérience
```

## Design system et composants

À réutiliser : `Button`, `Card`, `CardContent`, `ArabicText`, `Mascot`, `HikmaProgress`, `HikmaReveal`, primitives typographiques et `AudioPlayer` si le preview le justifie.

À préserver : `--background`, `--surface-featured`, `--primary-fur`, `--primary-strong`, `--text-primary`, `--text-secondary`, `--border-subtle`, `--shadow-card`, `--shadow-elevated`, Poppins et Amiri.

À refuser : nouvelle palette arbitraire, gradient SaaS, verset en fond, arabe décoratif sans fonction, seconde mascotte dans la même vue, claims non vérifiables, animation permanente ou gamification.

## Matrice de score

| Domaine | Score /10 | Problème dominant | Impact | Priorité |
|---|---:|---|---|---|
| Hero | 5 | pas de preuve produit | première impression générique | P0 |
| Copy | 5 | promesse exacte mais peu distinctive | mémorisation faible | P1 |
| Visual identity | 6 | warm Hikma présente, composition générique | premium sous-exprimé | P1 |
| Typography | 7 | lisible et expressive | hero très haut mobile | P2 |
| Arabic | 6 | correct mais statique | identité sous-exploitée | P2 |
| CTA | 7 | visible et clair | route/label incohérents | P0 |
| Product showcase | 2 | presque absent | confiance faible | P0 |
| Storytelling | 3 | empilement de blocs | scroll peu narratif | P1 |
| Trust | 2 | aucune preuve publique structurée | hésitation non traitée | P1 |
| Responsive | 7 | utilisable et sans overflow | desktop trop étroit | P1 |
| Accessibility | 7 | landmarks et targets solides | footer/alt/LCP à affiner | P2 |
| Motion | 2 | aucune signature | manque de finition | P3 |
| Performance | 7 | server-first, peu d'assets | hero lazy/LCP à mesurer | P2 |

## Problèmes P0 → P3

### P0

- `P0-1` — Hero/product — la landing ne montre pas l'expérience réelle — le visiteur ne peut pas imaginer la leçon — ajouter un preview produit dans le premier écran.
- `P0-2` — CTA — « Al-Fatiha » pointe vers Basmala — rupture d'attente — aligner le label et la route.

### P1

- `P1-1` — Product showcase — aucune preuve de feedback, path, audio ou personnalisation — perception de produit générique — composer un learning loop réel.
- `P1-2` — Storytelling — sections juxtaposées — faible envie de scroller — séquencer promesse → preuve → méthode → confiance → action.
- `P1-3` — Trust — pas de méthode/confidentialité/footer — hésitation — ajouter seulement des principes vérifiables.
- `P1-4` — Desktop — colonne 720px — canvas sous-utilisé — passer à une composition asymétrique.

### P2

- `P2-1` — Brand — deux mascottes welcome — rôle de marque dilué — garder une seule présence signifiante.
- `P2-2` — Arabic — carte de mot statique — arabe perçu comme exemple décoratif — relier forme, sens et contexte.
- `P2-3` — Copy — titres génériques — faible mémorisation — adopter une copy outcome-led.

### P3

- `P3-1` — Motion — absence de micro-signature — page moins premium — ajouter des reveals transform/opacity après validation de structure.
- `P3-2` — Footer — absence de footer public — impression inachevée — ajouter des liens réels uniquement.

## Performance, accessibilité et responsive

La landing est un Server Component et ne charge pas de vidéo, canvas ou animation lourde. La base est saine. Le point à mesurer pendant l'implémentation sera le LCP du hero : `Mascot` utilise `loading="lazy"` via `next/image` même au-dessus de la ligne de flottaison. Toute nouvelle composition doit rester majoritairement composée de primitives UI, éviter le CLS et respecter reduced motion.

À mobile, le CTA principal est visible, les targets sont >=44px et aucun overflow horizontal n'a été observé. À desktop, la lisibilité est bonne mais la composition n'utilise pas le canvas disponible.

## Architecture de skill future

L'architecture proposée pour `docs/ui-ux-skills/hikma-landing-page/` est fournie dans `tmp/phase7-landing/skill-architecture.json`. Elle doit devenir une source de vérité pour hero, storytelling, ArabicText, product showcase, responsive, motion, accessibilité, performance, copywriting et anti-patterns. Elle n'a pas été créée dans cette phase read-only.

## Livrables

Les JSON demandés sont dans `tmp/phase7-landing/` et ont été validés avec `jq empty` : route-audit, visual-audit, responsive-audit, accessibility-audit, performance-audit, copy-audit, design-system-audit, direction-a/b/c, recommended-direction, hero-spec, section-architecture, skill-architecture et priority-matrix.

## Conclusion

La Landing Page que Hikma doit construire n'est pas une landing SaaS plus brillante. C'est une page éditoriale chaleureuse qui montre immédiatement le passage du mot arabe au sens, du sens au rappel et du rappel au feedback. Le visiteur doit voir le produit apprendre avec lui, pas seulement lire qu'il existe.

**Statut : `PHASE_7_LANDING_AUDIT_COMPLETE_READY_FOR_APPROVAL`**

