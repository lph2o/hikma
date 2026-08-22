# PHASE 24H-Q3-B — PRODUCTION VOCALE GUIDÉE + COMPARAISON ACOUSTIQUE PRUDENTE

STATUS = `PRONUNCIATION_PRODUCTION_GUIDED_COMPLETE`
BROWSER_VALIDATION = `BROWSER_VALIDATION_PENDING`

> Production guidée enrichie de mesures acoustiques **descriptives** — jamais un
> verdict automatique de prononciation. Aucun STT, aucun score, aucun stockage,
> aucun upload, aucune nouvelle compétence, aucune migration, aucun impact
> mastery/SRS.

---

## 1. État avant

`PRONUNCIATION_GUIDED` (Q1) fournissait déjà : écouter le modèle (AudioPlayer
24F) → observer les marques → répéter → enregistrer **localement** (getUserMedia +
MediaRecorder) → réécouter → réessayer, avec nettoyage correct du flux. Absence
de détection MIME, aucune mesure de signal, auto-évaluation minimale
(Réessayer / C'est bon).

## 2. Architecture retenue

```
clic → permission micro → getUserMedia → MediaRecorder (MIME détecté)
→ Blob local → URL.createObjectURL → réécoute
→ (locale) decodeAudioData → mesures descriptives (durée/RMS/silence/saturation)
→ verdict NO_SIGNAL | REVIEW_REQUIRED
→ auto-évaluation humaine (comparaison modèle/soi) → réessayer / c'est bon
```

Couches inchangées : moteur (`validateAnswer`/`scoreAnswer` neutres pour
PRONUNCIATION_GUIDED), `skillForExerciseType` (null), mastery, SRS, session 24E,
grading FR/AR, phonétique Q1, discrimination Q2-B.

## 3. Fichiers modifiés

- `components/learn/exercises/pronunciation-exercise.tsx` — détection MIME
  progressive, décodage + mesures descriptives, feedback, auto-évaluation,
  libération du contexte audio.

## 4. Fichiers créés

- `lib/pronunciation/acoustics.ts` — logique PURE de mesures descriptives
  (`analyzeSamples`, `classifyRecording`, `describeRecording`, seuils documentés).
- `tests/pronunciation-acoustics.test.ts` — 15 tests unitaires.
- `PHASE_24H_Q3_B_PRODUCTION_GUIDED_AUDIT.md` + `PHASE_24H_Q3_B_PRODUCTION_GUIDED_IMPLEMENTATION_REPORT.md`
- `tmp/phase24hq3-b/` (9 JSON).

## 5. Comportement utilisateur

Écoute du modèle → répétition → enregistrement local → réécoute → **message
descriptif** (silence / trop court / saturation / signal suffisant) →
**auto-évaluation** (3 cases : rythme, sons, voyelles + « Réessayer » /
« C'est bon »). L'exercice fonctionne sans micro (répéter à voix haute).

## 6. Gestion microphone

- Permission demandée **uniquement au clic**, jamais au chargement.
- `getUserMedia({ audio: true })` → `MediaRecorder` avec MIME détecté
  (`isTypeSupported`, repli codec navigateur).
- Nettoyage : `MediaRecorder.stop()` + `track.stop()` + `URL.revokeObjectURL()`
  + fermeture de l'`AudioContext` au reset/unmount.
- Micro refusé / indisponible : message clair, la leçon **n'est jamais bloquée**.

## 7. Mesures acoustiques (descriptives uniquement)

`lib/pronunciation/acoustics.ts` : durée, RMS approximatif, présence de signal,
silence quasi total, saturation évidente (seuils **heuristiques descriptifs**
documentés). Messages produits : « Aucun son détecté. » / « Enregistrement très
court. » / « Le signal semble saturé… » / « Le signal semble suffisant pour être
réécouté. » — **jamais** un score ni « bien/mal prononcé ».

## 8. Confidentialité

**L'audio utilisateur n'est jamais envoyé au serveur.** Aucune colonne audio,
aucun bucket, aucune table recordings, aucun embedding, aucune empreinte, aucun
fichier persistant. Le blob vit en mémoire (URL objet) et disparaît au
reset/unmount. Aucun appel réseau pendant la capture/analyse (testé).

## 9. Absence de verdict automatique

Le verdict interne est borné : `NO_SIGNAL | REVIEW_REQUIRED`. Il n'existe
**aucun** `CORRECT`/`INCORRECT` pour l'analyse acoustique Q3-B (testé). Aucune
transcription, aucun score de prononciation.

## 10. Absence d'impact mastery / SRS

`skillForExerciseType("PRONUNCIATION_GUIDED")` reste `null` ; `validateAnswer`/
`scoreAnswer` restent neutres (score 0, jamais CORRECT/INCORRECT). Aucune
écriture `user_word_skill_progress`, aucune rétention, aucun scheduling SRS.

## 11. Tests

- **397/397** (382 existants + 15 nouveaux). Nouveaux tests : silence, signal
  valide, canal vide, durée, saturation, classification (jamais CORRECT/INCORRECT),
  messages descriptifs, **aucun appel réseau**.
- `npx tsc --noEmit` : **0 erreur** · `npm run lint` : **clean** ·
  `npm run build` : **OK**.

## 12. Navigateur

**`BROWSER_VALIDATION_PENDING`** — la capture micro réelle (permission, arrêt,
deuxième enregistrement, refus, navigation pendant enregistrement, absence de
fuite/upload) **ne peut pas être validée sans navigateur automatisé** dans cet
environnement. Le code, les tests et le build sont validés ; le micro réel ne
l'est pas.

## 13. Limitations

- Le décodage (`decodeAudioData`) dépend de Web Audio API ; si indisponible,
  l'exercice affiche simplement l'enregistrement sans mesures (aucun blocage).
- Les seuils acoustiques sont **descriptifs**, volontairement grossiers.
- La comparaison reste **humaine** (auto-évaluation).

## 14. Risques futurs

- `BROWSER_VALIDATION_PENDING` (à lever en 24I/24J).
- Toute future évaluation automatique exige des données phonétiques structurées
  et une validation empirique (Q3-A) — hors Q3-B.
- Ne jamais transformer les mesures descriptives en verdict pédagogique.

## 15. Décision de phase suivante

**Arrêt obligatoire.** Aucun démarrage de Q3-C, Q4, 24I, 24J, 24K. Prochaine
action recommandée : validation navigateur (24I/24J) avant toute évolution.
