// Hikma — Content Studio (Phase G) : STOCKAGE PERSISTANT DU MP4.
//
// Le MP4 produit par Remotion ne doit PAS reposer sur le filesystem local
// (éphémère en production). Il est uploadé dans un bucket Supabase Storage
// PRIVÉ (même pattern que `word-audio` : bucket privé + URLs signées TTL).
//
//   render  →  out/<contentKey>.mp4 (temporaire)  →  upload bucket `hikma-video`
//   →  path de stockage en DB (render_path)  →  URL signée à la demande.
//
// Le MP4 lui-même n'est JAMAIS stocké en DB : seule la métadonnée
// (render_status, render_path, rendered_hash, rendered_at) l'est.

import { readFile, stat, unlink } from "node:fs/promises";
import { getContentStudioDbClient } from "./client";

export const VIDEO_BUCKET = "hikma-video";

export type StoredVideo = {
  storagePath: string;
  signedUrl: string;
  sizeBytes: number;
};

/**
 * Garantit l'existence du bucket vidéo privé (idempotent). Lève une erreur si
 * la création / l'accès échoue — le rendu ne se déclare RENDERED que si l'upload
 * persistant a réussi.
 */
export async function ensureVideoBucket(): Promise<void> {
  const client = getContentStudioDbClient();
  const { data: buckets, error: listErr } = await client.storage.listBuckets();
  if (listErr) throw new Error(`storage listBuckets: ${listErr.message}`);
  if (buckets?.some((b) => b.name === VIDEO_BUCKET)) return;
  const { error: createErr } = await client.storage.createBucket(VIDEO_BUCKET, {
    public: false,
    fileSizeLimit: 50 * 1024 * 1024, // 50 Mo = max Supabase par bucket (bien au-dessus d'une verticale ~1–15 Mo)
    allowedMimeTypes: ["video/mp4", "application/octet-stream"],
  });
  if (createErr) throw new Error(`storage createBucket: ${createErr.message}`);
}

/** Path de stockage stable & versionné : <contentKey>/v<version>-<hash8>.mp4. */
export function videoStoragePath(
  contentKey: string,
  version: number,
  effectiveHash: string,
): string {
  return `${contentKey}/v${version}-${effectiveHash.slice(0, 8)}.mp4`;
}

/**
 * Uploade un MP4 local vers le bucket vidéo (upsert) et renvoie le path + une
 * URL signée (TTL 1 h, comme word-audio). Supprime le fichier temporaire local
 * en une seule étape d'effacement — le binaire persiste uniquement dans Storage.
 */
export async function uploadRenderedVideo(
  contentKey: string,
  version: number,
  effectiveHash: string,
  localPath: string,
): Promise<StoredVideo> {
  const client = getContentStudioDbClient();
  await ensureVideoBucket();

  const storagePath = videoStoragePath(contentKey, version, effectiveHash);
  const buffer = await readFile(localPath);
  const { error: upErr } = await client.storage
    .from(VIDEO_BUCKET)
    .upload(storagePath, buffer, { upsert: true, contentType: "video/mp4" });
  if (upErr) throw new Error(`storage upload: ${upErr.message}`);

  const { size } = await stat(localPath);

  const { data: signed, error: signErr } = await client.storage
    .from(VIDEO_BUCKET)
    .createSignedUrl(storagePath, 60 * 60); // 1 h
  if (signErr) throw new Error(`storage signed url: ${signErr.message}`);

  // Nettoyage du temporaire local (le binaire vit désormais dans Storage).
  await unlink(localPath).catch(() => {});

  return { storagePath, signedUrl: signed?.signedUrl ?? "", sizeBytes: size };
}

/** URL signée fraîche pour un path stocké (à la demande, ex. consult de la vidéo). */
export async function signedUrlForVideo(storagePath: string): Promise<string | null> {
  if (!storagePath) return null;
  const client = getContentStudioDbClient();
  const { data, error } = await client.storage
    .from(VIDEO_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Supprime les assets vidéo générés associés à un contenu dans le bucket 'hikma-video'.
 * NE touche JAMAIS aux buckets partagés ('word-audio') ni aux données sources.
 */
export async function deleteRenderedVideoAssets(
  contentKey: string,
  specificPath?: string | null,
  client?: import("@supabase/supabase-js").SupabaseClient,
): Promise<{ deleted: string[]; error?: string }> {
  if (!contentKey) return { deleted: [] };

  let supabase = client;
  if (!supabase) {
    try {
      supabase = getContentStudioDbClient();
    } catch {
      return { deleted: [] };
    }
  }

  if (!supabase || typeof supabase.storage?.from !== "function") {
    return { deleted: [] };
  }

  try {
    // 1. Lister les fichiers dans le dossier <contentKey> du bucket vidéo
    const { data: files } = await supabase.storage.from(VIDEO_BUCKET).list(contentKey);
    const filePaths: string[] = (files ?? [])
      .filter((f) => f && f.name)
      .map((f) => `${contentKey}/${f.name}`);

    // 2. Ajouter le renderPath spécifique s'il est hors du dossier
    if (specificPath && !filePaths.includes(specificPath)) {
      filePaths.push(specificPath);
    }

    if (filePaths.length > 0) {
      const { data, error } = await supabase.storage.from(VIDEO_BUCKET).remove(filePaths);
      if (error) {
        console.error(`[storage] Erreur suppression assets vidéo: ${error.message}`);
        return { deleted: ((data as unknown as Array<{ name: string }>) ?? []).map((d) => d.name), error: error.message };
      }
      return { deleted: ((data as unknown as Array<{ name: string }>) ?? []).map((d) => d.name) };
    }
    return { deleted: [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Storage";
    return { deleted: [], error: message };
  }
}