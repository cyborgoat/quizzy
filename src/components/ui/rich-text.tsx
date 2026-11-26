import { Fragment, type ReactNode } from "react";

const TOKEN = /(<strong>.*?<\/strong>|<code>.*?<\/code>|\{[A-Za-z][A-Za-z0-9]*\})/g;

/**
 * Renders translated copy that contains inline `<strong>`, `<code>` and `{slot}`
 * placeholders (for example icons or styled numbers).
 */
export function RichText({
  text,
  slots = {},
}: {
  text: string;
  slots?: Record<string, ReactNode>;
}) {
  return (
    <>
      {text.split(TOKEN).map((part, index) => {
        if (part.startsWith("<strong>")) {
          return <strong key={index}>{part.slice(8, -9)}</strong>;
        }
        if (part.startsWith("<code>")) {
          return <code key={index}>{part.slice(6, -7)}</code>;
        }
        if (part.startsWith("{") && part.endsWith("}")) {
          const slot = part.slice(1, -1);
          if (slot in slots) return <Fragment key={index}>{slots[slot]}</Fragment>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}
