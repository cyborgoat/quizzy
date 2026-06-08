import { useEffect, useState, type ReactNode } from "react";
import { UiPreferencesContext } from "@/contexts/ui-preferences-context";
import { loadAppSettings } from "@/lib/appSettings";
import {
  applyUiPreferences,
  parseUiDensity,
  parseUiFontSize,
  type UiDensity,
  type UiFontSize,
} from "@/lib/uiPreferences";

export function UiPreferencesProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<UiFontSize>("default");
  const [density, setDensityState] = useState<UiDensity>("default");

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

  function setFontSize(value: UiFontSize) {
    setFontSizeState(value);
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
