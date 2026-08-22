# PHASE 36G — REFONTE UX/UI DU CLAVIER ARABE

## Statut final

`PHASE_36G_ARABIC_KEYBOARD_UX_REDESIGN_COMPLETE_WITH_VALIDATION`

Refonte **strictement visuelle/ergonomique** du clavier arabe utilisé dans
l'exercice « Retrouver la forme arabe » (et dans le retry d'écriture arabe).
Aucun moteur pédagogique modifié, aucune migration, aucune donnée modifiée,
aucun commit.

---

## 1. État avant

Le clavier (`components/ui/arabic-keyboard.tsx`) était une surface technique
ajoutée sous l'exercice :

- **3 mécanismes de fermeture** : bouton `✕` (en-tête), bouton `Fermer` (rangée
  d'actions), plus le basculeur du consommateur `⌨ Fermer le clavier`.
- **Voyelles masquées** derrière une bascule `Voyelles` / `Lettres` (une seconde
  « couche » à découvrir), donc non séparées visuellement des lettres.
- **Grille incohérente** : `grid-cols-5 min-[360px]:grid-cols-6 sm:grid-cols-7`
  appliquée uniformément à 4 rangées de tailles différentes (7 / 10 / 10 / 9
  lettres) → retours à la ligne irréguliers.
- Rangée d'actions `Espace / ⌫ / Fermer` avec une action redondante.
- `lang="ar"` posé sur tout le conteneur alors que les libellés (`Lettres
  arabes`, `Fermer`) sont en français.

## 2. Problèmes UX identifiés

| Problème | Impact |
| --- | --- |
| Plusieurs façons de fermer | Confusion (« Comment je referme ça ? ») |
| Voyelles cachées + bascule | L'utilisateur ne voit pas où sont les signes |
| Rangées irrégulières | Impression de formulaire technique, positions peu mémorisables |
| `Fermer` redondant + `Vérifier` décalé | Hiérarchie d'action floue |
| Voyelles sans libellé lisible | Accessibilité faible |

## 3. Recherches effectuées

- `web_search` (Serper) : **indisponible** (« No search results found »), comme
  lors des phases précédentes → `WEB_RESEARCH_LIMITED`, documenté honnêtement.
- Appui sur des principes stables (tailles tactiles ≥ 40 px, une seule action de
  fermeture, séparation lettres/signes de vocalisation, feedback sobre) et sur
  la référence de l'état actuel fournie dans le contexte de la phase.

## 4. Décisions de design

1. **Une seule fermeture** : `✕` en en-tête (label « Masquer le clavier arabe »),
   + Échap au clavier physique. Suppression du bouton `Fermer` de la rangée
   d'actions **et** du libellé « Fermer le clavier » du basculeur.
2. **Lettres toujours visibles, positions stables** : les 36 lettres existantes
   conservées dans leur ordre (jamais réordonnées selon le mot demandé), grille
   `grid-cols-7 sm:grid-cols-10`.
3. **Voyelles/signes séparés et dorés** : la rangée des 10 signes est **toujours
   visible** dans une sous-section délimitée (`Voyelles & signes`), teintée
   d'or Hikma pour la distinguer des lettres.
4. **Signes combinants lisibles** : chaque signe est affiché sur un support
   visuel `◌` (cercle pointillé), l'insertion n'insérant **que** le signe.
5. **Actions réduites** : `[⌫] [Espace]` (Espace large). `Vérifier` reste **hors
   du clavier**, CTA principal inchangé.
6. **Micro-feedback doré** : la touche fraîchement utilisée est soulignée en
   doré (état local, jamais un toggle — aucun `aria-pressed`).
7. **Le basculeur « ⌨ Clavier arabe » ouvre seulement** ; une fois ouvert, c'est
   le `✕` du clavier qui ferme (suppression du second mécanisme de fermeture
   dans les deux consommateurs).

## 5. Composants modifiés

- `components/ui/arabic-keyboard.tsx` — réécrit (structure, compact, doré, a11y).
- `components/learn/exercises/index.tsx` — `RecallExercise` : le bouton
  `⌨ Clavier arabe` n'ouvre plus/tombe plus (« Fermer le clavier » supprimé).
- `components/learn/mini-review.tsx` — `ArabicRewriteStep` : idem.

Aucun autre fichier modifié. `lib/ui/arabic-input.ts` (insertion/suppression +
jeux de caractères) est **inchangé** : mêmes lettres, mêmes signes, mêmes
primitives `insertTextAtCursor` / `backspaceAtCursor`.

## 6. Tokens utilisés (design system existant uniquement)

- Structure : `border-border`, `bg-surface-subtle`, `bg-popover`, `border-input`,
  `text-foreground`, `text-text-secondary`.
- Focus : `ring-focus` + offset `bg-background`.
- Accent doré (parcimonieux) : `border-hikma-gold/30·60·70`,
  `bg-hikma-gold/6·10·15·20`.
- Motion : `ease-[var(--ease-hikma)]`, transition `background-color/border/transform`
  100 ms (transform/opacité uniquement, `prefers-reduced-motion` respecté par la
  règle globale).

Le teal/vert reste la structure, le doré n'est qu'un accent pédagogique (section
voyelles + touche récemment utilisée).

## 7. Comportement responsive

Validé en navigateur réel sur **375×812, 390×844, 1280×720** : aucun overflow
horizontal, aucune touche coupée, saisie/fermeture/réouverture opérationnelles
sur les trois. Le clavier est mobile-first (grille 7 colonnes → touches ≈ 45 px)
et se compacte en 10 colonnes sur desktop.

## 8. Accessibilité

- Touches = `<button type="button">` avec nom accessible explicite :
  - lettres : `lang="ar"` + nom = la lettre elle-même ;
  - signes : `fatha (a)`, `damma (ou)`, `kasra (i)`, `sukun (absence de voyelle)`,
    `shadda (doublement)`, `fathatan (an)`, `dammatan (oun)`, `kasratan (in)`,
    `alif suscrit`, `wasla` ;
  - actions : `Supprimer (retour arrière)`, `Espace` ;
  - fermeture : `Masquer le clavier arabe`.
- Focus visible (`focus-visible:ring-2 ring-focus`), fermeture au clavier
  (`Échap`), groupe `role="group"` nommé « Clavier arabe ».
- Le `lang="ar"` global sur le conteneur (qui faisait lire des libellés français
  en arabe) a été retiré ; il n'est conservé que sur les touches de lettres.

## 9. Tests

- `npx tsc --noEmit` ✅ · `npx eslint` ✅
- `npx vitest run` → **671/671** (aucun test supprimé ; `tests/arabic-input.test.ts`
  couvre toujours les jeux de caractères et les primitives d'insertion/suppression).
- `npm run build` ✅

## 10. Validation navigateur (réelle)

Playwright + Chrome headless contre le serveur local, compte de test dédié
supprimé après chaque scénario. Leçon `surah-103-ayah-1` (MEANING_TO_FORM = 4ᵉ
exercice). Résultats **identiques sur les 3 viewports** :

- Ouverture du clavier : PASS
- **Une seule fermeture** (✕) — aucun bouton `Fermer`, aucune bascule `Voyelles` : PASS
- Section `Voyelles & signes` + labels accessibles (fatha/kasra/damma/sukun/shadda) : PASS
- Saisie réelle : `و` → `وَ` (lettre+voyelle) → `وَع` → `⌫` → `وَ` → `Espace` → `وَ␣` → `⌫` → `وَ` : PASS (valeurs exactes)
- Champ `lang="ar" dir="rtl"` : PASS
- Fermeture ✕ → clavier masqué, basculeur réapparaît : PASS
- Réouverture → valeur conservée : PASS
- `Vérifier` toujours fonctionnel (soumission → verdict) : PASS
- Console : **0 erreur** · overflow horizontal : **aucun** : PASS

## 11. Non-régression

Confirmé : `validateAnswer`, `normalizeArabicGrading`, `isArabicRewriteExact`,
scoring, SRS, mastery, `user_word_progress`, `skillAttempts`, séquenceur,
`selectArabicRewriteRetryWords`, `selectReinforcementWords`, données Quran,
traductions, MASAQ, `FATIHAH_REFERENCE_LOCKED`, parcours — **tous inchangés**.
Le retry arabe reste non noté (vérifié lors de la phase 36G précédente).

## 12. Limitations

- `WEB_RESEARCH_LIMITED` (Serper indisponible — aucune source fraîche citée).
- La validation navigatrice couvre le clavier dans l'exercice principal
  (`MEANING_TO_FORM`) ; le clavier du retry utilise le **même** composant et les
  **mêmes** props, donc inchangé fonctionnellement (déjà validé en E2E lors de
  la phase précédente).
- Le premier passage à 375×812 a expiré sur la compilation à froid de la route ;
  rejoué immédiatement → PASS (transitoire, non produit).

## 13. Fichiers modifiés

- `components/ui/arabic-keyboard.tsx`
- `components/learn/exercises/index.tsx`
- `components/learn/mini-review.tsx`

(Artifacts jetables : `tmp/phase36g-keyboard.cjs`, `tmp/phase36g-keyboard.json`,
`tmp/phase36g-kb-cleanup.cjs`.)

## 14. Conclusion

Le clavier donne désormais l'impression d'un **outil pédagogique Hikma** : compact,
voyelles séparées et dorées, une seule fermeture, touches stables et accessibles,
feedback sobre — et non plus « un clavier arabe générique sous un formulaire ».
Le contrat fonctionnel (insertion au curseur, retry non noté, `Vérifier` hors
clavier) est strictement préservé.

Aucun commit. Aucune migration. Aucun changement du moteur pédagogique.
