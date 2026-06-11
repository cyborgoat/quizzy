import { describe, expect, it } from "vitest";
import { resolveUniqueFileName, slugifyTitle } from "@/lib/knowledgeLinks";

describe("slugifyTitle", () => {
  it("keeps ASCII titles compact and lowercase", () => {
    expect(slugifyTitle("  React Hooks Basics!  ")).toBe("react-hooks-basics");
  });

  it("keeps non-Latin letters such as Chinese in the slug", () => {
    expect(slugifyTitle("机器学习基础")).toBe("机器学习基础");
    expect(slugifyTitle("Hello 世界")).toBe("hello-世界");
  });

  it("falls back when the title has no usable characters", () => {
    expect(slugifyTitle("!!!")).toBe("untitled-note");
    expect(slugifyTitle("   ")).toBe("untitled-note");
  });
});

describe("resolveUniqueFileName", () => {
  it("deduplicates Unicode slugs", () => {
    const existing = new Set(["机器学习.md"]);
    expect(resolveUniqueFileName("机器学习", existing)).toEqual({
      fileName: "机器学习-2.md",
      id: "机器学习-2",
    });
  });
});
