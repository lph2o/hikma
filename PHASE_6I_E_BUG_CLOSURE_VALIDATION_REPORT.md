# PHASE 6I-E — BUG CLOSURE & REGRESSION VALIDATION

**Mode : `READ_ONLY / VALIDATION_ONLY`**  
**Statut final : `PHASE_6I_E_BUG_CLOSED_VALIDATED`**

## Résultat

Le problème signalé — options parfois non cliquables, impression de reload/remount et cas autour d'Ex5 — n'est plus reproductible après clean rebuild et runtime production contrôlé.

Aucun fichier source n'a été modifié. Aucun grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, routing, persistance, Supabase, donnée Quran ou backend audio n'a été touché.

## Parcours production

Procédure exécutée :

```text
.next déplacé hors du dépôt pour obtenir un artefact clean
npm run build                         PASS
npm run start -- --port 3008         PASS
navigateur neuf
```

Le serveur contrôlé a été arrêté proprement après validation.

À `390×844`, Ex1 → Ex20 a été parcouru avec sélection, feedback et « Continuer », jusqu'à « Exercice 21 sur 46 ». L'URL est restée stable, `document.readyState` est resté `complete`, et aucune erreur/warning navigateur n'a été observé.

## Ex5 — validation ciblée

Ex5 a rendu quatre options. Une option a été sélectionnée, l'état `aria-checked` s'est mis à jour, les options ont été désactivées après réponse et le feedback est apparu. L'URL n'a pas changé et aucun document reload n'a été observé.

Le parcours Ex4 → Ex5 → Ex6 est inclus dans le stress Ex1 → Ex20. La validation dédiée Ex5 confirme donc :

```text
OPTIONS_CLICKABLE = PASS
STATE_UPDATE = PASS
NO_RELOAD = PASS
NO_UNEXPECTED_REMOUNT = PASS (aucun indice observable)
```

Le bouton « Comprendre pourquoi » a été ouvert avec feedback; l'explication est apparue sans navigation ni perte d'état. L'interface actuelle ne fournit pas de contrôle séparé de fermeture de l'explication; aucun changement n'a été introduit pour cela.

## Interactions vérifiées

- clic sur option;
- état sélectionné;
- désactivation des options après réponse;
- feedback;
- ouverture d'explication;
- validation et progression;
- transitions répétées jusqu'à Ex20;
- URL et état du document après chaque transition.

Les interactions n'ont provoqué ni boucle de rendu observable, ni navigation inattendue, ni blocage du clic.

## Responsive

### Mobile — 390×844

Les options restent accessibles et aucun overlay/overflow horizontal ne recouvre les réponses. Le parcours Ex1→Ex20 passe.

### Desktop — 1280×720

Les options Ex1 sont dans le viewport, cliquables, sans overflow horizontal ni recouvrement. La sélection et le feedback passent avec URL stable et console propre.

Note existante, non liée au bug clôturé : après un feedback long, le CTA « Continuer » peut être sous le viewport initial. Il reste présent et accessible par défilement/interaction, mais n'est pas toujours visible simultanément avec tout le feedback. Ce point est documenté, pas corrigé dans cette phase READ_ONLY.

## Console et navigation

- erreurs JavaScript : aucune;
- erreurs React : aucune observée;
- erreurs d'hydratation : aucune observée;
- navigation inattendue : aucune;
- document reload : aucun;
- URL : stable pendant les réponses et transitions.

Un remount React interne n'a pas été instrumenté, conformément au périmètre de clôture. Aucun indice de remount anormal n'est apparu : l'état sélectionné, le feedback et la progression se sont conservés comme prévu.

## Validations dépôt

| Commande | Résultat |
|---|---|
| `npm test` | PASS — 34 fichiers, 428 tests |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — clean rebuild |

Les JSON de `tmp/phase6i-e/` ont été validés avec `jq`.

## Diagnostic honnête

### Établi

Le bug n'est plus reproductible dans le runtime production propre validé, avec navigateur neuf, sur Ex1→Ex20, dont Ex5, à mobile et desktop.

### Inconnu

La cause exacte de l'incident historique initial n'est pas démontrée. La validation confirme une absence de régression dans le runtime contrôlé; elle ne transforme pas cette observation en preuve d'une causalité historique unique.

## Conclusion

`PHASE_6I_E_BUG_CLOSED_VALIDATED`

Le bug peut être considéré comme clos pour le runtime contrôlé actuel. Aucune modification de code n'est requise dans 6I-E.

