import { describe, expect, it } from "vitest";
import { normalizeMarkdownMathEscapes } from "@/lib/markdownMath";

describe("normalizeMarkdownMathEscapes", () => {
  it("unescapes markdown punctuation inside inline math", () => {
    expect(normalizeMarkdownMathEscapes(String.raw`$X \= (x\_1, x\_2, ..., x\_N)$`)).toBe(
      "$X = (x_1, x_2, ..., x_N)$",
    );
  });

  it("preserves LaTeX commands", () => {
    expect(normalizeMarkdownMathEscapes(String.raw`$\lim_{x \to 0} \dfrac{\sin x}{x}$`)).toBe(
      "$\\lim_{x \\to 0} \\dfrac{\\sin x}{x}$",
    );
  });

  it("normalizes block math delimiters", () => {
    expect(normalizeMarkdownMathEscapes(String.raw`$$\sum_{i=1}^{n} x\_i$$`)).toBe(
      "\n\n$$\n\\sum_{i=1}^{n} x_i\n$$\n\n",
    );
  });

  it("isolates double-dollar math on its own line", () => {
    expect(normalizeMarkdownMathEscapes("Text $$x^2$$ more")).toBe(
      "Text \n\n$$\nx^2\n$$\n\n more",
    );
  });
});
