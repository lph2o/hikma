# Reconstruire « Lingua » en Next.js — Prompts & Étapes

Ce dossier contient **l'ensemble des prompts et des étapes** pour recréer, en **Next.js** (web), l'application mobile **Lingua** (clone Duolingo avec prof IA) actuellement écrite en Expo / React Native.

Chaque fichier numéroté correspond à **une étape** du build. Chaque étape contient :

1. **🎯 Objectif** — ce qu'on construit.
2. **📋 Le prompt** — un bloc prêt à copier-coller dans ton outil IA (Cursor, Claude Code, Windsurf, etc.).
3. **🔧 Étapes manuelles** — les actions que l'IA ne peut pas faire à ta place (créer des comptes, clés API, etc.).
4. **📁 Fichiers attendus** — ce qui doit être créé.
5. **✅ Validation** — comment vérifier que ça marche.

> 💡 **Comment utiliser ce dossier** : pars de `01`, exécute l'étape (colle le prompt, fais les étapes manuelles), vérifie, puis passe au fichier suivant. Les prompts sont **séquentiels** : ils supposent que les étapes précédentes sont terminées.

---

## 🗺️ Mapping technologique (React Native / Expo → Next.js)

| Concept mobile | Équivalent Next.js / web |
|---|---|
| Expo Router (`app/`) | **Next.js App Router** (`app/`) |
| NativeWind / Tailwind | **Tailwind CSS v4** |
| `View`, `Text`, `Pressable` | `div`, `p`, `button` (HTML/JSX) |
| `SafeAreaView` | padding top (viewport) / CSS `env(safe-area-inset-top)` |
| `ScrollView` / `FlatList` | défilement natif + `map()` |
| `Image` (expo-image) | `next/image` ou `<img>` |
| `expo-haptics` | `navigator.vibrate()` (optionnel) |
| Zustand + AsyncStorage | **Zustand + `persist` → localStorage** |
| Expo API routes (`app/api`) | **Route Handlers** Next.js (`app/api/.../route.ts`) |
| `expo-constants` / `EXPO_PUBLIC_*` | `process.env.NEXT_PUBLIC_*` |
| `@clerk/expo` | **`@clerk/nextjs`** |
| `@stream-io/video-react-native-sdk` | **`@stream-io/video-react-sdk`** |
| `posthog-react-native` | **`posthog-js`** |
| Expo Go / device | **`http://localhost:3000`** dans le navigateur |
| Module natif WebRTC (build custom) | **WebRTC natif du navigateur** (aucun build nécessaire) ✅ |

> ⚠️ **Point clé** : sur le web, **WebRTC est fourni par le navigateur** (Chrome/Safari/Firefox). Fini les problèmes de build natif type Xcode/Expo Go : le prof IA vidéo/voix fonctionne directement dans un onglet.

---

## 🧰 Prérequis (comptes & clés à créer toi-même)

L'IA va coder, mais **tu** dois fournir ces clés. Crée-les au début (comptes gratuits) :

| Service | Rôle | Lien d'inscription |
|---|---|---|
| **Clerk** | Authentification (email + Google/Facebook/Apple) | https://clerk.com |
| **Stream** | Appels vidéo/audio temps réel (prof IA) | https://getstream.io |
| **PostHog** | Analytics produit | https://posthog.com |
| **OpenAI** | Modèle temps réel du prof IA (clé pour le service Python) | https://platform.openai.com |

## 🔑 Variables d'environnement (`.env.local`)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

STREAM_API_KEY=
STREAM_API_SECRET=

# URL du service Python vision-agent (étape 10)
VISION_AGENT_URL=http://localhost:8000
```

> Les clés `STREAM_API_SECRET` et `OPENAI_API_KEY` restent **côté serveur** (jamais préfixées `NEXT_PUBLIC_`).

---

## 📚 Sommaire des étapes

| # | Fichier | Sujet |
|---|---|---|
| 01 | `01-setup-design-system.md` | Init Next.js + Tailwind + design system (Poppins, couleurs) |
| 02 | `02-authentification-clerk.md` | Auth Clerk (sign-in/sign-up/SSO) + routes protégées |
| 03 | `03-onboarding-langue.md` | Onboarding + sélection de langue |
| 04 | `04-donnees-contenu.md` | Types + données (langues, unités, leçons) |
| 05 | `05-state-zustand.md` | Zustand + persistance (XP, streak, langue) |
| 06 | `06-accueil-layout.md` | Écran d'accueil + layout/navigation |
| 07 | `07-unites-lecons.md` | Écran unités & liste de leçons |
| 08 | `08-prof-ia-stream.md` | Route de leçon + Prof IA voix/vidéo (Stream web) |
| 09 | `09-vision-agent-python.md` | Service Python vision-agent |
| 10 | `10-tuteur-chat.md` | Tuteur chat (IA) |
| 11 | `11-profil.md` | Écran profil |
| 12 | `12-analytics-posthog.md` | Analytics PostHog |
| 13 | `13-deploiement.md` | Déploiement (Vercel) + README |
