import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { readFileSync, existsSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { PageLoading } from "../components/ui/page-loading";
import { HikmaLoader } from "../components/ui/hikma-loader";

const render = () => renderToStaticMarkup(createElement(PageLoading));
const renderLoader = () => renderToStaticMarkup(createElement(HikmaLoader));
const globals = readFileSync("app/globals.css", "utf8");

describe("PageLoading (Phase 92/94B — navigation loading UX)", () => {
  it("utilise le logo Hikma via son chemin public (/logo-hikma.png présent)", () => {
    const html = render();
    expect(html).toContain("/logo-hikma.png");
    expect(existsSync("public/logo-hikma.png")).toBe(true);
  });

  it("fournit un état accessible (role=status, aria-busy, annonce discrète + wordmark labelé)", () => {
    const html = render();
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Chargement de la page…");
    const loader = renderLoader();
    expect(loader).toContain('role="img"');
    expect(loader).toContain('aria-label="Chargement en cours"');
  });

  it("diffère l'apparition (~150 ms) pour éviter le flash sur les navigations rapides", () => {
    const html = render();
    expect(html).toContain("0.35s ease 0.15s forwards");
  });

  it("respecte prefers-reduced-motion (fondu coupé + animations globales désactivées)", () => {
    const html = render();
    expect(html).toContain("prefers-reduced-motion");
    expect(html).toMatch(/prefers-reduced-motion[\s\S]*?animation:\s*none/);
    expect(globals).toContain("prefers-reduced-motion: reduce");
  });

  it("définit les animations du loader (glow, shine, word-wave) dans globals.css", () => {
    expect(globals).toContain("--animate-hikma-glow");
    expect(globals).toContain("--animate-hikma-shine");
    expect(globals).toContain("--animate-hikma-word-wave");
    expect(globals).toContain("@keyframes hikma-shine");
    expect(globals).toContain("@keyframes hikma-word-wave");
  });

  it("fait onduler le wordmark en cascade (lettres H i k m a, délais décalés)", () => {
    const loader = renderLoader();
    expect(loader).toContain("animate-hikma-word-wave");
    expect(loader).toContain("animation-delay");
    expect(loader).toContain("0.12s");
  });
});
