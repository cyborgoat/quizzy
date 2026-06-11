import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";

export const CODE_BLOCK_LANGUAGES = {
  txt: "Plain text",
  js: "JavaScript",
  ts: "TypeScript",
  tsx: "TypeScript (React)",
  css: "CSS",
  json: "JSON",
  bash: "Bash",
  python: "Python",
} as const;

const HIGHLIGHT_LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  txt: "plaintext",
  text: "plaintext",
};

const PLAIN_TEXT_LANGUAGES = new Set(["txt", "text", "plaintext"]);

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("python", python);
hljs.registerLanguage("plaintext", plaintext);

const LANGUAGE_LABEL_ALIASES: Record<string, keyof typeof CODE_BLOCK_LANGUAGES> = {
  javascript: "js",
  typescript: "ts",
  py: "python",
  sh: "bash",
  shell: "bash",
  text: "txt",
  plaintext: "txt",
};

function formatLanguageTag(languageTag: string) {
  return languageTag
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function getCodeBlockLanguageLabel(languageTag: string) {
  const normalized = languageTag.toLowerCase();
  const knownLabel =
    CODE_BLOCK_LANGUAGES[normalized as keyof typeof CODE_BLOCK_LANGUAGES];
  if (knownLabel) {
    return knownLabel;
  }

  const aliasKey = LANGUAGE_LABEL_ALIASES[normalized];
  if (aliasKey) {
    return CODE_BLOCK_LANGUAGES[aliasKey];
  }

  return formatLanguageTag(normalized);
}

export function resolveHighlightLanguage(languageTag: string) {
  const normalized = HIGHLIGHT_LANGUAGE_ALIASES[languageTag] ?? languageTag;
  return hljs.getLanguage(normalized) ? normalized : undefined;
}

export function highlightMarkdownCode(languageTag: string, code: string) {
  const trimmed = code.replace(/\n$/, "");

  if (PLAIN_TEXT_LANGUAGES.has(languageTag)) {
    return hljs.highlight(trimmed, { language: "plaintext" }).value;
  }

  const language = resolveHighlightLanguage(languageTag);
  if (language) {
    return hljs.highlight(trimmed, { language }).value;
  }

  return hljs.highlightAuto(trimmed).value;
}
