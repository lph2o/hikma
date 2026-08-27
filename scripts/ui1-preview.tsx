// Hikma — Content Studio (UI1) : PREUVE VISUELLE STATIQUE.
//
// RenderToStaticMarkup des NOUVEAUX composants UI1 (coquille, badges, cartes,
// filtres, en-tête de projet) pour vérification visuelle/responsive sans
// session admin. La source de vérité reste les composants réels.
//
// AUTONOME : le serveur de preview ne sert qu'UN seul fichier → le CSS compilé
// est INLINÉ dans le HTML, et chaque largeur mobile (320/375/390/414) est un
// IFRAME srcdoc (viewport réel → media queries réelles, même origine → mesure
// d'overflow via scrollWidth vs clientWidth).
//
// Usage : npx tsx scripts/ui1-preview.tsx  →  out/studio-preview/index.html

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { StudioShell } from "../components/content-studio/studio-shell";
import { ContentGrid } from "../components/content-studio/library/content-grid";
import { ContentFilters } from "../components/content-studio/library/content-filters";
import type { ContentCardData } from "../components/content-studio/library/content-card";
import { ProjectHeader } from "../components/content-studio/editor/project-header";

const CARDS: ContentCardData[] = [
  {
    href: "#",
    arabic: "يَوْمَ",
    title: "Word Reveal",
    status: "APPROVED",
    renderStatus: "RENDERED",
    meta: "~12.0 s · v2",
  },
  {
    href: "#",
    arabic: "ٱلْمُتَّقِينَ",
    title: "Word Reveal",
    status: "DRAFT",
    renderStatus: "NOT_RENDERED",
    meta: "~13.4 s · v1",
  },
  {
    href: "#",
    arabic: "الْحَمْدُ",
    title: "Word Quiz",
    status: "REVIEW",
    renderStatus: "RENDERING",
    meta: "~11.2 s · v1",
  },
  {
    href: "#",
    arabic: "إِنَّ",
    title: "Word Reveal",
    status: "SCHEDULED",
    renderStatus: "RENDERED",
    meta: "~12.0 s · v3",
  },
];

const STATUSES = ["DRAFT", "REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED"] as const;

function LibraryMock() {
  return (
    <StudioShell active="library">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-h2 font-semibold">Vos contenus</h1>
          <p className="text-body-md text-text-secondary">
            Registre éditorial + studio d&apos;édition vidéo vertical. Sélectionne
            une vidéo pour l&apos;éditer.
          </p>
        </header>
        <details className="group mt-6 rounded-2xl border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-hikma-teal-600/12 text-hikma-teal-700">
              +
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-text-primary">Créer un contenu</span>
              <span className="block truncate text-caption text-text-secondary">
                Génère un draft depuis la Content API (mot + template)
              </span>
            </span>
          </summary>
        </details>
        <section className="mt-8 flex flex-col gap-4">
          <ContentFilters
            statuses={[...STATUSES]}
            active={undefined}
            total={12}
            hrefFor={(s) => `#${s ?? "all"}`}
          />
          <ContentGrid items={CARDS} />
        </section>
      </div>
    </StudioShell>
  );
}

function EditorMock() {
  return (
    <StudioShell active="library" sticky={false}>
      <div className="flex w-full min-w-0 flex-1 flex-col bg-surface-subtle">
        <ProjectHeader
          eyebrow="WORD_REVEAL_V1"
          title="يَوْمَ — Word Reveal"
          status="APPROVED"
          renderStatus="RENDERED"
          saveState="saved"
          saveDisabled
          onSave={() => {}}
          renderLabel="Rendre à nouveau"
          renderVariant="secondary"
          renderDisabled={false}
          onRender={() => {}}
        />
        <div className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 sm:px-5">
          <div className="flex min-w-0 flex-col gap-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_300px] lg:items-start">
            <aside
              aria-label="Scènes"
              className="hidden min-w-0 flex-col gap-1.5 rounded-2xl border border-border bg-card p-3 lg:flex"
            >
              <span className="px-1 pb-1 text-label font-medium text-muted-foreground">Scènes</span>
              {[
                ["INTRO", "bg-hikma-teal-100", "2.4s"],
                ["MOT", "bg-hikma-gold/40", "3.2s"],
                ["SENS", "bg-hikma-teal-500/25", "2.8s"],
                ["CORAN", "bg-hikma-teal-500/40", "2.6s"],
              ].map(([label, tone, dur], i) => (
                <div
                  key={label}
                  className={
                    i === 1
                      ? "flex items-center gap-2 rounded-lg px-2 py-2 bg-hikma-teal-600/12 ring-1 ring-inset ring-hikma-teal-500/40"
                      : "flex items-center gap-2 rounded-lg px-2 py-2"
                  }
                >
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-black/70 ${tone}`}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{label}</span>
                  <span className="font-mono text-caption text-text-secondary">{dur}</span>
                </div>
              ))}
            </aside>
            <div
              className="relative flex w-full items-center justify-center rounded-2xl border border-border/60 px-4 py-6 sm:py-8"
              style={{
                background:
                  "radial-gradient(130% 90% at 50% 0%, color-mix(in srgb, var(--color-hikma-gold) 5%, transparent), transparent 55%), linear-gradient(165deg, var(--color-hikma-charcoal) 0%, var(--color-hikma-charcoal-deep) 70%)",
              }}
            >
              <div className="relative w-full max-w-[min(100%,420px)] overflow-hidden rounded-xl shadow-[0_24px_64px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/10">
                <div className="relative aspect-[9/16] w-full bg-black/40">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <span dir="rtl" className="font-arabic text-4xl leading-[1.9] text-hikma-ivory">
                      يَوْمَ
                    </span>
                    <span className="text-caption text-white/70">1080×1920 · 30 fps (Player Remotion)</span>
                  </div>
                </div>
                <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/30 px-3 py-1 text-white/90">
                  <span className="text-caption text-white/90">9:16 · 1080×1920 · 30 fps</span>
                </div>
              </div>
            </div>
            <aside className="hidden min-w-0 lg:block">
              <div className="rounded-2xl border border-border bg-card p-4">
                <span className="text-label font-medium text-muted-foreground">Propriétés</span>
                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <span className="text-label font-medium text-muted-foreground">Scène</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-md bg-surface px-2 py-1 font-mono text-caption uppercase text-primary-strong">MOT</span>
                      <span className="text-caption text-text-secondary">word</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-label font-medium text-muted-foreground">arabic</span>
                    <input dir="rtl" defaultValue="يَوْمَ" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-label font-medium text-muted-foreground">transliteration</span>
                    <input defaultValue="Yawma" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-label font-medium text-muted-foreground">Durée (frames)</span>
                    <input type="number" defaultValue={96} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-label font-medium text-muted-foreground">Timeline</span>
              <span className="font-mono text-caption text-text-secondary">00:03.2 / 00:11.0</span>
            </div>
            <div className="relative w-full overflow-x-auto pb-1">
              <div className="relative flex h-14 min-w-full rounded-lg border border-border" style={{ minWidth: 4 * 96 }}>
                <div className="pointer-events-none absolute inset-y-0 z-10 w-px bg-hikma-gold" style={{ left: "29%" }}>
                  <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-hikma-gold" />
                </div>
                {[
                  ["INTRO", "bg-hikma-teal-100", "72"],
                  ["MOT", "bg-hikma-gold/40", "96"],
                  ["SENS", "bg-hikma-teal-500/25", "84"],
                  ["CORAN", "bg-hikma-teal-500/40", "78"],
                ].map(([label, tone, dur]) => (
                  <div
                    key={label}
                    className={`relative flex h-full min-w-0 flex-col justify-center overflow-hidden border-r border-black/10 px-2 text-left ${tone}`}
                    style={{ flex: `${dur} ${dur} ${dur}px` }}
                  >
                    <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-black/80">{label}</span>
                    <span className="truncate font-mono text-[9px] text-black/60">{Number(dur) / 30}s</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudioShell>
  );
}

const OUT = join(process.cwd(), "out", "studio-preview");

function findCss(): string {
  const cssDir = join(process.cwd(), ".next", "static", "chunks");
  const files = readdirSync(cssDir).filter((f) => f.endsWith(".css"));
  if (files.length === 0) throw new Error("Aucun CSS compilé — lance `next build` d'abord.");
  return files.map((f) => readFileSync(join(cssDir, f), "utf8")).join("\n");
}

const CSS = findCss();

function doc(title: string, body: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet" />
<style>
  html { --font-poppins: 'Poppins', sans-serif; --font-amiri: 'Amiri', serif; --font-sans: var(--font-poppins); --font-heading: var(--font-poppins); --font-arabic: var(--font-amiri); }
  body { margin: 0; }
  .preview-label { padding: 10px 16px; font: 600 12px/1.4 var(--font-poppins), sans-serif; color: var(--text-secondary); background: var(--hikma-ivory); }
</style>
<style>${CSS}</style>
</head>
<body>
${body}
</body>
</html>`;
}

function main() {
  mkdirSync(OUT, { recursive: true });

  // [largeur, label] — mobile (viewports réels des téléphones) + desktop.
  const frames = [
    [320, "mobile"],
    [375, "mobile"],
    [390, "mobile"],
    [414, "mobile"],
    [1024, "desktop"],
    [1280, "desktop"],
    [1440, "desktop"],
  ] as const;
  const frameBody =
    `<div class="preview-label">BIBLIOTHÈQUE</div>` +
    renderToStaticMarkup(<LibraryMock />) +
    `<div class="preview-label">ÉDITEUR</div>` +
    renderToStaticMarkup(<EditorMock />);
  const frameDocs = frames.map(([w, kind]) => ({ width: w, kind, html: doc(`${kind}-${w}`, frameBody) }));

  const desktopBody =
    `<div class="preview-label">BIBLIOTHÈQUE — desktop (max-w-6xl, grille 4 colonnes ≥ xl)</div>` +
    renderToStaticMarkup(<LibraryMock />) +
    `<div class="preview-label">ÉDITEUR — workspace (en-tête projet + scènes + preview + propriétés + timeline)</div>` +
    renderToStaticMarkup(<EditorMock />);

  const html = doc(
    "Content Studio UI1 — preview statique",
    desktopBody +
      `<div id="mobile-frames"></div>
<div class="preview-label" id="overflow-report" style="padding:14px 16px;font-weight:600;">Mesure d'overflow : en cours…</div>
<script>
var FRAME_DOCS = ${JSON.stringify(frameDocs)};
var container = document.getElementById('mobile-frames');
var frames = FRAME_DOCS.map(function (m) {
  var label = document.createElement('div');
  label.className = 'preview-label';
  label.textContent = (m.kind === 'mobile' ? 'MOBILE ' : 'DESKTOP ') + m.width + 'px — iframe srcdoc (viewport reel, media queries reelles)';
  container.appendChild(label);
  var f = document.createElement('iframe');
  f.setAttribute('data-width', m.width);
  f.setAttribute('data-kind', m.kind);
  f.style.width = m.width + 'px';
  f.style.height = '900px';
  f.style.border = '0';
  f.style.display = 'block';
  f.style.margin = '0 auto';
  f.srcdoc = m.html;
  container.appendChild(f);
  return f;
});
function measure() {
  var rows = frames.map(function (f) {
    var d = f.contentDocument;
    var el = d && d.scrollingElement;
    var overflow = el ? (el.scrollWidth - el.clientWidth) : -1;
    return f.getAttribute('data-width') + 'px: scrollWidth=' + (el ? el.scrollWidth : '?') + ' clientWidth=' + (el ? el.clientWidth : '?') + ' OVERFLOW=' + overflow;
  });
  var out = document.getElementById('overflow-report');
  if (out) out.textContent = 'MESURE OVERFLOW GLOBAL (par iframe) — ' + rows.join('  |  ');
}
var remaining = frames.length;
frames.forEach(function (f) {
  f.addEventListener('load', function () { remaining -= 1; if (remaining === 0) measure(); });
});
setTimeout(measure, 4000);
</script>`,
  );

  writeFileSync(join(OUT, "index.html"), html);
  // eslint-disable-next-line no-console
  console.log(`UI1_PREVIEW=${join(OUT, "index.html")}`);
}

main();
