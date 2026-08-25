# Étape 09 — Service Python « vision-agent »

## 🎯 Objectif

Créer le service **Python** qui pilote le prof IA : il rejoint l'appel Stream, applique les instructions pédagogiques (prompt système de la leçon), parle à l'élève via le modèle temps réel d'OpenAI, et renvoie les transcriptions en direct vers l'app.

> Ce service tourne **à côté** de l'app Next.js (processus séparé). C'est la « tête » de l'agent IA.

## 📋 Le prompt

```text
Crée un service Python nommé `vision-agent/` qui pilote un prof de langue IA en temps réel.

Il utilise :
- La lib `vision-agents` (framework Stream Vision Agents) et ses plugins `getstream` + `openai`.
- `getstream.models` pour MemberRequest.
- `openai` (modèle temps réel) avec transcription audio.

### Fichier `vision-agent/main.py`

1. Charge les variables d'environnement : d'abord le `.env` parent (clés Stream), puis un `.env` local qui ajoute `OPENAI_API_KEY` (override).
2. Définit `AGENT_USER_ID = "ai-teacher"`.
3. Définit un dictionnaire `LANGUAGE_NAMES` : es→Spanish, fr→French, ja→Japanese, de→German.
4. Définit `DEFAULT_SYSTEM_PROMPT` : un prof de langue chaleureux et énergique qui fonctionne en DEUX modes sans jamais les mélanger :
   - MODE ENSEIGNEMENT : dit UN mot/expression, sa traduction anglaise, un conseil de prononciation, termine par une question, et S'ARRÊTE au point d'interrogation. N'imagine jamais la réponse de l'élève.
   - MODE RÉACTION : réagit à ce que l'élève a réellement dit (une phrase d'encouragement ou de correction), puis redemande d'essayer ou introduit le mot suivant, et s'arrête.
   - Règles absolues : ne jamais féliciter sans avoir entendu l'élève parler ; ne jamais dépasser le point d'interrogation ; réponses d'une ou deux phrases ; rester dans le vocabulaire de la leçon.
5. `create_agent(**kwargs)` → retourne un `Agent` :
   - `edge = getstream.Edge()`
   - `llm = openai.Realtime(...)` avec un `realtime_session` configuré pour la détection de parole par VAD serveur (threshold 0.4, prefix_padding_ms 200, silence_duration_ms 400, interrupt_response True) et transcription `gpt-4o-mini-transcribe`.
   - `agent_user = User(name="AI Teacher", id=AGENT_USER_ID)`
   - `instructions = DEFAULT_SYSTEM_PROMPT`
6. `join_call(agent, call_type, call_id, **kwargs)` :
   - `call = await agent.create_call(call_type, call_id)`.
   - Lit le `custom` du call (données envoyées par l'app : `system_prompt`, `intro_message`, `language`, `lesson_title`).
   - Applique `agent.instructions = Instructions(input_text=system_prompt)`.
   - Donne le rôle admin à l'agent et passe le call en live (`go_live`).
   - S'abonne aux événements de transcription (`RealtimeAgentSpeechTranscriptionEvent` et `RealtimeUserSpeechTranscriptionEvent`) : accumule les deltas et renvoie des événements custom Stream `{ type: "transcript_partial", speaker: "agent"/"user", text }` pour les sous-titres en direct ; efface le buffer au mode `final`.
   - Entre dans le call avec `async with agent.join(call)`, attend le participant (`wait_for_participant(timeout=60)`).
   - Si `intro_message` : donne une consigne pour saluer l'élève avec CE message exact, puis poser une question simple, puis attendre.
   - Sinon : salue chaleureusement et pose une question simple.
   - `await agent.finish()`.
7. `if __name__ == "__main__"` : vérifie que `STREAM_API_KEY`, `STREAM_API_SECRET`, `OPENAI_API_KEY` sont présents (sinon RuntimeError), puis lance `Runner(AgentLauncher(create_agent=create_agent, join_call=join_call)).cli()`.

### Fichier `vision-agent/pyproject.toml`
Déclare les dépendances : `vision-agents`, `python-dotenv`, `getstream`, `openai`, avec Python 3.11+.

### Fichier `vision-agent/.env.example`
```
OPENAI_API_KEY=
```

### README du service
Explique comment lancer : `uv run main.py serve` (ou `pip install -e .` puis `python main.py serve`), en précisant qu'il écoute sur `http://localhost:8000` et que l'app l'appelle via `VISION_AGENT_URL`.
```

## 🔧 Étapes manuelles

1. Installe **uv** (https://docs.astral.sh/uv/) ou utilise `pip`.
2. Crée la clé **OpenAI** (https://platform.openai.com) et mets-la dans `vision-agent/.env` :
   ```env
   OPENAI_API_KEY=sk-...
   ```
3. Les clés Stream (`STREAM_API_KEY`, `STREAM_API_SECRET`) sont lues depuis le `.env` parent.
4. Lance le service :
   ```bash
   cd vision-agent
   uv run main.py serve
   ```
   Il doit écouter sur `http://localhost:8000`.

> ⚠️ Le `vision-agents` SDK Stream est une dépendance récente. Vérifie la doc Stream officielle pour la bonne version/import (`vision_agents.core`, `vision_agents.plugins`). Adapte les imports si la version installée diffère.

## 📁 Fichiers attendus

```
vision-agent/main.py
vision-agent/pyproject.toml
vision-agent/.env.example
vision-agent/README.md
```

## ✅ Validation

- Le service démarre sans erreur et affiche qu'il écoute (serve).
- Quand une leçon démarre côté web, l'agent rejoint le call (logs), salue l'élève, et les sous-titres en direct apparaissent dans l'app.
