# PHASE 24A — AUDIT COMPLET UX/UI + LEARNING EXPERIENCE DE HIKMA

**STATUS = `UX_UI_AUDIT_PARTIAL`**

Audit **100 % READ-ONLY**. Garanties : `DATABASE_WRITES = 0` · `MIGRATIONS = 0` ·
`PRODUCTION_CODE_CHANGES = 0` · `CSS_CHANGES = 0` · `UI_CHANGES = 0` ·
`COMPONENT_CHANGES = 0` · `DESIGN_SYSTEM_CHANGES = 0` · `CURRICULUM_CHANGES = 0` ·
`EXERCISES_CHANGES = 0` · `ENGINE_CHANGES = 0` · `RESOLVER_CHANGES = 0` ·
`AUDIO_IMPORTS = 0` · `STORAGE_WRITES = 0`.

**Pourquoi `PARTIAL` et pas `COMPLETE`** : les surfaces **interactives** (clics
sur les exercices, saisie libre, lecture audio réelle, rendu visuel, navigation
clavier/touch) n'ont **pas pu être exécutées dans un navigateur** — l'environnement
n'expose aucun outil d'automatisation navigateur, l'outil de fetch refuse les
adresses locales (`localhost` = adresse privée), et le type de processus
`BACKGROUND` n'est pas disponible. L'audit est donc fondé sur : (1) la **trace
complète du code** de chaque route/composant, (2) le **build complet** (`next build`
OK, toutes les routes type-checkées), (3) les **278 tests du moteur** (grading,
séquenceur, maîtrise, rétention, audio, exercices), (4) les **vérifications DB
live** (`verify:persistence` 13/13, `verify:rls` 38/38). Aucun résultat n'est
inventé : les verdicts interactifs sont des verdicts de **code** (comportement
attendu), signalés comme tels.

---

## 1. Résumé exécutif

Hikma possède une **fondation UX solide et cohérente** : design system unifié
(~60 composants, tokens, dark mode), navigation minimale claire, feedback
pédagogique chaleureux et non humiliant, fondations RTL arabes sérieuses, états
vides bien traités, et une pédagogie en amont déjà robuste (séquence par
compétence, rappel machine-noté, contexte/lemme réels). **Aucun problème
BLOQUANT (P0) n'a été identifié.**

Les lacunes sont concentrées sur : la **proposition de valeur** (le nouvel
utilisateur ne comprend pas en <30 s ce que Hikma va lui permettre d'accomplir),
la **longueur/reprise des sessions** (27–54 exercices sans sauvegarde
intra-session), l'**audio UX** (outil pédagogique réel mais rendu par des
contrôles natifs), la **motivation visible** (la maîtrise par compétence existe
en base mais n'est jamais affichée), et quelques points d'**accessibilité/contraste**.

**Score UX global : 3.2 / 5** (acceptable–bon). Verdict : la base est prête pour
une passe de polish UX ciblée — **ne pas refondre**, mais **compléter** (valeur de
proposition, audio, sessions, feedback positif).

---

## 2. Architecture UX actuelle

| Couche | Réalisation |
|---|---|
| Routes | `/`, `/dashboard`, `/learn`, `/learn/units/[slug]`, `/learn/[slug]`, `/review`, `/profile`, `/mots/[id]`, `/login`, `/onboarding`, `/design-system` |
| Layouts | racine (fonts Poppins/Amiri/Geist Mono) · `(app)` (AppNav + redirect onboarding) · `(onboarding)` isolé · `(auth)` centré |
| Navigation | desktop : sidebar fixe gauche (logo + 4 entrées) ; mobile : bottom nav 4 entrées ; `aria-current`, `focus-visible`, liens « ← Parcours » |
| Parcours | curriculum → unités → leçons (statut LOCKED/AVAILABLE/IN_PROGRESS/COMPLETED, badge, barre de progression) |
| LessonPlayer | Découverte → exercices (par compétence) → fin ; persistance par Server Actions |
| Exercices | 12 types ; séquence connectée = 7 compétences ; rappel libre machine-noté tri-state |
| Audio | 21 295 word_audio Muallim, URL signées ; rendu `<audio controls>` natif |
| Composants | ~60 (button, card, badge, progress, alert, input, typography, arabic-text, mascot, spinner, skeleton, dialog…) |

Détail complet : `tmp/phase24a-screens-inventory.json`.

---

## 3. Parcours nouvel utilisateur

`/` → `/dashboard` (anon) → `/login` (sign-up email/mot de passe) → `/onboarding`
(objectif) → `/dashboard`.

**Constats clés** :
- L'accueil anon offre deux CTA clairs (« Se connecter » / « Explorer le
  parcours ») — **bien**.
- Mais ni l'accueil ni l'onboarding n'expliquent **ce qu'on apprend** (le
  vocabulaire coranique mot à mot). La proposition de valeur est portée
  uniquement par le nom « Hikma » et la mascotte — **insuffisant**.
- L'onboarding est minimal (1 étape, 2 décisions : type + valeur d'objectif) —
  **faible friction**, mais on règle un objectif **avant d'avoir vu une leçon**.
- L'explorateur non connecté peut tester une leçon via « Explorer le parcours »
  (séquence par défaut) — **positif** pour la découverte.

→ Problèmes : **U1** (P1, valeur de proposition), lié au §5.

---

## 4. Parcours apprentissage

`/learn` → leçon → Découverte (mots : arabe, translittération, sens, badge de
validation) → exercices par compétence → écran de fin (stats + leçon suivante +
réviser + retour).

- **Pourquoi cette leçon maintenant ?** L'ordre est séquentiel et verrouillé,
  mais le verrou n'explique pas sa condition (U5).
- **Pourquoi cet exercice maintenant ?** L'ordre par compétence est correct
  (reconnaissance → rappel → audio → contexte → lemme), mais il n'est **jamais
  expliqué** à l'utilisateur (aucune mention « on révise, on rappelle, on
  écoute »).
- **Pourquoi ce mot revient ?** Réintroduit via la révision cumulative — mais non
  expliqué.
- **Pourquoi ce mot disparaît ?** Une compétence maîtrisée est sautée — mais la
  maîtrise par compétence n'est **pas affichée**, donc le saut paraît arbitraire.

---

## 5. Onboarding

- **Étapes** : 1 · **Décisions** : 2 (type + valeur) · **Texte** : court.
- **Question des 30 secondes** : ❌ **l'utilisateur ne comprend pas ce que Hikma va
  lui permettre d'accomplir.** L'onboarding règle un objectif, il ne « vend » pas
  l'apprentissage du vocabulaire coranique.
- Classification : **UX P1** (valeur de proposition), le reste est acceptable.

---

## 6. Dashboard

- **Hiérarchie** : 1 CTA principal (« Continuer/Commencer la leçon ») puis
  objectif → révisions → progression → révisions à venir → historique → stats.
- **Objectif principal** : clair (reprendre/apprendre). **Bien.**
- **Progression/statistiques** : leçons terminées, mots appris, maîtrise moyenne,
  mots à réviser, anneau d'objectif, barre de parcours, activité 30 jours. **Riche.**
- **Distractions** : plusieurs CTA secondaires (« Modifier l'objectif »,
  « Voir la révision », « Voir le parcours ») diluent légèrement le CTA principal
  (U12, P3).
- **Densité** : 6 cartes + 4 stats = page longue (P3 sur la densité verticale).
- **Question « sait-il où cliquer ? »** : ✅ oui, le CTA principal domine.

---

## 7. Parcours d'apprentissage (détail)

Cf. §4. Points forts : statuts visuels (icônes cadenas/soleil/étoile/trophée),
badges, barre de progression par leçon. Points faibles : verrou non expliqué
(U5), difficulté absente de la liste (U10), maîtrise par compétence invisible.

---

## 8. LessonPlayer (audit détaillé)

**Étape Découverte** : liste de cartes (1 mot/carte : arabe Amiri, translittération,
sens, badge « Sens français validé » / « FR en préparation », lien « Voir la fiche »).
→ 1 CTA « Commencer les exercices ». **Bien**, mais la liste complète + le contexte
du verset (au-dessus) poussent le CTA sous la ligne de flottaison sur mobile (U9).

**Étape Exercice** (par exercice) :
- en-tête : quitter (X + confirmation) · « Exercice X/Y » · difficulté · barre de progression ;
- corps : 1 prompt + 4 options (grille 2×2) ou champ libre (rappel) ;
- feedback : panneau vert/rouge/ambre + mascotte + bonne réponse + explication ;
- pied : « Continuer » (désactivé tant qu'aucune réponse).

**Mesures** : 1 prompt · 4 options · 1 barre · ~5 éléments visuels · texte court.
**Surcharge cognitive** : faible **par écran**, mais élevée **sur la durée**
(27–54 exercices, U2/U7). Le rappel libre (saisie) exige un clavier arabe pour
`MEANING_TO_FORM` — friction débutant (profil B).

**Fin de leçon** : stats (exercices, précision, mots étudiés) + progression
parcours + « Continuer — leçon suivante » + « Réviser » + « Retour ». **Bien.**

---

## 9. Exercices

| Famille | Objectif | Compréhension | Feedback | Risque d'ennui | Cohérence |
|---|---|---|---|---|---|
| WORD_TO_TRANSLATION | reconnaître le sens | bonne | ✓ | moyen | ✓ |
| TRANSLATION_TO_WORD | sens(+indice)→arabe | bonne | ✓ | moyen | ✓ |
| REVERSE_TRANSLATION | sens→arabe | bonne | ✓ | moyen | ✓ |
| MULTIPLE_CHOICE | arabe→prononciation | bonne | ✓ | moyen | ✓ |
| COMPLETE_WORD | compléter le sens | bonne | ✓ | moyen | ✓ |
| FORM_TO_MEANING (rappel) | rappeler le sens | bonne | tri-state | faible (varie) | ✓ |
| MEANING_TO_FORM (production) | rappeler la forme | bonne mais exigeant | tri-state | faible | ✓ |
| AUDIO_TO_WORD | écouter→identifier | bonne | ✓ | faible | ✓ |
| WORD_TO_AUDIO | écouter→confirmer | bonne | auto-éval | faible | ✓ |
| CONTEXT_RECOGNITION | sens dans le verset | bonne | ✓ | moyen | ✓ |
| LEMMA_RELATION | famille de mots | moyenne (concept « lemme » non vulgarisé) | ✓ | faible | ✓ |
| WORD_RECOGNITION | auto-évaluation | bonne | neutre | — | ✓ |

**Question « comprend-il pourquoi il fait cet exercice ? »** : **partiellement** —
l'objectif de chaque compétence n'est jamais affiché (aucun « ici tu apprends à
reconnaître », « ici tu rappelles de mémoire »). Les consignes sont claires, mais
le « pourquoi » pédagogique est implicite.

**Répétitivité** : 5 des 7 compétences utilisent le même motif QCM 2×2 (U7, P2) ;
seul le rappel libre varie. Le visiteur reçoit jusqu'à **11 types/mot** contre 7
pour un connecté (U8, P2).

---

## 10. Problème de l'ennui

- **Répétitions longues** : 27–54 exercices/session (23F-C) — **OUI**.
- **Séries identiques** : même motif QCM répété — **OUI**.
- **Absence de variété** : 5 compétences visuellement identiques — **OUI**.
- **Temps morts** : non (validation immédiate).
- **Feedback répétitif** : le panneau de feedback est constant (bien mais uniforme).
- **Animations** : présentes mais subtiles ; pas de célébration de réussite (U13).
- **Prévisibilité** : ordre déterministe (pédagogiquement voulu).

**Diagnostic** : la pédagogie fournit de la variété **au niveau des compétences**
(7 axes), mais pas **au niveau visuel** (le même rendu QCM). Ne pas ajouter de
gamification artificielle ; d'abord varier la **présentation** et réduire la
**longueur** des sessions.

---

## 11. Charge cognitive

- **Simultanée** : faible (1 exercice, 4 options). **Bien.**
- **Consécutive** : élevée (27–54 exercices, U2).
- **Consignes** : courtes. **Bien.**
- **Choix** : 4 options (2 pour l'auto-évaluation). **Bien.**
- **La correction 23F-B a-t-elle amélioré l'interface réelle ?** Oui : plafond à
  8 mots/leçon, mais le nombre d'exercices reste 27–54 car chaque mot traverse
  ~7 compétences — la réduction de mots n'a pas réduit la longueur de session
  (confirmé par la simulation 23F-C). → reste un point de friction (U2).

---

## 12. Design visuel

Détail complet : `tmp/phase24a-design-system-audit.json`.

- **Typographie** : Poppins (corps/titres) + Amiri (arabe) + Geist Mono. Échelle
  cohérente 32→11px. **Bon (4/5).**
- **Couleurs** : orange chaud (#FF7732) + crème + neutres propres + dark mode.
  **Cohérent**, mais contraste des couleurs sémantiques en texte insuffisant (U6).
- **Espaces** : généreux, mais densité verticale élevée sur le dashboard.
- **Composants** : complets et cohérents (button 8×7, badge 8, card, progress,
  alert, input…). Rendu générique « shadcn/base-ui » peu personnalisé.
- **Radius/ombres/bordure** : cohérents, ombres discrètes. **Bon.**

---

## 13. Identité visuelle

**Identité actuelle** : chaleureuse, calme, sobre, éducative, avec une touche
spirituelle (nom حكمة, « Apprends avec sagesse », arabe et contexte coranique).
**Pas enfantine** (mascotte sobre, palette restreinte, pas de gamification).

Verdict : `FRIENDLY + CALME + MODERNE + ACCESSIBLE` **atteint** ;
`PREMIUM` **à renforcer** (rendu template, mascottes statiques, emojis). L'identité
est **cohérente mais pas encore distinctive**.

---

## 14. Arabe + Français

- `ArabicText` : `dir=rtl`, `lang=ar`, Amiri, `line-height:1.9`, `letter-spacing:0`
  (préserve ligatures et diacritiques). **Fondations solides.**
- Options arabes détectées (regex) → Amiri RTL ; prompts mixtes entre guillemets.
- Saisie arabe libre en `dir=rtl`.
- Formes testées (`رَبِّ`, `اللَّهِ`, `الرَّحْمَٰنِ`, `الصِّرَاطَ`, `الْمُسْتَقِيمَ`) :
  aucune casse détectée dans le code. **Bon (4/5).**

---

## 15. Audio UX

- L'audio Muallim (21 295) est **réel** et **utilisé comme entrée d'exercice**
  (`AUDIO_TO_WORD`, `WORD_TO_AUDIO`), jamais décoratif. **Bien.**
- Mais le rendu est un `<audio controls preload=none>` natif : pas d'état de
  chargement/lecture dédié, pas de bouton replay stylé, pas de gestion d'erreur
  réseau, pas de rendu mobile soigné. **U3 (P1).**
- « Outil pédagogique ou bouton décoratif ? » → **outil pédagogique réel**, mais
  **présenté comme un contrôle minimal**.

---

## 16. Feedback et erreurs

| Situation | Traitement | Verdict |
|---|---|---|
| Bonne réponse | panneau vert + mascotte « Excellent ! » + « ✓ Bonne réponse » | clair, chaleureux |
| Mauvaise réponse | panneau rouge + mascotte « Pas encore, tu vas y arriver » + bonne réponse + explication | clair, non humiliant |
| Réponse ambiguë (arabe) | panneau ambre « ≈ À vérifier » + « vérifie la vocalisation exacte » | clair, neutre |
| Absence de réponse | bouton « Continuer » désactivé | clair |
| Erreur réseau/persistance | écran « Oups… » + Réessayer + Retour | clair |
| Audio indisponible | note « Exercices audio : indisponibles » en en-tête | clair |
| Session terminée | écran de fin (stats + suite) | clair |
| 404 / erreur serveur | **fallback générique Next.js** (pas de page personnalisée) | **U4 (P2)** |

Aucun feedback **humiliant** détecté. Le feedback est cohérent et pédagogique.

---

## 17. Motivation

**Mécanismes actuels** (intrinsèques uniquement, pas de gamification ajoutée) :
- compréhension (contexte du verset, sens FR validé) ;
- progression (barres, compteurs, statuts, « Reprendre la leçon ») ;
- sentiment de compétence : **faible** — la maîtrise par compétence (8 axes) est
  calculée et persistée mais **jamais affichée** ;
- continuité (objectif du jour, révisions dues, historique) ;
- découverte (fiches mot, occurrences coraniques).

**« Pourquoi reviendrait-il demain ? »** : l'objectif du jour + la répétition
espacée (échéances) + la continuité de leçon donnent une raison de revenir, mais
la motivation est **sous-exploitée** : aucune célébration de réussite (U13),
aucune visibilité de la maîtrise, aucune valorisation du progrès par compétence.

---

## 18. Accessibilité

- **Présent** : `role=radiogroup/radio`, `role=status`, `aria-label` (progression,
  navigation), `aria-current`, `focus-visible`, `aria-disabled` (leçons verrouillées),
  `aria-busy` + `sr-only` live (login), `aria-valuetext` déterministe (progress,
  anti-hydratation), `alt` sur images, `prefers`/dark mode.
- **Classement** :
  - **P0** : aucun.
  - **P1** : aucun.
  - **P2** : contraste des couleurs sémantiques en texte (U6).
  - **P3** : emojis non masqués (U11), cibles tactiles nav mobile limites (U12).

---

## 19. Responsive

- **Mobile** : bottom nav, cartes empilées, grille d'options 1→2 colonnes, boutons
  pleine largeur. **Patterns présents.**
- **Tablette/desktop** : sidebar fixe, max-w-2xl/3xl centrés, options 2 colonnes.
- **Points d'attention** : en-tête + contexte de leçon poussent le CTA sous la
  ligne de flottaison sur mobile (U9) ; cibles nav mobile petites (U12).
- **Limite** : non vérifié en navigateur réel (cf. méthodologie).

---

## 20. Performance perçue

- **Chargement** : `app/(app)/loading.tsx` (squelettes) pendant le SSR. **Bien.**
- **Force-dynamic** sur toutes les pages applicatives → le rendu dépend du réseau
  Supabase (plusieurs requêtes en parallèle pour la leçon). Pas de Suspense
  granulaire ni de streaming au-delà du loading global.
- **Transitions** : progress (500 ms), goal ring (500 ms), spinner, skeleton. **Subtiles.**
- **Latence perçue** : correcte grâce aux squelettes, mais pas de skeleton dédié
  au LessonPlayer lui-même (le chargement des données de leçon se fait au SSR).

---

## 21. Micro-interactions

Inventaire : transitions de progression, anneau d'objectif, hover des cartes/boutons,
spinner, skeleton, feedback couleur. Évaluation : **utiles** (orientation/progression),
**aucune distrayante**. Manque : une micro-animation de **récompense** sur bonne
réponse (U13). Chaque animation existante a une fonction — conforme à la règle.

---

## 22. Navigation

- Architecture plate et claire (4 entrées + sous-pages de détail).
- Retours « ← Parcours » présents sur leçon/unité/fiche mot.
- Pas de breadcrumb complet, mais l'état actif + les titres de page suffisent.
- **« Sait-il toujours où il se trouve ? »** : ✅ oui (état actif + titre + retour).

---

## 23. États vides et cas limites

| Cas | Traitement | Verdict |
|---|---|---|
| Aucune leçon / aucun curriculum | mascotte + message + action | ✓ |
| Aucune progression (nouveau) | dashboard « Bonjour / Que veux-tu apprendre » | ✓ |
| Aucune révision due | « Rien à réviser 🎉 » + « Voir le parcours » | ✓ |
| Session terminée | écran de fin | ✓ |
| Audio indisponible | note d'information | ✓ |
| Erreur serveur | écran « Oups… » (session) / **fallback générique (routes)** | partiel (U4) |
| Réseau lent | skeleton + spinner | ✓ |
| Non connecté | écrans d'invite par page | ✓ |
| Données manquantes (sens/occurrences) | badges/messages explicites | ✓ |

---

## 24. Comparaison avec les meilleures pratiques

Comparaison **conceptuelle** uniquement (aucune copie d'identité).

| Produit | Leçon pour Hikma |
|---|---|
| Duolingo | onboarding qui montre la valeur en 10 s ; célébration de réussite ; micro-sessions courtes |
| Babbel | valeur de proposition explicite (« parle dès la leçon 1 ») |
| Khan Academy | visibilité de la maîtrise par compétence (barres de maîtrise) |
| Brilliant | variété de présentation des concepts ; feedback qui explique le « pourquoi » |
| Headspace | ton calme, progression visuelle apaisante, continuité quotidienne |
| Memrise | audio comme outil central stylisé ; rappel espacé visible |

Ce que Hikma peut en retenir **sans copier** : une valeur de proposition en
<30 s, une maîtrise par compétence **visible**, des sessions plus courtes, un
audio **stylisé**, et une célébration de réussite sobre.

---

## 25. Persona principal

« **Adulte francophone souhaitant apprendre/comprendre le vocabulaire coranique
progressivement, avec peu de connaissances en arabe.** » Hikma n'est **pas** une
application destinée aux enfants. Ce persona guide les priorités : valeur de
proposition claire, arabe lisible + traduit, audio prononcé, progression visible,
production arabe **accessible** (ou alternative à la saisie arabe brute).

---

## 26. Score UX global

Échelle 0–5. Détail + justifications : `tmp/phase24a-ux-ui-score.json`.

| Dimension | Score |
|---|---|
| Clarté | 4 |
| Simplicité | 4 |
| Navigation | 4 |
| Onboarding | 2 |
| Design visuel | 3 |
| Lisibilité | 4 |
| Arabe/RTL | 4 |
| Feedback | 4 |
| Audio UX | 2 |
| Learning UX | 3 |
| Charge cognitive | 3 |
| Motivation | 2 |
| Accessibilité | 3 |
| Responsive | 3 |
| Performance perçue | 3 |
| Cohérence | 4 |
| **Moyenne** | **3.2** |

Scores volontairement non gonflés.

---

## 27. Problèmes P0

**Aucun problème BLOQUANT identifié.** Le socle (données 26/26 FR, audio 26/26,
moteur testé 278/278, RLS 38/38) est sain ; rien n'empêche ni ne compromet
fortement l'apprentissage. Les problèmes sont tous en P1–P3.

---

## 28. Problèmes P1 (majeurs)

| ID | Écran | Problème |
|---|---|---|
| U1 | /dashboard (anon) · /onboarding | Proposition de valeur absente au premier contact |
| U2 | LessonPlayer | Sessions 27–54 exercices sans sauvegarde/reprise intra-session |
| U3 | exercices audio | Audio réel mais rendu par `<audio controls>` natif (pas d'états dédiés) |

---

## 29. Problèmes P2 (importants)

| ID | Écran | Problème |
|---|---|---|
| U4 | global | Pas de page d'erreur/404 personnalisée (fallback générique Next.js) |
| U5 | /learn | Verrou de leçon sans explication de la condition de déverrouillage |
| U6 | dashboard/objectifs | Contraste insuffisant des couleurs sémantiques en texte (AA) |
| U7 | LessonPlayer | 5 compétences au même motif QCM (répétitivité visuelle) |
| U8 | /learn/[slug] (visiteur) | Parcours visiteur plus long (11 types/mot) que connecté (7) |
| U9 | /learn/[slug] (mobile) | En-tête + contexte poussent le CTA « Commencer » sous la ligne de flottaison |

*(liste détaillée et justifiée : `tmp/phase24a-ux-ui-issues.json`)*

---

## 30. Problèmes P3 (polish)

U10 (difficulté absente de la liste) · U11 (emojis non masqués) · U12 (nav mobile
11px + CTA secondaires) · U13 (pas de célébration de réussite) · U14
(/design-system exposé publiquement).

---

## 31. Forces actuelles

1. Design system unifié, cohérent et accessible (tokens, dark mode, ~60 composants).
2. Navigation minimale et claire avec états actifs et focus.
3. Feedback pédagogique chaleureux, immédiat, non humiliant (tri-state).
4. Fondations RTL arabes sérieuses (Amiri, dir/lang, interligne diacritiques).
5. États vides/cas limites bien traités partout.
6. Pédagogie solide en amont (séquence par compétence, rappel machine-noté,
   contexte/lemme réels, données FR 26/26, audio 26/26).
7. Aucun P0 bloquant.

---

## 32. Faiblesses actuelles

1. Valeur de proposition absente au premier contact (onboarding).
2. Sessions longues sans reprise intra-session.
3. Audio réel mais présentation minimale.
4. Répétitivité visuelle des exercices.
5. Pas de page d'erreur/404 personnalisée.
6. Maîtrise par compétence calculée mais jamais affichée.
7. Contraste des couleurs sémantiques en texte.
8. Production arabe exigeante pour un débutant sans clavier arabe.

---

## 33. Priorités recommandées

1. **24B** : valeur de proposition + pages d'erreur/404 + contraste (rapide, fort impact).
2. **24C** : composant audio dédié + micro-interactions de récompense.
3. **24F** : sessions (micro-sessions/reprise) + variété d'exercices.
4. **24E** : visibilité de la maîtrise par compétence (motivation).
5. **24D** : onboarding complet (<30 s : valeur + aperçu + objectif).

---

## 34. Roadmap UX proposée

| Phase | Intitulé | Objectif |
|---|---|---|
| 24B | UX Foundation | valeur de proposition, erreur/404, contraste |
| 24C | Design System | audio dédié, variantes texte AA, micro-interactions |
| 24D | Onboarding | premier contact <30 s (valeur + aperçu + objectif) |
| 24E | Dashboard | hiérarchie, mots faibles, maîtrise visible |
| 24F | LessonPlayer | micro-sessions/reprise, variété, charge cognitive |
| 24G | Exercise UX | présentations variées, production arabe accessible |
| 24H | Review UX | vue des mots faibles, reprise ciblée |
| 24I | Mobile/Responsive | vérification navigateur réel, compactage en-têtes |
| 24J | Accessibility | contraste, emojis, cibles tactiles, clavier |
| 24K | Polish & Micro-interactions | célébration, transitions, cohérence |

**Cette roadmap est une PROPOSITION.** Aucune phase suivante ne sera exécutée
automatiquement.

---

## 35. Vérifications techniques (non-régression)

| Vérification | Résultat |
|---|---|
| `npm test` | **278/278** ✓ |
| `npx tsc --noEmit` | **0 erreur** ✓ |
| `npm run lint` | clean ✓ |
| `npm run build` | OK ✓ |
| `npm run verify:persistence` | **13/13** ✓ |
| `npm run verify:rls` | **38/38** ✓ |

Aucune régression. Aucun test supprimé ni affaibli.

---

## 36. État des données préservé

| Compteur | Attendu | Réel | État |
|---|---|---|---|
| quran_words | 21 296 | 21 296 | ✓ |
| word_occurrences | 77 430 | 77 430 | ✓ |
| word_audio | 21 295 | 21 295 | ✓ |
| ayah_audio | 0 | 0 | ✓ |
| lemmas | 32 | 32 | ✓ |
| word_translations FR | 25 | 25 | ✓ |
| word_lemma_mapping | 183 | 183 | ✓ |

**Aucune écriture.**

---

## 37. Livrables

- `PHASE_24A_HIKMA_UX_UI_AUDIT.md`
- `tmp/phase24a-ux-ui-audit.json`
- `tmp/phase24a-ux-ui-score.json`
- `tmp/phase24a-ux-ui-issues.json`
- `tmp/phase24a-user-journey-audit.json`
- `tmp/phase24a-design-system-audit.json`
- `tmp/phase24a-screens-inventory.json`
- `tmp/phase24a-baseline.json` (vérification de préservation des données)

---

## 38. Règle finale — ARRÊT

Après cet audit : **ARRÊTER**. Ne pas commencer automatiquement 24B, 23G, un SRS
avancé, de la gamification, 114 sourates, un nouveau curriculum, un nouveau
design, une refonte UI ni une modification du LessonPlayer. Le propriétaire doit
d'abord examiner `PHASE_24A_HIKMA_UX_UI_AUDIT.md`, puis donner une approbation
explicite pour la phase suivante.
