# PHASE 6H-V — REAL LESSON EXPERIENCE FINAL VALIDATION

Statut : `READ_ONLY / VALIDATION_ONLY / NO_CODE_MODIFICATION`

Date : 2026-08-17

## A. Environnement

| Élément | Valeur |
|---|---|
| Browser | Codex In-app Browser |
| OS | macOS |
| Instance | Next.js production server local sur `127.0.0.1:3002` |
| Route réelle | `/learn/basmala` |
| Mobile | `390×844` |
| Desktop | `1280×720` |
| Auth | Anonyme ; session authentifiée indisponible |
| Microphone | Aucune permission acceptée ou refusée pendant ce run |
| Matrice | [`tmp/phase6h-v/validation-matrix.json`](./tmp/phase6h-v/validation-matrix.json) |

## B. Résultats

| Domaine | Résultat | Sévérité | Notes |
|---|---|---|---|
| Auth | BLOCKED | NONE | Aucun compte/session QA disponible ; dashboard anonyme vérifié. |
| Lesson load | PASS | NONE | Leçon réelle chargée après stabilisation du rendu. |
| Audio | PASS | NONE | Interaction réelle : `loading` puis `ended`, replay disponible. |
| Microphone | BLOCKED | NONE | Permission non déclenchée/acceptée dans ce run. |
| Recording | BLOCKED | NONE | Nécessite permission accordée. |
| Word navigation | PASS | NONE | Mot 1→2→3→4 puis retour ; aucun état UI observé en fuite. |
| Exercise | PASS | NONE | QCM réel exercé, progression vers exercice 2. |
| Incorrect feedback | PASS | NONE | Réponse brute et réponse attendue distinctes. |
| Correct feedback | PASS | NONE | Réussite ordinaire sans `Mā shā’ Allāh` mécanique. |
| Explanation | PASS | NONE | Fermée par défaut ; `aria-expanded` et `aria-controls` vérifiés. |
| Arabic | PASS | NONE | `ٱلرَّحْمَـٰنِ` observé dans le contexte réel, diacritiques conservées. |
| Arabic keyboard | BLOCKED | NONE | Aucun exercice de saisie arabe atteint dans ce parcours court. |
| Persistence | BLOCKED | NONE | Session authentifiée indisponible ; aucune donnée modifiée. |
| Completion | BLOCKED | NONE | Parcours complet de 46 exercices non exécuté. |
| Mobile | PASS | NONE | CTA visible, safe-area observée, `scrollWidth = 390`. |
| Desktop | PASS | NONE | Leçon, arabe, guidée, contexte et CTA rendus ; `scrollWidth = 1280`. |

## C. Scénarios réellement exécutés

### Chargement et responsive

- `/learn/basmala` anonyme chargé à `390×844` et `1280×720`.
- Aucun warning ou erreur console observé après stabilisation du rendu.
- À `390×844`, `Mot suivant` est visible à `bottom = 832px` dans un viewport de `844px`.
- Aucun débordement horizontal détecté.

### Audio

- `Écouter le modèle` cliqué réellement.
- État observé : `loading` → `ended`.
- Les actions `Rejouer` et `Réécouter` sont apparues.
- Aucune erreur console audio.

### Contexte et arabe

- `Contexte coranique` ouvert puis fermé réellement.
- Les versets ont affiché notamment `ٱلرَّحْمَـٰنِ`, `ٱلرَّحِيمِ` et les diacritiques associées.
- Le contexte est revenu à `open = false` sans overflow.

### Navigation et isolation UI

- Navigation réelle Mot 1 → Mot 2 → Mot 3 → Mot 4 → retour Mot 3 → Mot 1.
- La prononciation guidée et le texte d’enregistrement étaient absents sur Mot 2 et présents sur Mot 1.
- Aucun état enregistré, sens ou feedback n’a fui entre les mots testés.

### Exercices et feedback

- Exercice 1 : mauvaise réponse volontaire `Allah`.
- Feedback observé : `À revoir`, `Ta réponse`, `Réponse attendue`, `Comprendre pourquoi`, `Continuer`.
- Explication ouverte puis fermée : `aria-expanded` `false → true → false`, `aria-controls` présent.
- Explication indisponible affichée honnêtement, sans analyse inventée.
- Exercice 2 : bonne réponse arabe `بِسْمِ`.
- Feedback observé : `Très bien`, `Réponse juste.` ; aucune expression islamique mécanique et aucune duplication de réponse attendue.

## D. Authentification, permission et persistance

```text
AUTH_SESSION: BLOCKED
REASON: aucune session authentifiée disponible dans l’environnement navigateur ; aucun identifiant fourni.

MIC_PERMISSION_GRANTED: BLOCKED
MIC_PERMISSION_DENIED: BLOCKED
MIC_PERMISSION_ALREADY_GRANTED: BLOCKED
MIC_PERMISSION_ALREADY_DENIED: BLOCKED
REASON: aucune permission microphone n’a été acceptée ou refusée durant ce run ; aucune donnée audio n’a été capturée.

PERSISTENCE: BLOCKED
REASON: le parcours authentifié et les Server Actions de persistance nécessitent une session utilisateur non disponible.

ARABIC_KEYBOARD: BLOCKED
REASON: aucun exercice de saisie arabe n’a été atteint dans le parcours navigateur exécuté.

FULL_LESSON_COMPLETION: BLOCKED
REASON: la leçon contient 46 exercices ; la validation authentifiée de fin de leçon n’était pas accessible dans cet environnement.
```

Ces blocages ne sont pas des échecs fonctionnels : ils indiquent uniquement des scénarios non exécutés. Aucune validation n’a été inventée.

## E. Bugs découverts

### Aucun bug P0/P1/P2/P3 confirmé pendant ce run

Les scénarios accessibles ont été exécutés sans erreur console, mismatch d’hydratation, overflow, fuite d’état ou incohérence de feedback observée.

Le délai de stabilisation initiale de la route dynamique a été observé, mais le rendu réel s’est ensuite affiché correctement sans erreur ; il n’est pas classé comme bug sur la seule base de cette observation.

## F. Validation automatisée

- `npm test` : **34 fichiers, 428 tests passés**.
- `npx tsc --noEmit` : **OK**.
- `npm run lint` : **OK**.
- `npm run build` : **OK**.

## G. Intégrité du dépôt

```text
source files modified during 6H-V: 0
backend modified: 0
database modified: 0
migrations: 0
data modified: 0
```

L’état Git fortement modifié observé au démarrage a été préservé. Seuls les livrables de validation autorisés par le brief ont été ajoutés : `tmp/phase6h-v/validation-matrix.json` et ce rapport.

## H. Conclusion

La validation réelle accessible est réussie pour le rendu anonyme, la découverte, le CTA mobile, l’audio, le contexte, l’arabe, la navigation des mots, le feedback incorrect/correct, l’explication et les deux viewports demandés.

Les validations authentifiées, microphone, persistance, clavier arabe et complétion complète restent explicitement bloquées et doivent être rejouées dans un environnement QA disposant d’un compte et d’une permission contrôlée.

`UI_UX_6H_V_REAL_VALIDATION_PARTIAL`
