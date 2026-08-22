# PHASE 37A — QURAN COMPREHENSION COVERAGE : AUDIT READ-ONLY

Statut : `PHASE_37A_AUDIT_COMPLETE` — **aucun fichier modifié, aucune migration, aucune écriture DB, aucun commit.**

---

## A. État actuel des données (comptages réels, revérifiés en base)

| Table / mesure | Valeur vérifiée | Note |
| --- | --- | --- |
| `quran_words` | **21 296** | formes lexicales distinctes (1 occurrence min chacune) |
| `word_occurrences` | **77 430** | occurrences réelles (texte Uthmani) |
| `ayahs` | **6 236** | versets |
| `lemmas` | **32** total · **8** validés | (le brief indiquait 22 ; corrigé) |
| `lemma_translations` (FR validées) | **28** | (le brief indiquait 18 ; corrigé) |
| `word_translations` (FR validées) | **263** lignes · **263** formes distinctes | lexique éditorial Hikma |
| `word_lemma_mapping` (confidence = safe) | **184** lignes · **184** formes distinctes | surcouche additive |
| `quran_words.lemma_id` non nul | **135** formes | lemme direct natif |
| Leçons publiées | **90** | |
| Formes enseignées (`lesson_words.is_new = true`) | **270** formes distinctes | toutes ont ≥1 occurrence |

### Faits structurels importants (vérifiés)

1. **Toutes les 21 296 formes ont un `meaning` non nul** (gloss EN Quran.com). Il n'existe **aucune** forme « sans aucun sens » : `meaning = NULL` → 0 ligne. La distinction « évaluable / non évaluable » ne porte donc **pas** sur l'absence de sens, mais uniquement sur la **couverture FR validée** (263 formes) — voir §F.
2. **Toutes les formes ont au moins une occurrence** : `distinct_forms_with_occurrences = 21 296 = quran_words`. Aucune forme orpheline.
3. **Concentration Zipf forte** (fréquences réelles) :
   - **12 formes** → **10 %** des occurrences ;
   - **67 formes** → **25 %** ;
   - **618 formes** → **50 %** ;
   - **4 559 formes** → **75 %**.
4. **Plafond actuel de couverture** : les 270 formes enseignées couvrent **14 522 occurrences = 18,76 %** du corpus. C'est le **maximum atteignable aujourd'hui** par un utilisateur ayant tout maîtrisé (la métrique est bornée par le curriculum, pas par la formule).

---

## B. Modèle de progression actuel (comment Hikma sait qu'un mot est « su »)

Source de vérité : `user_word_progress` (vue agrégée par mot), elle-même alimentée par `validateAnswer` → `applyAnswer` (`lib/learning/progress.ts`).

Statuts (`WordStatus`) et seuils exacts :

| Statut | Condition de passage | `mastery` |
| --- | --- | --- |
| `new` | aucun contact | 0 |
| `learning` | 1er contact | 25 |
| `familiar` | ≥ 3 corrects **et** précision ≥ 0,50 | 50 (75 si intervalle ≥ 7 j) |
| `mastered` | ≥ 8 corrects **et** précision ≥ 0,80 **et** intervalle SRS ≥ 14 j | 100 |

Compléments (sans changement de la métrique) :
- `user_word_skill_progress` (8 compétences) et `review_items` (SRS) sont des couches **additives** ; la vue agrégée `user_word_progress.status` reste la notion officielle et suffisante.
- `nextStatus` **rétrograde** `mastered → familiar` en cas d'erreur (re-révision) — la métrique reflétera donc honnêtement une perte de maîtrise.

**Constat : Hikma possède déjà une notion fiable de « compris ». Aucun nouveau score de maîtrise n'est nécessaire.**

---

## C. Modèles de couverture comparés (formes / lemmes / occurrences)

| Modèle | Principe | Faisable aujourd'hui | Verdict |
| --- | --- | --- | --- |
| **A — Formes** | une forme maîtrisée couvre ses propres occurrences exactes | **Oui, 100 % des données** (`quran_words ↔ word_occurrences`) | **RETENU** |
| **B — Lemmes** | un lemme maîtrisé couvre toutes ses formes | **Non** : couche lemme couvre ~1,5 % des formes (135 directes + 184 mappées, 8 lemmes validés, 28 gloses FR) | **Rejeté (future work)** |
| **C — Occurrences pondérées** | somme des occurrences couvertes / total | Identique à A, mais formulé au niveau occurrence | **A et C sont le même calcul** |

**Choix : Modèle A = Modèle C.** La « couverture » est calculée **par forme, pondérée par ses occurrences**. C'est le seul modèle :
- **déterministe et complet** (chaque forme a des occurrences, chaque occurrence a une forme) ;
- **sans inférence linguistique** (pas de propagation lemme/racine non fiable) ;
- **honnête** : il ne **sur-compte** jamais (jamais de « vous comprenez X parce que vous connaissez un mot similaire »).

Le modèle B (lemme) est **rejeté pour la métrique officielle** car la couverture lemme est trop partielle pour être honnête à l'échelle du Coran. Il redeviendra pertinent quand la couche lemme aura été éditorialement étendue (hors périmètre).

---

## D. Définition recommandée de « compris »

> **`COMPREHENDED(w)` ⟺ `user_word_progress.status(w) ∈ { familiar, mastered }`** (équivalent : `mastery ≥ 50`).

**Binaire** (oui/non), pas pondéré. Justification :

1. **« vu ≠ compris »** : `new`/`learning` sont exclus (le brief interdit explicitement de présenter « 30 % » quand l'utilisateur a juste vu les mots une fois). `learning` = 1er contact, corrects < 3 — pas une compréhension.
2. **`familiar` est un vrai seuil d'apprentissage** (≥ 3 rappels réussis + précision ≥ 0,50), pas un contact.
3. **`mastered` est la maîtrise durable** (≥ 8 corrects, ≥ 0,80, intervalle ≥ 14 j).
4. **Binaire > pondéré** : un coefficient 0/0,25/0,5/1 n'existe pas dans le modèle actuel et ajouterait une explication sans bénéfice pédagogique. Le seuil binaire encode déjà « assez solide pour compter ».
5. Réutilise `WordStatus` **sans rien inventer**.

> Variante plus conservatrice possible (non retenue) : `mastered` seul. Elle donnerait une progression plus lente et un « 0 % » prolongé — démotivant pour une métrique de motivation. `familiar ∪ mastered` est le bon compromis.

---

## E. Formule mathématique exacte

Soit `freq(w)` = nombre d'occurrences de la forme `w` (`COUNT(word_occurrences.word_id = w)`), et `U` l'ensemble des formes avec `status ∈ {familiar, mastered}` pour l'utilisateur.

```
coverage = round( 100 × Σ_{w ∈ U} freq(w) / 77 430 )
```

Propriétés :
- **déterministe** (fréquences statiques + statuts persistés) ;
- **reproductible** (aucune randomisation, aucune horloge) ;
- **explicable** (« X occurrences du texte appartiennent à des mots que tu as déjà compris ») ;
- **stable** (monotone non-décroissante sauf régression `mastered → familiar`) ;
- **bornée** : 0 % (aucun mot compris) → 18,76 % aujourd'hui (tout le curriculum maîtrisé), croîtra avec le curriculum ;
- **testable** (pure fonction sur `Map<wordId, freq>` + statuts).

### Dénominateur : 77 430, sans exclusion

Décision : **Option 1 (inclure tout au dénominateur).**

- La promesse produit est « X % du **texte coranique** ». Exclure les formes hors curriculum gonflerait artificiellement le chiffre (« X % de ce qu'on pourrait t'enseigner » ≠ « X % du Coran »).
- Comme **toutes** les formes ont un sens (aucun `meaning = NULL`), il n'existe aucun « non-évaluable » structurel à retirer. Les formes non enseignées restent simplement **non couvertes** → la métrique reste honnête et motive l'expansion du curriculum.
- Pas de « couverture partielle » : la pondération intermédiaire est rejetée (voir §D.4).

---

## F. Cas particuliers (liste + traitement)

| Cas | Traitement | Justification |
| --- | --- | --- |
| `الله` vs `ٱللَّهِ` vs `ٱللَّهَ` | **formes distinctes**, chacune comptée si elle-même comprise | pas de fusion orthographique |
| `لِلَّه = لِ + الله` | **formes distinctes** ; maîtriser `الله` ne couvre **pas** `لِلَّه` | « ne pas supposer que deux chaînes similaires = même lexème » |
| Proclitiques (و، ب، ف، ل) / enclitiques pronominaux | formes distinctes, aucun traitement spécial | le modèle forme-exact les gère naturellement |
| Mots grammaticaux (مَا، مِن، لَا، إِنَّ…) | formes comme les autres ; comptées seulement si comprises | cohérent |
| Formes sans FR validée (gloss EN seulement) | **comptées quand même** si comprises | la compréhension est indépendante de la langue de la glose ; la qualité lexicale FR est un **autre** axe (readiness sourate, `effectiveFrPct`) |
| Formes à sens multiples | comptées **une fois par forme** | la couverture mesure la reconnaissance de la forme, pas l'énumération des sens |
| Mots hors curriculum | au dénominateur, jamais au numérateur | honnête (plafond = union du curriculum) |
| Progression partielle (`learning`) | **non comptée** (binaire) | « vu ≠ compris » |

> Cas `لِلَّه` : le projet dispose déjà de l'outillage pour le traiter proprement plus tard (`word_lemma_mapping` migration 0022 documente explicitement la fusion proclitique Quran.com). La métrique **n'utilise pas** ce mapping aujourd'hui (Modèle A strict), donc **aucune fusion incorrecte** — c'est le comportement sûr et demandé.

---

## G. Performance — méthode de calcul recommandée

Le calcul se décompose en :
1. **Numérateur** : liste des `word_id` compris (1 requête `user_word_progress` filtrée `status IN (familiar, mastered)`) + somme de leurs fréquences.
2. **Dénominateur** : 77 430 (constante de corpus, pas de requête).

Options comparées :

| Option | Coût DB | Fraîcheur | Maintenance | Verdict |
| --- | --- | --- | --- | --- |
| A. Calcul à chaque affichage (JS, agrégation mémoire) | jusqu'à ~15 round-trips (14 522 occurrences à paginer) pour le pire cas | parfaite | aucune | fallback possible |
| **B. SQL RPC `get_quran_coverage(user_id)`** | **1 round-trip** | parfaite | 1 fonction | **RETENU** |
| C. Vue SQL | 1 round-trip | parfaite | 1 vue | équivalent à B |
| D. Cache / agrégation | basse | **périmée** (entre deux leçons) | élevée (invalidation) | rejeté |
| E. Calcul périodique | basse | périmée | élevée | rejeté |

**Recommandation : SQL RPC (Option B/C), `SECURITY INVOKER`, lecture seule.**

Une fonction du type :

```sql
create or replace function get_quran_coverage(uid uuid)
returns bigint  -- nombre d'occurrences couvertes
language sql stable security invoker as $$
  select count(*)
  from word_occurrences wo
  where wo.word_id in (
    select word_id from user_word_progress
    where user_id = uid and status in ('familiar','mastered')
  );
$$;
```

- **Aucune table d'agrégation** (le brief l'interdit prématurément).
- **Aucun fetch de 14 522 lignes** côté JS.
- Le dénominateur 77 430 reste une constante applicative (ou un `count(*)` séparé si l'on préfère la recalculer).
- Si l'on souhaite **zéro objet SQL** (aucune migration du tout), le fallback Option A (agrégation JS en paginant `word_occurrences` filtré sur les `word_id` compris) est correct au scale actuel (≤ 270 formes, ≤ 14 522 occurrences) — mais moins élégant.

> Statut migration : **aucune table ni donnée**. L'Option B/C ajouterait un unique `CREATE FUNCTION` (lecture seule). Le brief demandait « aucune migration » pendant l'**audit** ; la décision d'implémenter la fonction (ou le fallback JS sans migration) relève de la Phase 37B après validation.

---

## H. Sécurité / autorisation

- `user_word_progress` est déjà protégé par RLS (`auth.uid() = user_id`). Une fonction `SECURITY INVOKER` exécutée par le `user` authentifié **ne peut lire que sa propre progression**.
- Le dénominateur (77 430) et les fréquences (`word_occurrences`) sont des **données corpus publiques** (RLS `using (true)`).
- Aucune server action / route handler nouvelle nécessaire : le calcul s'intègre dans la page serveur `dashboard/page.tsx` (déjà `force-dynamic`, déjà authentifiée via `client.auth.getUser()`).
- **Aucun risque de fuite inter-utilisateurs** : le `user_id` est soit forcé par RLS (RPC invoker), soit passé explicitement depuis `client.auth.getUser()`.

---

## I. UX — proposition d'affichage

- Libellé principal (encourageant, non culpabilisant) :
  > **« Tu comprends déjà ≈ X % du Coran »**
  (variante : « ≈ X % du texte coranique est déjà à ta portée »).
- **Arrondi entier + « ≈ »**, jamais de décimale (`18,4 %` est une fausse précision pour une estimation de couverture).
- Valeurs affichées seulement quand le numérateur est calculable ; sinon (aucune progression) → **0 %** assumé ou état neutre « Tes premiers mots comptent ici ».
- **Emplacement recommandé** : carte « Progression » du dashboard (section `Tes sourates`), en complément des `SummaryValue` existantes (« Mots étudiés / maîtrisés / maîtrise moyenne »). La couverture ajoute la **dimension « que représente ce vocabulaire dans le Coran »** qui manque aujourd'hui.
- Le chiffre doit être **explicable au clic** (ou en `Caption`) : « X mots compris couvrent N occurrences du texte coranique » — vérité du calcul, pas marketing.

> Le coach quotidien / plan du jour (P2 du rapport Quran Progress) est **hors périmètre** de cette phase, comme demandé.

---

## J. Tests nécessaires (Phase 37B)

### Logique pure `computeQuranCoverage(comprehendedWordIds, frequencyByWordId, totalOccurrences)`
1. **Utilisateur sans progression** → `0 %`.
2. **Un seul mot appris** → impact exact = `freq(mot) / 77 430`.
3. **Mot très fréquent maîtrisé** → poids = sa fréquence (ex. forme de `الله`, 963 occurrences).
4. **Mot rare maîtrisé** → poids = 1–2 occurrences.
5. **Plusieurs formes d'un même lemme** → chaque forme comptée **indépendamment** (Modèle A, pas de fusion lemme).
6. **`لِلَّه` et `الله`** → deux formes distinctes, aucune fusion : maîtriser `الله` ne couvre **pas** `لِلَّه`.
7. **Forme sans FR validée** → comptée si `familiar`/`mastered` (la couverture est indépendante de la langue de la glose).
8. **Progression partielle (`learning`)** → **non comptée** (seuil binaire `familiar`).
9. **Isolation A/B** : le numérateur ne dépend que des `word_id` du user (RLS testé au niveau requête).
10. **Non-régression** : les 671 tests existants restent verts ; `getGlobalWordStats`/dashboard inchangés.

### Bornes & arrondi
- `round(0.4) → 0` ; `round(18.76) → 19` ; jamais > 100 ; jamais NaN si `totalOccurrences = 0`.

---

## K. Migration

**Aucune migration nécessaire** pour la logique de couverture elle-même.

- La formule est une **pure fonction** sur des données déjà existantes (`user_word_progress` + `word_occurrences`).
- Deux chemins d'implémentation en 37B :
  1. **Sans migration** : agrégation JS (fetch paginé des occurrences des formes comprises).
  2. **Avec un unique `CREATE FUNCTION`** (lecture seule, `SECURITY INVOKER`) si l'on veut 1 seul round-trip — ce n'est **pas** une table d'agrégation, mais c'est techniquement un objet SQL (à valider avant 37B).

**Aucune table, aucune colonne, aucune donnée à créer ou modifier.**

---

## Conclusion — décision à valider avant implémentation

1. **Modèle** : formes (A = C), pondéré par occurrences, dénominateur 77 430 sans exclusion.
2. **« Compris »** : `status ∈ {familiar, mastered}` (binaire).
3. **Formule** : `round(100 × Σ freq(compris) / 77 430)`.
4. **Cas limites** : forme-exact strict (pas de fusion `لِلَّه`/`الله`), FR non requis pour compter.
5. **Calcul** : RPC `SECURITY INVOKER` recommandé (ou fallback JS sans migration).
6. **UX** : « Tu comprends déjà ≈ X % du Coran », entier, dashboard.

**STOP après ce rapport** — aucune implémentation automatique. La Phase 37B ne démarre qu'après validation de la définition de la métrique.
