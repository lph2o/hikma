// Hikma — Tests unitaires des parseurs de durée audio PURS (aucun réseau).
// Vérifie parseMp3DurationFromBuffer et parseOggOpusDurationFromBuffer sur des
// buffers synthétiques déterministes (frames MPEG / pages Ogg construites à la main).

import { describe, it, expect } from "vitest";
import {
  parseMp3DurationFromBuffer,
  parseOggOpusDurationFromBuffer,
} from "../lib/content-studio/audio";

// ---------------------------------------------------------------------------
// Helpers : construction de buffers MP3 / Ogg/Opus synthétiques
// ---------------------------------------------------------------------------

/**
 * Construit un header MPEG1 Layer III valide.
 * @param bitrateKbps débit (ex. 128)
 * @param sampleRate 44100
 * @param padding 0|1
 */
function mpeg1Layer3Header(bitrateKbps: number, sampleRate = 44100, padding = 0): Buffer {
  const bitrateIdx = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320].indexOf(bitrateKbps);
  if (bitrateIdx < 0) throw new Error(`bitrate non table: ${bitrateKbps}`);
  const sampleIdx = sampleRate === 44100 ? 0 : sampleRate === 48000 ? 1 : 2;
  // bits: sync(11) version(2)=11 MPEG1 layer(2)=01 LayerIII protection(1)=1
  let h = 0xffe00000;
  h |= 0x1c0000; // version 11 << 19 = 0x180000, layer 01 << 17 = 0x20000 → 0x1A0000? recomputed below
  h = 0xffe00000;
  h |= (3 << 19); // MPEG1
  h |= (1 << 17); // Layer III
  h |= (1 << 16); // no CRC
  h |= (bitrateIdx << 12);
  h |= (sampleIdx << 10);
  h |= (padding << 9);
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(h >>> 0, 0);
  return buf;
}

function mpeg1Layer3FrameLength(bitrateKbps: number, sampleRate = 44100, padding = 0): number {
  return Math.floor((144 * bitrateKbps * 1000) / sampleRate) + padding;
}

/** Construit un fichier MP3 synthétique : N frames identiques (CBR 128kbps/44.1kHz). */
function syntheticMp3(frameCount: number, bitrateKbps = 128, sampleRate = 44100): Buffer {
  const header = mpeg1Layer3Header(bitrateKbps, sampleRate);
  const frameLen = mpeg1Layer3FrameLength(bitrateKbps, sampleRate);
  const body = Buffer.alloc(frameLen - 4, 0x55);
  const chunks: Buffer[] = [];
  for (let i = 0; i < frameCount; i++) {
    chunks.push(header);
    chunks.push(body);
  }
  return Buffer.concat(chunks);
}

/** Construit une page Ogg simple. */
function oggPage(
  granule: number,
  serial: number,
  packets: Buffer[],
  headerType = 0,
): Buffer {
  // Lacings : un seul packet de taille connue (<=255 pour simplifier les tests)
  const segCount = packets.length;
  const lacings = Buffer.alloc(segCount);
  packets.forEach((p, i) => {
    lacings[i] = p.length;
  });
  const data = Buffer.concat(packets);
  const page = Buffer.alloc(27 + segCount + data.length);
  page.write("OggS", 0, "latin1");
  page[4] = 0; // version
  page[5] = headerType;
  page.writeBigUInt64LE(BigInt(granule), 6);
  page.writeUInt32LE(serial, 14);
  page.writeUInt32LE(0, 18); // sequence
  page.writeUInt32LE(0, 22); // CRC (non vérifié par notre parseur)
  page[26] = segCount;
  lacings.copy(page, 27);
  data.copy(page, 27 + segCount);
  return page;
}

function opusHeadPacket(preSkip: number): Buffer {
  const head = Buffer.alloc(19);
  head.write("OpusHead", 0, "latin1");
  head[8] = 1; // version
  head[9] = 1; // canaux
  head.writeUInt16LE(preSkip, 10);
  head.writeUInt16LE(48000, 12); // input sample rate
  return head;
}

// ---------------------------------------------------------------------------
// parseMp3DurationFromBuffer
// ---------------------------------------------------------------------------

describe("parseMp3DurationFromBuffer", () => {
  it("retourne null sur un buffer non-MP3", () => {
    expect(parseMp3DurationFromBuffer(Buffer.from("not an mp3 file at all"))).toBeNull();
    expect(parseMp3DurationFromBuffer(Buffer.alloc(0))).toBeNull();
  });

  it("mesure exactement une séquence CBR de 100 frames (100 × 1152 / 44100 = 2.61s)", () => {
    const mp3 = syntheticMp3(100);
    const expected = Math.round((100 * 1152) / 44100 * 100) / 100;
    expect(parseMp3DurationFromBuffer(mp3)).toBe(expected);
  });

  it("est déterministe : mêmes frames ⇒ même durée", () => {
    const a = parseMp3DurationFromBuffer(syntheticMp3(50));
    const b = parseMp3DurationFromBuffer(syntheticMp3(50));
    expect(a).toBe(b);
  });

  it("ignore correctement un tag ID3v2 placé avant les frames", () => {
    const frames = syntheticMp3(20);
    const id3 = Buffer.alloc(10 + 128); // tag ID3v2 de 128 octets
    id3.write("ID3", 0, "latin1");
    id3[3] = 4; // version 2.4
    // taille syncsafe = 128
    // taille syncsafe de 128 = octets [0x00, 0x00, 0x01, 0x00]
    id3[8] = 1;
    const file = Buffer.concat([id3, frames]);
    const expected = parseMp3DurationFromBuffer(frames);
    expect(parseMp3DurationFromBuffer(file)).toBe(expected);
  });

  it("mesure la même durée sur un fichier VBR simulé (frames de débits différents)", () => {
    // 50 frames à 128kbps + 50 frames à 64kbps : durée = 100 × 1152 / 44100
    const a = syntheticMp3(50, 128);
    const b = syntheticMp3(50, 64);
    const expected = Math.round((100 * 1152) / 44100 * 100) / 100;
    expect(parseMp3DurationFromBuffer(Buffer.concat([a, b]))).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// parseOggOpusDurationFromBuffer
// ---------------------------------------------------------------------------

describe("parseOggOpusDurationFromBuffer", () => {
  it("retourne null sur un buffer non-Ogg", () => {
    expect(parseOggOpusDurationFromBuffer(Buffer.from("RIFF....WAVE"))).toBeNull();
    expect(parseOggOpusDurationFromBuffer(Buffer.alloc(0))).toBeNull();
  });

  it("mesure exactement (granule − pre-skip) / 48000", () => {
    const preSkip = 312;
    const totalSamples = 48000; // 1.0 s
    const page1 = oggPage(0, 7, [opusHeadPacket(preSkip), Buffer.from([0x01])]);
    const page2 = oggPage(totalSamples, 7, [Buffer.alloc(30, 0x11)], 4 /* EOS */);
    const ogg = Buffer.concat([page1, page2]);
    const expected = Math.round(((totalSamples - preSkip) / 48000) * 100) / 100;
    expect(parseOggOpusDurationFromBuffer(ogg)).toBe(expected);
  });

  it("utilise la granule de la dernière page", () => {
    const preSkip = 0;
    const page1 = oggPage(0, 7, [opusHeadPacket(preSkip)]);
    const page2 = oggPage(24000, 7, [Buffer.alloc(20, 0x22)]);
    const page3 = oggPage(96000, 7, [Buffer.alloc(20, 0x33)], 4);
    const ogg = Buffer.concat([page1, page2, page3]);
    expect(parseOggOpusDurationFromBuffer(ogg)).toBe(2);
  });

  it("est déterministe", () => {
    const mk = () => {
      const page1 = oggPage(0, 7, [opusHeadPacket(0)]);
      const page2 = oggPage(24000, 7, [Buffer.alloc(20, 0x44)], 4);
      return Buffer.concat([page1, page2]);
    };
    expect(parseOggOpusDurationFromBuffer(mk())).toBe(parseOggOpusDurationFromBuffer(mk()));
  });
});
