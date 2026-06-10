import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { UiPreferencesContext } from "@/contexts/ui-preferences-context";
import { loadAppSettings } from "@/lib/appSettings";
import { isEditableKeyboardTarget } from "@/lib/keyboard";
import { errorMessage, nativeApi } from "@/lib/native";
import {
  applyUiPreferences,
  clampFontSize,
  parseUiDensity,
  parseUiFontSize,
  stepFontSize,
  UI_FONT_SIZE_DEFAULT,
  type UiDensity,
} from "@/lib/uiPreferences";

export function UiPreferencesProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState(UI_FONT_SIZE_DEFAULT);
  const [density, setDensityState] = useState<UiDensity>("default");
  const fontSizeRef = useRef(fontSize);

  useEffect(() => {
    fontSizeRef.current = fontSize;
  }, [fontSize]);

  useEffect(() => {
    void loadAppSettings().then((settings) => {
      const nextFontSize = parseUiFontSize(settings.uiFontSize);
      const nextDensity = parseUiDensity(settings.uiDensity);
      setFontSizeState(nextFontSize);
      setDensityState(nextDensity);
      applyUiPreferences(nextFontSize, nextDensity);
    });
  }, []);

  useEffect(() => {
    applyUiPreferences(fontSize, density);
  }, [fontSize, density]);

  const persistFontSize = useCallback(async (value: number) => {
    try {
      await nativeApi.saveSettings({ uiFontSize: clampFontSize(value) });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }, []);

  const adjustFontSize = useCallback(
    (direction: "up" | "down") => {
      const next = stepFontSize(fontSizeRef.current, direction);
      if (next === null) return;
      setFontSizeState(next);
      void persistFontSize(next);
    },
    [persistFontSize],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (isEditableKeyboardTarget(event.target)) return;

      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        adjustFontSize("up");
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        adjustFontSize("down");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [adjustFontSize]);

  function setFontSize(value: number) {
    setFontSizeState(clampFontSize(value));
  }

  function setDensity(value: UiDensity) {
    setDensityState(value);
  }

  return (
    <UiPreferencesContext.Provider value={{ fontSize, density, setFontSize, setDensity }}>
      {children}
    </UiPreferencesContext.Provider>
  );
}
