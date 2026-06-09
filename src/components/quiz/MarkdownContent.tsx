import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Components } from "react-markdown";

const blockComponents: Components = {
  p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ className, children }) => {
    if (className) {
      return <code className={`font-mono text-sm ${className}`}>{children}</code>;
    }
    return <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm font-mono">{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-sm leading-relaxed">
      {children}
    </pre>
  ),
  ul: ({ children }) => <ul className="mt-2 list-inside list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-inside list-decimal space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-sm">{children}</li>,
};

const inlineComponents: Components = {
  p: ({ children }) => <span>{children}</span>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs font-mono">{children}</code>
  ),
};

export function MarkdownContent({
  children,
  inline = false,
}: {
  children: string;
  inline?: boolean;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={inline ? inlineComponents : blockComponents}
    >
      {children}
    </ReactMarkdown>
  );
}
