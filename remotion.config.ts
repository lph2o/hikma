import { Config } from "@remotion/cli/config";

// Hikma — configuration Remotion (rendu des vidéos Content Studio).
// Overwrite de sortie autorisé : le rendu est reproductible et l'idempotence
// est gérée par contentKey au niveau du registre (jamais par l'écrasement).
Config.setOverwriteOutput(true);
Config.setVideoImageFormat("jpeg");
Config.setPixelFormat("yuv420p");
