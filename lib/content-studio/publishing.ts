// Hikma — Content Studio (B9) : PUBLISHING ABSTRACTION.
//
// Aucune intégration sociale n'est câblée en V1 : les adapters sont
// ENREGISTRÉS dynamiquement (aucun couplage Remotion/TikTok). PUBLISHED n'est
// jamais déclaré sans un adapter ayant retourné un identifiant de publication
// réel (platformPostId).

export type PublishingPlatform = "TIKTOK" | "INSTAGRAM_REELS" | "YOUTUBE_SHORTS";

export type PublishInput = {
  contentKey: string;
  version: number;
  renderPath: string;
  caption: string;
  platform: PublishingPlatform;
  /** Programme de publication optionnel (B10) — null = publication immédiate. */
  scheduledAt?: string | null;
};

export type PublishResult = {
  platform: PublishingPlatform;
  platformPostId: string;
  publishedAt: string;
};

export interface PublishingAdapter {
  platform: PublishingPlatform;
  publish(input: PublishInput): Promise<PublishResult>;
}

const adapters = new Map<PublishingPlatform, PublishingAdapter>();

export function registerPublishingAdapter(adapter: PublishingAdapter): void {
  adapters.set(adapter.platform, adapter);
}

export function getPublishingAdapter(
  platform: PublishingPlatform,
): PublishingAdapter | null {
  return adapters.get(platform) ?? null;
}

export function availablePlatforms(): PublishingPlatform[] {
  return [...adapters.keys()];
}
