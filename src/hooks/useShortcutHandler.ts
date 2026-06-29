import { useEffect } from "react";
import { isEditableKeyboardTarget } from "@/lib/keyboard";
import { matchesKeybind, serializeKeybind, type Keybind } from "@/lib/keybinds";

export function useShortcutHandler(
  keybind: Keybind,
  handler: () => void,
  options?: {
    enabled?: boolean;
  },
) {
  const serialized = serializeKeybind(keybind);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableKeyboardTarget(event.target)) return;
      if (!matchesKeybind(event, keybind)) return;

      event.preventDefault();
      handler();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handler, keybind, serialized]);
}
