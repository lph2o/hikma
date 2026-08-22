# PHASE 24F — AUDIO UX / AUDIOPLAYER INTÉGRATION

STATUS = UX_UI_AUDIO_COMPLETE

Phase : 24F · Type : intégration UX/UI de l'audio existant · Pédagogie/données inchangées
Date : 2026-08-16

---

## 1. Résumé exécutif

L'audio pédagogique (Muallim, 21 295 `word_audio`) était rendu par un `<audio controls>` natif minimal dans les exercices `AUDIO_TO_WORD` et `WORD_TO_AUDIO`. Il est désormais rendu par le **lecteur Hikma `AudioPlayer`** (créé en 24C) : états complets, réessai après erreur, bouton accessible ≥48px, et **coordination « un seul audio actif à la fois »**.

La chaîne source est strictement inchangée :

```
word_id → word_audio → Storage Supabase → URL signée existante → AudioPlayer
```

Aucune nouvelle source, aucun import, aucun changement de signed URL, aucune migration, aucune écriture DB/Storage. Le moteur pédagogique, les générateurs, le scoring, la maîtrise, le SRS et la session 24E restent **rigoureusement identiques**.

---

## 2. État avant / après

| Élément | Avant 24F | Après 24F |
|---|---|---|
| Rendu audio | `<audio controls>` natif (lecteur technique) | `AudioPlayer` Hikma (bouton + états + microcopy) |
| États visuels | natifs du navigateur (incohérents) | idle / loading / playing / paused / ended / error |
| Erreur | message navigateur opaque ou silencieux | « Impossible de lire l'audio. Réessaie. » + bouton Réessayer |
| Audios simultanés | possibles (aucune coordination) | un seul actif (coordinateur + remontage par question) |
| Nettoyage au changement de question | dépendant du navigateur | garanti (`key={audioUrl}` + unsubscribe au démontage) |
| Autoplay | non | **non conservé** (déclenchement volontaire uniquement) |

---

## 3. Fichiers modifiés / créés

**Modifiés**
- `components/ui/audio-player.tsx` — ajout du réessai après erreur (`retry` = `load()` + `play()`), coordination un-seul-audio, caption réservée au statut (plus de redondance « Écouter »), bouton « Réessayer » dédié en état d'erreur.
- `components/learn/exercises/index.tsx` — suppression du `AudioPlayer` local natif ; import du composant 24C ; `AUDIO_TO_WORD` (label « Écouter le mot ») et `WORD_TO_AUDIO` (label « Écouter la prononciation ») l'utilisent avec `key={audioUrl}`.

**Créés**
- `lib/ui/audio-coordinator.ts` — registre impératif léger, sans React, testable en Node (`registerAudio` / `pauseOtherAudios`).
- `tests/audio-coordinator.test.ts` — 4 tests de coordination.
- `tmp/phase24f-audio-baseline.ts` — script read-only de couverture audio (non livrable, outil de vérification).

---

## 4. Intégration AudioPlayer

Le composant 24C est conservé et **amélioré** (pas réécrit) :
- Bouton principal `min-h-12 min-w-12 rounded-full` (≥48px), icône play/pause.
- `aria-label` contextuel : « Écouter… » / « Mettre en pause » / « Rejouer » / « Réessayer ».
- `span role="status" aria-live="polite"` pour annoncer le statut.
- Motion limitée à `transform`/`opacity` (héritée du design system) + `prefers-reduced-motion` déjà respecté.

---

## 5. AUDIO_TO_WORD — vérifié

- Le générateur `audioToWord` est **inchangé** (aucun autoplay, le texte cible reste masqué avant réponse).
- La question reste : **[Écouter] → [options QCM]**. Le lecteur ne révèle jamais la réponse.
- Scoring / validation / mastery / skill progress / séquenceur inchangés.

## 6. WORD_TO_AUDIO — vérifié

- La forme arabe affichée est inchangée ; le lecteur « Écouter la prononciation » est **secondaire** par rapport à l'objectif.
- Auto-évaluation notée inchangée. Aucun élément superflu ajouté.

---

## 7. Un seul audio actif

- **Coordinateur** : `registerAudio(audio)` au montage ; au premier `play`, `pauseOtherAudios(audio)` stoppe tous les autres lecteurs enregistrés.
- **Remontage par question** : `key={audioUrl}` garantit que le passage à une nouvelle question démonte l'ancien lecteur (arrêt + désinscription).
- **Démontage** : le cleanup de l'effet retire les listeners et désinscrit l'élément.

Conséquence : changement de question, navigation, retour, reprise et refresh ne laissent jamais d'audio jouer en arrière-plan.

---

## 8. États audio

| État | Visuel | Action |
|---|---|---|
| idle | icône play | lancer |
| loading | spinner | — (désactivé) |
| playing | icône pause | pause |
| paused | icône play | reprendre |
| ended | replay + « Réécouter » | rejouer |
| error | message + « Réessayer » | `load()` + `play()` |

Aucun texte technique (AbortError, NotAllowedError, Failed to fetch) n'est exposé.

---

## 9. Erreurs réseau — isolation

`error` / `play().catch()` bascule l'état local à `error`. Une panne audio **ne fait jamais planter** le LessonPlayer : elle reste confinée au composant (audio error ≠ lesson error).

---

## 10. Performance

- `preload="none"` : aucun chargement tant que l'utilisateur ne clique pas.
- Aucun préchargement massif (pas de 26/21 295 fichiers).
- Aucun cache complexe ajouté ; les signed URLs sont celles déjà générées par le batch existant (TTL 1h).

---

## 11. Tests

`tests/audio-coordinator.test.ts` — 4 nouveaux tests (coordination) :
1. pause des autres lecteurs mais jamais soi-même ;
2. pas de `pause()` sur un lecteur déjà en pause ;
3. un lecteur désinscrit n'est plus affecté (cleanup au démontage) ;
4. stabilité (pas de double pause).

Les générateurs audio sont déjà couverts dans `tests/exercises.test.ts` (null sans URL signée ; URL signée propagée). Aucun test supprimé ni affaibli.

---

## 12. Non-régression

| Vérification | Résultat |
|---|---|
| `npm test` | **293/293** (+4) ✅ |
| `npx tsc --noEmit` | 0 erreur ✅ |
| `npm run lint` | clean ✅ |
| `npm run build` | OK ✅ |
| `npm run verify:persistence` | 13/13 ✅ |
| `npm run verify:rls` | 44/44 ✅ |

---

## 13. Compteurs DB (inchangés)

| Compteur | Valeur |
|---|---|
| quran_words | 21 296 ✅ |
| word_occurrences | 77 430 ✅ |
| word_audio | 21 295 ✅ |
| ayah_audio | 0 ✅ |
| lemmas | 32 ✅ |
| word_translations FR validées | 25 ✅ |
| word_lemma_mapping | 183 ✅ |

Aucune migration, aucune nouvelle table, aucune écriture DB, aucune écriture Storage.

---

## 14. Couverture audio Al-Fatiha

- Sourate 1 : **26 formes distinctes**, **26/26 audio** disponibles (Muallim) ✅.

## 15. Mujawwad / ayah_audio

- **ayah_audio = 0** ✅ (aucun audio de verset créé).
- **Mujawwad = 0 fichier audio** ✅. La table `recitations` contient une ligne *catalogue* « Mujawwad » (AbdulBaset AbdulSamad) avec **0 `word_audio` et 0 `ayah_audio`** — définition préexistante, aucun fichier importé. Les 21 295 `word_audio` appartiennent tous à la récitation « WBW Muallim ».

---

## 16. Limites restantes (honnêtes)

1. **Validation visuelle** : aucun navigateur automatisé disponible. La validation est au niveau code + build + tests + vérifications DB/RLS. Le rendu pixel et le comportement tactile/clavier réels restent à confirmer (24I/24J).
2. **États React non testés unitairement** : l'environnement de test est Node pur (pas de jsdom/happy-dom) ; les transitions d'états visuels du composant sont validées par typecheck + build + inspection, pas par tests DOM.
3. **Erreur de décodage vs réseau** : le composant agrège toutes les erreurs de lecture en un état `error` unique (réessai possible) — granularité suffisante pour l'UX cible.

---

## 17. Arrêt

**Arrêt respecté.** 24G / 24H / 24I / 24J / 24K / 23G **non démarrées**. Aucun curriculum, exercice, maîtrise, resolver, SRS, donnée lexicale modifiés. Aucun import audio, aucun Mujawwad, aucun ayah_audio, aucune gamification.

---

## Livrables

- `PHASE_24F_AUDIO_UX_IMPLEMENTATION_REPORT.md` (ce rapport)
- `tmp/phase24f-audio-ux-evidence.json`
- `tmp/phase24f-audio-player-validation.json`
