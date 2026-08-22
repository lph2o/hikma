# PHASE 20C-B — BROWSER VALIDATION

**Mode : `MANUAL_VALIDATION_ONLY`**  
**Code/database writes : 0**  
**Décision : `FATIHAH_REQUIRES_FINAL_FIX`**

## 1. Environnement

- Application : build production locale, `next start`, port 3000.
- Navigateur : Codex In-app Browser.
- Desktop : `1280×720`.
- Mobile : `390×844`.
- Session anonyme : aucune donnée de progression utilisateur n'a été écrite.

Le serveur déjà présent sur le port 3000 a été redémarré à partir de la build
actuelle pour éviter de valider une version obsolète. Aucun fichier ni aucune
donnée Supabase n'a été modifié.

## 2. Méthode

Pour chacune des 8 leçons : chargement, découverte des mots, passage aux
exercices, réponse correcte, réponse incorrecte, feedback, explication,
audio/context lorsque disponibles, RTL, overflow et console.

## 3. Résultat des 8 leçons

| Leçon | Chargement | Exercice | Correct | Incorrect | Explication | Audio | RTL | Mobile | Console |
|---|---|---|---|---|---|---|---|---|---|
| basmala | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| al-hamd | PASS | PASS | PASS | PASS | PASS* | PASS | PASS | PASS | PASS |
| ar-rahman | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| malik-yawm-ad-din | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| iyyaka-nabudu | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| ihdina-sirat | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| sirat-alladhina | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| wa-la-d-dallin | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

`*` L'explication standard passe, mais l'exercice spécialisé de relation de
lemme révèle le problème décrit ci-dessous.

## 4. Validation de l'explication

Le flux standard observé est correct : feedback, réponse attendue, glose,
contexte du verset et bouton audio. L'explication reste fermée avant la
soumission et son ouverture ne crée pas de réussite.

## 5. Validation audio

Le bouton `Écouter le mot` est visible après erreur. La lecture a atteint
l'état `loading` sans erreur console ; aucune URL publique ou nouvel audio n'a
été créé.

## 6. Validation lemme

Sur `al-hamd`, exercice 85/89, la relation de lemme affiche correctement le
repère « même famille » et l'audio. Cependant, la glose et le contexte réel
disponibles ne sont pas affichés dans cette branche spécialisée.

## 7. Validation contexte

PASS sur les exercices standards : le contexte arabe et la traduction réelle
du verset sont visibles après ouverture de l'explication. Les diacritiques
Quranic Arabic sont conservées.

## 8. Validation grading

PASS : réponses correctes et incorrectes observées dans les huit leçons, avec
feedback et continuation. Le grading n'a pas été modifié.

## 9–11. Progression, SRS, mastery

Aucune progression artificielle n'est observée lors de l'ouverture d'une
explication en session anonyme. SRS et mastery ne sont pas persistés dans ce
parcours anonyme ; les mécanismes restent inchangés et les validations
automatisées Phase 20C restent la référence complémentaire.

## 12. Validation RTL

PASS : arabe vocalisé lisible, attributs `dir="rtl"` observés, boutons et
contenu français conservant leur direction LTR.

## 13. Validation responsive

PASS à `390×844` et `1280×720`. `scrollWidth` est égal à la largeur du
viewport dans les parcours vérifiés ; aucun overflow horizontal observé.

## 14. Console

PASS : aucune erreur JavaScript, React, hydratation, réseau ou Supabase
observée dans la console pendant les parcours testés.

## 15–16. Problème trouvé et sévérité

**P1 — fonctionnel/pédagogique :** dans la branche `LEMMA_RELATION`,
`Comprendre pourquoi` affiche la relation de famille et l'audio, mais pas la
glose ni le contexte disponibles pour la forme. Reproduction :
`al-hamd → exercice 85/89 → choisir رَبِّ → Comprendre pourquoi`.

La Phase 20C-B étant validation-only, aucune correction n'a été appliquée.

Observation séparée : lors de l'arrêt du serveur local redémarré, sa sortie a
émis plusieurs `Failed to find Server Action`. Ces messages n'ont pas été
observés dans la console navigateur pendant les parcours et sont documentés
comme observation runtime non critique, sans causalité affirmée.

## 17. Décision finale

`FATIHAH_REQUIRES_FINAL_FIX`

Le verrouillage `FATIHAH_REFERENCE_LOCKED` est refusé pour cette phase. Une
petite correction du wiring de l'explication spécialisée est nécessaire, puis
une nouvelle validation navigateur pourra reprendre.

## 18. JSON

Voir [le JSON de validation navigateur](tmp/phase20c-b-browser-validation.json).
