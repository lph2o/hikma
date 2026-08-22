# Phase 6H — Real Lesson Experience QA & Premium Polish Audit

**Statut : `READ_ONLY` · `AUDIT_ONLY` · aucune correction implémentée**

## A. Executive Summary

Hikma a désormais une fondation UI/UX cohérente et reconnaissable : palette warm, shell de leçon, carte mot signature, progression, contexte repliable, audio Hikma, feedback séparé et explications progressives. Le parcours réel `/learn/basmala` confirme que l’expérience n’est plus une simple juxtaposition de composants techniques.

Le verdict reste toutefois **partiel** pour une raison concrète : le navigateur signale une erreur d’hydratation sur la découverte de leçon, liée à la détection client du microphone dans `PronunciationGuided`. L’arbre client se régénère ensuite et le contenu est utilisable, mais le premier rendu n’est pas stable. Le second enjeu est premium/pédagogique : sur mobile, la prononciation guidée prend la majorité du premier écran et repousse `Mot suivant` sous la ligne de flottaison.

**Score global : 3,5/5.** Aucun P0 confirmé. Deux P1 sont retenus : hydratation et rythme mobile de la découverte.

## B. État réel observé

Routes inspectées : `/dashboard`, `/learn`, `/learn/basmala` et `/design-system`.

- `/dashboard` anonyme : page d’accueil claire, CTA vers Al-Fatiha et création de compte.
- `/learn` : parcours réel `Quran Vocabulary`, 8 leçons, Basmala disponible, les suivantes verrouillées.
- `/learn/basmala` : leçon réelle “La Basmala”, 4 mots, mot 1/4, audio/prononciation/contextes issus des données disponibles.
- `/design-system` : laboratoire avec états pédagogiques et arabes Quranic.

Le dépôt était déjà très fortement modifié avant cette phase. Aucun fichier applicatif n’a été modifié pendant 6H ; seuls le rapport et les artefacts `tmp/phase6h/` ont été créés.

## C. Parcours complet

Le chemin observé et inspecté est :

`Dashboard → Learning Path → Lesson Discovery → Mot courant → Audio → Prononciation guidée → Exercices → Feedback → Explication → Exercice suivant → Fin de leçon`.

La boucle pédagogique `VOIR → COMPRENDRE → SE RAPPELER → PRODUIRE → RECEVOIR DU FEEDBACK` est correctement représentée dans les composants. La fin réelle n’a pas été atteinte dans le navigateur, mais `LessonComplete` possède les trois sorties attendues : leçon suivante, révision, retour au parcours.

Voir [`lesson-flow.json`](tmp/phase6h/lesson-flow.json) et [`route-state-matrix.json`](tmp/phase6h/route-state-matrix.json).

## D. Audit visuel et “wow factor”

La perception premium est réelle mais pas encore uniforme au niveau des micro-détails. Les surfaces warm, la carte `rounded-4xl`, les bordures fines et le vocabulaire visuel sont intentionnels. La sidebar desktop est calme et la zone de lecture reste centrée.

La découverte présente cependant un déséquilibre : le mot actuel est le héros conceptuel, mais la carte de prononciation guidée devient le héros visuel dès qu’elle est présente. Sur desktop, le premier fold montre surtout le début de cette zone ; sur mobile, le premier écran ne montre pas `Mot suivant`.

Le shell d’exercice est cohérent mais verticalement généreux : header focus, progression, compétence, interaction, feedback et footer forment une pile qui peut devenir longue après une réponse libre ou une explication ouverte.

## E. Audit pédagogique

Forces confirmées :

- effort de rappel protégé par les révélations et le contexte repliable ;
- compétence exprimée en verbe humain ;
- auto-évaluation distincte du noté ;
- réponse utilisateur et réponse attendue séparées ;
- feedback `correct`, `incorrect`, `ambiguous` explicite ;
- explication vérifiée ou indisponible plutôt qu’inventée ;
- contexte arabe conservé.

Point de vigilance : l’ordre visuel de la découverte peut faire comprendre “enregistrer” avant “continuer”, alors que l’objectif premier est d’ancrer le mot. Cela ne constitue pas une fuite de réponse, mais une question de hiérarchie et de charge cognitive.

## F. Audit mobile — 390×844

Validation réelle : `/learn/basmala` chargé à `390×844`, largeur de document `390px`, largeur de viewport `390px`, aucun overflow horizontal détecté. Le mot arabe, sa translittération et la carte warm restent lisibles.

Constats :

- le header focus reste compact et la sortie est accessible ;
- la carte mot est lisible, mais la prononciation guidée commence avant que l’action `Mot suivant` soit visible ;
- le contenu est naturellement scrollable, sans clipping horizontal ;
- les états de microphone n’ont pas été déclenchés pour ne pas demander une permission réelle ;
- les états feedback longs, clavier arabe et leçon complète n’ont pas été parcourus dans cette session.

Voir [`mobile-audit.json`](tmp/phase6h/mobile-audit.json).

## G. Audit desktop — 1280×720

Validation réelle : `/learn/basmala` chargé à `1280×720`, largeur de document `1280px`, aucun overflow horizontal détecté. La sidebar fixe de 256px et la colonne de lecture sont visuellement lisibles.

La composition est calme, mais la colonne centrale est étroite par rapport à l’espace disponible. Ce choix favorise la lecture et le focus, au prix d’une sensation de vide latéral et d’un guidage prononciation partiellement sous le fold.

Voir [`desktop-audit.json`](tmp/phase6h/desktop-audit.json).

## H. Arabe / RTL / diacritiques

Le contrat `ArabicText` est bon : `dir="rtl"`, `lang="ar"`, Amiri, line-height `1.9`, letter-spacing nul et aucune transformation de casse. Les caractères `ٱ`, shadda, voyelles et alif khanjariyah sont conservés dans le DOM et visibles dans le laboratoire et la découverte.

Les formes demandées ont été intégrées dans la matrice. Le rendu pixel-perfect de chaque marque selon navigateur/font n’a pas été mesuré par comparaison d’images ; aucune anomalie de clipping n’a été confirmée dans les captures disponibles.

Voir [`arabic-rendering.json`](tmp/phase6h/arabic-rendering.json).

## I. Audio

Le contrat `AudioPlayer` couvre idle, loading, playing, paused, ended et error, avec coordination d’un seul audio actif. Les états sont annoncés lorsque nécessaire, les boutons sont tactiles et l’absence d’audio dispose d’un fallback.

La lecture réelle, la pause, la fin et l’erreur réseau n’ont pas été déclenchées dans cette session. Ce point est donc `CODE_VERIFIED`, pas `BROWSER_VALIDATED`.

Voir [`audio-state-matrix.json`](tmp/phase6h/audio-state-matrix.json).

## J. Microphone / prononciation

La permission est demandée uniquement après clic explicite sur `Enregistrer`, ce qui respecte le principe de consentement. Les états `recording`, `recorded`, `NO_SIGNAL` et `REVIEW_REQUIRED` sont conçus de manière honnête : aucune correction automatique de prononciation n’est prétendue.

Constat critique : `recordingSupported()` lit `navigator` pendant le rendu et produit un HTML serveur différent du client. Le navigateur a signalé une erreur d’hydratation avec une différence entre le message d’indisponibilité serveur et le bouton `Enregistrer` client. Le client se régénère ensuite, mais ce défaut doit être corrigé dans une phase approuvée ultérieure.

Voir [`pronunciation-state-matrix.json`](tmp/phase6h/pronunciation-state-matrix.json).

## K. Exercices et feedback

Les familles d’exercices et leurs compétences sont recensées dans [`exercise-state-matrix.json`](tmp/phase6h/exercise-state-matrix.json). Le shell commun est une vraie force : la progression, la compétence, l’interaction et le feedback ont une grammaire commune.

Le feedback respecte la hiérarchie :

`À revoir → Ta réponse → Réponse attendue → Comprendre pourquoi → Continuer`.

Les réponses longues utilisent le retour à la ligne et la césure, mais leur effet sur la hauteur réelle d’une carte mobile n’a pas été testé par saisie navigateur. Le risque est P2, pas P0.

Voir [`feedback-state-matrix.json`](tmp/phase6h/feedback-state-matrix.json).

## L. Explications

La disclosure est fermée par défaut, porte `aria-expanded` et `aria-controls`, et expose une région pédagogique lorsqu’elle est ouverte. Les niveaux `verified`, `partial` et `unavailable` sont représentés.

Le point de polish est le rythme : dans un feedback déjà haut, ouvrir l’explication peut repousser fortement le CTA. L’information est honnête, mais la hiérarchie post-erreur mérite une passe mobile dédiée.

Voir [`explanation-state-matrix.json`](tmp/phase6h/explanation-state-matrix.json).

## M. Islamic UX language

Les expressions islamiques restent contextuelles et à faible fréquence. `Très bien` est utilisé pour les réussites ordinaires ; `Mā shā’ Allāh` est réservé aux moments significatifs. Aucun usage mécanique en score, badge ou monnaie n’a été observé.

Le seul outlier est `🎉 Leçon terminée` dans l’écran de fin : il introduit un ton plus gamifié que le reste de l’expérience. Il est classé P2 de cohérence de ton, sans constituer une violation pédagogique bloquante.

Voir [`islamic-ux-language.json`](tmp/phase6h/islamic-ux-language.json).

## N. MICRO-DETAILS THAT MATTER

Les détails à fort rendement premium sont regroupés dans [`micro-details.json`](tmp/phase6h/micro-details.json). Les plus importants sont :

1. redonner au mot courant davantage de présence avant la prononciation guidée ;
2. éviter que le CTA `Mot suivant` disparaisse sous le fold mobile ;
3. réduire la distance visuelle entre feedback, explication et `Continuer` ;
4. stabiliser le premier rendu microphone pour supprimer la rupture d’hydratation ;
5. revoir le ton de fin de leçon pour rester sobre et orienté maîtrise.

## O. Accessibilité

Les landmarks, libellés de navigation, focus visibles, `aria-live`, `aria-expanded`, `aria-controls` et cibles tactiles sont présents dans le code. Le contraste a été vérifié par cohérence de tokens, mais pas par mesure automatisée dans ce run. Le parcours clavier complet et un lecteur d’écran n’ont pas été exécutés.

Le titre `🎉 Leçon terminée` mérite une décision explicite sur le statut décoratif de l’emoji et son exposition aux technologies d’assistance.

Voir [`accessibility-audit.json`](tmp/phase6h/accessibility-audit.json).

## P. Cohérence Design System

La cohérence est bonne sur palette, boutons, nav, cartes signature et feedback. Les écarts sont surtout liés à la densité et au ton de completion, pas à une rupture de tokens.

Voir [`consistency-audit.json`](tmp/phase6h/consistency-audit.json).

## Q. Priorités P0 → P3

### P0

Aucun P0 confirmé.

### P1

- `6H-01` — hydratation de `PronunciationGuided` sur la route réelle ; erreur console et premier rendu instable.
- `6H-02` — découverte mobile trop longue avant `Mot suivant` ; la prochaine action d’apprentissage n’est pas visible au premier écran.

### P2

- `6H-03` — feedback long et explication ouverte éloignent le CTA.
- `6H-04` — le bloc de prononciation guidée dilue la présence du mot héros.
- `6H-05` — fin de leçon légèrement score-centric/gamifiée avec emoji et “Précision”.
- `6H-06` — audio, permission micro et fin authentifiée non validés en navigateur réel.

### P3

- `6H-07` — labels mobile proches du minimum typographique.
- `6H-08` — idle audio volontairement silencieux en texte, à préserver sauf besoin utilisateur démontré.
- `6H-09` — dashboard anonyme sparse, acceptable tant que l’onboarding anonyme reste hors scope.

Voir [`priority-matrix.json`](tmp/phase6h/priority-matrix.json).

## R. Écrans à refondre

Aucune refonte ne doit commencer automatiquement. Les deux candidats à une décision sont :

- `LessonDiscovery` mobile, pour le rythme mot courant → prononciation → Mot suivant ;
- la frontière de capacité de `PronunciationGuided`, pour stabiliser SSR/client.

## S. Écrans à polir

- feedback post-réponse dans `HikmaExerciseShell` ;
- écran `LessonComplete` et son cadrage de maîtrise ;
- hiérarchie audio/mot courant dans la découverte.

## T. Recommandations

1. Approuver séparément la correction de l’hydratation avant toute modification.
2. Faire une passe mobile dédiée avec une réponse longue et une explication ouverte.
3. Tester le vrai audio, le refus microphone et la fin persistée avec une session de QA authentifiée.
4. Conserver l’arabe et les données Quran inchangés ; mesurer le rendu avant toute décision de taille.
5. Décider si `Précision` doit rester une statistique secondaire face à une lecture par compétence/mots appris.

## U. Phase suivante proposée

Présenter ce rapport pour approbation. La phase suivante éventuelle serait une **Phase 6H-B Premium Lesson Polish**, strictement limitée aux deux P1 approuvés et aux micro-détails explicitement sélectionnés. Aucun changement n’est recommandé sans validation de périmètre.

## Validation technique

Les validations de dépôt connues de la phase précédente restent le baseline : 427 tests, TypeScript, lint et build passés. Aucun code applicatif n’a été modifié pendant cet audit. Les artefacts JSON de `tmp/phase6h/` sont validés par `jq` après génération.

`BROWSER_VALIDATION_PENDING` reste applicable aux routes authentifiées, Supabase, microphone, lecture audio réelle, saisie arabe, parcours complet d’exercices et fin persistée. Les validations réellement effectuées sont distinguées dans chaque matrice.

PHASE_6H_AUDIT_COMPLETE_READY_FOR_APPROVAL
