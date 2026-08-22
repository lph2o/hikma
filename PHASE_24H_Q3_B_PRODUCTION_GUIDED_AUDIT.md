# PHASE 24H-Q3-B — ÉTAPE 0 · AUDIT AVANT MODIFICATION

STATUT = `READ_ONLY` — aucune modification avant cet audit.

## 1. Implémentation actuelle de `PRONUNCIATION_GUIDED`

| Élément | Fichier | Constat |
|---|---|---|
| Générateur | `lib/exercises/generators/pronunciation-guided.ts` | nécessite `audioUrl`, sinon null ; `selfAssessed: true`, `phoneticMarks`/`phoneticHints` dérivés |
| Composant | `components/learn/exercises/pronunciation-exercise.tsx` | écouter → observer → répéter → enregistrer (local) → réécouter → réessayer |
| Micro | `recordingSupported()` (getUserMedia + MediaRecorder) | permission au clic, jamais au chargement |
| Nettoyage | `useEffect` cleanup | `MediaRecorder.stop()` + `track.stop()` + `URL.revokeObjectURL()` |
| MIME | `new MediaRecorder(stream)` **sans** `mimeType` | améliorable (Étape 2) |
| Verdict | `validateAnswer`/`scoreAnswer` → auto-évalué (correct=true, score 0) | neutre, déjà conforme |
| Skill | `skillForExerciseType("PRONUNCIATION_GUIDED") → null` | aucune mastery |
| Intégration | `app/(app)/learn/[slug]/page.tsx` + Découverte `lesson-player.tsx` | hors séquence notée, premier mot |

## 2. AudioPlayer (24F) — `components/ui/audio-player.tsx`

Réutilisé pour le modèle ET le rejeu de l'apprenant. Un seul audio actif
(coordination 24F). États idle/loading/playing/paused/ended/error, clavier,
≥48 px.

## 3. Couches à NE PAS toucher (vérifiées)

- `validateAnswer` / `scoreAnswer` (neutres pour PRONUNCIATION_GUIDED) ;
- `skillForExerciseType` (null) ;
- mastery / SRS / rétention (aucun write) ;
- session 24E (l'exercice est hors séquence notée, aucun index) ;
- grading FR/AR, phonétique Q1, discrimination Q2-B (inchangés).

## 4. Conclusion d'audit

Q1 fournit déjà la capture 100 % locale et le nettoyage. Q3-B ajoute :
1. **détection MIME progressive** (`MediaRecorder.isTypeSupported`) ;
2. **mesures acoustiques descriptives** (durée, RMS, présence de signal, silence,
   saturation) via Web Audio API **locale** ;
3. un **verdict explicite** `NO_SIGNAL | REVIEW_REQUIRED` (jamais CORRECT/INCORRECT) ;
4. une **auto-évaluation** guidée (comparaison modèle/soi + réessayer/continuer) ;
5. des **tests unitaires** sur la logique pure d'analyse.

Aucune nouvelle compétence, aucune migration, aucun stockage, aucun upload,
aucun STT.

Détail : `tmp/phase24hq3-b/audit.json`.
