# PHASE 24H-DISCOVERY-UX — AUDIT DE L'ÉTAPE DÉCOUVERTE

## STATUT

`AUDIT_COMPLETE_READY_FOR_APPROVAL`

ÉTAPE A réalisée en **READ_ONLY**. Aucun fichier source, aucune donnée, aucune
migration, aucun SRS/mastery/grading/curriculum modifié. Seuls les livrables
d'audit (rapport + JSON + script de lecture) ont été créés dans `tmp/`.

---

## 1. CAUSE RACINE — PROBLÈME 1 (audio uniquement sur le 1ᵉʳ mot)

**La donnée est complète. Le problème est 100 % UI, introduit volontairement en Q1.**

| Vérification | Résultat |
|---|---|
| `word_audio` DB (8 mots `iyyaka-nabudu`) | **8/8 présents** (`registered: 8`) |
| Chemin Storage | `muallim/{word_id}.opus` — valide (pattern `WORD_AUDIO_PATH_PATTERN`) |
| URL signée sous rôle **ANON** (rôle réel de la page) | **8/8 signées** (`signed: 8`) |
| HTTP réel (GET Range) | **8/8 → 206 (lisible)** |
| `service_role` exposé au client | **non** (signature par le client ANON, `lib/learning/queries.ts`) |

**Cause exacte** : dans `app/(app)/learn/[slug]/page.tsx`, `getWordAudioState`
retourne bien `audioByWord` (Map de 8 URLs signées), mais cette Map n'est passée
qu'aux **générateurs d'exercices**. La carte de prononciation guidée est générée
uniquement pour `bank[0]` (premier mot) :

```ts
const guidedPronunciation = generateExercise("PRONUNCIATION_GUIDED", {
  target: bank[0]!, // ← PREMIER mot uniquement (commentaire explicite « sur le PREMIER mot »)
  audioUrl: audioByWord.get(bank[0]!.wordId) ?? null,
});
```

Et dans `components/learn/lesson-player.tsx`, le type `DiscoveryWord` **n'a pas de
champ `audioUrl`**, donc la boucle `words.map(...)` des cartes de Découverte ne
rend **aucun** lecteur audio — elle n'affiche que arabe + translittération + sens.
Conclusion : les 8 mots ont un audio réel, mais l'UI ne le rend accessible que
via la carte unique du premier mot.

## 2. CAUSE RACINE — PROBLÈME 2 (réponses exposées)

Deux canaux d'exposition, cumulés :

1. **Cartes de Découverte** (`lesson-player.tsx`) : chaque carte affiche
   `word.meaning` directement (le sens FR validé ou le repli EN). C'est la réponse
   exacte des exercices de rappel (`FORM_TO_MEANING` : « Que signifie نَعْبُدُ ? »).
2. **Verset étudié** (`getLessonAyahContext`) : la traduction Hamidullah du verset
   1:5 affichée au-dessus de la Découverte contient **mot pour mot** le sens de
   deux mots : « **nous adorons** » (نَعْبُدُ) et « **nous implorons le secours** »
   (نَسْتَعِينُ).

**Verset réel affiché** (audit DB) : `إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ`
→ « C'est toi que nous adorons, c'est toi dont nous implorons le secours. »

## 3. MATRICE AUDIO (8/8)

| # | mot | word_audio DB | Storage | signed ANON | HTTP | UI |
|---|---|---|---|---|---|---|
| 1 | إِيَّاكَ | ✅ | muallim/{uuid}.opus | ✅ | 206 | ❌ (carte muette, seule la carte guidée du 1ᵉʳ mot a l'audio) |
| 2 | نَعْبُدُ | ✅ | ✅ | ✅ | 206 | ❌ |
| 3 | وَإِيَّاكَ | ✅ | ✅ | ✅ | 206 | ❌ |
| 4 | نَسْتَعِينُ | ✅ | ✅ | ✅ | 206 | ❌ |
| 5 | مَـٰلِكِ | ✅ | ✅ | ✅ | 206 | ❌ |
| 6 | يَوْمِ | ✅ | ✅ | ✅ | 206 | ❌ |
| 7 | ٱلدِّينِ | ✅ | ✅ | ✅ | 206 | ❌ |
| 8 | ٱلرَّحْمَـٰنِ | ✅ | ✅ | ✅ | 206 | ❌ |

(Preuve brute : `tmp/phase24h-discovery-ux/audio-audit.json`.)

## 4. MATRICE DE FUITE PÉDAGOGIQUE

Sens affiché en Découverte vs traduction du verset 1:5.

| mot | sens affiché (Découverte) | langue | présent dans le verset ? | niveau de fuite |
|---|---|---|---|---|
| إِيَّاكَ | « Toi seul / c'est Toi que » | fr validé | « c'est toi que… » (phrase) | **FORTE** |
| نَعْبُدُ | « nous adorons » | fr validé | « nous adorons » mot pour mot | **TOTALE** |
| وَإِيَّاكَ | « et Toi seul / et c'est Toi que » | fr validé | « c'est toi dont… » (phrase) | **FORTE** |
| نَسْتَعِينُ | « nous implorons le secours » | fr validé | « nous implorons le secours » mot pour mot | **TOTALE** |
| مَـٰلِكِ | « souverain / maître » | fr validé | non (mot de révision, verset 4) | AUCUNE (du verset) — mais fuite via la **carte mot** |
| يَوْمِ | « (of the) Day » | **en (repli)** | non | AUCUNE (du verset) — fuite via la **carte mot** |
| ٱلدِّينِ | « rétribution / religion » | fr validé | non | AUCUNE (du verset) — fuite via la **carte mot** |
| ٱلرَّحْمَـٰنِ | « le Tout Miséricordieux » | fr validé | non | AUCUNE (du verset) — fuite via la **carte mot** |

**Synthèse** :
- La **carte mot** expose le sens de **8/8** mots (c'est le problème dominant).
- Le **verset** expose directement le sens de **2/8** mots (نَعْبُدُ, نَسْتَعِينُ)
  et partiellement 2 autres (إِيَّاكَ, وَإِيَّاكَ).
- Le verset ne compromet **pas** les 4 mots de révision (5–8).
- Anomalie annexe (non bloquante) : `يَوْمِ` retombe sur la glose **anglaise**
  « (of the) Day » (FR non validé pour ce mot) — cohérent avec le README Phase 5.

## 5. FLUX ACTUEL (Découverte)

```
Verset étudié (arabe + traduction FR)          ← Niveau 1 (contexte)
   ↓
Carte « Prononciation guidée » (1ᵉʳ mot SEUL)  ← Niveau 2 (audio + micro)
   ↓
Carte Mot 1..8 : arabe + translittération + SENS ← Niveau 3 (fuite : sens auto-affiché)
   ↓
[ Commencer les exercices ]
```

## 6. ARCHITECTURE CORRECTIVE PROPOSÉE (ÉTAPE B, après approbation)

Niveaux ciblés (principe CONTEXTE ≠ RÉPONSE) :

```
Niveau 1 — Contexte : verset arabe + traduction FR (conservé)
Niveau 2 — Mot : arabe + translittération + 🎧 Écouter (AudioPlayer existant)
Niveau 3 — Aide volontaire : [ Voir le sens ] (masqué par défaut)
Niveau 4 — Exercices : rappel actif sans réponse affichée
```

### B1 — Audio par mot
- Ajouter `audioUrl?: string | null` au type `DiscoveryWord` ;
- `app/(app)/learn/[slug]/page.tsx` : construire `discovery` à partir de `bank`
  en y adjoignant `audioByWord.get(wordId)` ;
- `lesson-player.tsx` : rendre `🎧 Écouter` (réutiliser `AudioPlayer`) sur chaque
  carte dont `audioUrl` est non-null. **Aucun second système audio.**

### B2 — Prononciation guidée par mot (léger)
- Remplacer l'approche « 1 bloc guidé sur le 1ᵉʳ mot » par un accès par mot :
  un bouton `[ Prononciation guidée ]` sur chaque carte ayant un audio, qui ouvre
  `PronunciationGuided` pour CE mot (état local `selectedWordId`).
- **Un seul enregistreur monté à la fois** (un seul `PronunciationGuided` rendu,
  pour le mot sélectionné) — jamais 8 enregistreurs simultanés, jamais de micro
  demandé à l'ouverture de la Découverte.

### B3 — Sens caché par défaut
- Remplacer l'affichage direct de `word.meaning` par `[ Voir le sens ]`.
- Le sens se révèle sur action volontaire (état local `revealedIds`), avec la
  micro-relance « Essaie de t'en souvenir sans regarder ».

### B4 — Protection pédagogique
- La révélation du sens est un état UI local (jamais un `ExerciseAnswer`, jamais
  `validateAnswer`/`scoreAnswer`). Elle n'alimente ni `user_word_skill_progress`,
  ni `review_items`, ni mastery, ni SRS, ni l'activité.

### B5 — Contexte conservé
- Le verset (arabe + traduction FR) reste affiché : il fournit le contexte
  coranique. Documenter les 4 cas de fuite (نَعْبُدُ, نَسْتَعِينُ = TOTALE ;
  إِيَّاكَ, وَإِيَّاكَ = FORTE) sans supprimer le contexte sans décision.

## 7. FICHIERS CONCERNÉS (implémentation future)

| Fichier | Changement |
|---|---|
| `components/learn/lesson-player.tsx` | champ audio par mot, bouton guidé par mot, sens caché |
| `app/(app)/learn/[slug]/page.tsx` | passer `audioByWord` dans `discovery` |
| `components/ui/audio-player.tsx` | réutilisation seule (aucun changement prévu) |
| `components/learn/exercises/pronunciation-exercise.tsx` | réutilisation (montage unique) |

Aucun changement : `lib/learning/queries.ts`, générateurs, `validateAnswer`,
`scoreAnswer`, `skillForExerciseType`, mastery, SRS, session 24E, données Quran.

## 8. RISQUES

| Risque | Impact | Mitigation |
|---|---|---|
| Multiplier les enregistreurs (8 micros) | fuite mémoire/AudioContext | un seul `PronunciationGuided` monté (mot sélectionné) |
| Casser la persistance de session | régression 24E | l'audio/la révélation sont hors séquence notée, aucun index touché |
| Verdict/notation parasite | mastery/SRS pollués | révélation = état UI, jamais un `ExerciseAnswer` |
| Masquer le sens au détriment du débutant | frustration | le sens reste à 1 clic (`Voir le sens`), jamais retiré |
| Casser la reprise (refresh) | 24E | `revealedIds` est éphémère (non persisté), la séquence notée reste déterministe |

## 9. TESTS PRÉVUS (ÉTAPE B)

1. chaque mot ayant `word_audio` expose `🎧 Écouter` ; mot sans audio → absence propre ;
2. aucune fuite `service_role` (bundle + signé par ANON) ;
3. `[ Voir le sens ]` masqué par défaut, révélé sur action, re-masquable si prévu ;
4. la révélation ne compte jamais comme réponse (aucun `recordAnswer`) ;
5. exercice indépendant de l'état d'affichage de la fiche ;
6. prononciation guidée accessible pour le mot sélectionné (1 seul monté) ;
7. non-régression : grading FR/AR, homographes, session 24E, activité idempotente,
   fin de leçon, SRS, mastery inchangés.

## 10. NON-RÉGRESSION (baseline préservée, aucun changement source)

- `npm test` : 397/397 (non ré-exécuté ici — aucun fichier source modifié ; vérifié en 24I-B)
- `npx tsc --noEmit` : 0 erreur (re-vérifié, y compris le script d'audit tmp/)
- `npm run lint` : clean (re-vérifié)
- `npm run build` : OK (inchangé, aucun source modifié)
- Données Quran : inchangées (script d'audit READ-ONLY : SELECT + createSignedUrl + GET)

## 11. DÉCISION

`AUDIT_COMPLETE_READY_FOR_APPROVAL`

- La cause du Problème 1 est **UI** (pas de champ audio par mot + prononciation
  guidée bornée à `bank[0]`), **pas** une donnée manquante (8/8 audio réels).
- La cause du Problème 2 est **l'affichage automatique de `word.meaning`** dans les
  cartes + la traduction du verset qui donne 2 réponses mot pour mot.
- L'implémentation (B1–B5) est **techniquement sûre** (aucune donnée, aucun
  mastery/SRS/grading à modifier). Aucun code ne sera modifié avant approbation
  explicite du propriétaire.
