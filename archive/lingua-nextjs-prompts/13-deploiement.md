# Étape 13 — Déploiement & README final

## 🎯 Objectif

Préparer l'app pour la **production** : vérifier les variables d'environnement, configurer le déploiement **Vercel**, ajouter les domaines autorisés (Clerk), et rédiger un README propre.

## 📋 Le prompt

```text
Finalise « Lingua » (Next.js) pour la production.

1. **README.md** : écris un README complet (en anglais ou français, à ton choix) avec :
   - Titre + bannière/description (« Duolingo clone with a real-time AI teacher »).
   - Stack : Next.js, TypeScript, Tailwind CSS, Clerk, Stream Video, Zustand, PostHog, OpenAI (vision-agent).
   - Fonctionnalités : onboarding, auth (email + social), écran d'accueil (XP/streak), parcours de leçons, prof IA en voix temps réel, tuteur chat, analytics.
   - Prérequis + étapes d'installation locales.
   - Tableau des variables d'environnement avec `.env.example`.
   - Instructions pour lancer le service Python `vision-agent`.
   - Lien de déploiement Vercel.

2. **`.env.example`** : liste toutes les variables (sans valeurs réelles) :
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST, STREAM_API_KEY, STREAM_API_SECRET, VISION_AGENT_URL, OPENAI_API_KEY.

3. **`next.config.ts`** : si ce n'est pas fait, autorise les domaines d'images distantes utilisés (flagcdn.com, picsum.photos) dans `images.remotePatterns`.

4. Vérifie que toutes les routes sont protégées correctement (middleware Clerk) et qu'aucune clé secrète n'est exposée côté client (seules les `NEXT_PUBLIC_*` le sont).

5. Ajoute un petit script `npm run typecheck` (tsc --noEmit) et `npm run lint` si absents, et vérifie que `npm run build` passe.
```

## 🔧 Étapes manuelles (déploiement)

1. **Pousse** le repo sur GitHub.
2. Crée un projet sur **Vercel** et importe le repo.
3. Dans Vercel → **Environment Variables**, ajoute **toutes** les variables de `.env.example` (y compris `CLERK_SECRET_KEY`, `STREAM_API_SECRET`, `OPENAI_API_KEY`).
4. Dans le dashboard **Clerk** :
   - Ajoute ton **domaine de production** (ex. `https://lingua.vercel.app`) dans « Allowed redirect origins » / « Allowed origins ».
   - Reconfigure les providers sociaux (Google/Facebook) avec les URLs de prod si besoin.
5. Dans **Stream** : vérifie que l'app est en mode production et que le domaine/les clés correspondent.
6. **Vision agent** : le service Python ne peut pas tourner sur Vercel (c'est un processus long-running). Héberge-le séparément (Fly.io, Railway, Render, un VPS…), puis pointe `VISION_AGENT_URL` vers son URL publique (HTTPS). Pour un usage purement local/démo, laisse `http://localhost:8000` et lance-le sur ta machine.

> ⚠️ **Important** : le prof IA ne fonctionnera que si le service `vision-agent` est joignable depuis l'app déployée. Sans lui, le reste (auth, leçons, UI, chat texte) fonctionne normalement.

## 📁 Fichiers attendus

```
README.md
.env.example
next.config.ts (mis à jour)
```

## ✅ Validation

- `npm run build` passe en local.
- L'app déployée sur Vercel charge l'accueil, l'auth fonctionne avec le domaine de prod.
- Le prof IA répond quand le service vision-agent est joignable.

---

## 🎉 C'est fini !

Tu as reconstruit « Lingua » en Next.js : auth Clerk, onboarding, parcours de leçons, prof IA en voix temps réel (Stream + OpenAI), tuteur chat, et analytics PostHog — le tout sans build natif, directement dans le navigateur.
