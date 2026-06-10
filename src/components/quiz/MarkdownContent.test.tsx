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
});
