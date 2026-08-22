# PHASE 24I — VALIDATION NAVIGATEUR RÉELLE · AUDIT

STATUS = `BROWSER_VALIDATION_BLOCKED`
MODE = `READ_ONLY` — aucune modification de code / DB / migration / policy.

> Aucune validation navigateur n'a été **inventée**. Ce rapport distingue
> strictement ce qui a été vérifié de façon statique (build + code réel) de ce
> qui exige un navigateur automatisé et un microphone réel (non disponibles).

---

## 0. Résumé exécutif

L'environnement d'exécution **ne permet pas** la validation navigateur réelle
exigée par 24I :

| Capacité requise | Disponible ? |
|---|---|
| Chrome installé | **oui** (`/Applications/Google Chrome.app/...`) |
| Framework d'automatisation (Playwright/Puppeteer/Cypress) | **non** (aucun dans `node_modules`) |
| Microphone réel | **non** (environnement terminal) |
| Serveur applicatif en cours | **non** (aucun sur :3000) |
| Session Supabase interactive pilotable | **non** (sans automatisation) |

Conséquence : les interactions réelles (clic Écouter, permission micro,
enregistrement, refus, navigation pendant enregistrement, capture réseau
DevTools) **ne peuvent pas être exécutées**. Les validations **statiques**
possibles ont été réalisées et documentées.

---

## 1. Ce qui a été vérifié (statique, build + code réel)

| Contrôle | Résultat | Preuve |
|---|---|---|
| Service role dans le bundle client | **PASS** — absent | `grep "SERVICE_ROLE" .next/static/chunks` → aucun résultat |
| `createSignedUrl` dans le bundle client | **PASS** — absent (serveur uniquement) | `grep "createSignedUrl" .next/static/chunks` → aucun résultat |
| Client Supabase = clé **anon** uniquement | **PASS** | `lib/supabase/client.ts` : URL + ANON_KEY seulement |
| Service role réservé aux scripts serveur | **PASS** | `SUPABASE_SERVICE_ROLE_KEY` (non `NEXT_PUBLIC_`) dans scripts/ |
| Aucun upload audio dans le code client | **PASS** | Q1/Q3-B : `getUserMedia`+`MediaRecorder` 100 % local, aucun `storage.from().upload` |
| Verdict Q3-B borné (jamais CORRECT/INCORRECT) | **PASS** | `lib/pronunciation/acoustics.ts` + tests (397/397) |
| Non-régression unitaire | **PASS** | `npm test` 397/397 · tsc 0 · lint clean · build OK |

---

## 2. Ce qui n'a PAS pu être validé (BLOCKED)

Tout ce qui exige un navigateur piloté ou un microphone réel :

1. AudioPlayer : lecture réelle, pause/reprise, fin naturelle, replay, arrêt du
   premier audio au lancement du second, aucun « son fantôme ».
2. `word_audio` : URL signée réellement lue (HTTP 200 audio/opus), expiration,
   erreur de signature ≠ « aucun audio », coupure/retour réseau.
3. Exercices audio (AUDIO_TO_WORD / WORD_TO_AUDIO) : flux audio→réponse→feedback.
4. Q1 : autorisation micro, enregistrement, arrêt, réécoute, reset, refus,
   périphérique indisponible, navigation pendant enregistrement.
5. Q2-B : rendu réel de la discrimination (traits hamza/madda/shadda/soukoun/tanwīn).
6. Q3-B : capture micro réelle, mesures acoustiques réelles (durée/RMS/silence/
   saturation), scénario NO_SIGNAL, refus micro, navigation pendant enregistrement.
7. Confidentialité DevTools/Network : absence de requête contenant l'audio
   (ne peut être observée sans session pilotée).
8. Storage/Supabase depuis le navigateur : TTL signé, bucket privé, aucune
   écriture utilisateur (nécessite une session interactive).
9. Persistance leçon / review / navigation / responsive / accessibilité réelle
   (axe-core non disponible) / performance navigateur (mémoire, listeners).

---

## 3. Problème documenté (non corrigé — read-only)

**P1 · `.env.example` expose une clé service_role sous un préfixe `NEXT_PUBLIC_`**

`PHASE_24I` · fichier `.env.example` ligne 18 :

```
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhxxxxxx
```

Cette ligne **contredit son propre commentaire** (« jamais préfixée
NEXT_PUBLIC_ ») : toute copie de `.env.example` vers `.env.local` ferait
inline la clé service_role dans le bundle client par Next.js. Le `.env` réel
n'utilise **pas** ce préfixe (`SUPABASE_SERVICE_ROLE_KEY`), donc l'application
actuelle n'est pas affectée — c'est un **risque de configuration** à corriger
dans une phase dédiée (aucune correction ici, conformément à la règle read-only).

---

## 4. Matrice des points d'entrée (Étape 0)

| Feature | Route | Composant | Action | Résultat attendu | Risque |
|---|---|---|---|---|---|
| AudioPlayer | `/learn/[slug]` | `components/ui/audio-player.tsx` | Écouter/pause/replay | un seul audio actif | non validé navigateur |
| Audio exercices | `/learn/[slug]` | `exercises/index.tsx` (AudioToWord/WordToAudio) | audio→réponse | feedback + progression | non validé |
| Q1 guidé | Découverte `/learn/[slug]` | `pronunciation-exercise.tsx` | écouter→enregistrer→réécouter | auto-évalué, non noté | non validé |
| Q2-B discrimination | séquence `/learn/[slug]` | `exercises/index.tsx` | audio→caractéristique | QCM audio_recognition | non validé |
| Q3-B mesures | Découverte | `pronunciation-exercise.tsx` + `lib/pronunciation/acoustics.ts` | enregistrer→mesurer | descriptif, NO_SIGNAL/REVIEW_REQUIRED | non validé |
| Persistance | fin de leçon | `actions.ts` / `lesson-submit.ts` | terminer | success/partial/failed | non validé |
| Review | `/review` | `app/(app)/review/page.tsx` | ouvrir | due/studied distincts | non validé |

Détail : `tmp/phase24i-browser-validation/browser-matrix.json`.

---

## 5. Décision

**`BROWSER_VALIDATION_BLOCKED`**

Les critères de `BROWSER_VALIDATION_PASS` (audio réel OK, micro réel OK, refus
micro OK, navigation pendant enregistrement OK, aucun upload, cleanup OK) **ne
peuvent pas être atteints** faute de navigateur automatisé et de microphone réel.

**Recommandation** : ajouter un harnais Playwright (ou équivalent) + un
environnement avec microphone, puis rejouer 24I. En parallèle, corriger le
`.env.example` (P1) dans une phase de correction approuvée.

## 6. Arrêt obligatoire

Aucun démarrage de Q3-C, Q4, 24J, 24K, 23G, extension 114 sourates, nouveau
système de mastery/SRS, ni import phonétique.
