# PHASE 24H-Q3-A — AUDIT DE PRODUCTION ET D'ÉVALUATION DE LA PRONONCIATION

STATUT = `AUDIT_COMPLETE`
DÉCISION = `GUIDED_PRODUCTION_ONLY`
MODE = `READ_ONLY` — aucune modification de code / DB / Storage / migration / UI.

> Le code réel a été lu (source de vérité). Baseline confirmée, aucun artefact
> modifié. Aucune implémentation ne démarre sans approbation explicite.

---

## 0. Baseline confirmée

| Vérification | Résultat |
|---|---|
| `npm test` | **382/382** |
| `npx tsc --noEmit` | **0 erreur** |
| `npm run lint` | **clean** |
| `npm run build` | **OK** (vérifié en 24H-Q2-B, aucun changement depuis) |
| `verify:persistence` / `verify:rls` | non re-exécutés (DB/credentials) — référence 13/13 / 44/44 |

Données inchangées : `quran_words` 21 296 · `word_occurrences` 77 430 ·
`word_audio` 21 295 · `ayah_audio` 0 · `lemmas` 32 · FR 25 · mappings 183.

---

## 1. Réponse à la question centrale (§2)

> **Que peut réellement évaluer Hikma de manière fiable lorsqu'un apprenant prononce un mot coranique ?**

**Rien qui puisse être présenté comme un verdict automatique CORRECT/INCORRECT fiable aujourd'hui.** Hikma peut, de façon fiable :

1. **capturer** la voix (localement) ;
2. **rejouer** la voix et le modèle de référence ;
3. **laisser l'apprenant comparer lui-même** (auto-évaluation) — c'est ce que fait
   déjà `PRONUNCIATION_GUIDED` (Q1) ;
4. **mesurer des grandeurs acoustiques brutes** (durée, énergie, voisement
   approximatif) — mais **pas** les convertir en preuve de bonne prononciation.

Tout le reste (vocalisation correcte, shadda, makhraj, distinction de sons
proches) exige des **données phonétiques structurées absentes** et une
**validation empirique non réalisée**.

---

## 2. Ce qui est techniquement possible vs pédagogiquement fiable (§2)

| Capacité | Possible | Fiable pour un verdict | Commentaire |
|---|---|---|---|
| Enregistrer la voix | oui | oui | getUserMedia + MediaRecorder (Q1) |
| Rejouer / comparer soi-même | oui | oui | déjà en production |
| Mesurer durée / énergie / voisement | oui | partiel | signal utile, pas une preuve |
| Détecter un son présent/absent | partiel | non | sans segmentation ni référence annotée |
| Juger shadda/soukoun/madda | partiel | **non** | comparaison naïve trompeuse (mots courts) |
| Juger le makhraj | non | **non** | non mesurable au micro |
| Juger le tajwid | non | **non** | hors périmètre Q3 |
| STT comme vérité | techniquement oui | **jamais** | voir §10 |

---

## 3. Captures et navigateur (§6, §7)

- `getUserMedia` + `MediaRecorder` : **disponibles** Chrome/Firefox/Safari/Edge
  (desktop et mobile), **HTTPS requis** (localhost exempté), permission explicite
  et révocable.
- Formats : Chrome/Firefox → `audio/webm;codecs=opus` ; Safari → `audio/mp4`
  (AAC). **Différence à prendre en compte** pour toute analyse future (décodage
  opus vs aac).
- iOS : MediaRecorder supporté depuis Safari 14.5+ (AAC). Android : WebM/Opus
  selon navigateur.
- **MVP entièrement local : `YES`** — capture, rejeu et traitement léger (Web
  Audio API / WASM) tiennent dans le navigateur ; un mot ≈ 0,5–1,5 s, mono,
  16–48 kHz, ~10–50 Ko en mémoire (blob URL), aucun serveur requis.
  Détail : `tmp/phase24hq3-a/environment-capabilities.json`,
  `browser-compatibility.json`, `audio-capture-analysis.json`.

---

## 4. Privacy by design (§8, §9) — recommandation PRIVACY_FIRST

| Option | Confidentialité | RGPD | Coût | Latence | Verdict |
|---|---|---|---|---|---|
| A — 100 % local | excellente | minimal | ≈ 0 | ~0 | **MVP** |
| B — stockage serveur temporaire | moyenne | traitement + suppression | CPU/bande passante | upload | à éviter sans nécessité |
| C — API externe | faible | données vocales à un tiers | par requête | réseau | non justifié au MVP |

**Ne stocker que le verdict/score** (si un jour la mastery l'exige). **Jamais
l'audio original, l'empreinte acoustique ou les features.** L'audio vit en
mémoire (blob URL) et est libéré au reset/unmount (déjà le comportement Q1).

---

## 5. STT : jamais une source de vérité (§10)

`STT réussi ≠ bonne prononciation` — le STT transcrit du **texte** (graphemes),
il ignore les voyelles courtes, la shadda, la longueur, le makhraj. Reconnaître
« مالك » peut se produire avec une mauvaise voyelle longue.
`STT échoué ≠ mauvaise prononciation` — mots courts, bruit, style de récitation,
microphone suffisent à faire échouer un STT sans faute de l'apprenant.

Arabe coranique : voyelles courtes non transcrites, diacritiques, shadda,
assimilation, variations de récitation (qira'at), accent, mots de 1 s.
**Conclusion : STT = `jamais utilisé` comme source de vérité** (au mieux un
signal auxiliaire de « parole détectée », inutile au MVP).

---

## 6. Analyse acoustique (§11) — sans fausse précision

| Capacité | Faisable | Fiabilité estimée | Données nécessaires | Risque |
|---|---|---|---|---|
| durée globale | oui | moyenne | aucune | durée « correcte » non définie sans référence |
| énergie / niveau | oui | moyenne | aucune | volume ≠ justesse |
| voisement (voisé/non) | partiel | moyenne | aucune | ne couvre pas les emphatiques/qalqala |
| présence d'un événement (stop/burst) | partiel | faible | segmentation | confond pause/bruit |
| voyelles longues vs courtes | partiel | faible | référence alignée | vitesse naturelle fausse le ratio |
| shadda (gémination) | partiel | faible | référence alignée | allongement ≠ gémination |
| makhraj | non | inconnue | articulation | **non mesurable** |

Fiabilité exprimée en **élevée / moyenne / faible / inconnue** — **aucun seuil
numérique inventé** (aucune validation empirique).

---

## 7. Mots courts : la comparaison naïve trompe (§12)

`مَـٰلِكِ`, `رَبِّ`, `نَعْبُدُ`, `دِينِ` : 0,5–1,5 s = très peu d'échantillons.
Vitesse, pauses, souffle, accent, volume, environnement, microphone et récitation
naturelle produisent des variations **légitimes** qu'une distance (MFCC/DTW) à un
unique enregistrement de référence interprétera comme des erreurs (faux négatifs)
tout en manquant de vraies erreurs (faux positifs). **Une distance acoustique
n'est pas un verdict pédagogique.**

---

## 8. Audio de référence : un exemplaire, pas une annotation (§13)

Les 21 295 `word_audio` Muallim sont une **référence pédagogique** (à écouter) et
un **exemplaire acoustique** possible, mais **pas une annotation phonétique
structurée** : pas de frontières de phonèmes, pas de durées, pas d'étiquettes.
`word_audio.duration` est NULL. On peut écouter et s'aligner grossièrement, mais
on ne peut pas en dériver une « vérité phonétique » exploitable automatiquement.

---

## 9. Données phonétiques manquantes (§14)

| Donnée | Existe | Où | Qualité | Nécessaire Q3 | Action |
|---|---|---|---|---|---|
| forme arabe vocalisée | oui | `quran_words.arabic` | bonne | partiel | — |
| translittération | oui | `quran_words.transliteration` | moyenne | partiel | — |
| audio de référence | oui | `word_audio` (21 295) | bonne (audio) | oui | — |
| durée audio | non | `word_audio.duration` NULL | — | utile | dérivable à la lecture |
| phonèmes | non | — | — | oui (évaluation auto) | MIGRATION/IMPORT futur |
| segmentation phonémique | non | — | — | oui | MIGRATION/IMPORT futur |
| timing phonème | non | — | — | oui | MIGRATION/IMPORT futur |
| vocalisation structurée | dérivable | `phonetics.ts` (dérivé du texte) | bonne | partiel | — |
| makhraj | non | — | — | non au MVP | MIGRATION/IMPORT futur |
| règles / variantes | non | — | — | plus tard | hors Q3 |

**Aucune donnée importée pendant l'audit.**

---

## 10. Makhraj et tajwid (§15, §16)

- Q3 ne doit **pas** prétendre évaluer le makhraj (non mesurable au micro) — au
  mieux « as-tu produit le son de façon reconnaissable ? » (approximatif).
- **Hors périmètre Q3** : assimilation (idgham), règles d'allongement (madd),
  qalqala, ghunna, récitation contextuelle, tajwid de verset. Frontière :
  `WORD PHONETICS → PRONUNCIATION → (plus tard) CONTEXTUAL RECITATION → (plus tard) TAJWID`.

---

## 11. Verdict et confiance (§17, §18)

Modèle à **4 états** : `CORRECT` / `INCORRECT` / `REVIEW_REQUIRED` /
`NO_SIGNAL` (audio vide/trop court/inaudible).

- `REVIEW_REQUIRED` est le **défaut** de toute incertitude.
- **Jamais** transformer une incertitude technique en `INCORRECT`.
- `confidence` (technique) ≠ vérité pédagogique : `features → confidence →
  décision pédagogique`. Les seuils doivent être **validés empiriquement** avant
  usage — aucun seuil numérique dans cet audit.

---

## 12. Feedback (§19) et UX (§20–23)

Messages permis (jamais « mauvaise prononciation » sans preuve) :
- certain → « Bien joué. »
- incertain → « Je n'arrive pas à déterminer clairement ta prononciation. Réécoute et réessaie. »
- insuffisant → « L'enregistrement est trop court ou difficile à analyser. Réessaie. »
- erreur réellement détectée → « Écoute à nouveau le modèle puis répète le mot. »

Flux cible : ÉCOUTER → RÉPÉTER → ENREGISTRER → RÉÉCOUTER → ÉVALUATION → RÉESSAYER.
États : idle, permission, recording, recording limit, recorded, playback,
analyzing, correct, incorrect, review_required, insufficient_audio,
microphone_denied, microphone_unavailable, error.

**Microphone refusé : ne jamais bloquer la leçon** — écouter, réécouter,
continuer, passer (déjà le comportement Q1).

Accessibilité : clavier, screen reader, focus, touch ≥ 48 px, `aria-live`,
feedback non uniquement sonore ni coloré, RTL, mobile ; le micro utilisable sans
dépendre d'un indicateur animé.

---

## 13. Mastery / SRS (§24–26)

- Une évaluation **incertaine ne doit jamais dégrader la mastery** : seuls les
  verdicts à haute confiance écriraient, `REVIEW_REQUIRED`/`NO_SIGNAL` = neutre.
- Compétence : la **production** est bien un objectif/signal/métrique/progression
  différents de la reconnaissance (critères §25 remplis), mais la fiabilité du
  verdict n'est **pas établie**. Conclusion : `pronunciation_production`
  documentée comme `MIGRATION_REQUIRED_IF_APPROVED` — **ne pas la créer**.
- SRS : la prononciation ne doit **pas** piloter la planification au MVP ; elle
  pourrait enrichir la mastery plus tard. Une erreur acoustique ne doit jamais
  déclencher une mauvaise répétition.

---

## 14. Coûts et technologies (§27, §28)

- Local : serveur ≈ 0.
- Serveur : CPU + stockage + bande passante (upload) — non nécessaire au MVP.
- API externe : par minute/requête, latence, dépendance, confidentialité —
  **ordres de grandeur uniquement**, aucune intégration (aucun prix inventé).

Comparaison conceptuelle (Web Audio API, MediaRecorder, WASM, analyse acoustique
locale, STT, speech-to-speech, API phonétique, IA audio externe) :
`tmp/phase24hq3-a/technology-comparison.json`.

---

## 15. MVP recommandé (§30)

**`ÉCOUTER → RÉPÉTER → ENREGISTRER LOCAL → RÉÉCOUTER → COMPARER SOI-MÊME → RÉESSAYER`**

C'est **déjà** `PRONUNCIATION_GUIDED` (Q1). Il reste le bon MVP car il est :
zéro donnée, zéro coût, zéro risque de faux verdict, pédagogiquement honnête.
**L'évaluation acoustique automatique ne vient qu'après** validation empirique
avec données structurées — hors Q3-A.

---

## 16. Critères de passage à Q3-B (§31)

Non remplis pour une évaluation automatique : données (phonèmes/segmentation),
validation empirique des seuils, modèle de confiance, gestion d'incertitude,
décision privacy produit. La capture/privacy/UX/verdict sont en revanche définis
pour une production **guidée** (déjà en place). → Q3-B ne doit être lancé que si
le propriétaire tranche entre « production guidée uniquement » et « évaluation
acoustique après acquisition de données + validation ».

---

## 17. Décision finale (§37, §38)

**`GUIDED_PRODUCTION_ONLY`**

La production automatique ne peut pas être suffisamment fiable aujourd'hui : les
données phonétiques structurées manquent (`PHONETIC_DATA_GAP`) et toute
technologie d'évaluation exige une validation expérimentale
(`TECHNOLOGY_VALIDATION_REQUIRED`). La seule production fiable et éthique est la
production **guidée auto-évaluée** (déjà livrée en Q1). Règle dominante (§34) :
un système qui produit des faux verdicts est pire qu'un système qui demande de
réessayer — donc `REVIEW_REQUIRED` par défaut, jamais de faux `INCORRECT`.

Priorités respectées : 1. exactitude pédagogique · 2. sécurité des données
vocales · 3. transparence · 4. simplicité · 5. UX · 6. fiabilité ·
7. seulement ensuite automatisation.

## 18. Arrêt obligatoire (§36)

Aucun démarrage de Q3-B, 24I, 24J, 24K, 23G, extension aux 114 sourates, import
phonétique, nouvelle compétence, ni nouveau système de mastery.
