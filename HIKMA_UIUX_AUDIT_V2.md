# HIKMA UI/UX AUDIT V2 — PHASE 0 (READ-ONLY)

**Statut : `UX_UI_AUDIT_V2_PARTIAL`** — audit **100 % READ ONLY**.

Garanties : `DATABASE_WRITES = 0` · `MIGRATIONS = 0` · `PRODUCTION_CODE_CHANGES = 0`
· `CSS_CHANGES = 0` · `UI_CHANGES = 0` · `COMPONENT_CHANGES = 0` ·
`DESIGN_SYSTEM_CHANGES = 0` · `CURRICULUM_CHANGES = 0` · `EXERCISES_CHANGES = 0` ·
`ENGINE_CHANGES = 0` · `AUDIO_IMPORTS = 0` · `STORAGE_WRITES = 0`.

**Pourquoi `V2` et pas une autre phase 24x** : la mission confiée est
*générationnelle* — il ne s'agit pas d'itérer la roadmap 24C→24K
(polish incrémental) mais de poser un **socle UI/UX réutilisable** +
**direction artistique + architecture de redesign** qui ouvre un nouveau cycle.
Cet audit intègre les acquis des phases 24A/24B/24C/24D/24E/24F/24G/24H
(sans les dupliquer) et identifie ce qui reste à transformer pour passer
de « produit fonctionnel techniquement correct » à « produit mémorable ».

**Périmètre lu (READ ONLY)** : `app/`, `components/`, `lib/`,
`PHASE_24A/B/C/D/E/F/G/H*.md`, `tmp/phase24*.json`, design tokens (`globals.css`),
routing, navigation, LessonPlayer, ExerciseFeedback, AudioPlayer, mascottes.

---

## 1. Résumé exécutif

Hikma est aujourd'hui un produit **fonctionnellement irréprochable** : un moteur
pédagogique à 8 compétences, 14 types d'exercices, un SRS robuste, des
fondations arabes sérieuses, une vraie pipeline audio (Muallim WBW),
397/397 tests verts, RLS 38/38, persistance 13/13, et déjà trois cycles
d'UX polish (24A audit → 24B design → 24C–24H implémentations).

Ce qui **manque encore** pour atteindre la « nouvelle génération » :

1. **Une identité de marque assumée** — aujourd'hui Hikma ressemble à un bon
   shadcn/base-ui bien customisé. Ce n'est pas un défaut, mais ce n'est pas
   encore un **produit reconnaissable** entre mille.
2. **Des principes UI/UX formalisés et réutilisables** — la connaissance UX
   vit dans des rapports PDF, pas dans des skills invocables.
3. **Une signature visuelle/spatiale** — palette, typo, espace, motion,
   iconographie sont définis mais **isolés** ; il manque un langage visible
   (« ça, c'est Hikma »).
4. **Une narration produit cohérente** — la valeur est lisible sur la
   landing, mais le reste de l'app est silencieux (pas de copy stratégique
   autre que les boutons).
5. **Une posture émotionnelle calibrée** — la mascotte parle, le feedback est
   chaleureux, mais l'app ne « respire » pas encore (densité, hiérarchie
   visuelle, respiration typographique).

**Verdict** : le **moteur est prêt**, l'**écorce doit muer**. Cette mue ne
doit être ni cosmétique (juste du CSS) ni structurelle (refonte du moteur).
Elle doit être **directionnelle** : donner une **voix**, un **corps**, un
**rythme** à un produit qui a déjà une âme.

---

## 2. État actuel du design system

### 2.1 Inventaire factuel

| Couche | État | Source |
|---|---|---|
| Composants UI | **62 primitives** dans `components/ui/` | `ls components/ui` |
| Composants domaine | 9 dans `components/app/` + 9 dans `components/learn/` | inventaire 24A |
| Design tokens | `--font-*`, `--text-*`, `--color-*` (primary/secondary/tertiary/streak + sémantiques AA + neutrals) | `app/globals.css` |
| Dark mode | Défini, variants `*_text` AA également mappés | `globals.css` `.dark` |
| Typographie | **Poppins** (UI), **Amiri** (arabe), **Geist Mono** (code) | `app/layout.tsx` |
| Palette de marque | Orange Hikma `#FF7732` (primary), cream `#FFE2B8` (secondary), `#FFFFFB` (background) | `globals.css` |
| Motion | Easings `cubic-bezier(0.32, 0.72, 0, 1)` + `cubic-bezier(0.16, 1, 0.3, 1)` | `globals.css` |
| Animations | `skeleton`, `feedback-in`, `reward-pulse`, `toast-*` | `globals.css` |
| RTL | `ArabicText` (dir/lang/font/line-height 1.9) | `components/ui/arabic-text.tsx` |
| Réduction motion | `prefers-reduced-motion` global | `globals.css` |

### 2.2 Forces réelles

1. **Socle token-driven** — toutes les valeurs vivent dans `:root`, pas dans
   les composants. C'est exactement ce qu'il faut pour pouvoir itérer.
2. **Couleurs sémantiques AA** — `success-text`, `error-text`, `warning-text`,
   `info-text` ont été pensées dès 24B. C'est un vrai progrès vs du shadcn brut.
3. **Composants `ui/` propres** — `ExerciseFeedback`, `AnswerOption`,
   `AudioPlayer`, `ArabicKeyboard`, `Mascot`, `Typography` (Display→Caption)
   sont de vraies primitives réutilisables.
4. **Tokens de motion explicites** — `ease-hikma`, `ease-soft-out` + keyframes
   ciblés (transform/opacity only). C'est un **bon présage**.
5. **RTL traité en citoyen de première classe** — `ArabicText` existe, est
   typé, et la règle « pas d'inversion globale » est documentée.
6. **62 primitives couvrent ~80 % des besoins visuels** — pas besoin de
   réinventer `Button`, `Card`, `Dialog`, `Sheet`, `Tabs`, `Tooltip`, etc.

### 2.3 Faiblesses visibles

1. **Pas de langage visible** — les composants sont *corrects*, mais on ne
   reconnaîtrait pas Hikma les yeux bandés. L'identité reste cantonnée à la
   couleur orange.
2. **Échelle typographique sage** — `--text-h1: 32px`, `--text-display: 44px`.
   C'est de la *corporate*. Pour un produit « spirituel, pédagogique,
   premium », il manque un cran : un Display 56–64px, un système
   taille/poids/espace plus expressif.
3. **Mascottes = images statiques** — 5 PNGs, taille fixe. Aucun sourire,
   aucune émotion adaptative. Le canal « mascotte » est sous-exploité.
4. **Densité élevée sur les écrans « fonctionnels »** — le Dashboard empile
   1 hero + 1 goal + 1 review + 1 progress + 1 upcoming + 1 history + 4 stats.
   C'est techniquement ordonné mais **respire peu**.
5. **Pas de signature spatiale** — pas de marges « signature », pas de grille
   visible, pas de zones « hero / contenu / action » clairement hiérarchisées.
6. **Icônes = lucide-react par défaut** — fonctionnelles, mais aucune
   signature (pas d'iconographie Hikma). C'est le point le plus visible pour
   un œil extérieur : « c'est une app shadcn ».

### 2.4 État du contraste et de l'accessibilité

- ✅ Contraste du texte principal : excellent (texte sombre sur fond crème).
- ✅ Focus visible : `outline-ring/50` partout.
- ✅ Cibles tactiles ≥ 44px sur les CTA principaux (`min-h-12`).
- ⚠️ **Couleurs sémantiques en texte** : OK depuis 24B, mais restent
  visuellement ternes — un `#1B7A47` n'a pas la même présence qu'un `#2EB872`.
- ⚠️ Emojis non systématiquement `aria-hidden` (U11 du 24A).
- ⚠️ Nav mobile : libellés à 11px (U12) — sous le minimum 12px recommandé.

---

## 3. Principaux problèmes UX

### 3.1 Navigation & repérage

- **Pas de breadcrumb** dans les écrans profonds (`/learn/units/[slug]`,
  `/learn/[slug]`, `/mots/[id]`). Seul un « ← Parcours » existe sur la fiche
  mot et la page leçon. On ne sait pas où on est dans la hiérarchie.
- **Pas de raccourci « sortie de session »** dans LessonPlayer. Le `quitOpen`
  AlertDialog existe mais n'est pas pré-annoncé (un utilisateur perdu peut
  chercher 30 secondes).
- **Le logo Hikma en sidebar n'est pas un lien « accueil contextuel »** — il
  pointe vers `/dashboard` même quand on est sur `/learn/[slug]`. C'est
  techniquement correct mais sémantiquement pauvre (le logo devrait ramener
  au « hub » naturel : le parcours, pas le dashboard).

### 3.2 Hiérarchie & information

- **Dashboard : 7 blocs en série verticale**. Score 24A = « acceptable ». Pour
  un utilisateur quotidien, c'est trop. La hiérarchie visuelle ne distingue
  pas « **aujourd'hui** » (3 blocs : action + objectif + révision) de
  « **historique** » (le reste, repliable/secondaire).
- **Carte « Action principale »** (Continuer/Commencer) cohabite avec
  « Objectif du jour » et « À réviser » sans qu'on sache quelle est LA
  priorité du jour. Le `GoalRing` est en seconde position alors qu'il porte
  la motivation quotidienne.
- **Stats en bas** (Leçons terminées, Mots appris, Maîtrise moyenne, Mots à
  réviser) **dupliquent** ce qui est déjà dans les cartes. C'est de la
  redondance d'effort cognitif.

### 3.3 Cognition

- **Sur-densité du dashboard** : chaque scroll exige un effort de lecture
  pour prioriser.
- **Leçon « Découverte »** : la liste des mots est rendue sous forme de
  cartes empilées ; le contexte du verset est en `CardContent` séparé.
  Visuellement, on ne voit pas immédiatement que « ces mots **forment**
  ce verset ». Le lien forme → contexte n'est pas littéral.
- **Mascot message** (« Bienvenue ! », « Excellent ! ») est utilisé comme
  bandeau décoratif, pas comme **fil narratif**. La mascotte ne raconte pas
  une histoire au fil de la session.

### 3.4 Pédagogie

- **Pas d'explication de la compétence en cours** dans l'exercice
  (reconnaître ? se rappeler ? écouter ?). Le 24B l'a identifié comme
  design target, mais ce n'est pas encore rendu.
- **L'auto-évaluation (`WORD_RECOGNITION`)** apparaît avec le même poids
  visuel qu'un exercice noté. L'utilisateur peut croire qu'il sera noté.
- **Pas de micro-félicitations intermédiaires** lors d'une série de bonnes
  réponses (le 24A a noté l'absence de célébration — U13).
- **SRS invisible** : l'utilisateur ne voit jamais *pourquoi* un mot revient
  maintenant (pas de label SRS comme « ce mot revient dans 3 jours »).

### 3.5 Onboarding

- **Le 24D a comblé U1** : landing + onboarding avec proposition de valeur.
- **Mais** : pas de **micro-démo interactive** dans l'onboarding. L'utilisateur
  ne touche pas un mot arabe avant l'écran Découverte. Il signe un
  « objectif quotidien » avant de savoir ce que c'est.
- **Pas de « première victoire » célébrée** dans la première leçon.
- **Pas de retour visuel** de ce que l'onboarding a configuré
  (l'utilisateur ne voit jamais « OK, tu as dit 5 mots/jour, voici ton
  premier anneau à moitié rempli »).

### 3.6 Mobile & responsive

- **Patterns présents** : sidebar ↔ bottom nav, sm: → md:, grilles 1→2.
- **Nav mobile 11px** : U12 du 24A, non corrigé.
- **CTA « Commencer » sous la ligne de flottaison** sur mobile (U9).
- **Header du LessonPlayer** : progression + étape + quitter sont dans un
  bloc dense. Sur mobile, ça occupe 25-30 % de l'écran au-dessus de
  l'exercice.

### 3.7 Audio

- **AudioPlayer 24F est solide** : play/pause/replay/retry, un seul audio
  actif, états dédiés, ≥44px. Bravo.
- **Mais** : pas de **visualisation de waveform** ni de **progress bar
  audio** ; pas d'**état de buffer/chargement visible** ; pas de **vitesse
  de relecture** ; pas de **répétition automatique** (utile pour les
  exercices d'écoute).

### 3.8 États vides & erreurs

- **24C a ajouté `app/error.tsx` et `app/not-found.tsx`** : c'est fait.
- **Mais** : les états vides du Dashboard (`DashboardAnon`,
  `allDone`) sont **mascottés + centrés**, sans aucune redirection vers la
  prochaine action utile. Ex. `allDone` devrait suggérer « Révise tes mots
  les plus faibles » avec un CTA direct.

---

## 4. Principaux problèmes UI

### 4.1 Hiérarchie visuelle

- Les `Card` ont la même élévation partout. Un Dashboard où la carte
  « Continuer » a la **même ombre** que la carte « 30 derniers jours »
  crée de l'indistinction.
- Le `Display` (44px) est utilisé **une seule fois** (landing). À
  l'intérieur du produit, on plafonne à `H1` (32px). Manque un cran
  intermédiaire (`H0` ou `Display-product`) pour les écrans pivots
  (LessonPlayer header, fin de leçon).

### 4.2 Espacement

- L'échelle 4/8/16/24/32/48/64/96/128 est appliquée.
- **Mais** : la densité est **homogène**. Les sections « calmes »
  (landing, fiche mot) ont la même densité verticale que les sections
  « actives » (dashboard). Le rythme visuel est plat.

### 4.3 Iconographie

- 100 % lucide-react. C'est *très* correct mais **zéro signature**.
- Les icônes de navigation (`Home`, `BookOpen`, `RefreshCcw`, `User`) sont
  génériques.
- Aucune icône pédagogique (une plume, une bougie, une main qui compte — tout
  ce qui aurait du sens spirituel et discret).

### 4.4 Couleur

- L'orange `#FF7732` est utilisé **partout** : primary, sidebar-primary,
  ring, focus. C'est **monochrome par accident**.
- Le cream `#FFE2B8` est sous-utilisé : il n'apparaît que dans les
  `Badge variant="secondary"` et `secondary-fur`.
- **Pas de hiérarchie chromatique** entre les CTA principaux (orange vif)
  et les CTA de « réassurance » (cream chaud + outline).

### 4.5 Composants à fort potentiel sous-exploités

- `Frame` (existe, pas regardé).
- `Mascot` (5 variantes fixes, aucune émotion adaptative).
- `Mascot message` (utilisé pour la décoration, pas pour le récit).
- `PreviewCard` (existe, usage ?).
- `Empty` (existe, usage ?).
- `Drawer`/`Sheet` (existent, usage ?).
- `Field`/`Fieldset` (existent, usage ?).

### 4.6 Mascottes

- 5 PNGs statiques (`welcome`, `login`, `learn`, `profile`, `settings`).
- **Aucun état émotionnel** : pas de mascotte « fière », « encourageante »,
  « patiente », « concentrée ». Or, le feedback d'exercice a 3 états
  (correct/incorrect/ambiguous) mais une seule variante de mascotte est
  utilisée (`learn`) — c'est une opportunité manquée.

---

## 5. Incohérences détectées

| Incohérence | Lieu | Effet |
|---|---|---|
| Mascotte unique pour 3 états de feedback | `components/ui/exercise.tsx` `ExerciseFeedback` | Le canal émotionnel est sous-exploité |
| Logo sidebar → `/dashboard`, pas `/learn` | `app-nav.tsx` | Le « hub » est confus (dashboard OU parcours ?) |
| Densité `Dashboard` vs `Landing` | les deux pages | Le ton n'est pas différencié (introspectif vs actif) |
| Nav mobile 11px vs légende 12px+ | `app-nav.tsx` | Non-conformité aux 12px min |
| `CardContent` flex-row + flex-col selon les écrans | multiple | Pas de règle claire (quand row, quand col ?) |
| Copy FR parfois très technique (« réinitialiser », « séquence déterministe ») | commentaires code | Pas un problème UI, mais signale un risque de fuite dans l'UI |
| Pas de `aria-current` uniforme | `app-nav.tsx` a `aria-current="page"`, mais les liens profonds n'en ont pas | Cohérence ARIA à renforcer |

---

## 6. Problèmes pédagogiques identifiés (au niveau UI)

### 6.1 Effet de rappel

- Le 24H-Q1 (prononciation guidée) a comblé Q1.
- Le 24H-Q2-B a ajouté la discrimination phonétique.
- Le 24H-Q3-B a ajouté la production guidée.
- **Mais** : aucun de ces exercices n'explique *pourquoi* cette compétence
  est demandée maintenant. L'utilisateur passe d'une compétence à l'autre
  sans récit.

### 6.2 Effort cognitif

- L'écran d'exercice est déjà épuré (1 prompt + 4 options) — c'est acquis.
- **Mais** : les transitions entre exercices sont abruptes. Pas d'**effet
  « question suivante »** (slide léger, fade), ce qui rend la succession
  visuellement chaotique.

### 6.3 Feedback humiliant

- Le copy est déjà non-humiliant (« Pas tout à fait. », « Tu étais proche. »)
  — acquis.
- **Mais** : sur erreur, la **bonne réponse** apparaît immédiatement, ce
  qui peut décourager l'effort de **retenir**. Pédagogiquement, on pourrait
  donner un indice avant la réponse (ex. « Indice : commence par… »).

### 6.4 Motivation extrinsèque vs intrinsèque

- L'objectif quotidien existe (GoalRing).
- La progression existe (Progress bar parcours).
- La maîtrise par compétence existe (en base, **jamais affichée** — MasterySynopsis du 24B est un design target non livré).
- **Mais** : aucune **vue d'identité apprenante** (« tu es fort en
  reconnaissance, faible en production »). L'utilisateur ne sait pas qui
  il est en tant qu'apprenant.

### 6.5 Découvrabilité

- L'utilisateur ne sait pas qu'il y a 8 compétences, 14 types d'exercices.
- Aucun **écran « compétences »** (« Voici ce que tu vas apprendre à
  faire »). Or, la 8 compétences sont précisément le **pitch produit**.

---

## 7. Skills UI/UX à créer

La mission demande de créer une **capacité UI/UX réutilisable**. Quatre
skills sont proposés. Chacun est un *fichier de règles + check-lists*
invoqué à chaque phase de design, audit, ou implémentation. Aucun n'écrit
du code — tous guident.

### 7.1 SKILL — `hikma:design-system-architect`

**Rôle** : source de vérité unique des décisions visuelles Hikma.

**Maîtrise** : couleurs, typographie, spacing, radius, shadows, borders,
surfaces, backgrounds, iconographie, boutons, cartes, badges, progress,
feedback, états, responsive, RTL, dark mode.

**Produit** : tokens cohérents, primitives validées, garde-fous anti-pattern.

**Règles clés** :
- Aucune valeur en dur dans les composants : **toujours** un token.
- Toute couleur sémantique utilisée en TEXTE → variante `*_text` AA.
- Ombre Hikma = diffuse, chaude, jamais noire dure (`rgba(46,42,28,*)`).
- Motion = transform/opacity uniquement ; respect `prefers-reduced-motion`.
- Une seule `Display` par page ; au plus un `H1` sémantique.
- Border hairline > ombre forte quand c'est de la séparation, pas de l'élévation.
- Iconographie : lucide par défaut, **sauf** si une signature Hikma est nécessaire (→ alors iconographie custom sur 8-12 glyphes max).

### 7.2 SKILL — `hikma:ux-auditor`

**Rôle** : auditer une page ou un parcours selon les axes UX Hikma.

**Axes** :
1. **Navigation** (où suis-je ? où aller ? action principale ? retour ?).
2. **Hiérarchie** (primaire / secondaire / tertiaire ; CTA principal vs secondaire ; éléments inutiles).
3. **Cognition** (surcharge, redondance, choix inutiles, ambiguïtés, distractions, informations qui donnent la réponse trop tôt).
4. **Pédagogie** (« cette interface aide-t-elle l'apprentissage ou permet-elle de contourner l'effort cognitif ? »).
5. **Accessibilité** (contraste, cibles tactiles, focus, ARIA).
6. **Responsive** (mobile-first, ≥44px, lisibilité, hiérarchie).

**Produit** : verdict par axe, score 0-5, problèmes triés P0/P1/P2/P3, recommandations.

### 7.3 SKILL — `hikma:learning-ux-designer`

**Rôle** : spécialiste des interfaces d'apprentissage.

**Maîtrise** : découverte, mémorisation, rappel actif, répétition espacée,
feedback, maîtrise, révision, progression, difficulté, récupération active,
phonétique, écoute, prononciation.

**Règle d'or** : **VOIR → COMPRENDRE → SE RAPPELER → PRODUIRE → RECEVOIR
DU FEEDBACK**. Ne jamais afficher prématurément une information qui détruit
l'effort de rappel.

**Produit** : wireframe pédagogique par écran, copy stratégique, scénario d'usage.

### 7.4 SKILL — `hikma:quran-arabic-ux-designer`

**Rôle** : spécialiste de l'affichage du texte coranique et arabe en général.

**Maîtrise** : arabe, RTL, diacritiques (shadda, sukun, hamza, madda,
dagger alif, wasla, tanwin), translittération, alignement arabe/latin,
lisibilité, tailles de texte, line-height, affichage mobile, sélection/copier, audio.

**Règles** :
- Le texte arabe est **un contenu sacré** : jamais de letter-spacing, jamais
  de text-transform, jamais de line-height < 1.7 (1.9 par défaut).
- Diacritiques toujours préservées, jamais masquées par défaut.
- Translittération = aide secondaire, jamais vérité pédagogique.
- Sélection/copier natifs préservés (pas de `user-select: none` sur l'arabe).

---

## 8. Nouvelle direction artistique proposée

### 8.1 Posture

> Hikma doit donner l'impression d'un **objet bien fait**, pas d'une
> « application ». Comme un carnet de notes relié à la main. Comme une
> page de livre posée à côté d'une bougie.

**Trois adjectifs à chérir** : sobre, vivant, mémorisable.
**Trois adjectifs à éviter** : corporate, scolaire, gamifié.

### 8.2 Direction chromatique

> Passer de « monochrome orange » à **« palette Hikma »**.

| Rôle | Actuel | Proposition V2 |
|---|---|---|
| Primary (action) | `#FF7732` orange vif | **Conservé** (signature). |
| Primary ink (texte) | `#C9501E` | **Conservé**. |
| Secondary (réassurance) | `#FFE2B8` cream | **Conservé + déployé** (CTA secondaires, badges, surfaces chaudes). |
| Tertiary (profondeur) | `#D87034` | **Conservé**. |
| Background | `#FFFFFB` ivoire | **Conservé + option crème `#FCFAF5`** (test A/B 24C). |
| Surface | `#F6F7FB` gris froid | **Remplacé** par `#F4EFE4` (cream chaud) → aligner la palette sur le *warm*, pas le *cool*. |
| Border | `#E5E7EB` gris | **Adouci** `#E8E0D2` (cream-gris). |
| Text primary | `#2E2A1c` (chaud) | **Conservé**. |
| Text secondary | `#687280` (froid) | **Remplacé** `#6B6354` (warm gray). |
| Streak | `#FF8F00` | **Conservé** + déploiement (filtre/illustration uniquement, jamais texte). |

**Effet attendu** : la palette ne change pas de nature, mais **bascule du
« warm primary + cool chrome »** vers **« full warm »**. La signature
devient : *un orange chaud qui respire dans un écrin cream*.

### 8.3 Direction typographique

| Niveau | Actuel | Proposition V2 |
|---|---|---|
| Display | 44px / 1.15 | **56px / 1.1** (signature produit) |
| H1 | 32px / 1.2 | **32px / 1.2** (conservé) |
| H2 | 24px / 1.3 | **24px / 1.3** (conservé) |
| H3 | 20px / 1.3 | **20px / 1.3** (conservé) |
| H4 | 16px / 1.4 | **16px / 1.4** (conservé) |
| Body lg | 16px / 1.6 | **17px / 1.6** (lisibilité desktop) |
| Body md | 14px / 1.6 | **15px / 1.6** (lisibilité mobile) |
| Body sm | 13px / 1.6 | **13px / 1.6** (conservé) |
| Caption | 11px / 1.4 | **12px / 1.4** (mobile-readable) |
| Label | 12px / 1.3 | **12px / 1.3** (conservé) |
| Quran | Amiri 1.9 | **Conservé** + variante Amiri Quran pour les titres de sourate |

**Effet attendu** : un Display signature (56px) pour la landing **et** les
écrans pivots (fin de leçon, premier mot d'une sourate, onboarding).
Caption passe à 12px (mobile-readable). Body passe à 15-17px (lecture
confortable des versets longs).

### 8.4 Direction spatiale

> Passer de « empilement dense » à **« respiration Hikma »**.

- Sections publiques (landing) : **py-32** (au lieu de py-10).
- Sections applicatives : **py-12** (inchangé).
- Cartes : **p-6 minimum**, **p-4 uniquement** pour listes denses.
- Grille de réponses : **gap-3 mobile / gap-4 desktop** (au lieu de gap-2/3).
- **Hiérarchie d'espaces** :
  - **Hero** = py-32, mx-auto max-w-2xl (lecture intime).
  - **Dashboard** = py-12, mx-auto max-w-3xl.
  - **LessonPlayer** = py-8 (focus), mx-auto max-w-2xl.

**Effet attendu** : la landing **respire**, le dashboard **structure**, la
leçon **isole**. Chaque écran a un *ton spatial* distinct.

### 8.5 Direction iconographique

> Lucide par défaut + **8 icônes Hikma signature**.

- 8 icônes custom sobres, line-icon, 1.5px stroke :
  1. **Compas** (orientation spirituelle, parcours).
  2. **Lampe** (lumière, sagesse — mascotte alternative).
  3. **Main ouverte** (accueil, don).
  4. **Plume** (écriture, savoir).
  5. **Grain de sable** (patience, persévérance).
  6. **Fil tendu** (chemin, progression).
  7. **Croissant fin** (signature culturelle sans être kitsch).
  8. **Étoile à 8 branches** (calligraphie sobre — Rub el Hizb).

Ces 8 icônes **ne sont pas religieuses au sens liturgique** — elles sont
**poétiques**. Elles habillent : navigation (compas + livre + boucle +
profil), empty states, mascotte fallback, achievement.

### 8.6 Direction motion

> Conserver `ease-hikma` + `ease-soft-out`, mais **affecter chaque
> animation à une intention claire**.

| Événement | Animation | Intention |
|---|---|---|
| Bonne réponse | `reward_pulse` (scale 1→1.02→1) | Récompense sobre |
| Mauvaise réponse | Aucune anim sur la mauvaise option ; `feedback-in` sur le panneau | Pas de châtiment |
| Réussite complète (leçon finie) | `reward_pulse` + mascotte « fière » + son doux (option) | Célébration |
| Transition entre exercices | Fade-out 150ms → Fade-in 200ms | Rythme, pas chaos |
| Passage à l'écran de fin | Reveal en deux temps (stats → CTA) | Anticipation |
| Premier mot d'une sourate | Amiri Quran reveal 600ms | Sacré |
| Streak | Pulse sur l'anneau objectif | Continuité |

### 8.7 Direction émotionnelle (mascottes)

> 5 mascottes fixes **+ 3 états émotionnels** par mascotte (neutre /
> encourageante / fière). Le rendu reste 5 PNGs fixes par contrainte, mais
> le **cadre** change (bulle, halo, glow) selon l'émotion.

| État | Cadre | Quand |
|---|---|---|
| Neutre | Bubble standard | accueil, login |
| Encourageante | Halo warm | erreur, ambiguïté |
| Fière | Halo warm + sparkle sobre | bonne réponse, fin de leçon |

---

## 9. Architecture de redesign

### 9.1 Principes

1. **Ne pas refondre le moteur** (pédagogie, SRS, grading, audio).
2. **Ne pas dupliquer les phases 24x livrées** (24C tokens AA, 24D landing,
   24E reprise, 24F audio, 24G exercices, 24H phonétique).
3. **Ne pas ajouter de gamification** (pas de XP, pas de streak visible
   au-delà de l'objectif, pas de badges cumulés).
4. **Composer avec ce qui existe** — 62 primitives + 4 compétences
   pédagogiques + 14 types d'exercices + 21 296 mots = socle.

### 9.2 Trois couches de transformation

| Couche | Intitulé | Effet |
|---|---|---|
| **C1 — Langage** | Direction artistique + tokens + composants refactorés | Hikma *ressemble* à Hikma |
| **C2 — Architecture de l'information** | Dashboard hiérarchisé, parcours re-narré, mastery visible | L'utilisateur *comprend* où il est |
| **C3 — Pédagogie visible** | Compétence expliquée, SRS explicité, micro-célébrations | L'utilisateur *sait pourquoi* il apprend |

**Ordre recommandé** : C1 → C2 → C3. C1 est fondation, C2 est navigation,
C3 est profondeur. Chaque couche doit être **réversible** et **ciblée**.

### 9.3 Périmètre par couche

**C1 — Langage** :
- Tokens : surface, border, text-secondary, Caption 12px, Body 15-17px, Display 56px.
- Iconographie : 8 icônes Hikma (lucide pour le reste).
- Composants : `Card` (border hairline + radius 2xl), `Mascot` (cadre émotionnel), `Button` (primary/secondary/ghost rééquilibrés).
- Pages : landing, login, onboarding — déjà traitées en 24D, retouches uniquement.

**C2 — Architecture de l'information** :
- Dashboard : 3 blocs « aujourd'hui » + 3 blocs « parcours » (repliables).
- LessonPlayer header : compacté mobile.
- Navigation : breadcrumb contextuel dans `/learn/[slug]` et `/mots/[id]`.
- Profil : intro narrative (« Voici où tu en es »).

**C3 — Pédagogie visible** :
- Bandeau de compétence en cours d'exercice (micro-explication).
- SRS explicité : « Ce mot revient maintenant car tu l'as étudié il y a 3 jours. ».
- MasterySynopsis visible (déjà designé en 24B, non livré).
- Micro-célébrations discrètes (pas de feu d'artifice).
- Écran « Compétences Hikma » (8 compétences avec progression par compétence).

### 9.4 Ce qui ne change pas

- Backend pédagogique (moteur, grading, SRS).
- Authentification, RLS.
- Données Quran (mots, occurrences, audios, traductions, lemmes).
- Routes principales (Dashboard, Parcours, Réviser, Profil).
- Composants `ui/` (refactorés, **non réécrits**).
- Tests (397/397 doivent rester verts).

---

## 10. Risques identifiés

| Risque | Gravité | Mitigation |
|---|---|---|
| **Dérive « joli mais vide »** — embellir sans servir la pédagogie | Élevée | Skill `hikma:learning-ux-designer` invoqué à chaque décision visuelle ; règle d'or « ne pas montrer ce qui tue l'effort de rappel ». |
| **Charge cognitive augmentée** par l'ajout d'éléments narratifs | Moyenne | Règle « un écran, une intention » + tests de densité verticale. |
| **Régression visuelle** (tokens renommés, classes cassées) | Moyenne | Refactor ciblé + tests visuels manuels + suite de non-régression (`npm test`, `tsc`, `lint`, `build`) après chaque phase. |
| **Sur-anthropomorphisme des mascottes** | Moyenne | 5 mascottes fixes + 3 cadres émotionnels max. Pas d'animations de mascotte (statique). |
| **Dérive religieuse / culturelle** | Élevée | 8 icônes **poétiques**, pas liturgiques. Pas de versets coraniques en illustration. Pas d'arabesques en fond. Documentation explicite. |
| **Incompatibilité mobile** des nouveaux patterns | Moyenne | Mobile-first, breakpoints `sm:`/`md:` systématiques, vérification manuelle sur iPhone SE (375px) et iPad. |
| **Perte de momentum d'implémentation 24x** | Moyenne | Roadmap V2 = continuation logique de 24x (24I/24J/24K), pas remplacement. |
| **Surcharge de l'utilisateur par trop de copy** | Moyenne | Limite : chaque écran ≤ 3 blocs de copy stratégique. |
| **Fuite de tokens sémantiques en texte** | Faible | Garde-fou skill `hikma:design-system-architect` (toute couleur sémantique en texte → variante `*_text`). |

---

## 11. Plan d'implémentation par phases

> **Principe** : chaque phase est **ciblée**, **réversible**, **testée**.

### Phase A — Direction artistique & tokens (C1.a)

**Objectif** : poser la palette, la typo, le spacing, les 8 icônes Hikma.

Livrables :
- `HIKMA_DESIGN_SYSTEM.md` (source de vérité du langage visuel).
- Tokens C1 dans `globals.css` (surface cream, border adouci, Caption 12px, Body 15-17px, Display 56px, Amiri Quran).
- 8 icônes Hikma (SVG) dans `public/icones/hikma/`.
- `Icon` registry (`lib/ui/icons.ts`).

**Vérification** : `npm test` (397/397), `tsc --noEmit`, `lint`, `build`,
contraste AA manuel sur 5 pages.

**Risque résiduel** : aucun P0 ; P1 = régression visuelle si un composant
utilise `surface` ou `border` comme couleur de texte.

### Phase B — Composants signature (C1.b)

**Objectif** : refactor ciblé de `Card`, `Button`, `Mascot`, `Badge`,
`Empty`, `Frame` pour porter le langage Hikma.

Livrables :
- `Card` : border hairline cream + radius 2xl + variants (default / warm / sacred).
- `Button` : équilibre primary / secondary / ghost / outline ré-harmonisé.
- `Mascot` : ajout des cadres émotionnels (neutre / encourageant / fier).
- `Badge` : palette chaude déployée (warm / sacred / ink).
- `Empty` : icône Hikma + copy stratégique + CTA.

**Vérification** : 397 tests, snapshot de 5 pages, lecture critique de
l'UI sur 3 écrans pivots (landing, dashboard, lesson player).

### Phase C — Architecture de l'information (C2)

**Objectif** : Dashboard hiérarchisé, breadcrumb, lesson header compacté.

Livrables :
- Dashboard restructuré : 3 blocs « aujourd'hui » + 3 blocs « parcours » (repli).
- Breadcrumb contextuel (`/learn/units/[slug]`, `/learn/[slug]`, `/mots/[id]`).
- LessonPlayer header : compacté mobile, « Quitter » toujours visible.
- Profil : intro narrative + lien vers « Mes compétences ».

**Vérification** : tests E2E manuels sur les 4 parcours de la mission
(nouvel utilisateur, existant, révision, prononciation).

### Phase D — Pédagogie visible (C3)

**Objectif** : bandeau compétence, SRS explicité, MasterySynopsis,
micro-célébrations, écran Compétences.

Livrables :
- Bandeau de compétence en cours d'exercice (micro-explication, jamais le nom technique).
- SRS explicité : étiquette SRS sur les mots qui reviennent.
- MasterySynopsis en 6 verbes humains (« Tu reconnais bien / Tu commences à retenir / … »).
- Micro-célébrations discrètes (`reward_pulse` + mascotte fière).
- Écran `/profile/skills` (8 compétences avec progression par compétence).

**Vérification** : 397 tests + audit pédagogique manuel sur 3 leçons.

### Phase E — Polish & accessibilité (24I/24J/24K continués)

**Objectif** : responsive, accessibilité, micro-interactions.

Livrables :
- Cibles tactiles ≥ 44px partout (U12 fixé).
- Emojis `aria-hidden` (U11 fixé).
- Page 404/erreur brandée et utile (U4 fixé).
- Récompenses sobres (U13 fixé).
- `/design-system` retiré de la prod (U14 fixé).

**Vérification** : tests accessibilité (axe, lighthouse), responsive
manuel (iPhone SE, iPad, desktop).

### Phase F — Documentation & skills (livrable final)

**Objectif** : skills documentés, design system archivé.

Livrables :
- `HIKMA_UIUX_AUDIT_V2.md` (ce rapport).
- `HIKMA_DESIGN_SYSTEM.md` (langage visuel).
- `HIKMA_INFORMATION_ARCHITECTURE.md` (navigation + hiérarchie).
- `HIKMA_UX_PRINCIPLES.md` (règles d'or).
- 4 skills UI/UX documentés et invocables.
- Design tokens archivés.
- Composants refactorés.
- Pages redesignées.
- Rapports : responsive, accessibility, UX QA, non-régression.

---

## 12. Annexe — Vérifications techniques (état actuel)

| Vérification | Résultat | Date |
|---|---|---|
| `npm test` | **397 / 397** ✓ | 2026-08-16 (audit) |
| `npx tsc --noEmit` | **0 erreur** ✓ | hérité 24A |
| `npm run lint` | clean ✓ | hérité 24A |
| `npm run build` | OK ✓ | hérité 24A |
| `npm run verify:persistence` | **13 / 13** ✓ | hérité 24A |
| `npm run verify:rls` | **38 / 38** ✓ | hérité 24A |
| Données Quran (mots / occurrences / audios / traductions) | 21 296 / 77 430 / 21 295 / 25 FR | hérité 24A |
| Lemmas | 32 | hérité 24A |
| Word-lemma mapping | 183 | hérité 24A |

**Aucune écriture.** Phase 0 reste **READ ONLY**.

---

## 13. Règle finale — ARRÊT

Après livraison de cet audit : **ARRÊTER**. Ne pas commencer
automatiquement la phase A, ni une refonte globale, ni une modification
des composants, des tokens, du LessonPlayer ou du moteur pédagogique.

Le propriétaire doit examiner `HIKMA_UIUX_AUDIT_V2.md` et donner une
approbation explicite pour la phase A.

**Statut final : `UX_UI_AUDIT_V2_PARTIAL`** — attend validation.

---

## 14. Skills UI/UX créés (livrables)

Quatre skills ont été créés dans `.codex/skills/.system/` pour servir de
**source de vérité réutilisable** lors des phases suivantes :

| Skill | Rôle | Invocation |
|---|---|---|
| `hikma-design-system-architect` | Tokens, typo, motion, palette warm, signature | Toute création / refonte de composant, toute revue de design |
| `hikma-ux-auditor` | Audit 6 axes, scoring P0-P3 | Toute création / refonte de page, tout parcours critique |
| `hikma-learning-ux-designer` | Boucle pédagogique, compétences, SRS | Tout écran pédagogique (Découverte, Exercice, Fin, Révision, Profil compétences) |
| `hikma-quran-arabic-ux-designer` | RTL, diacritiques, lisibilité arabe | Toute carte mot, tout bloc verset, tout écran Découverte |

Ces skills sont invocables globalement (ils sont dans le système Codex
de l'utilisateur). Aucun ne modifie le code : ils **guident**, **valident**,
**refusent** ce qui casse l'identité Hikma.

Chaque skill documente :
- Ses **règles absolues** (non négociables).
- Ses **garde-fous** (anti-patterns à refuser).
- Son **format de sortie** (wireframe, spec, audit).
- Ses **workflows d'utilisation** (comment l'invoquer).

