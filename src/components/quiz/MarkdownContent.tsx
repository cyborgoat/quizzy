import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Components } from "react-markdown";

const codeFontClass = "font-mono";

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
            className={`${codeFontClass} text-sm ${prose ? "block w-full max-w-full wrap-break-word whitespace-pre-wrap text-zinc-800" : "block max-w-full overflow-x-auto"} ${className}`}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className={
            prose
              ? `${codeFontClass} text-[0.9em] text-zinc-800 wrap-break-word`
              : `rounded bg-zinc-100 px-1 py-0.5 text-sm ${codeFontClass} wrap-break-word`
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
            ? `wrap-break-word whitespace-pre-wrap ${codeFontClass} text-zinc-800`
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
      <div className={`w-full max-w-full overflow-x-auto ${prose ? "mt-4" : "mt-2"}`}>
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="border-b border-zinc-200 bg-zinc-50/60">{children}</thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-zinc-200/45">{children}</tr>,
    th: ({ children }) => (
      <th className="px-3 py-2 text-left align-middle text-xs font-semibold text-zinc-600">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td
        className={`px-3 py-2 align-middle ${prose ? "text-base leading-7 text-zinc-700" : "text-sm text-zinc-700"}`}
      >
        {children}
      </td>
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
    <code className={`rounded bg-zinc-100 px-1 py-0.5 text-xs ${codeFontClass}`}>{children}</code>
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
      remarkPlugins={[remarkMath, remarkGfm]}
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
