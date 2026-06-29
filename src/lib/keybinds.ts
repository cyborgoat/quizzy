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
    label: "Link knowledge note",
    description: "Opens the link search from the references panel.",
  },
  {
    draftKey: "knowledgeNewNoteShortcut",
    apiKey: "knowledgeNewNoteShortcutKey",
    contextBindKey: "knowledgeNewNote",
    defaultBind: DEFAULT_KEYBINDS.knowledgeNewNote,
    label: "New knowledge note",
    description: "Creates a note linked to the current question.",
  },
  {
    draftKey: "zoomInShortcut",
    apiKey: "zoomInShortcutKey",
    contextBindKey: "zoomIn",
    defaultBind: DEFAULT_KEYBINDS.zoomIn,
    label: "Zoom in",
    description: "Increases app font size in 5% steps.",
  },
  {
    draftKey: "zoomOutShortcut",
    apiKey: "zoomOutShortcutKey",
    contextBindKey: "zoomOut",
    defaultBind: DEFAULT_KEYBINDS.zoomOut,
    label: "Zoom out",
    description: "Decreases app font size in 5% steps. Ctrl/Cmd + scroll wheel also works.",
  },
  {
    draftKey: "toggleSidebarShortcut",
    apiKey: "toggleSidebarShortcutKey",
    contextBindKey: "toggleSidebar",
    defaultBind: DEFAULT_KEYBINDS.toggleSidebar,
    label: "Toggle question sidebar",
    description: "Shows or hides the question navigator during a quiz.",
  },
] as const;

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

export function validateKeybindSerialized(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Record a shortcut.";

  if (!trimmed.includes("+")) {
    if (trimmed.length === 1 && /^[a-z]$/i.test(trimmed)) {
      return null;
    }
    return "Shortcut format is invalid.";
  }

  const bind = parseKeybind(trimmed, DEFAULT_KEYBINDS.knowledgeLink);
  if (!bind.key) return "Shortcut is invalid.";

  const hasModifier = bind.mod || bind.alt || bind.shift;
  if (!hasModifier) return "Include at least one modifier key.";

  return null;
}

export function findDuplicateKeybind(
  values: Record<string, string>,
): { field: string; message: string } | null {
  const seen = new Map<string, string>();

  for (const [field, raw] of Object.entries(values)) {
    const fieldConfig = SHORTCUT_FIELDS.find((config) => config.draftKey === field);
    const fallback = fieldConfig?.defaultBind ?? DEFAULT_KEYBINDS.knowledgeLink;
    const serialized = serializeKeybind(parseKeybind(raw, fallback));
    const previous = seen.get(serialized);
    if (previous) {
      return {
        field,
        message: "This shortcut is already assigned.",
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
