# Étape 12 — Analytics PostHog

## 🎯 Objectif

Brancher **PostHog** pour suivre les événements produit : identification de l'utilisateur, vues d'écran, et événements clés (leçon démarrée/abandonnée, clic « Continue learning », etc.).

## 📋 Le prompt

```text
Ajoute l'analytics PostHog à « Lingua » (Next.js App Router).

Contexte : design system Lingua, auth Clerk, stores Zustand, écrans Home/Learn/leçon/Chat déjà en place.

1. Installe `posthog-js`.
2. Crée `lib/posthog.ts` (côté client) :
   - Lis `NEXT_PUBLIC_POSTHOG_KEY` et `NEXT_PUBLIC_POSTHOG_HOST` depuis l'environnement.
   - Si la clé est absente ou placeholder, désactive PostHog (`disabled: true`) et log un warning.
   - Exporte un client singleton `posthog` initialisé avec `{ api_host, autocapture: true, ... }` (utilise `posthog.init` une seule fois).
3. Crée `components/posthog-provider.tsx` (client component) qui initialise le client dans un `useEffect` au chargement de l'app (évite de l'initialiser côté serveur).
4. Dans le layout racine :
   - Monte `PostHogProvider`.
   - Ajoute un composant qui, quand l'utilisateur Clerk est chargé et connecté, appelle `posthog.identify(user.id, { $set_once: { signup_date }, $set: { preferred_language } })`.
5. Suivi de pages : utilise `usePathname()` dans un composant du layout pour appeler `posthog.capture("$pageview", { pathname })` (ou active l'autocapture de pages).
6. Ajoute les événements clés :
   - `chat_viewed` (onglet Chat), `ai_teacher_viewed` (onglet AI Teacher) au montage.
   - `continue_learning_tapped` (bouton Continue de l'accueil) avec propriétés `language_code`, `unit_order`, `xp_today`, `streak`.
   - `lesson_started` (au début d'une leçon) avec `lesson_id`, `language`, `lesson_number`.
   - `lesson_abandoned` (quitter une leçon) avec `lesson_id`, `time_into_lesson_seconds`.
7. Utilise la même signature d'événements que l'app mobile d'origine pour rester cohérent.

Note : côté serveur (routes API), n'envoie PAS d'événements (ou utilise le SDK serveur `posthog-node` si tu veux des analytics backend — optionnel).
```

## 🔧 Étapes manuelles

1. Crée un compte **PostHog** (https://posthog.com) et un projet.
2. Dans `.env.local` :
   ```env
   NEXT_PUBLIC_POSTHOG_KEY=phc_...
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```
3. (Optionnel) Autorise `localhost` dans les domaines PostHog.

## 📁 Fichiers attendus

```
lib/posthog.ts
components/posthog-provider.tsx
```

## ✅ Validation

- Les événements apparaissent dans le dashboard PostHog (onglet Activity/Live Events).
- `identify` est appelé à la connexion, et les vues de pages sont capturées.
- Si la clé manque, aucun appel réseau n'est fait (mode désactivé).
