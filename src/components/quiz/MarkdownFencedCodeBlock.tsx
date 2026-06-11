import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  getCodeBlockLanguageLabel,
  highlightMarkdownCode,
} from "@/lib/codeBlockLanguages";
import { copyTextToClipboard } from "@/lib/clipboard";
import { errorMessage } from "@/lib/native";
import { cn } from "@/lib/utils";

const codeFontClass = "font-mono";

export function MarkdownFencedCodeBlock({
  language,
  source,
  className,
}: {
  language: string;
  source: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const languageLabel = getCodeBlockLanguageLabel(language);
  const html = highlightMarkdownCode(language, source);

  async function handleCopy() {
    setIsCopying(true);
    try {
      await copyTextToClipboard(source);
      setCopied(true);
      toast.success("Code copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <div className={cn("markdown-fenced-code w-full max-w-full", className)}>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 bg-zinc-100/70 px-3 py-1.5">
          <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            {languageLabel}
          </span>
          <button
            type="button"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-zinc-200/80 bg-white/90 text-zinc-700 shadow-sm transition hover:bg-white disabled:opacity-60"
            onClick={() => void handleCopy()}
            disabled={isCopying}
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
        <pre className="max-w-full overflow-x-auto p-3 text-sm leading-relaxed">
          <code
            className={cn(codeFontClass, "hljs block w-full max-w-full text-sm", `language-${language}`)}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </pre>
      </div>
    </div>
  );
}
