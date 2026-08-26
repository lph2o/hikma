import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

describe("PHASE 96C — /learn responsive : aucun débordement horizontal sur mobile", () => {
  const learn = read("app/(app)/learn/page.tsx");
  const hikma = read("components/ui/hikma.tsx");

  it("le grid « Ton chemin / Comment avancer » a une colonne mobile explicite + min-w-0 sur les items (cause racine : le track auto du grid se calait sur le max-content de « Prochaine étape », 356px > viewport)", () => {
    expect(learn).toContain('className="grid grid-cols-1 gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_0.7fr]"');
  });

  it("le titre de « Prochaine étape » n'est plus en nowrap/truncate : le texte peut se réorganiser naturellement sur plusieurs lignes", () => {
    // le lien de la prochaine étape ne doit plus contenir de classe truncate sur le titre
    const nextStepLink = learn.match(/<Link href=\{`\/learn\/\$\{ctx\.nextLesson[\s\S]*?<\/Link>/)?.[0] ?? "";
    expect(nextStepLink).not.toContain("truncate");
    expect(nextStepLink).toContain("<BodyMedium className=\"font-medium\">");
  });

  it("HikmaProgress : la ligne label/détail est en flex-wrap, le label ne rétrécit ni ne se tronque (détail passe en ligne 2 quand ça ne tient pas)", () => {
    expect(hikma).toContain("flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1");
    expect(hikma).toContain("<BodyMedium className=\"flex-none font-medium\">{label}</BodyMedium>");
    expect(hikma).toContain("<Caption className=\"shrink-0 text-right\">{detail}</Caption>");
  });
});
