# PHASE 24H-P — AUDIT PHONÉTIQUE ET PRONONCIATION DU MOTEUR PÉDAGOGIQUE

STATUS = `PHONETIC_DATA_GAP`

> Audit **read-only** : aucune implémentation, aucune migration, aucune écriture
> DB/Storage, aucune modification du code de production, des données ou des tests.

---

## 1. Réponse directe à la question centrale

**Hikma fait ENTENDRE les mots, mais n'apprend pas encore à les PRONONCER.**

| Dimension | Couverture |
|---|---|
| Audio (entendre) | **26/26** Al-Fatiha — 21 295 word_audio Muallim |
| Translittération (lire en latin) | **26/26** — 21 296/21 296 (100 %) |
| Phonétique (données phonémiques/articulatoires) | **0/26** — absente |
| Prononciation (produire + feedback) | **0/26** — absente |

`word_audio = 21 295` ne signifie **pas** que la prononciation est maîtrisée :
l'audio permet d'**entendre**, pas de **prononcer** ni d'être **corrigé**.

---

## 2. Ce qui existe réellement (audit du code)

- **AudioPlayer** (`components/ui/audio-player.tsx`) : play / pause / replay /
  réessayer + états idle/loading/playing/paused/ended/error. **Aucun micro,
  aucun enregistrement, aucun retour** (`getUserMedia` / `MediaRecorder` /
  `SpeechRecognition` : 0 occurrence dans le code).
- **AUDIO_TO_WORD** (`lib/exercises/generators/audio.ts`) : écouter → identifier
  la forme arabe (QCM). Compétence `audio_recognition`.
- **WORD_TO_AUDIO** : voir la forme → écouter → auto-évaluation
  « Je le reconnais à l'écoute ». Compétence `audio_recognition`.
- **Translittération** (`quran_words.transliteration`, source Quran.com WbW) :
  utilisée comme **indice passif** (découverte, `TRANSLATION_TO_WORD`) et par une
  seule QCM `MULTIPLE_CHOICE` (« Comment se prononce ce mot ? », compétence
  `form_recognition`). **Ce n'est pas un système d'apprentissage phonétique.**
- **Diacritiques** (fatha/damma/kasra/sukun/shadda/tanwin/madda/dagger alef/wasla) :
  **affichées graphiquement** dans le texte arabe et **normalisées** par le grader
  (24H-B), mais **aucun exercice n'apprend à les lire**.

**Compétences** (`lib/learning/skills.ts`) : 8 compétences —
`form_recognition`, `meaning_recognition`, `form_to_meaning`, `meaning_to_form`,
`audio_recognition`, `context_recognition`, `lemma_relation`, `retention`.
**Aucune compétence de prononciation.** `audio_recognition` = « identifier à
l'écoute », pas « prononcer ».

---

## 3. Capacités (A → G)

| # | Capacité | Verdict | Support actuel |
|---|---|---|---|
| A | AUDIO_RECOGNITION (entendre → reconnaître la forme) | **YES** | `AUDIO_TO_WORD` |
| B | FORM_TO_AUDIO (voir → associer l'audio) | **PARTIAL** | `WORD_TO_AUDIO` (écoute + auto-évaluation, pas d'appariement avec distracteurs) |
| C | AUDIO_TO_MEANING (entendre → retrouver le sens) | **NO** | — |
| D | AUDIO_TO_FORM (entendre → retrouver la forme) | **YES** | `AUDIO_TO_WORD` (identique à A) |
| E | PRONUNCIATION_RECOGNITION (comprendre comment prononcer) | **PARTIAL** | translittération (indice + QCM), diacritiques seulement affichées |
| F | PRONUNCIATION_PRODUCTION (prononcer soi-même) | **NO** | — |
| G | PRONUNCIATION_FEEDBACK (recevoir un retour) | **NO** | — |

**`PRONUNCIATION_PRODUCTION = MISSING`** et **`PRONUNCIATION_FEEDBACK = MISSING`**.

---

## 4. Distinction des concepts (rappels §2)

- **FORME** `مَـٰلِكِ` — écrite, présente.
- **SIGNIFICATION** « souverain / maître » — présente (glose FR validée).
- **AUDIO** — présent (fichier Muallim).
- **PRONONCIATION** — la capacité de l'apprenant à lire correctement : **absente**.
- **PHONÉTIQUE** — représentation/analyse du son : **absente**.
- **TRANSLITTÉRATION** `māliki` — présente mais **secondaire** ; l'objectif reste
  **ARABE → SON → COMPRÉHENSION**, jamais ARABE → LATIN → COMPRÉHENSION.

---

## 5. Données disponibles (AVAILABLE / PARTIAL / MISSING / UNVERIFIED)

| Donnée | Statut |
|---|---|
| Translittération | **AVAILABLE** (100 %) |
| Audio de référence | **AVAILABLE** (21 295 Muallim) |
| Voyelles courtes (harakat) | **AVAILABLE** (affichées, non enseignées) |
| Shadda / sukun / madda / hamza | **AVAILABLE** (diacritiques dans le texte) |
| Tanwin | **PARTIAL** (0/26 en Al-Fatiha) |
| Durée des segments audio | **MISSING** (`word_audio.duration` = NULL) |
| Phonèmes / segmentation phonétique | **MISSING** |
| Règles de lecture | **MISSING** |
| Tajwid (makhraj, tafkhim, allongement) | **MISSING** |
| Articulation (makhraj) | **MISSING** |

---

## 6. Cas Al-Fatiha — matrice des 26 formes

Chaque forme a : **arabe + glose FR + audio + translittération** ; **aucune**
n'a de donnée phonétique, d'exercice de lecture, ni de feedback de prononciation.

Répartition des diacritiques (26 formes) : fatha 24 · kasra 22 · sukun 13 ·
wasla 12 · shadda 11 · damma 5 · dagger alef 5 · madda 1 · tanwin 0.

Matrice complète : `tmp/phase24h-al-fatiha-phonetic-matrix.json`.

```
AUDIO_COVERAGE        = 26/26
TRANSLITERATION_COVERAGE = 26/26
PHONETIC_COVERAGE     = 0/26
PRONUNCIATION_COVERAGE = 0/26
```

---

## 7. Rupture dans la méthode pédagogique

Le moteur couvre : **VOIR → ENTENDRE → COMPRENDRE → RAPPELER → RECONNAÎTRE
DANS LE CONTEXTE → RETENIR**. La rupture se situe entre **ENTENDRE** et
**PRONONCER** :

```
VOIR → ENTENDRE → COMPRENDRE → RAPPELER ─┐
                                          ├─→ (rupture) PRONONCER → FEEDBACK
RECONNAÎTRE DANS LE CONTEXTE → RETENIR ───┘
```

Il manque l'étape de **production orale** et son **retour**.

---

## 8. Michel Thomas — principes compatibles (pas de copie)

Appliquer à la prononciation sans transformer Hikma en appli de conversation :

- compréhension avant mémorisation mécanique ;
- rappel actif (lire le mot, pas seulement le reconnaître) ;
- construction progressive (introduire les diacritiques une à une) ;
- réduction de la charge cognitive (une seule tâche sonore) ;
- production progressive + feedback immédiat ;
- réutilisation des acquis (les mots déjà appris servent de support).

---

## 9. Tajwid — hors périmètre

Cet audit porte sur **lire/prononcer correctement un mot** (voyelles, consonnes).
Le **tajwid** (règles d'allongement, tafkhim, récitation) est une **extension
séparée**, à documenter comme future phase. Ne pas les confondre.

---

## 10. Technologie d'évaluation de la prononciation (analyse, sans décision)

| Option | Précision | Limites | Coût | Confidentialité | Mobile/Web | Risques |
|---|---|---|---|---|---|---|
| A. Auto-évaluation | faible | pas de mesure objective | nul | totale | excellent | faux sentiment de compétence |
| B. Comparaison audio vs référence (DTW/MFCC local) | moyenne | bruit/micro, phonèmes emphatiques | faible–moyen | bonne (local) | bon | faux +/- sur phonèmes proches |
| C. Speech-to-text arabe | faible | gère mal le coranique vocalisé/mot isolé | moyen | à risque (API tierce) | bon | faux +/- massifs |
| D. Forced alignment | bonne* | *exige une segmentation phonémique ABSENTE | moyen | dépend hébergement | moyen | dépend de la qualité de la donnée |
| E. Reconnaissance de phonèmes | moyenne–bonne | phonèmes coraniques difficiles | moyen–élevé | dépend | moyen | confusion sīn/ṣād, ḍād/ẓā… |
| F. Modèle spécialisé coranique | élevée | coût de dev/données | élevé | à évaluer | moyen–bon | sur-ingénierie prématurée |

**Direction recommandée (conceptuelle)** : commencer par une **production
guidée sans verdict automatique** — *Écoute → Répète → Enregistre → Compare →
Réessaie* — puis, seulement si nécessaire, une comparaison acoustique **locale
prudente** (B). Jamais un STT générique comme source de vérité.

Détail : `tmp/phase24h-pronunciation-technology-analysis.json`.

---

## 11. Maîtrise (mastery) — intégration conceptuelle

- `user_word_skill_progress` est **générique** (user_id, word_id, skill,
  compteurs) et peut représenter une future compétence de prononciation.
- La colonne `skill` porte un `CHECK (skill in … 8 valeurs)`
  (migration `0023`) : ajouter `pronunciation_production` exigerait **une
  migration** (étendre la contrainte) + étendre l'union `Skill`, `WordSkill`,
  `SKILLS`/`SKILL_LABELS`/`SKILL_ORDER`, `skillForExerciseType`, et un
  générateur + un composant UI.
- Le verdict de prononciation devrait être **une source unique** (même principe
  que `gradeFreeResponse`) consommée par mastery/rétention — **aucune seconde
  source de vérité**.

Architecture proposée : `tmp/phase24h-pronunciation-architecture.json`.

---

## 12. Réponses aux 14 questions du cahier des charges

1. **Hikma apprend-elle à prononcer ?** Non.
2. **Permet-elle seulement d'écouter ?** Oui (audio passif).
3. **Couverture audio ?** 26/26 (Al-Fatiha), 21 295 mots au total.
4. **Couverture phonétique ?** 0/26.
5. **Couverture prononciation ?** 0/26.
6. **Apprendre Al-Fatiha mot par mot avec prononciation ?** Partiel : voir/
   entendre/comprendre oui ; guider/corriger sa prononciation non.
7. **Ce qui manque exactement ?** Production orale, feedback, micro/
   enregistrement, données phonémiques/lecture/durée.
8. **Données nécessaires ?** Segmentation phonémique, durée/alignement de
   référence, règles de lecture minimales.
9. **Technologie nécessaire ?** D'abord production guidée sans verdict auto,
   puis éventuellement comparaison acoustique locale prudente.
10. **Compétence de mastery séparée ?** Oui (conceptuellement) —
    `pronunciation_production` (+ éventuellement `pronunciation_feedback`).
11. **Intégration sans surcharge ?** Étape courte, optionnelle, non punitive,
    une seule tâche sonore, mobile-first.
12. **Place de la translittération ?** Indice secondaire uniquement — jamais le
    système principal.
13. **Place du tajwid ?** Extension séparée, hors périmètre.
14. **Phases après cet audit ?** (voir §13).

---

## 13. Phases nécessaires après cet audit (proposition, non exécutée)

1. **24H-P1** — données de lecture minimales : règles de prononciation des
   diacritiques (fatha/kasra/damma/sukun/shadda/madda) pour les 26 formes.
2. **24H-P2** — production guidée sans verdict automatique (Écoute → Répète →
   Enregistre → Compare → Réessaie) via `getUserMedia` local.
3. **24H-P3** — compétence `pronunciation_production` (+ migration CHECK) et
   feedback acoustique local prudent.
4. **24H-P4 (optionnel)** — extension tajwid séparée.

---

## 14. Non-régression + immutabilité

| Vérification | Résultat |
|---|---|
| `npm test` | **328/328** |
| `npx tsc --noEmit` | **0 erreur** |
| `npm run lint` | **clean** |
| `npm run build` | **OK** |
| `npm run verify:persistence` | **13/13** |
| `npm run verify:rls` | **44/44** |

Données inchangées : `quran_words` 21 296 · `word_occurrences` 77 430 ·
`word_audio` 21 295 · `ayah_audio` 0 · `lemmas` 32 · `word_translations FR` 25 ·
`word_lemma_mapping` 183. **0 migration, 0 import, 0 modification UI/moteur/grading/curriculum.**

---

## 15. Arrêt obligatoire

Audit terminé. **Aucune implémentation** : pas de migration, pas d'import, pas de
modification UI, moteur, grading, curriculum. Le propriétaire examine ce rapport
avant d'autoriser une phase de prononciation.
