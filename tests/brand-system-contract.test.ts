import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

describe("Hikma brand system — contracts", () => {
  const globals = read("app/globals.css");

  it("expose les tokens de marque approuvés", () => {
    expect(globals).toContain("--hikma-teal-900: #002828");
    expect(globals).toContain("--hikma-teal-800: #083838");
    expect(globals).toContain("--hikma-gold: #c8a058");
    expect(globals).toContain("--hikma-ivory: #f8f8f0");
    expect(globals).toContain("--hikma-cream: #fffdf8");
    expect(globals).toContain("--surface-subtle: #f1f6f3");
    expect(globals).toContain("--surface-featured: #f1f6f3");
    expect(globals).toContain("--hikma-charcoal: #182028");
  });

  it("préserve les sémantiques fonctionnelles existantes", () => {
    expect(globals).toContain("--success: #2eb872");
    expect(globals).toContain("--error: #ef4444");
    expect(globals).toContain("--warning: #ffc107");
    expect(globals).toContain("--info: #2d7a58");
  });

  it("centralise le logo officiel sans recoloration", () => {
    const logo = read("components/ui/hikma-logo.tsx");
    expect(logo).toContain('src="/logo/logo_hikma.png"');
    expect(logo).toContain("object-contain");
    expect(logo).not.toContain("filter:");
  });

  it("intègre le logo aux surfaces publiques prévues", () => {
    expect(read("components/app/landing.tsx")).toContain("<HikmaLogo");
    expect(read("components/app/app-nav.tsx")).toContain("<HikmaLogo");
    expect(read("app/(auth)/login/page.tsx")).toContain("<HikmaLogo");
    expect(read("app/design-system/page.tsx")).toContain("Hikma Brand Identity");
  });

  it("réserve l’augmentation desktop à la navigation applicative", () => {
    const nav = read("components/app/app-nav.tsx");
    expect(nav).toContain('className="size-[88px] lg:size-[104px]"');
    expect(read("components/app/landing.tsx")).toContain('<HikmaLogo size="sm"');
    expect(read("app/(auth)/login/page.tsx")).toContain('<HikmaLogo size="lg"');
  });

  it("réserve le doré aux marqueurs de valeur et de progression", () => {
    expect(read("components/ui/hikma.tsx")).toContain("bg-hikma-gold");
    expect(read("components/ui/hikma.tsx")).not.toContain("bg-hikma-gold text-success");
  });
});
