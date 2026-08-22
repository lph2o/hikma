# PHASE 24H-Q — CONCEPTION COMPLÈTE DU SYSTÈME PHONÉTIQUE & PRONONCIATION HIKMA

STATUS = `PHONETIC_PRONUNCIATION_DESIGN_COMPLETE`
DÉCISION = `ARCHITECTURE_REVIEW_REQUIRED`

> Phase **design-only / read-only** : aucune migration, aucune écriture DB/Storage,
> aucun import, aucune modification de code, UI, moteur, grading, curriculum ou tests.

---

## 1. Résumé exécutif

Hikma sait aujourd'hui faire **voir** (forme), **entendre** (audio Muallim 21 295),
**comprendre** (gloses FR) et **reconnaître à l'écoute** (`audio_recognition`).
Il ne sait pas encore faire **prononcer**.

Cette phase conçoit l'intégralité du futur système phonétique :

- **MVP sans IA** : `ÉCOUTER → RÉPÉTER → ENREGISTRER (local) → RÉÉCOUTER →
  COMPARER (soi-même) → RÉESSAYER` — réalisable avec l'existant + une **lecture
  guidée des diacritiques**.
- **Compétences futures** : `pronunciation_recognition` et
  `pronunciation_production` (conceptuelles, exigent une migration du `CHECK`).
- **Feedback automatique** : seulement plus tard, via une **comparaison acoustique
  locale prudente** avec seuil de confiance — **jamais un STT générique**.
- **Tajwid** : extension séparée, hors périmètre de la prononciation de mot.

Décision finale : `ARCHITECTURE_REVIEW_REQUIRED` — l'architecture est prête, mais
la donnée phonétique structurée et les choix de confidentialité/technologie
doivent être tranchés par le propriétaire avant toute implémentation.

---

## 2. Distinction fondamentale des concepts

| Concept | Définition simple | Donnée |
|---|---|---|
| **FORME** | la représentation écrite du mot (`مَـٰلِكِ`) | `quran_words.arabic` — **disponible** |
| **VOCALISATION** | signes diacritiques (fatha, damma, kasra, sukun, shadda, tanwin, madda, dagger alef, wasla) qui indiquent comment lire | présents graphiquement, **non structurés** |
| **TRANSLITTÉRATION** | approximation latine (`māliki`) — aide secondaire | `quran_words.transliteration` — **100 %** |
| **PHONÈME** | unité sonore distinctive (`/m/ /ā/ /l/ /i/ /k/`) | **absente** |
| **PRONONCIATION** | la réalisation orale du mot | **absente** (compétence + donnée) |
| **MAKHRAJ** | point d'articulation (« où se forme le son ») | **absent** |
| **TAJWID** | règles de récitation (allongement, assimilation, qualités) | **absent** (extension future) |
| **AUDIO** | modèle sonore réel | `word_audio` Muallim — **21 295** |

---

## 3. Audit des données (A–G)

- **A. Ce qui existe** : forme arabe, vocalisation graphique, translittération
  (21 296/21 296), audio (21 295, `.opus`, bucket `muallim`), gloses FR (26/26),
  lemmes (12/26 mappés, `lemma_arabic` présent, `lemma_transliteration` NULL).
- **B. Fiable** : forme, translittération, audio, glose FR.
- **C. Incomplet** : vocalisation (non structurée), lemmes (12/26),
  `word_audio.duration` (NULL).
- **D. Calculable** : durée/alignement (au moment de la lecture), lecture guidée
  des diacritiques (partiellement, à valider), paires minimales (si présentes).
- **E. À créer** : lecture guidée, règles de lecture, makharij, segmentation.
- **F. À obtenir d'une source externe** : segmentation phonémique fiable,
  éventuellement données tajwid — **REVIEW_REQUIRED** (licence non audité).
- **G. Validation humaine** : toute donnée phonétique/tajwid.

Détail : `tmp/phase24hq-phonetic-data-gaps.json`.

---

## 4. Translittération

- **Source** : Quran.com word-by-word (déjà importée, licence établie Phase 5/7).
- **Couverture** : 100 % (21 296/21 296).
- **Cohérence/qualité** : correcte comme **indice**, mais **approximative**
  (elle ne rend pas l'emphase, la durée des voyelles longues, ni les makharij).
- **Adéquation débutant francophone** : utile, mais insuffisante pour **produire**
  le son exact.
- **Principe retenu** : `ARABE → priorité` · `AUDIO → modèle principal` ·
  `TRANSLITTÉRATION → aide éventuelle`.

---

## 5. Sons difficiles pour un francophone

| Son | Dans Al-Fatiha | Problème | Erreur type | Introduction |
|---|---|---|---|---|
| ح (ḥā') | الحمد، الرحمن، الرحيم | souffle pharyngal | « h » muet/expiré | dès 1:1 |
| ع (ʿayn) | عليهم، أنعمت، نستعين، العالمين، المغضوب | aucun équivalent | omission / hamza | dès 1:7 |
| غ (ghayn) | غير، المغضوب | proche du « r » grasseyé | « r » / « g » | dès 1:7 |
| ق (qāf) | المستقيم | occlusive uvulaire | « k » | 1:6 |
| ص (ṣād) | الصراط، صراط | « s » emphatique | « s » | 1:6/7 |
| ض (ḍād) | الضالين، المغضوب | « d » emphatique | « d » / « ẓ » | 1:7 |
| ط (ṭā') | صراط، الصراط | « t » emphatique | « t » | 1:6/7 |
| ذ (dhāl) | الذين | « th » voisé | « z » / « d » | 1:7 |
| خ ث ظ ش | hors Al-Fatiha | généraux | — | plus tard |

**Voyelles/marques** : voyelles longues (dagger alef, madda) vs courtes ; shadda
(doublement) ; sukun (arrêt bref) ; wasla (liaison) ; hamza (coup de glotte) ;
tanwin (absent d'Al-Fatiha).

Détail pédagogique : `tmp/phase24hq-phonetic-curriculum.json`.

---

## 6. Makharij — simplement

Principe : **« Où se forme le son ? »** avant toute terminologie.

- **Affiché** : une aide visuelle minimale (gorge/bouche) + « En savoir plus ».
- **Caché derrière « En savoir plus »** : noms techniques (ḥalq, lisān, shafatayn).
- **Réservé au niveau avancé** : classement complet des makharij.

Exemples : `ح` = souffle du fond de la gorge ; `ق` = un « k » tout au fond ;
`ص ض ط` = sons « lourds » (langue creusée).

---

## 7. Frontière phonétique ↔ tajwid

- **WORD PHONETICS** (maintenant) : voyelles + consonnes + shadda + sukun + madda
  → nécessaire pour prononcer un **mot**.
- **CONTEXTUAL RECITATION** (verset) : liaisons wasla, assimilation frontalière.
- **TAJWID AVANCÉ** (plus tard) : allongement (madd règles), qalqala,
  tafkhim/tarqiq, ghunna.

Ne pas transformer la première version en cours de tajwid.

---

## 8. Progression pédagogique (14 étapes)

La progression du cahier des charges est **optimale** ; on regroupe simplement
les étapes 9–12 en une boucle « Enregistre → Compare → Réessaie » :

1. Écouter → 2. Observer la forme → 3. Observer la vocalisation (une diacritique
à la fois) → 4. Écouter encore → 5. Identifier les sons → 6. Découper →
7. Répéter avec le modèle → 8. Répéter sans le modèle → 9–12. Enregistrer →
Réécouter → Comparer → Réessayer → 13. Produire dans le verset → 14. Stabiliser.

---

## 9. Familles d'exercices (futures)

| Famille | Existant | Utile |
|---|---|---|
| AUDIO → FORME | oui (AUDIO_TO_WORD) | — |
| AUDIO → SENS | non | **oui** (son↔sens) |
| FORME → AUDIO | partiel (WORD_TO_AUDIO) | à compléter |
| SON → FORME | non | **oui** (cibler un son difficile) |
| FORME → SON | non | **oui** |
| DIFFÉRENCIATION DE SONS (غ/ع, ص/س, ض/د…) | non | **oui** |
| ÉCOUTER → RÉPÉTER | non | **oui** |
| RÉPÉTER → ENREGISTRER | non | **oui** |
| PRODUCTION LIBRE orale | non | **oui** |
| PRONONCIATION EN CONTEXTE | non | oui (plus tard) |

Aucun générateur existant modifié.

---

## 10. Enregistrement (conceptuel)

`getUserMedia` + `MediaRecorder`, **100 % local**, HTTPS requis, permission
explicite et révocable, **aucun upload par défaut**, suppression immédiate après
comparaison, format léger (`opus`/`webm`, cohérent avec l'audio de référence).
Détail : `tmp/phase24hq-pronunciation-ux-design.json`.

---

## 11. Comparaison de prononciation (A–F)

| Approche | Précision | Confidentialité | Faux ± | Verdict |
|---|---|---|---|---|
| A. audio brute | faible | bonne | élevés | à éviter |
| B. acoustique (MFCC/DTW) | moyenne | bonne (local) | moyens | candidate |
| C. phonétique (phonèmes) | moyenne–bonne | dépend | moyens | plus tard |
| D. STT générique | faible (coranique) | à risque | élevés | **non comme juge** |
| E. modèle spécialisé | élevée | à évaluer | faibles | avancé |
| F. hybride | bonne pragmatique | bonne | maîtrisés | **recommandé** |

**Règle STT** : `STT réussi ≠ prononciation correcte` ; `STT échoué ≠
prononciation incorrecte`. Verdict `CORRECT / INCORRECT / REVIEW_REQUIRED`,
jamais catégorique si la confiance est insuffisante.

---

## 12. Feedback pédagogique

- CORRECT : « Très bien. »
- PRESQUE : « Presque. Réécoute le modèle puis essaie encore. »
- DIFFICULTÉ : « Écoute bien le son خ puis répète doucement. » (son adapté au mot)
- INCERTAIN : « Je ne suis pas suffisamment sûr de ta prononciation. Réessaie. »

Jamais humiliant, jamais une sanction.

---

## 13. Mastery — intégration

- **Ne pas confondre** avec `audio_recognition` (identifier à l'écoute).
- **Compétences proposées** : `pronunciation_recognition` (lire/discriminer) et
  `pronunciation_production` (produire).
- **Modèle réutilisé** : `user_word_skill_progress` (compteurs + récence +
  précision) tel quel ; **migration** requise pour étendre le `CHECK(skill in 8)`.
- **Confiance** : le verdict n'est écrit qu'au-dessus d'un seuil, sinon
  `REVIEW_REQUIRED` (neutre, jamais pénalisant).
- **Réactivation** : avec le rappel et la rétention existants, sans boucle SRS
  distincte au MVP.

Détail : `tmp/phase24hq-pronunciation-mastery-design.json`.

---

## 14. Intégration Michel Thomas

La phonétique s'insère dans la boucle existante, sans section isolée :

```
nouveau mot → sens → forme → écoute → PRONONCIATION → rappel → contexte → révision
```

---

## 15. Prototype Al-Fatiha (5 mots)

Conçu en détail pour `مَـٰلِكِ`, `ٱلرَّحْمَـٰنِ`, `صِرَٰطَ`, `إِيَّاكَ`,
`ٱلضَّآلِّينَ` (forme, sens, audio, translittération, sons difficiles, phonèmes,
articulation, exercice, répétition, enregistrement, comparaison, feedback,
mastery, révision). Voir `tmp/phase24hq-al-fatiha-phonetic-design.json`.

Matrice complète des **26 formes** (difficulté 1–5, sons particuliers, statut
READY pour le design / DATA_GAP pour la donnée phonétique) dans le même fichier.

---

## 16. MVP

**`ÉCOUTER → RÉPÉTER → ENREGISTRER (local) → RÉÉCOUTER → COMPARER (soi-même) →
RÉESSAYER`** — sans IA, traitement local, sans analyse automatique au départ,
assistance humaine non requise. C'est la seule brique qui n'exige **ni micro en
production, ni analyse acoustique, ni migration de compétence, ni donnée externe**.

---

## 17. Roadmap P0 → P3

- **P0** — `24H-Q1` : lecture guidée des diacritiques (26 formes) + production
  guidée sans verdict (local, optionnelle).
- **P0** — `24H-Q2` : compétence `pronunciation_recognition` + exercices
  FORME→SON / SON→FORME / DIFFÉRENCIATION (verdict déterministe).
- **P1** — `24H-Q3` : compétence `pronunciation_production` + comparaison
  acoustique locale prudente (seuil de confiance).
- **P2** — `24H-Q4` : segmentation phonémique + makharij + feedback par phonème.
- **P3** — `24H-Q5` : tajwid (extension séparée).

**Prochaine phase recommandée : `24H-Q1`.**

---

## 18. Réponses aux 26 questions

1. Enseigner la prononciation aujourd'hui ? **Non.** 2. Sait déjà faire ?
Entendre, reconnaître à l'écoute, voir la translittération, afficher les
diacritiques. 3. Manque ? Production orale, feedback, données phonétiques,
compétence dédiée. 4. Phonétique vs tajwid ? lire/prononcer un mot vs règles de
récitation. 5. Phonétique vs translittération ? le son réel vs une approximation
latine. 6. Sons prioritaires ? ع غ ح ص ض ط ق ذ + voyelles + shadda/sukun/madda.
7. Sons difficiles d'Al-Fatiha ? ع غ ح ص ض ط ذ + shadda + dagger alef/madda + wasla.
8. Makharij simplement ? « où se forme le son » avant la terminologie.
9. Quand le tajwid ? plus tard (WORD → CONTEXTE → TAJWID). 10. Exercices à créer ?
8 familles listées §9. 11. Intégration aux leçons ? dans la boucle existante §14.
12. Intégration mastery ? verdict unique + table générique. 13. Compétences à
ajouter ? oui, 2. 14. Enregistrer la voix ? getUserMedia/MediaRecorder local.
15. Analyser la voix ? auto-comparaison puis acoustique locale. 16. STT ? non
comme juge. 17. Technologie ? hybride en deux temps. 18. Architecture ? pipeline
§19. 19. Données nécessaires ? lecture guidée (P0), durée (P0), segmentation (P1),
règles (P1), makharij (P2). 20. Données déjà là ? forme/vocalisation/translit/
audio/glose. 21. Sources externes ? à déterminer (REVIEW_REQUIRED). 22. Licence ?
aucune déclarée libre — REVIEW_REQUIRED. 23. MVP ? §16. 24. Roadmap ? §17.
25. Risques ? faux +/- , confidentialité, surcharge, données, licences. 26. Phase
suivante ? `24H-Q1`.

---

## 19. Architecture future (conceptuelle, aucune migration)

```
quran_word → phonetic_representation → phoneme_segments → pronunciation_rules
→ reference_audio → user_recording → analysis → confidence → feedback
→ pronunciation_mastery
```

Tables conceptuelles : `word_phonetic` (lecture guidée), `word_phoneme_segments`
(découpage), `user_pronunciation_attempts` (verdict + confiance, sans audio par
défaut). Modules : `lib/pronunciation/{phonetic-guide, recorder, analysis}` +
`components/ui/pronunciation-exercise.tsx`. **Aucune migration dans cette phase.**

---

## 20. Compatibilité avec l'existant

Additive : ne touche ni au resolver, ni au grading (24H-B), ni au curriculum, ni
à LessonPlayer/ReviewPlayer, ni à la session (24E), ni à l'AudioPlayer (24F), ni
à l'exercice UX (24G), ni à la maîtrise existante, ni aux RLS, ni aux données
lexicales. La prononciation **s'ajoute**, elle ne remplace rien.

---

## 21. Risques

P0 : faux positifs/négatifs d'apprentissage, confidentialité. P1 : surcharge
cognitive, bruit/micro, mauvaise détection. P2 : données insuffisantes, tajwid
simplifié à tort, dépendance fournisseur, licences. Registre complet :
`tmp/phase24hq-pronunciation-risk-register.json`.

---

## 22. Non-régression + immutabilité

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
`word_lemma_mapping` 183. **0 migration, 0 import, 0 modification.**

---

## 23. Décision finale

**`ARCHITECTURE_REVIEW_REQUIRED`** — l'architecture est complète et le MVP sans
IA est réalisable avec l'existant, mais la donnée phonétique structurée et les
choix de confidentialité/technologie/licence doivent être validés par le
propriétaire avant toute implémentation.

---

## 24. Arrêt obligatoire

Phase terminée. **Aucune implémentation** : pas de table phonétique, pas de
compétence, pas de microphone, pas d'enregistrement, pas de STT, pas d'analyse
acoustique, pas de phonèmes, pas d'import, pas de modification du curriculum/
exercices/mastery/SRS/UI/grading. La phase suivante sera décidée après lecture.
