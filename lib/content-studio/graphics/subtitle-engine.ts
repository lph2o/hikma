// Hikma — Content Studio : MOTEUR SOUS-TITRES / KARAOKÉ (port OpenReel).
//
// Adapté de OpenReel (MIT) — packages/core/src/text/subtitle-engine.ts.
// Port des FONCTIONS PURES uniquement : parseSRT/VTT, formatSRTTimestamp,
// exportSRT, reflowCaptionText, splitCaptionIntoSingleLineCues,
// subtitleMarkupToText, normalizeSRT. La classe SubtitleEngine (couplée au
// modèle Timeline OpenReel) n'est PAS portée — classe C (inspiration).
//
// ADAPTATIONS :
//  - types Subtitle/SubtitleStyle/SubtitleWord définis localement (mêmes
//    formes que types/timeline.ts d'OpenReel) ;
//  - generateSubtitleId déterministe (pas de Date.now()/Math.random()) :
//    parseSRT(même entrée) → même résultat ;
//  - ajout Hikma : subtitleWordsToFrames() pour passer des timings SRT
//    (secondes) aux frames de la timeline (Golden Follower).
//
// NOTICE : © OpenReel — Copyright (c) 2024-2026 Augustus Otu and Contributors
// (MIT License). https://github.com/Augani/openreel-video

/** Sous-titre (même forme que le type OpenReel Subtitle). */
export interface Subtitle {
  readonly id: string;
  readonly text: string;
  /** Secondes. */
  readonly startTime: number;
  /** Secondes. */
  readonly endTime: number;
  readonly style?: SubtitleStyle;
  /** Timings par mot (karaoké) — secondes. */
  readonly words?: SubtitleWord[];
  readonly animationStyle?: string;
}

/** Timing d'un mot (karaoké) — secondes. */
export interface SubtitleWord {
  readonly word: string;
  readonly startTime: number;
  readonly endTime: number;
}

export interface SubtitleStyle {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly color: string;
  readonly backgroundColor: string;
  readonly position: "top" | "center" | "bottom";
  readonly highlightColor?: string;
  readonly upcomingColor?: string;
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontFamily: "Arial",
  fontSize: 24,
  color: "#ffffff",
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  position: "bottom",
};

export const SUBTITLE_STYLE_PRESETS: Record<string, SubtitleStyle> = {
  default: DEFAULT_SUBTITLE_STYLE,
  classic: {
    fontFamily: "Arial",
    fontSize: 24,
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    position: "bottom",
  },
  modern: {
    fontFamily: "Helvetica Neue",
    fontSize: 28,
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    position: "bottom",
  },
  cinematic: {
    fontFamily: "Georgia",
    fontSize: 26,
    color: "#f0f0f0",
    backgroundColor: "transparent",
    position: "bottom",
  },
  bold: {
    fontFamily: "Impact",
    fontSize: 32,
    color: "#ffff00",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    position: "bottom",
  },
  minimal: {
    fontFamily: "Roboto",
    fontSize: 22,
    color: "#ffffff",
    backgroundColor: "transparent",
    position: "bottom",
  },
  topCenter: {
    fontFamily: "Arial",
    fontSize: 24,
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    position: "top",
  },
  centered: {
    fontFamily: "Arial",
    fontSize: 24,
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    position: "center",
  },
};

export interface SRTParseResult {
  readonly success: boolean;
  readonly subtitles: Subtitle[];
  readonly errors: SRTParseError[];
}

export interface SRTParseError {
  readonly line: number;
  readonly message: string;
  readonly segment?: number;
}

/**
 * Id déterministe (adaptation Hikma) : stable pour un même contenu, contrairement
 * à l'original (Date.now + Math.random). Utilisé par parseSRT pour garantir
 * parseSRT(même entrée) === parseSRT(même entrée).
 */
function generateSubtitleId(text: string, startTime: number, index: number): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return `subtitle-${startTime}-${index}-${(hash >>> 0).toString(36)}`;
}

/**
 * Parses SRT/VTT timestamp formats. SRT normally uses HH:MM:SS,mmm while
 * WebVTT also permits MM:SS.mmm. One to three millisecond digits are accepted
 * because several caption providers omit trailing zeroes.
 * Returns null if format is invalid or time values are out of range.
 */
export function parseSRTTimestamp(timestamp: string): number | null {
  const match = timestamp
    .trim()
    .match(/^(?:(\d{1,3}):)?(\d{2}):(\d{2})[,.](\d{1,3})$/);

  if (!match) {
    return null;
  }

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const milliseconds = parseInt(match[4].padEnd(3, "0"), 10);

  // Validate ranges (minutes and seconds must be < 60)
  if (minutes >= 60 || seconds >= 60) {
    return null;
  }

  // Convert to total seconds
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/** Convert caption markup to the plain text used by editable TextClips. */
export function subtitleMarkupToText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .trim();
}

/** Rewrap editable caption text without changing its words. */
export function reflowCaptionText(value: string, maxWordsPerLine: number): string {
  const maxWords = Math.max(1, Math.floor(maxWordsPerLine));
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  for (let index = 0; index < words.length; index += maxWords) {
    lines.push(words.slice(index, index + maxWords).join(" "));
  }
  return lines.join("\n");
}

export interface SingleLineCaptionCue {
  readonly text: string;
  readonly startTime: number;
  readonly endTime: number;
}

/**
 * Split one caption cue into sequential, single-line cues. Timing is divided
 * proportionally by word count so the resulting cues remain contiguous.
 */
export function splitCaptionIntoSingleLineCues(
  value: string,
  startTime: number,
  endTime: number,
  maxWordsPerCue: number,
): SingleLineCaptionCue[] {
  const maxWords = Math.max(1, Math.floor(maxWordsPerCue));
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const safeStart = Math.max(0, startTime);
  const safeEnd = Math.max(safeStart + 0.1, endTime);
  const duration = safeEnd - safeStart;
  const cues: SingleLineCaptionCue[] = [];

  for (let index = 0; index < words.length; index += maxWords) {
    const cueWords = words.slice(index, index + maxWords);
    const cueStart = safeStart + duration * (index / words.length);
    const cueEnd = safeStart + duration * ((index + cueWords.length) / words.length);
    cues.push({
      text: cueWords.join(" "),
      startTime: cueStart,
      endTime: cueEnd,
    });
  }

  return cues;
}

export function formatSRTTimestamp(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) {
    seconds = 0;
  }

  const totalMs = Math.round(seconds * 1000);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms
    .toString()
    .padStart(3, "0")}`;
}

export function parseSRT(srtContent: string): SRTParseResult {
  const subtitles: Subtitle[] = [];
  const errors: SRTParseError[] = [];

  const normalizedContent = srtContent
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const isWebVTT = normalizedContent.trimStart().startsWith("WEBVTT");
  const blocks = normalizedContent
    .split(/\n\n+/)
    .filter((block) => block.trim());

  let lineNumber = 1;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    const lines = block.split("\n");

    if (/^(WEBVTT(?:\s|$)|NOTE(?:\s|$)|STYLE\s*$|REGION\s*$)/i.test(lines[0].trim())) {
      lineNumber += block.split("\n").length + 1;
      continue;
    }

    if (lines.length < 2 && !lines[0]?.includes("-->")) {
      errors.push({
        line: lineNumber,
        message: "Invalid subtitle block: insufficient lines",
        segment: i + 1,
      });
      lineNumber += block.split("\n").length + 1;
      continue;
    }

    // SRT has a numeric index, while VTT has either a cue id or no id. Find
    // the timing line instead of forcing one provider-specific layout.
    const timestampLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timestampLineIndex < 0) {
      errors.push({
        line: lineNumber,
        message: `Missing subtitle timestamp`,
        segment: i + 1,
      });
      lineNumber += block.split("\n").length + 1;
      continue;
    }
    if (
      !isWebVTT &&
      timestampLineIndex > 0 &&
      !/^\d+$/.test(lines[0].trim())
    ) {
      errors.push({
        line: lineNumber,
        message: `Invalid subtitle index: "${lines[0].trim()}"`,
        segment: i + 1,
      });
      lineNumber += block.split("\n").length + 1;
      continue;
    }
    const timestampLine = lines[timestampLineIndex].trim();
    const timestampMatch = timestampLine.match(
      /^(.+?)\s*-->\s*(.+?)(?:\s+.*)?$/,
    );

    if (!timestampMatch) {
      errors.push({
        line: lineNumber + timestampLineIndex,
        message: `Invalid timestamp format: "${timestampLine}"`,
        segment: i + 1,
      });
      lineNumber += block.split("\n").length + 1;
      continue;
    }

    const startTime = parseSRTTimestamp(timestampMatch[1]);
    const endTime = parseSRTTimestamp(timestampMatch[2]);

    if (startTime === null) {
      errors.push({
        line: lineNumber + timestampLineIndex,
        message: `Invalid start timestamp: "${timestampMatch[1]}"`,
        segment: i + 1,
      });
      lineNumber += block.split("\n").length + 1;
      continue;
    }

    if (endTime === null) {
      errors.push({
        line: lineNumber + timestampLineIndex,
        message: `Invalid end timestamp: "${timestampMatch[2]}"`,
        segment: i + 1,
      });
      lineNumber += block.split("\n").length + 1;
      continue;
    }

    if (endTime <= startTime) {
      errors.push({
        line: lineNumber + timestampLineIndex,
        message: `End time must be greater than start time`,
        segment: i + 1,
      });
      lineNumber += block.split("\n").length + 1;
      continue;
    }

    const text = subtitleMarkupToText(
      lines.slice(timestampLineIndex + 1).join("\n"),
    );

    if (!text) {
      errors.push({
        line: lineNumber + timestampLineIndex + 1,
        message: "Empty subtitle text",
        segment: i + 1,
      });
      lineNumber += block.split("\n").length + 1;
      continue;
    }

    subtitles.push({
      id: generateSubtitleId(text, startTime, subtitles.length),
      text,
      startTime,
      endTime,
      style: DEFAULT_SUBTITLE_STYLE,
    });

    lineNumber += block.split("\n").length + 1;
  }

  return {
    success: errors.length === 0,
    subtitles,
    errors,
  };
}

export function exportSRT(subtitles: readonly Subtitle[]): string {
  const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);

  const blocks: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const subtitle = sorted[i];
    const index = i + 1;
    const startTimestamp = formatSRTTimestamp(subtitle.startTime);
    const endTimestamp = formatSRTTimestamp(subtitle.endTime);

    blocks.push(
      `${index}\n${startTimestamp} --> ${endTimestamp}\n${subtitle.text}`,
    );
  }

  return blocks.join("\n\n");
}

export function normalizeSRT(srtContent: string): string {
  const parseResult = parseSRT(srtContent);

  if (parseResult.subtitles.length === 0) {
    return "";
  }

  return exportSRT(parseResult.subtitles);
}

/**
 * AJOUT HIKMA — convertit des timings SRT (secondes) en frames timeline.
 * Pont vers le Golden Recitation Follower : les timings de mots doivent être
 * bornés à la durée réelle de la récitation (jamais plus longs).
 */
export function subtitleWordsToFrames(
  words: readonly SubtitleWord[],
  fps: number,
  maxEndFrame?: number,
): { word: string; startFrame: number; endFrame: number }[] {
  const result: { word: string; startFrame: number; endFrame: number }[] = [];
  for (const word of words) {
    const startFrame = Math.max(0, Math.round(word.startTime * fps));
    let endFrame = Math.max(startFrame + 1, Math.round(word.endTime * fps));
    if (maxEndFrame !== undefined) {
      endFrame = Math.min(endFrame, maxEndFrame);
      if (endFrame <= startFrame) continue; // mot hors bornes → exclu
    }
    result.push({ word: word.word, startFrame, endFrame });
  }
  return result;
}

