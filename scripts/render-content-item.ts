// Hikma — Content Studio : CLI & WORKER DE RENDU VIDÉO.
//
// Exécute le rendu Remotion (1080×1920 @ 30fps) + upload persistant Supabase Storage (hikma-video)
// + mise à jour du registre (RENDERED ou FAILED avec message).
//
// Usage :
//   npx tsx scripts/render-content-item.ts <contentKey>      → Rend un item spécifique
//   npx tsx scripts/render-content-item.ts --all             → Rend tous les items en attente/non rendus
//   npx tsx scripts/render-content-item.ts --worker          → Mode démon : surveille les items 'RENDERING' et les rend automatiquement

import { ContentRegistryService } from "../lib/content-studio/registry";
import { getContentStudioDbClient } from "../lib/content-studio/client";
import { renderEffectiveVideoToFile } from "../lib/content-studio/render";
import { uploadRenderedVideo, signedUrlForVideo } from "../lib/content-studio/storage";
import type { ContentStudioItem } from "../lib/content-studio/types";

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Ignoré si fichier absent
    }
  }
}

export async function renderSingleItem(
  contentKey: string,
  registry: ContentRegistryService,
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  console.log(`\n🎬 [Render] Début du rendu pour contentKey: ${contentKey}`);
  const item = await registry.getByContentKey(contentKey);
  if (!item) {
    console.error(`❌ [Render] Contenu introuvable pour ${contentKey}`);
    return { success: false, error: "CONTENT_NOT_FOUND" };
  }

  await registry.setRenderStatus(item.contentKey, "RENDERING").catch(() => {});

  try {
    console.log(`📦 [Render] Rendu Remotion en cours (template: ${item.templateKey}, version: ${item.version})...`);
    const rendered = await renderEffectiveVideoToFile(item);

    if (rendered.status === "REJECTED") {
      const err = `${rendered.code}: ${rendered.message}`;
      console.error(`❌ [Render] Rendu rejeté : ${err}`);
      await registry.setRenderStatus(item.contentKey, "FAILED", { renderError: err }).catch(() => {});
      return { success: false, error: err };
    }

    console.log(`☁️  [Render] Envoi vers Supabase Storage (hikma-video)...`);
    const { storagePath, signedUrl, sizeBytes } = await uploadRenderedVideo(
      item.contentKey,
      item.version,
      rendered.effectiveHash,
      rendered.outputLocation,
    );

    await registry.setRenderStatus(item.contentKey, "RENDERED", { renderPath: storagePath }).catch(() => {});
    console.log(`✅ [Render] Terminé avec succès ! (${(sizeBytes / (1024 * 1024)).toFixed(2)} Mo)`);
    console.log(`🔗 [Render] URL de preview : ${signedUrl.slice(0, 80)}...`);

    return { success: true, signedUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error(`❌ [Render] Échec critique du rendu :`, message);
    await registry.setRenderStatus(item.contentKey, "FAILED", { renderError: message }).catch(() => {});
    return { success: false, error: message };
  }
}

async function runWorker(registry: ContentRegistryService): Promise<void> {
  console.log("⚡ [Worker] Démarrage du worker de rendu vidéo Hikma...");
  console.log("⚡ [Worker] En écoute des items 'RENDERING' dans Supabase (intervalle 5s)...");

  let isRunning = true;
  process.on("SIGINT", () => {
    console.log("\n🛑 [Worker] Arrêt demandé. Fermeture propre...");
    isRunning = false;
  });

  while (isRunning) {
    try {
      const { items } = await registry.list({ limit: 10 });
      const pending = items.filter((it) => it.renderStatus === "RENDERING");

      for (const item of pending) {
        console.log(`\n🔔 [Worker] Tâche détectée : ${item.contentKey} (${item.templateKey})`);
        await renderSingleItem(item.contentKey, registry);
      }
    } catch (err) {
      console.error("⚠️  [Worker] Erreur de scrutation :", err instanceof Error ? err.message : err);
    }

    if (isRunning) {
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function main(): Promise<void> {
  loadEnvFiles();
  const arg = process.argv[2];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("❌ Variables Supabase absentes (.env / .env.local).");
    process.exit(1);
  }

  const registry = new ContentRegistryService(getContentStudioDbClient());

  if (arg === "--worker") {
    await runWorker(registry);
    return;
  }

  if (arg === "--all") {
    const { items } = await registry.list({ limit: 50 });
    const toRender = items.filter((it) => it.renderStatus !== "RENDERED");
    console.log(`📋 [Render] ${toRender.length} item(s) à rendre.`);
    for (const it of toRender) {
      await renderSingleItem(it.contentKey, registry);
    }
    return;
  }

  const contentKey = arg?.replace(/^--contentKey=/, "").trim();
  if (!contentKey) {
    console.log("Usage :");
    console.log("  npx tsx scripts/render-content-item.ts <contentKey>");
    console.log("  npx tsx scripts/render-content-item.ts --worker");
    console.log("  npx tsx scripts/render-content-item.ts --all");
    process.exit(1);
  }

  const result = await renderSingleItem(contentKey, registry);
  if (!result.success) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("render-content-item.ts")) {
  main().catch((err) => {
    console.error("Erreur fatale :", err);
    process.exit(1);
  });
}
