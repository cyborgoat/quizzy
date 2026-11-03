import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { quizSchema } from "@/data/quizSchema";
import { EXAMPLE_QUIZ_JSON } from "@/lib/importHelpContent";

describe("import help content", () => {
  it("example quiz is valid", () => {
    expect(quizSchema.safeParse(JSON.parse(EXAMPLE_QUIZ_JSON)).success).toBe(true);
  });

  it.each(["css-basics", "javascript-basics", "react-basics", "markdown-showcase"])(
    "bundled sample %s is valid",
    (name) => {
      const raw = readFileSync(`sample-quizzes/${name}.json`, "utf8");
      expect(quizSchema.safeParse(JSON.parse(raw)).success).toBe(true);
    },
  );
});
