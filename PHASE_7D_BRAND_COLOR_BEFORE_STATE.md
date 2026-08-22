# PHASE 7D — HIKMA BRAND IDENTITY & DESIGN SYSTEM COLOR SYSTEM

## Statut

`READ_ONLY_AUDIT_COMPLETE_READY_FOR_APPROVAL`

Aucune modification applicative n’a été effectuée pendant cet audit.

## 1. Logo réel inspecté

Source : [logo_hikma.png](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/public/logo/logo_hikma.png)

- Format : PNG RGBA transparent.
- Résolution : `1254×1254`.
- Zone alpha utile : environ `826×1005` dans le carré source, avec une marge transparente importante.
- Contenu : emblème arabe `حكمة`, arche teal profonde, livre ouvert, détails et filets or, wordmark `Hikma`, tagline française `COMPRENDRE LE CORAN · MOT PAR MOT`.
- Le fichier contient déjà le wordmark complet : il ne faut pas le redessiner en HTML ni le recréer en CSS.
- Le logo n’est actuellement intégré ni dans la landing, ni dans `AppNav`, ni dans l’authentification.

L’analyse de pixels montre une identité dominée par :

- teal très profond : familles observées autour de `#002828`, `#083838`, `#003030` ;
- charbon bleu-vert : familles autour de `#102020`, `#182028` ;
- or chaud : familles autour de `#B89050`, `#C8A058`, avec des highlights proches de `#F0D090` ;
- ivoire chaud : familles autour de `#F8F8F0`, `#F8F0E0`, `#F8E8D0`.

Ces couleurs sont des ancres représentatives d’un logo avec gradients, antialiasing et halo ; elles ne doivent pas être copiées aveuglément comme une palette de composants.

## 2. État actuel du Design System

Le système est déjà centralisé dans [app/globals.css](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/app/globals.css), avec des tokens sémantiques et des variantes light/dark. C’est une bonne base de migration.

État light actuel :

- primaire : orange `#FF7732` ;
- accent secondaire : pêche `#FFE2B8` ;
- fond : ivoire léger `#FFFFFB` ;
- surfaces : crème `#F4EFE4`, blanc et pêche très clair ;
- texte : charbon brun `#2E2A1C` et gris chaud `#6B6354`.

État dark actuel :

- fond brun `#1C1A15` ;
- surfaces brun chaud ;
- primaire encore orange ;
- accents clairs orange/pêche.

Le système actuel est cohérent avec les phases précédentes mais ne reflète pas encore le logo teal/or. La migration doit donc adapter les tokens centraux, pas ajouter des couleurs hardcodées dans chaque composant.

## 3. Hardcodes et gaps identifiés

- Environ 73 occurrences de couleurs hexadécimales dans les fichiers de projet audités.
- 57 occurrences se trouvent dans `app/globals.css`, ce qui confirme que la majorité est centralisée.
- La palette d’aperçu de [app/design-system/page.tsx](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/app/design-system/page.tsx) répète des valeurs hexadécimales pour les swatches ; elle devra devenir une représentation explicite des tokens finaux.
- [hikma-loader-wordmark.svg](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/public/icones/hikma-loader-wordmark.svg) contient encore du orange/charbon en dur. Il s’agit d’un asset distinct à auditer, sans le modifier automatiquement.
- Aucun `bg-[#...]`, `text-[#...]` ou `style={{ color: ... }}` applicatif critique n’a été identifié hors usages internes génériques de primitives.

## 4. Palette proposée issue du logo

| Rôle | Token proposé | Valeur | Usage |
|---|---|---|---|
| Teal très profond | `--hikma-teal-950` | `#001820` | fond dark et profondeur |
| Teal identitaire | `--hikma-teal-900` | `#002828` | CTA forts, surfaces profondes |
| Teal principal | `--hikma-teal-800` | `#083838` | primaire UI et navigation |
| Teal texte | `--hikma-teal-700` | `#0B5552` | texte teal AA sur ivoire |
| Teal secondaire | `--hikma-teal-600` | `#16706A` | hover, états actifs, détails |
| Teal clair | `--hikma-teal-100` | `#DDEDEA` | surface douce et sélection |
| Or chaud | `--hikma-gold` | `#C8A058` | accent premium rare |
| Or atténué | `--hikma-gold-muted` | `#B89050` | bordures, détails et dark mode |
| Highlight or | `--hikma-gold-bright` | `#F0D090` | petite lumière, jamais texte principal par défaut |
| Ivoire | `--hikma-ivory` | `#F8F8F0` | background éditorial |
| Crème | `--hikma-cream` | `#F8F0E0` | surfaces de lecture et cartes |
| Charbon | `--hikma-charcoal` | `#182028` | titres et texte principal |
| Charbon profond | `--hikma-charcoal-deep` | `#102020` | fond sombre et contraste |

Ratios calculés sur les candidats :

- blanc sur teal-900 : `15,74:1` ;
- ivoire sur teal-900 : `14,75:1` ;
- blanc sur teal-800 : `12,86:1` ;
- charbon sur or chaud : `6,76:1` ;
- charbon sur ivoire : `15,42:1` ;
- ivoire sur charbon : `15,42:1` ;
- teal-700 sur ivoire : `8,08:1` ;
- or atténué sur charbon : `5,60:1`.

Le teal clair et l’or brillant ne doivent pas être utilisés comme texte principal sans variante AA dédiée. Les états `success`, `error`, `warning` et `info` restent sémantiques et ne seront pas remplacés par l’or.

## 5. Tokens à modifier après approbation

La stratégie proposée est additive et sémantique :

1. Ajouter les tokens de marque `hikma-teal-*`, `hikma-gold-*`, `hikma-ivory`, `hikma-cream`, `hikma-charcoal` dans `globals.css`.
2. Remapper `--primary`, `--primary-foreground`, `--ring`, `--focus`, `--background`, `--surface*`, `--foreground` et les tokens sidebar vers ces variables.
3. Créer les variantes de texte `--primary-strong`, `--gold-text` et éventuellement `--info-text` recalculées si nécessaire.
4. Préserver les familles `success-*`, `error-*`, `warning-*`, `info-*` avec des valeurs accessibles et distinctes.
5. Créer une composition dark dédiée teal/charbon/ivoire/or-muted, au lieu d’inverser le light mode.
6. Remplacer les hexadécimaux de la palette de démonstration du Design System Lab par les valeurs réellement exposées par les tokens.
7. Auditer séparément le loader SVG avant toute décision sur son recoloring.

## 6. Composants concernés par ordre de priorité

### Priorité 1 — identité visible

- `components/app/landing.tsx` : header, hero, CTA et footer ;
- `components/app/app-nav.tsx` : logo desktop/mobile et états actifs ;
- `components/app/app-header.tsx` : header applicatif ;
- `app/(auth)/login/page.tsx` : logo réel au-dessus du formulaire ;
- `app/layout.tsx` : metadata icon seulement si un asset approprié existe.

### Priorité 2 — primitives et surfaces

- `Button`, `Card`, `Badge`, `Progress`, `HikmaProgress` ;
- `HikmaExerciseShell` et options sélectionnées ;
- `ExerciseFeedback` et `HikmaExplanation` ;
- `HikmaLessonFocusHeader`, `HikmaContextDisclosure`, `AudioPlayer`.

### Priorité 3 — contenu arabe et états

- cartes mot et découverte ;
- contexte coranique ;
- audio et prononciation ;
- completion, empty states et navigation secondaire.

## 7. Intégration logo proposée

Le même PNG peut être utilisé comme wordmark complet dans les zones suffisamment larges : landing header, auth et sidebar desktop. Pour le mobile, le cadrage doit être vérifié avant de choisir entre le fichier complet et une simple réduction ; aucun symbole autonome distinct n’existe actuellement dans `public/logo/`.

Le logo doit conserver ses proportions et son espace transparent. Il ne doit pas être recoloré, étiré, recadré arbitrairement, décoré d’ombre ou posé sur une surface qui réduit le contraste de son wordmark charbon.

Les assets disponibles comprennent le logo PNG, plusieurs mascottes et un loader wordmark SVG. Aucun favicon, app icon ou `metadata.icons` n’a été identifié.

## 8. Stratégie de migration proposée

### Approche recommandée — migration tokens-first, puis composants critiques

1. Ajouter et valider les tokens de marque dans light/dark.
2. Migrer les primitives sémantiques (`Button`, `Card`, feedback, progress, navigation).
3. Intégrer le logo réel dans landing, navigation et auth.
4. Mettre à jour le Design System Lab avec palette, logo, états, arabe et contrastes.
5. Auditer les composants pédagogiques sans modifier leur logique métier.
6. Tester les textes arabes `ٱلرَّحْمَـٰنِ` et `إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ` en light/dark et responsive.
7. Exécuter tests, TypeScript, lint, build et navigateur réel.

Cette approche limite la régression car les composants utilisent déjà majoritairement les tokens sémantiques. Elle laisse les couleurs de feedback reconnaissables et réserve l’or aux détails premium.

## 9. Périmètre strict préservé

Pendant cet audit :

```text
SOURCE_FILES_MODIFIED: 0
GRADING_MODIFIED: 0
SCORING_MODIFIED: 0
SRS_MODIFIED: 0
MASTERY_MODIFIED: 0
SCHEDULER_MODIFIED: 0
INTERLEAVING_MODIFIED: 0
CURRICULUM_MODIFIED: 0
GENERATORS_MODIFIED: 0
ANSWER_RESULT_MODIFIED: 0
PERSISTENCE_MODIFIED: 0
SUPABASE_MODIFIED: 0
MIGRATIONS_MODIFIED: 0
QURAN_DATA_MODIFIED: 0
AUDIO_BACKEND_MODIFIED: 0
```

Les seuls fichiers créés sont les artifacts d’audit `tmp/phase7d-brand/` et ce rapport d’état initial.

## 10. Décision attendue

La palette et la stratégie proposées sont prêtes à être approuvées. Après approbation seulement, l’implémentation pourra commencer avec le statut :

`UI_UX_7D_HIKMA_BRAND_IDENTITY_IMPLEMENTATION_IN_PROGRESS`

La Phase 7D ne doit pas être implémentée avant validation de cette palette et de cette stratégie.
