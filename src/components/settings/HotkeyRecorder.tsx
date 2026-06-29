import { useEffect, useId, useRef, useState } from "react";
import {
  formatKeybind,
  keybindFromKeyboardEvent,
  parseKeybind,
  serializeKeybind,
} from "@/lib/keybinds";
import { cn } from "@/lib/utils";
import { settingsControlSizeClassName } from "@/components/settings/settingsControlStyles";

export function HotkeyRecorder({
  value,
  onChange,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [recording, setRecording] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const keybind = parseKeybind(value, { key: "", mod: false, alt: false, shift: false });

  function cancelRecording() {
    setRecording(false);
  }

  useEffect(() => {
    if (!recording) return;

    function handlePointerDown(event: MouseEvent) {
      if (buttonRef.current?.contains(event.target as Node)) return;
      cancelRecording();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelRecording();
        return;
      }

      const captured = keybindFromKeyboardEvent(event);
      if (!captured) return;

      event.preventDefault();
      event.stopPropagation();
      onChange(serializeKeybind(captured));
      setRecording(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onChange, recording]);

  return (
    <button
      ref={buttonRef}
      type="button"
      id={labelId}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={recording}
      onClick={() => setRecording(true)}
      className={cn(
        settingsControlSizeClassName,
        "truncate px-1 py-0 font-medium text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        recording ? "border-zinc-700" : "border-zinc-200",
        className,
      )}
    >
      {recording ? "\u00A0" : formatKeybind(keybind)}
    </button>
  );
}
