import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Components } from "react-markdown";

function createBlockComponents(variant: "default" | "prose"): Components {
  const prose = variant === "prose";
  return {
    h1: ({ children }) => (
      <h1
        className={
          prose
            ? "mt-8 first:mt-0 text-2xl font-bold tracking-tight text-zinc-950"
            : "mt-4 text-xl font-bold"
        }
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        className={
          prose
            ? "mt-6 text-xl font-semibold tracking-tight text-zinc-950"
            : "mt-3 text-lg font-semibold"
        }
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        className={
          prose ? "mt-5 text-lg font-semibold text-zinc-950" : "mt-2 text-base font-semibold"
        }
      >
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p
        className={`${prose ? "mt-3 first:mt-0 text-base leading-7 text-zinc-700 wrap-break-word" : "mt-2 first:mt-0"}`}
      >
        {children}
      </p>
    ),
    strong: ({ children }) => <strong className="font-semibold text-zinc-950">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ className, children }) => {
      if (className) {
        return (
          <code
            className={`font-mono text-sm ${prose ? "block w-full max-w-full wrap-break-word whitespace-pre-wrap text-zinc-800" : "block max-w-full overflow-x-auto"} ${className}`}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className={
            prose
              ? "font-mono text-[0.9em] text-zinc-800 wrap-break-word"
              : "rounded bg-zinc-100 px-1 py-0.5 text-sm font-mono wrap-break-word"
          }
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre
        className={`mt-3 w-full max-w-full text-sm leading-relaxed ${
          prose
            ? "wrap-break-word whitespace-pre-wrap font-mono text-zinc-800"
            : "mt-2 overflow-x-auto rounded-lg bg-zinc-100 p-3"
        }`}
      >
        {children}
      </pre>
    ),
    ul: ({ children }) => (
      <ul
        className={`${prose ? "mt-3 list-disc space-y-1.5 pl-5 text-base leading-7 text-zinc-700 wrap-break-word" : "mt-2 list-inside list-disc space-y-1"}`}
      >
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol
        className={`${prose ? "mt-3 list-decimal space-y-1.5 pl-5 text-base leading-7 text-zinc-700 wrap-break-word" : "mt-2 list-inside list-decimal space-y-1"}`}
      >
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className={prose ? "wrap-break-word" : "text-sm"}>{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className={
          prose
            ? "mt-3 border-l-2 border-zinc-300 pl-4 text-base leading-7 text-zinc-600 italic"
            : "mt-2 border-l-2 border-zinc-200 pl-3 italic"
        }
      >
        {children}
      </blockquote>
    ),
    hr: () => <hr className={prose ? "my-6 border-zinc-200" : "my-4 border-zinc-200"} />,
    table: ({ children }) => (
      <div className="mt-2 w-full max-w-full overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    img: ({ src, alt }) => (
      <img src={src} alt={alt ?? ""} className="my-2 h-auto max-w-full rounded-md" />
    ),
  };
}

const blockComponents = createBlockComponents("default");
const proseComponents = createBlockComponents("prose");

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
  variant = "default",
}: {
  children: string;
  inline?: boolean;
  variant?: "default" | "prose";
}) {
  const components = inline
    ? inlineComponents
    : variant === "prose"
      ? proseComponents
      : blockComponents;

  const markdown = (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );

  if (variant === "prose" && !inline) {
    return <div className="w-full min-w-0 max-w-full">{markdown}</div>;
  }

  return markdown;
}
