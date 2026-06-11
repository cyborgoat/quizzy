import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownContent } from "@/components/quiz/MarkdownContent";

const HIGHLIGHT_LANGUAGES = [
  ["js", 'const total = rows.reduce((sum, row) => sum + row.value, 0);'],
  ["ts", "function greet(name: string): string {\n  return `Hello, ${name}!`;\n}"],
  ["tsx", "export function App() {\n  return <main />;\n}"],
  ["json", '{ "id": "markdown-showcase", "tags": ["markdown"] }'],
  ["python", "values = [1, 2, 3]\nprint(sum(values))"],
  ["css", ".note {\n  color: #18181b;\n}"],
  ["bash", 'echo "hello"'],
] as const;

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

  it("renders vector notation with escaped markdown punctuation in math", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent variant="prose">
        {String.raw`Vector $X \= (x\_1, x\_2, ..., x\_N)$`}
      </MarkdownContent>,
    );

    expect(html).toContain("katex");
    expect(html).toContain("msupsub");
    expect(html).not.toContain("katex-error");
    expect(html).not.toContain(String.raw`x\_1`);
    expect(html).not.toContain(String.raw`\=`);
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

  it("highlights fenced code blocks but not inline code", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent variant="prose">
        {[
          "Use `const` inline and a block:",
          "",
          "```js",
          "const total = rows.reduce((sum, row) => sum + row.value, 0);",
          "```",
        ].join("\n")}
      </MarkdownContent>,
    );

    expect(html).toContain("hljs");
    expect(html).toContain("language-js");
    expect(html).toContain("hljs-keyword");
    expect(html).toContain("markdown-fenced-code");
    expect(html).toContain("JavaScript");
    expect(html).toContain('aria-label="Copy code"');
    expect(html).toContain("border-zinc-200");
    expect(html).toContain("bg-zinc-50");
    expect(html).not.toMatch(/<code class="[^"]*hljs[^"]*">const<\/code>/);
  });

  it.each(HIGHLIGHT_LANGUAGES)("highlights %s fenced blocks", (lang, snippet) => {
    const html = renderToStaticMarkup(
      <MarkdownContent>{`\`\`\`${lang}\n${snippet}\n\`\`\``}</MarkdownContent>,
    );

    expect(html).toContain(`language-${lang}`);
    expect(html).toContain("hljs");
    expect(html).toMatch(/hljs-[a-z]/);
  });
});
