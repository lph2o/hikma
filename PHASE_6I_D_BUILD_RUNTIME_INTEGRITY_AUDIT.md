# PHASE 6I-D — FORENSIC BUILD & RUNTIME INTEGRITY AUDIT

**Statut initial : `PHASE_6I_D_BUILD_RUNTIME_FORENSIC_AUDIT_READY`**  
**Statut final : `PHASE_6I_D_BUILD_RUNTIME_FORENSIC_AUDIT_COMPLETE`**  
**Décision unique : `STALE_BUILD_REJECTED`**  
**`NO_CODE_MODIFIED` · `NO_BUSINESS_LOGIC_MODIFIED` · `NO_DATA_MODIFIED`**

## Périmètre et état avant audit

Audit strictement forensic. Les modifications non commitées existantes ont été conservées. Aucun composant, hook, CSS, moteur pédagogique, persistance, Supabase, donnée Quran ou backend n'a été modifié.

Avant le contrôle, `.next` contenait des artefacts `dev` et un build Turbopack partiel provenant de tentatives précédentes. Le build production n'était pas suffisamment complet pour conclure à partir de cet état seul. Le port 3002 n'était plus joignable depuis l'hôte et aucun processus Next applicatif n'était visible dans l'inventaire hôte.

## ÉTAPE A — Inventaire runtime

L'inspection escaladée en lecture seule de `ps` et des ports d'écoute n'a trouvé aucune instance Next/Node/Turbopack applicative active sur l'hôte au moment de l'inventaire. Cela n'exclut pas l'isolation du runtime navigateur, mais ne montre aucun serveur concurrent local.

Un runtime contrôlé unique a ensuite été lancé :

```text
npm run start -- --port 3004
mode: next start
cwd: /Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma
URL locale: http://127.0.0.1:3004/learn/basmala
URL réseau: http://172.20.10.7:3004
```

Il a été arrêté après le test. Aucun autre serveur n'a été lancé en parallèle.

## ÉTAPE B — Intégrité build

Le `.next` précédent a été supprimé uniquement après documentation de son état, puis reconstruit avec `npm run build`. Le clean rebuild a réussi avec Next.js 16.3.0/Turbopack : compilation, TypeScript, collecte de page, génération statique et optimisation sont passés.

Artefacts complets présents : `BUILD_ID`, `build-manifest.json`, `server/app-paths-manifest.json`, `server/server-reference-manifest.json`, `routes-manifest.json`, `trace` et `trace-build`.

Les timestamps du build (`12:28:42–12:28:58`) sont postérieurs aux sources critiques inspectées (`22:37–23:53` la veille). Le build est donc contemporain des dernières modifications source concernées.

## ÉTAPE C — Source → bundle → navigateur

Les source maps de production contiennent le `sourceContent` des fichiers critiques et les signatures actuelles :

| Composant | Signature vérifiée | Résultat |
|---|---|---|
| `LessonPlayer` | `saveLessonSession`, `router.push("/learn")`, `setAnswer(null)` | présente |
| `HikmaExerciseShell` | `data-slot="hikma-exercise-shell"`, `Réponse enregistrée` | présente |
| `ExerciseCard` | `exerciseIdentity`, `OptionsExercise` | présente |
| `OptionsExercise` | `role="radio"`, `onChoose` | présente |
| `PronunciationGuided` | `micState`, `recordingSupported` | présente |
| `Button` | `typeValue`, `pointer-events-none` | présente |

Le navigateur neuf a reçu 15 scripts et 2 feuilles de style sous `/_next/static/chunks/` avec noms hashés de production. La page a atteint `document.readyState=complete`. La chaîne source → source map → chunks hashés → DOM est cohérente.

## ÉTAPE D — Cache navigateur

Le test a utilisé un nouvel onglet/contexte de travail et le runtime de production nouvellement lancé. Les chunks hashés observés ne fournissent aucun indice d'ancien bundle.

Les headers HTTP, Cache Storage, IndexedDB et l'API service worker n'ont pas pu être inspectés directement depuis l'environnement isolé du navigateur; l'hôte ne pouvait pas joindre son `127.0.0.1:3004`. Cette limite est explicitement conservée : aucun cache problématique n'est affirmé ni inventé.

## ÉTAPE E — Port et serveur servi

Le parcours propre a utilisé exclusivement :

```text
URL navigateur http://127.0.0.1:3004/learn/basmala
↓
next start --port 3004
↓
cwd /Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma
↓
build .next reconstruit immédiatement avant le lancement
```

La correspondance est explicite. Le précédent port 3002 était indisponible côté hôte et n'a pas été utilisé pour la validation Phase 6I-D.

## ÉTAPE F — Clean rebuild

Action limitée aux artefacts générés : `.next` uniquement. Aucun répertoire source n'a été touché. `npm run build` a réussi après nettoyage. Le serveur unique `next start` a servi ce build et a été arrêté après la validation navigateur.

## ÉTAPE G — Test navigateur propre

À `390×844`, parcours réel : découverte → démarrage → Ex1 → Ex2 → Ex3 → Ex4 → Ex5 → Ex6. Chaque action a été précédée d'un snapshot frais et d'un comptage exact du contrôle.

Résultats Ex1–Ex6 : quatre radios présentes, `pointer-events:auto`, aucun formulaire parent, sélection observée après clic, radios désactivées après réponse, URL inchangée et `document.readyState=complete`. Ex5 ne disparaît pas avant interaction et utilise le même chemin de production `OptionsExercise` que les autres QCM.

Un feedback long peut placer « Continuer » hors du viewport mobile; le locator le retrouve et la transition réussit. Ce phénomène est une visibilité/scroll UX, pas un document reload.

Console navigateur : aucun warning/error.

## ÉTAPE H — Reload / remount / rerender

- **Document reload : non observé** — URL et état du document restent stables pendant Ex1–Ex6.
- **Route navigation : non observée** — aucune URL ne change pendant les réponses.
- **React remount anormal : non démontré** — l'API d'observation fine des mounts n'a pas été injectée en mode read-only; aucune perte d'état ou disparition avant clic n'a été observée.
- **Rerender normal : observé** — la sélection désactive les options et rend le feedback, ce qui correspond au cycle React attendu.
- **Perception visuelle : possible** — le feedback long et le CTA hors viewport peuvent ressembler à une interruption, sans être un reload.

## ÉTAPE I — Régression options

Les options Ex1–Ex6 sont présentes, dans le viewport, interactives, non désactivées avant réponse, sans formulaire parent ni overlay observé. Après clic, `aria-checked` passe à `true` pour une option et les boutons deviennent désactivés conformément au contrat métier. Aucun submit implicite ni navigation n'a été déclenché.

## ÉTAPE J — Hypothèse ancien build

`STALE_BUILD_REJECTED`.

Preuves : clean rebuild réussi, manifestes complets, timestamps contemporains, signatures source présentes dans les source maps, chunks hashés réellement référencés par le navigateur neuf, runtime unique `next start`, et parcours Ex1–Ex6 fonctionnel avec console propre.

## Réponses aux critères de succès

1. Le navigateur sert-il le source actuel ? **Oui, traçabilité source maps/chunks/runtime contrôlé.**
2. Build contemporain ? **Oui.**
3. Plusieurs serveurs ? **Aucun observé; un seul serveur contrôlé.**
4. Cache/service worker problématique ? **Non démontré; inspection directe limitée par l'isolation.**
5. Ex5 même code ? **Oui, même bundle et famille `OptionsExercise`.**
6. `onClick` atteint ? **Effet observable : sélection et désactivation après clic.**
7. Document reload ? **Non observé.**
8. React remount ? **Non directement observable, aucun remount anormal démontré.**
9. Overlay ? **Aucun observé.**
10. Clean build reproduit le problème ? **Non; clean build + runtime production restent stables.**

## Validations finales

- `npm test` : **PASS**, 34 fichiers, 428 tests.
- `npx tsc --noEmit` : **PASS**.
- `npm run lint` : **PASS**.
- `npm run build` après clean `.next` : **PASS**.

## Limites et prochaine action

Le cache HTTP/service worker n'a pas pu être inspecté directement dans le runtime isolé; aucune preuve ne le met toutefois en cause. La prochaine investigation ne devrait passer à une correction de code interaction que si le symptôme persiste après la procédure contrôlée suivante : arrêter les anciens serveurs, nettoyer `.next`, reconstruire, lancer une seule instance, puis rejouer avec un contexte neuf.

Si le bug persiste dans ce cadre, recueillir l'URL/port exact, le type d'exercice, l'état authentifié et une capture de l'état avant/après clic.

## Décision finale

# `STALE_BUILD_REJECTED`

