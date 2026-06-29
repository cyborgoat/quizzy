import { describe, expect, it } from "vitest";
import {
  DEFAULT_KEYBINDS,
  DEFAULT_SHORTCUT_SERIALIZED,
  findDuplicateKeybind,
  formatKeybind,
  keybindFromKeyboardEvent,
  matchesKeybind,
  parseKeybind,
  serializeKeybind,
  validateKeybindSerialized,
} from "@/lib/keybinds";

describe("keybinds", () => {
  it("parses legacy single-letter shortcuts as mod shortcuts", () => {
    expect(parseKeybind("l", DEFAULT_KEYBINDS.knowledgeLink)).toEqual({
      key: "l",
      mod: true,
      alt: false,
      shift: false,
    });
  });

  it("serializes and parses full shortcuts", () => {
    const serialized = serializeKeybind({
      key: "k",
      mod: true,
      alt: false,
      shift: true,
    });
    expect(serialized).toBe("mod+shift+k");
    expect(parseKeybind(serialized, DEFAULT_KEYBINDS.knowledgeLink)).toEqual({
      key: "k",
      mod: true,
      alt: false,
      shift: true,
    });
  });

  it("validates shortcut bindings", () => {
    expect(validateKeybindSerialized("mod+l")).toBeNull();
    expect(validateKeybindSerialized("")).toBeTruthy();
    expect(validateKeybindSerialized("not-a-shortcut")).toBeTruthy();
  });

  it("detects duplicate shortcuts", () => {
    expect(
      findDuplicateKeybind({
        knowledgeLinkShortcut: "mod+l",
        knowledgeNewNoteShortcut: "mod+n",
        zoomInShortcut: "mod+=",
        zoomOutShortcut: "mod+-",
        toggleSidebarShortcut: "mod+l",
      }),
    ).toEqual({
      field: "toggleSidebarShortcut",
      message: "This shortcut is already assigned.",
    });
  });

  it("formats keybinds without extra plus separators", () => {
    expect(
      formatKeybind({ key: "=", mod: true, alt: false, shift: false }),
    ).toMatch(/^(Ctrl|⌘) \+$/);
    expect(
      formatKeybind({ key: "l", mod: true, alt: false, shift: true }),
    ).not.toContain(" + ");
  });

  it("uses physical key codes when alt produces special characters", () => {
    const event = {
      key: "´",
      code: "KeyE",
      ctrlKey: false,
      metaKey: false,
      altKey: true,
      shiftKey: false,
    } as KeyboardEvent;

    expect(keybindFromKeyboardEvent(event)).toEqual({
      key: "e",
      mod: false,
      alt: true,
      shift: false,
    });
  });

  it("matches ctrl or meta modified keys", () => {
    const bind = DEFAULT_KEYBINDS.knowledgeLink;
    const ctrlEvent = { key: "l", code: "KeyL", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false } as KeyboardEvent;
    const metaEvent = { key: "l", code: "KeyL", ctrlKey: false, metaKey: true, altKey: false, shiftKey: false } as KeyboardEvent;
    const shiftEvent = { key: "l", code: "KeyL", ctrlKey: true, metaKey: false, altKey: false, shiftKey: true } as KeyboardEvent;

    expect(matchesKeybind(ctrlEvent, bind)).toBe(true);
    expect(matchesKeybind(metaEvent, bind)).toBe(true);
    expect(matchesKeybind(shiftEvent, bind)).toBe(false);
  });

  it("exposes defaults that match the Rust backend", () => {
    expect(DEFAULT_SHORTCUT_SERIALIZED).toEqual({
      knowledgeLinkShortcutKey: "mod+l",
      knowledgeNewNoteShortcutKey: "mod+n",
      zoomInShortcutKey: "mod+=",
      zoomOutShortcutKey: "mod+-",
      toggleSidebarShortcutKey: "mod+b",
    });
  });
});
