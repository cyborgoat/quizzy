import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownContent } from "@/components/quiz/MarkdownContent";

describe("MarkdownContent", () => {
  it("renders inline and block KaTeX math", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent variant="prose">
        {`Inline $x^2$ and block:\n\n$$\\sum_{i=1}^{n} i$$`}
      </MarkdownContent>,
    );

    expect(html).toContain('class="katex"');
    expect(html).toContain("x^2");
    expect(html).toContain("\\sum_{i=1}^{n} i");
  });

  it("renders underscore subscripts and underline macros", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent variant="prose">
        {[
          "Subscript $x_1$",
          "Limit $\\lim_{x \\to 0}$",
          "Underline $\\underline{abc}$",
          "Indexed $T_1$, $T_2$, $S_t$",
        ].join("\n\n")}
      </MarkdownContent>,
    );

    expect(html).toContain("katex");
    expect(html).toContain("msupsub");
    expect(html).toContain("underline-line");
    expect(html).not.toContain("<em>");
    expect(html).toContain("T_1");
    expect(html).toContain("S_t");
  });

  it("renders showcase-style block sum and underline macros", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent variant="prose">
        {[
          "$$",
          "\\sum_{i=1}^{n} i = \\frac{n(n + 1)}{2}",
          "$$",
          "",
          "$\\underline{ABC + xyz}$",
        ].join("\n")}
      </MarkdownContent>,
    );

    expect(html).toContain("katex-display");
    expect(html).toContain("op-limits");
    expect(html).toContain("underline-line");
  });
});
