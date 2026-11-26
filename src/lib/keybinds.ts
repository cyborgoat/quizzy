import type { MessageKey } from "@/lib/i18n-messages";

export type Keybind = {
  key: string;
  mod: boolean;
  alt: boolean;
  shift: boolean;
};

export const DEFAULT_KEYBINDS = {
  knowledgeLink: { key: "l", mod: true, alt: false, shift: false },
  knowledgeNewNote: { key: "n", mod: true, alt: false, shift: false },
  zoomIn: { key: "=", mod: true, alt: false, shift: false },
  zoomOut: { key: "-", mod: true, alt: false, shift: false },
  toggleSidebar: { key: "b", mod: true, alt: false, shift: false },
} as const satisfies Record<string, Keybind>;

export const SHORTCUT_FIELDS = [
  {
    draftKey: "knowledgeLinkShortcut",
    apiKey: "knowledgeLinkShortcutKey",
    contextBindKey: "knowledgeLink",
    defaultBind: DEFAULT_KEYBINDS.knowledgeLink,
    labelKey: "settings.shortcuts.knowledgeLink.label",
    descriptionKey: "settings.shortcuts.knowledgeLink.description",
  },
  {
    draftKey: "knowledgeNewNoteShortcut",
    apiKey: "knowledgeNewNoteShortcutKey",
    contextBindKey: "knowledgeNewNote",
    defaultBind: DEFAULT_KEYBINDS.knowledgeNewNote,
    labelKey: "settings.shortcuts.knowledgeNewNote.label",
    descriptionKey: "settings.shortcuts.knowledgeNewNote.description",
  },
  {
    draftKey: "zoomInShortcut",
    apiKey: "zoomInShortcutKey",
    contextBindKey: "zoomIn",
    defaultBind: DEFAULT_KEYBINDS.zoomIn,
    labelKey: "settings.shortcuts.zoomIn.label",
    descriptionKey: "settings.shortcuts.zoomIn.description",
  },
  {
    draftKey: "zoomOutShortcut",
    apiKey: "zoomOutShortcutKey",
    contextBindKey: "zoomOut",
    defaultBind: DEFAULT_KEYBINDS.zoomOut,
    labelKey: "settings.shortcuts.zoomOut.label",
    descriptionKey: "settings.shortcuts.zoomOut.description",
  },
  {
    draftKey: "toggleSidebarShortcut",
    apiKey: "toggleSidebarShortcutKey",
    contextBindKey: "toggleSidebar",
    defaultBind: DEFAULT_KEYBINDS.toggleSidebar,
    labelKey: "settings.shortcuts.toggleSidebar.label",
    descriptionKey: "settings.shortcuts.toggleSidebar.description",
  },
] as const satisfies readonly {
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  [field: string]: unknown;
}[];

export type ShortcutDraftKey = (typeof SHORTCUT_FIELDS)[number]["draftKey"];

const MODIFIER_ONLY_KEYS = new Set(["Control", "Meta", "Alt", "Shift"]);

export function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function formatShortcutModifier() {
  return isMacPlatform() ? "⌘" : "Ctrl";
}

function formatAltModifier() {
  return isMacPlatform() ? "⌥" : "Alt";
}

function formatShiftModifier() {
  return isMacPlatform() ? "⇧" : "Shift";
}

function formatKeyLabel(key: string) {
  if (key === "=") return "+";
  if (key === "-") return "−";
  return key.length === 1 ? key.toUpperCase() : key;
}

export function formatKeybind(bind: Keybind) {
  const parts: string[] = [];
  if (bind.mod) parts.push(formatShortcutModifier());
  if (bind.alt) parts.push(formatAltModifier());
  if (bind.shift) parts.push(formatShiftModifier());
  parts.push(formatKeyLabel(bind.key));
  return parts.join(" ");
}

export function serializeKeybind(bind: Keybind): string {
  const parts: string[] = [];
  if (bind.mod) parts.push("mod");
  if (bind.alt) parts.push("alt");
  if (bind.shift) parts.push("shift");
  parts.push(bind.key);
  return parts.join("+");
}

export function parseKeybind(raw: unknown, fallback: Keybind): Keybind {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return fallback;

  if (!trimmed.includes("+")) {
    if (trimmed.length === 1 && /^[a-z0-9]$/.test(trimmed)) {
      return { key: trimmed, mod: true, alt: false, shift: false };
    }
    return fallback;
  }

  const parts = trimmed.split("+").filter(Boolean);
  const key = parts[parts.length - 1] ?? fallback.key;

  return {
    key,
    mod: parts.includes("mod") || parts.includes("ctrl") || parts.includes("meta"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
  };
}

function keyFromEventCode(code: string | undefined): string | null {
  if (!code) return null;
  if (code.startsWith("Key") && code.length === 4) {
    return code.slice(3).toLowerCase();
  }
  if (code.startsWith("Digit") && code.length === 6) {
    return code.slice(5);
  }

  switch (code) {
    case "Equal":
    case "NumpadAdd":
      return "=";
    case "Minus":
    case "NumpadSubtract":
      return "-";
    default:
      return null;
  }
}

export function normalizeEventKey(event: KeyboardEvent): string | null {
  if (MODIFIER_ONLY_KEYS.has(event.key)) return null;

  const fromCode = keyFromEventCode(event.code);
  if (fromCode) return fromCode;

  if (event.key === "=" || event.key === "+") return "=";
  if (event.key === "-") return "-";
  if (event.key.length === 1) return event.key.toLowerCase();

  return null;
}

export function keybindFromKeyboardEvent(event: KeyboardEvent): Keybind | null {
  const key = normalizeEventKey(event);
  if (!key) return null;

  return {
    key,
    mod: event.ctrlKey || event.metaKey,
    alt: event.altKey,
    shift: event.shiftKey,
  };
}

export function matchesKeybind(event: KeyboardEvent, bind: Keybind) {
  const key = normalizeEventKey(event);
  if (!key || key !== bind.key) return false;

  const mod = event.ctrlKey || event.metaKey;
  return bind.mod === mod && bind.alt === event.altKey && bind.shift === event.shiftKey;
}

export function validateKeybindSerialized(value: string): MessageKey | null {
  const trimmed = value.trim();
  if (!trimmed) return "settings.shortcuts.error.record";

  if (!trimmed.includes("+")) {
    if (trimmed.length === 1 && /^[a-z]$/i.test(trimmed)) {
      return null;
    }
    return "settings.shortcuts.error.format";
  }

  const bind = parseKeybind(trimmed, DEFAULT_KEYBINDS.knowledgeLink);
  if (!bind.key) return "settings.shortcuts.error.invalid";

  const hasModifier = bind.mod || bind.alt || bind.shift;
  if (!hasModifier) return "settings.shortcuts.error.modifier";

  return null;
}

export function findDuplicateKeybind(
  values: Record<string, string>,
): { field: string; message: MessageKey } | null {
  const seen = new Map<string, string>();

  for (const [field, raw] of Object.entries(values)) {
    const fieldConfig = SHORTCUT_FIELDS.find((config) => config.draftKey === field);
    const fallback = fieldConfig?.defaultBind ?? DEFAULT_KEYBINDS.knowledgeLink;
    const serialized = serializeKeybind(parseKeybind(raw, fallback));
    const previous = seen.get(serialized);
    if (previous) {
      return {
        field,
        message: "settings.shortcuts.error.duplicate",
      };
    }
    seen.set(serialized, field);
  }

  return null;
}

// Keep in sync with default_*_shortcut_key() in src-tauri/src/lib.rs.
export const DEFAULT_SHORTCUT_SERIALIZED = Object.fromEntries(
  SHORTCUT_FIELDS.map((field) => [field.apiKey, serializeKeybind(field.defaultBind)]),
) as Record<(typeof SHORTCUT_FIELDS)[number]["apiKey"], string>;
