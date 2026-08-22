# PHASE 24H-Q2-A — AUDIT DE LA RECONNAISSANCE PHONÉTIQUE

STATUT = `AUDIT_COMPLETE_READY_FOR_APPROVAL`
DÉCISION = `NOT_JUSTIFIED_AS_SEPARATE_SKILL`
MODE = `READ_ONLY` — aucune écriture de code / DB / migration / import / UI.

> Phase **audit-only** : le code réel a été lu, la baseline confirmée, aucune
> modification apportée. L'implémentation (Q2-B) ne démarre qu'après approbation
> explicite du propriétaire, et uniquement si la conclusion est revue.

---

## 0. Baseline confirmée (non-régression)

| Vérification | Résultat |
|---|---|
| `npm test` | **366/366** (27 fichiers) |
| `npx tsc --noEmit` | **0 erreur** |
| `npm run lint` | **clean** |
| `npm run build` | **OK** |
| `verify:persistence` / `verify:rls` | non re-exécutés (DB/credentials — hors audit read-only) ; baseline de référence 13/13 et 44/44 |

---

## 1. Réponses explicites aux 12 questions (§23)

### Q1 — `audio_recognition` et `pronunciation_recognition` sont-ils deux compétences différentes ?

**Pédagogiquement oui, en granularité ; en tant que valeur de `skill` DB, non au MVP.**

- `audio_recognition` = reconnaître **quel MOT** a été entendu (identité lexicale
  globale). C'est `AUDIO_TO_WORD` (audio → choisir la forme) et `WORD_TO_AUDIO`
  (forme affichée → confirmer la reconnaissance à l'écoute).
- `pronunciation_recognition` = discriminer **quel TRAIT de prononciation**
  (son difficile, vocalisation, longueur, shadda, etc.) a été entendu. C'est une
  granularité de FEATURE, pas d'identité de mot.

La différence est réelle : « quel mot ? » ≠ « quel son / quelle marque ? ». Mais
les deux opèrent sur le **même canal** (l'écoute de l'audio de référence) et sur
la **même famille de reconnaissance** (« reconnaître à l'écoute »). Le libellé
existant `audio_recognition = "Reconnaître à l'écoute"` couvre déjà cette famille.

### Q2 — Q2 nécessite-t-elle une nouvelle compétence DB ?

**Non.** Voir §14 ci-dessous.

### Q3 — Une migration est-elle nécessaire ?

**Non.** Le `CHECK(skill IN 8)` (migration 0023) n'a pas besoin d'être étendu.
Les exercices Q2 sont des **nouveaux types d'exercice** mappés à la compétence
existante `audio_recognition`, via `skillForExerciseType`. Aucune colonne, aucune
table, aucune valeur de skill supplémentaire.

### Q4 — Quel exercice Q2 recommandes-tu ?

**Variante E (audio → identifier le son/trait phonétique ciblé)**, dérivée
déterministiquement de `lib/learning/phonetics.ts` et de l'audio réel Muallim,
avec la **Variante C** (audio → identifier la vocalisation/marque) comme
extension naturelle de la même famille. Voir §11 et §16.

### Q5 — Quelles données supplémentaires sont nécessaires ?

Pour le MVP recommandé : **aucune donnée nouvelle** — les traits sont **DÉRIVÉS**
de `quran_words.arabic` (déjà 26/26 translittération + audio 26/26). Voir §13.

### Q6 — Les données d'Al-Fatiha suffisent-elles pour un MVP ?

**Oui pour les variantes C et E** (identification de son/vocalisation, dérivées) ;
**non pour la variante B** (paires minimales réelles), qui n'existe pas dans les
26 formes. Voir §8.

### Q7 — Comment éviter les faux positifs ?

1. La bonne réponse est **toujours la forme réelle du `word_id` ciblé** (jamais
   une forme inventée, jamais une paire fusionnée).
2. Les options de discrimination ne présentent **jamais** deux formes qui se
   normalisent vers le même squelette non vocalisé (protection `عَبَدَ` ≠ `عَبْد`,
   `دِين` ≠ `دَيْن`, `ضَالّ` ≠ `ظِلّ`) — règle de non-contamination du grading.
3. Le générateur est **déterministe** (pas d'aléa) et **retourne null** si l'audio
   ou le trait ciblé est absent (jamais d'audio simulé).
4. Le verdict reste le moteur binaire `validateAnswer` sur options — pas de STT.

### Q8 — Comment éviter le double comptage mastery ?

En **ne créant pas de nouvelle compétence**. Un exercice = une compétence
(`skillForExerciseType` retourne UNE valeur). Matrice au §15 : aucun exercice ne
cible deux skills simultanément. La fragmentation de l'écoute en deux buckets
(`audio_recognition` + `pronunciation_recognition`) est précisément le risque de
double comptage qu'on écarte.

### Q9 — Comment intégrer Q2 sans allonger excessivement les leçons ?

Le séquenceur **saute les compétences maîtrisées** (`needsPractice`). Q2, mappé
sur `audio_recognition`, rejoint la ronde audio existante : il **remplace ou
complète** `AUDIO_TO_WORD` pour un mot cible, sans ajouter de ronde
supplémentaire. Voir §16 (bornage et fréquence).

### Q10 — Quel est le minimum viable sans IA ?

**Variante E** : `audio réel → l'utilisateur identifie le son/trait phonétique
ciblé` (options = sons/marques dérivés de `phonetics.ts`). Aucun micro, aucun STT,
aucune analyse acoustique, aucune donnée nouvelle. Voir §16.

### Q11 — Quelle architecture préparer pour Q3 ?

Q3 (production) est **hors périmètre** : elle exigera une compétence
`pronunciation_production`, une comparaison acoustique locale prudente avec seuil
de confiance (jamais un STT générique), et un micro réservé à l'utilisateur. Le
modèle de compteurs `user_word_skill_progress` (correct/incorrect/streak/récence)
est **générique** et l'accueillera ; Q2-B ne doit rien construire qui présume de Q3
(pas de micro, pas de recorder, pas de table d'audio utilisateur). Voir §16.

### Q12 — Quels risques restent avant implémentation ?

Voir le registre §21. Synthèse : (a) **absence de paires minimales réelles** dans
Al-Fatiha (borne la variante B) ; (b) **fatigue/ambiguïté pédagogique** si la
discrimination de sons est introduite trop tôt ; (c) **accessibilité** — un
exercice sonore doit avoir une alternative visuelle ; (d) **non-régression** des
8 briques 24E–24H-B déjà en production.

---

## 2. Où vivent les skills (§5.1)

- **Définition** : `lib/learning/skills.ts` — `SKILLS` (8 valeurs), `Skill`,
  `SKILL_LABELS`, `SKILL_ORDER` (ordre pédagogique), `skillForExerciseType`.
- **Ordre** : `meaning_recognition → form_recognition → form_to_meaning →
  meaning_to_form → audio_recognition → context_recognition → lemma_relation →
  retention`.
- **Mapping audio** : `AUDIO_TO_WORD` et `WORD_TO_AUDIO` → `audio_recognition`.
  `WORD_RECOGNITION` et `PRONUNCIATION_GUIDED` → `null` (auto-évaluation non notée).

## 3. Où vit le CHECK(skill IN ...) (§5.2)

`supabase/migrations/0023_user_word_skill_progress.sql` :

```sql
skill text not null check (skill in (
  'form_recognition','meaning_recognition','form_to_meaning',
  'meaning_to_form','audio_recognition','context_recognition',
  'lemma_relation','retention'
))
```

Contrainte `UNIQUE (user_id, word_id, skill)` ; `mastery 0..100` ; RLS
`auth.uid() = user_id` (select/insert/update, aucun delete applicatif). La
migration 0024 ajoute `current_streak`, `last_correct_at`, `last_incorrect_at`
(additif).

## 4. Association exercice → skill (§5.3)

`skillForExerciseType(type)` retourne UN skill ou null. Un nouveau type
d'exercice Q2 est associé en ajoutant UN `case` dans cette fonction — **sans
toucher** à `SKILLS` ni à la migration. Le séquenceur (`defaultSkillToType`)
associe le skill à son générateur principal : `audio_recognition → AUDIO_TO_WORD`.

## 5. Score → mastery (§5.4)

`scoreAnswer` (binaire 0/1 ; auto-évaluation et AMBIGUOUS = 0) → collecté en
`SkillAttempt` dans `lesson-player.tsx` → `submitSkillAttempts` (Server Action,
best-effort) → `persistSkillAttempt` → `applySkillAttempt` → `skillMasteryLevel`
(net + plafond de précision + récence). Seules `form_to_meaning`/`meaning_to_form`
recalculent la rétention (`persistRetention`).

## 6. Mastery → SRS (§5.5)

Le SRS (`review_items`, Leitner) est **par MOT** (`user_id, word_id`), pas par
skill. Les skills n'influencent pas la programmation SRS : c'est la chaîne
agrégée `replayWordResults → ReviewEngine → applyAnswer` qui la pilote.
`user_word_skill_progress` est une couche **additive de lecture** (maîtrise
multi-dimensionnelle), pas un scheduler.

## 7. Exercices audio actuels (§5.6, §6)

- `lib/exercises/generators/audio.ts` — `audioToWord` (QCM 4 options arabes) et
  `wordToAudio` (2 options auto-évaluées, notées). Tous deux **exigent**
  `ctx.audioUrl` (sinon `null`).
- `components/learn/exercises/index.tsx` — `AudioToWordExercise` (AudioPlayer +
  grille), `WordToAudioExercise`.
- `AudioPlayer` (`components/ui/audio-player.tsx`, 24C/24F) : un seul audio actif,
  états idle/loading/playing/paused/ended/error, clavier, cible ≥ 48 px.

**AUDIO_TO_WORD est-il déjà de la reconnaissance phonétique ?** C'est de la
**reconnaissance à l'écoute de niveau MOT** (`audio_recognition`), pas de la
discrimination de **trait** phonétique. La différence pédagogique entre
`audio_recognition` et `pronunciation_recognition` est la **granularité** :
identité du mot vs trait de prononciation. `WORD_TO_AUDIO` est une
**association forme↔audio auto-évaluée**, pas une discrimination phonétique.

## 8. Séquenceur (§5.7, §16)

`buildCumulativeSequence` itère `SKILL_ORDER` ; pour chaque skill non maîtrisé
(`needsPractice`) et chaque mot, il pousse un `SequencedStep{wordId, exerciseType,
skill}`. `defaultSkillToType(skill)` choisit le générateur principal. Ajouter un
**skill** exigerait : `SKILLS`, `SKILL_ORDER`, `defaultSkillToType`,
`skillForExerciseType` + migration CHECK. Ajouter un **type d'exercice** (Q2)
n'exige que : le type, son générateur, son composant UI, et un `case` dans
`skillForExerciseType` (retour `audio_recognition`).

## 9. Ajout d'une compétence sans migration (§5.9, §5.10)

Le modèle peut accueillir Q2 **sans migration** : les nouveaux exercices
retournent `audio_recognition` (valeur déjà dans le CHECK). Une nouvelle valeur
`pronunciation_recognition` **n'est pas nécessaire** et créerait un risque de
double comptage (deux buckets pour le même canal d'écoute) sans bénéfice
démontrable dans les données actuelles.

---

## 10. Distinction utile ou artificielle ? (§7)

La distinction **est utile comme concept de design d'exercice** (elle oriente le
feedback et la cible pédagogique), mais **n'est pas utile comme nouvelle valeur de
skill DB au MVP**, car :

1. l'écoute de référence est la même ;
2. le libellé `audio_recognition` couvre déjà « reconnaître à l'écoute » ;
3. Al-Fatiha ne fournit **aucune paire minimale réelle** pour exercer une
   distinction que `AUDIO_TO_WORD` ne couvrirait pas déjà.

**Conclusion : ne pas créer une compétence artificielle.**

---

## 11. Matrice des distinctions phonétiques d'Al-Fatiha (§8)

Les 26 formes réelles (matrice `tmp/phase23c-al-fatiha-matrix.json`) ont été
auditées. Résultat central : **il n'existe aucune paire minimale réelle dans les
26 formes.**

| Paire citée | Présence réelle dans Al-Fatiha | Verdict |
|---|---|---|
| مَالِكِ / مَلِكِ | seul `مَـٰلِكِ` existe ; `مَلِكِ` absent | **paire INVENTÉE** ✗ |
| دِينِ / دَيْن | seul `ٱلدِّينِ` existe | **paire INVENTÉE** ✗ |
| ض / ظ | ض présent (`ٱلضَّآلِّينَ`, `ٱلْمَغْضُوبِ`) ; ظ absent | **pas de paire** ✗ |
| ص / س | ص (`صِرَٰطَ`, `ٱلصِّرَٰطَ`) et س (`بِسْمِ`, `نَسْتَعِينُ`) présents | discrimination de SON ✓ (pas de paire minimale) |
| ح / ه | ح (`ٱلْحَمْدُ`…) et ه (`ٱهْدِنَا`, `عَلَيْهِمْ`, `ٱللَّهِ`) présents | discrimination de SON ✓ |
| ع / ء | ع (`ٱلْعَـٰلَمِينَ`…) et ء/إ (`إِيَّاكَ`, `وَإِيَّاكَ`) présents | discrimination de SON ✓ |
| ط / ت | ط (`صِرَٰطَ`) et ت (`نَسْتَعِينُ`, `أَنْعَمْتَ`) présents | discrimination de SON ✓ |
| ق / ك | ق (`ٱلْمُسْتَقِيمَ`) et ك (`إِيَّاكَ`, `مَـٰلِكِ`) présents | discrimination de SON ✓ |
| غ / ذ | غ (`غَيْرِ`), ذ (`ٱلَّذِينَ`) présents | présents ✓ |
| shadda | `ٱللَّهِ`, `رَبِّ`, `إِيَّاكَ`, `ٱلَّذِينَ`, `ٱلضَّآلِّينَ`, `ٱلدِّينِ`… | ✓ |
| dagger alef | `مَـٰلِكِ`, `صِرَٰطَ`, `ٱلصِّرَٰطَ`, `ٱلرَّحْمَـٰنِ`, `ٱلْعَـٰلَمِينَ` | ✓ |
| madda | `ٱلضَّآلِّينَ` | ✓ |
| wasla / sukun | nombreuses formes | ✓ |
| tanwīn | **0/26** | absent ✗ |
| خ ث ظ ش | hors Al-Fatiha | absent ✗ |

**Conséquence** : la Variante B (deux formes très proches) est **DATA_GAP** dans
Al-Fatiha. Les variantes **C** (vocalisation/marque) et **E** (son/trait) sont
**réalisables** car les traits sont présents et dérivables. Voir
`tmp/phase24hq2-a/al-fatiha-recognition-matrix.json`.

## 12. Protections homographes (§9)

`lib/exercises/grading.ts` protège déjà `عَبَدَ` ≠ `عَبْد`, `دِين` ≠ `دَيْن`,
`ضَالّ` ≠ `ظِلّ` via `gradeArabicResponse` (même squelette non vocalisé +
vocalisation différente = AMBIGUOUS, jamais CORRECT). **Q2 (options, pas de saisie
libre) ne touche pas au grading** : la bonne réponse est fixée par le générateur au
`word_id` ciblé. Règle à respecter pour Q2-B : un jeu d'options ne présente jamais
deux formes qui partagent le même squelette non vocalisé.

## 13. Audio (§10)

- `word_audio` : **21 295** lignes, chemin `muallim/{uuid}.opus`, bucket privé
  `word-audio` (policy storage read-only anon/authenticated, migration 0026).
- `getWordAudioState` (queries.ts) : signature batch TTL 1 h ; pattern
  `^muallim/[0-9a-f-]{36}\.opus$` ; échec de signature journalisé, jamais
  transformé en « indisponible ».
- **durée** : `word_audio.duration` = NULL (non connue) → pas d'exercice dépendant
  de la durée.
- **rejouer** : oui (AudioPlayer, replay/replay after error). **comparer deux
  audios** : possible (deux AudioPlayer), mais un seul actif à la fois
  (coordination 24F). **sélectionner entre deux formes** : possible. **exercice
  déterministe** : oui (bank ordonné, pas d'aléa).
- **Basmala 4/4 · Al-Fatiha 26/26** confirmés (audits 24H-AUDIO-FIX / 24F).

## 14. Variantes (§11) — analyse et recommandation

| Variante | Intérêt | Difficulté | Données | Faux positif | Moteur | Coût | Verdict |
|---|---|---|---|---|---|---|---|
| A. audio → mot arabe | reconnaissance mot | faible | audio (existant) | faible | identique à AUDIO_TO_WORD | nul (existe) | **déjà en place** |
| B. audio → 2 formes proches | discrimination maximale | moyenne | **paires minimales absentes** | à surveiller | compatible | générateur | **DATA_GAP** |
| C. audio → vocalisation/marque | lecture, longueur, shadda | faible–moyenne | dérivable (`detectMarks`) | faible | compatible | générateur | **MVP (extension)** |
| D. 2 audios → mot affiché | association forme↔son | moyenne | audio (existant) | moyen (chevauché WORD_TO_AUDIO) | compatible | générateur | possible, priorité 2 |
| E. audio → son/trait ciblé | discrimination de sons difficiles | moyenne | dérivable (`detectDifficultLetters`) | faible | compatible | générateur | **MVP (recommandé)** |

**Recommandation MVP : Variante E** (avec C comme extension naturelle), toutes
deux **mappées sur `audio_recognition`**, dérivées de `phonetics.ts`, sans
migration ni donnée nouvelle. La Variante B est reportée à une phase de données
éditoriales (paires minimales réelles), hors Q2.

## 15. Mastery / migration (§14)

Ajouter `pronunciation_recognition` comme valeur de skill exigerait :
1. migration du `CHECK(skill IN 8 → 9)` ;
2. `SKILLS`, `SKILL_ORDER`, `SKILL_LABELS`, `defaultSkillToType`,
   `skillForExerciseType` ;
3. retester les agrégats (`aggregateSkillMastery`, `weakestSkills`, lecture
   `getUserSkillProgress` qui filtre par `SKILLS`).

**Non justifié au MVP** : l'écoute de référence est la même que
`audio_recognition`, la couverture d'Al-Fatiha ne fournit pas la distinction de
paires minimales qui motiverait une compétence dédiée, et le split créerait un
double comptage sur le même canal. `user_word_skill_progress` reste intact.

## 16. Matrice de non double comptage (§15)

| Exercice | Skill actuel | Skill proposé | Justification |
|---|---|---|---|
| AUDIO_TO_WORD | audio_recognition | audio_recognition (inchangé) | identité mot à l'écoute |
| WORD_TO_AUDIO | audio_recognition | audio_recognition (inchangé) | association forme↔audio auto-évaluée |
| PRONUNCIATION_GUIDED | null | null (inchangé) | production guidée, auto-évaluée (Q1) |
| SOUND_IDENTIFICATION (nouveau, E) | — | **audio_recognition** | discrimination de trait, encore « reconnaître à l'écoute » |
| VOCALIZATION_IDENTIFICATION (nouveau, C) | — | **audio_recognition** | identification de marque, même canal |

Aucun exercice ne cible deux skills simultanément → pas de double comptage.

## 17. Intégration parcours (§16)

- **Quand** : après l'introduction audio (`AUDIO_TO_WORD`), dans la même ronde
  `audio_recognition`.
- **Après combien d'expositions** : après que le mot a été vu en reconnaissance
  forme/sens (les rondes précédentes de `SKILL_ORDER`).
- **Fréquence max / répétition** : 1 exercice de discrimination par mot par ronde,
  **en remplacement** de `AUDIO_TO_WORD` quand le son ciblé est présent (pas
  d'ajout net), pour ne pas transformer une leçon de ~27 exercices en session
  longue.
- **Difficulté progressive** : d'abord les marques (C : longueur, shadda, madda),
  puis les sons difficiles (E : ح/ه, ص/س, ط/ت, ق/ك, ع/ء).
- **Bornage** : le générateur retourne `null` si le trait ciblé est absent → le
  séquenceur saute l'exercice (pas d'exercice vide).

## 18. UX conceptuelle (§17)

**Écoute** — « 🎧 Écoute le mot. »

**Reconnais** — « Quel son entends-tu ? » / « Quelle marque entends-tu ? »

```
[ ص ]   [ س ]        (sons, translittération en indice)
[ ◌ّ shadda ]  [ ◌ْ soukoun ]  (marques)
```

Feedback : « Bien joué, tu as reconnu le son. » / « Pas tout à fait. Réécoute
attentivement. » Pas de jargon, pas de gamification artificielle, pas de surcharge.

## 19. Accessibilité (§18)

Clavier (boutons, pas de div cliquables) ; lecteur d'écran (`role="radiogroup"`,
`aria-checked`, `aria-live="polite"` pour le feedback — déjà le pattern existant) ;
boutons ≥ 44/48 px (`min-h-12`/`size="xl"` existants) ; focus visible ; RTL via
`ArabicText` (Amiri) ; FR LTR ; labels audio explicites. **Alternative visuelle** :
la cible de la question est affichée (symbole de la marque, lettre + translittération),
et le mot arabe peut être révélé comme indice visuel — l'exercice ne dépend jamais
**exclusivement** du son (dégradable/skippable si audio indisponible).

## 20. Confidentialité (§19)

Q2 = **aucun micro, aucun `getUserMedia`, aucun `MediaRecorder`, aucun upload**.
Fonctionne entièrement avec l'audio de référence (URL signées `word-audio`). Le
micro reste réservé à Q3. Rien à changer : le chemin Q2 n'ajoute aucune capture.

## 21. Risques et non-régression (§21)

| Risque | Niveau | Mitigation |
|---|---|---|
| Paires minimales absentes (Variante B) | élevé | reporter B à une phase de données éditoriales |
| Double comptage mastery | élevé | pas de nouveau skill — mapping `audio_recognition` |
| Surcharge cognitive / leçon longue | moyen | remplacement de AUDIO_TO_WORD, pas d'ajout net |
| Dépendance exclusive au son | moyen | alternative visuelle + dégradation |
| Non-régression 24E/24F/24G/24H-B | moyen | nouveaux types additifs ; aucun générateur existant modifié |
| `submitSkillAttempts` non bloquant | faible | déjà documenté — les écritures mastery/SRS peuvent finir **après** l'écran de fin ; Q2 (mappé `audio_recognition`) emprunte le même chemin, sans impact nouveau |

> **Risque documenté (§21)** : la maîtrise/SRS peut être mise à jour en
> arrière-plan après l'écran de fin. Impact conceptuel sur Q2 : **nul** tant que
> Q2 reste mappé sur `audio_recognition` (même chemin best-effort). Si une
> compétence dédiée était un jour ajoutée, elle hériterait du même caractère
> non bloquant — à intégrer dans la décision de Q3/Q4.

## 22. Plan de tests (§20)

Défini sans implémentation : voir `tmp/phase24hq2-a/test-plan.json` (T1–T15).

## 23. Livrables JSON

`tmp/phase24hq2-a/` : `code-architecture.json`, `skill-analysis.json`,
`exercise-analysis.json`, `audio-analysis.json`,
`phonetic-discrimination-matrix.json`, `al-fatiha-recognition-matrix.json`,
`mastery-impact.json`, `srs-impact.json`, `sequence-analysis.json`,
`ux-design.json`, `accessibility-analysis.json`, `privacy-analysis.json`,
`test-plan.json`, `risk-register.json`, `proposed-architecture.json`,
`decision.json`.

---

## 24. Décision finale

**`NOT_JUSTIFIED_AS_SEPARATE_SKILL`**

`pronunciation_recognition` ne doit **pas** devenir une nouvelle valeur de
compétence DB au Q2-MVP. La reconnaissance phonétique de Q2 est livrable comme de
**nouveaux types d'exercice** (Variante E recommandée, C en extension), mappés sur
la compétence existante `audio_recognition`, **sans migration et sans donnée
nouvelle**. La Variante B (paires minimales) est bloquée par une absence de
données dans Al-Fatiha (DATA_GAP éditorial, hors Q2).

**Aucune implémentation ne démarre** (la conclusion n'est pas
`READY_FOR_IMPLEMENTATION`). Le propriétaire peut approuver un Q2-B sous la forme
« exercices de discrimination mappés `audio_recognition`, sans migration », ou
demander un complément éditorial de paires minimales avant de reconsidérer une
compétence dédiée.

## 25. Arrêt obligatoire

Aucun démarrage de 24H-Q2-B, 24H-Q3, 24I, 24J, 24K, 23G, SRS avancé, gamification,
ni extension aux 114 sourates.
