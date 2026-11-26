import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { quizSchema } from "@/data/quizSchema";
import {
  AI_PROMPT_TEMPLATE,
  EXAMPLE_QUIZ_JSON,
  getImportHelpMarkdown,
} from "@/lib/importHelpContent";
import { APP_LOCALES } from "@/lib/locale";

describe("import help content", () => {
  it("example quiz is valid", () => {
    expect(quizSchema.safeParse(JSON.parse(EXAMPLE_QUIZ_JSON)).success).toBe(true);
  });

  it("AI prompt includes the example quiz JSON", () => {
    expect(AI_PROMPT_TEMPLATE).toContain(EXAMPLE_QUIZ_JSON);
    expect(AI_PROMPT_TEMPLATE).toContain("{topic}");
  });

  it.each(APP_LOCALES)("import help markdown exists for %s", (locale) => {
    const markdown = getImportHelpMarkdown(locale);
    expect(markdown).toContain("```json");
    expect(markdown).toContain(EXAMPLE_QUIZ_JSON.trim());
  });

  it.each(["welcome-to-quizzy.json", "welcome-to-quizzy.zh.json"])(
    "bundled welcome sample %s is valid",
    (name) => {
      const raw = readFileSync(`sample-quizzes/${name}`, "utf8");
      expect(quizSchema.safeParse(JSON.parse(raw)).success).toBe(true);
    },
  );
});
