function normalizeMathBody(body: string) {
  // Markdown writers often escape punctuation (\_ , \=) inside $...$ / $$...$$.
  // Strip those escapes while preserving LaTeX commands such as \frac and \sum.
  return body.replace(/\\([^a-zA-Z])/g, "$1");
}

export function normalizeMarkdownMathEscapes(markdown: string) {
  const withBlockMath = markdown.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (_match, body: string) => `$$${normalizeMathBody(body)}$$`,
  );

  return withBlockMath.replace(
    /\$([^$\n]+?)\$/g,
    (_match, body: string) => `$${normalizeMathBody(body)}$`,
  );
}
