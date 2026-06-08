import { useEffect, useState, type ReactNode } from "react";
import { MistakeLogSettingsContext } from "@/contexts/mistake-log-settings-context";
import { loadAppSettings } from "@/lib/appSettings";

export function MistakeLogSettingsProvider({ children }: { children: ReactNode }) {
  const [minMistakes, setMinMistakesState] = useState(1);
  const [maxCorrectnessPercentage, setMaxCorrectnessPercentageState] = useState(100);

  useEffect(() => {
    void loadAppSettings().then((settings) => {
      setMinMistakesState(settings.mistakeLogMinMistakes);
      setMaxCorrectnessPercentageState(settings.mistakeLogMaxCorrectnessPercentage);
    });
  }, []);

  function setMinMistakes(value: number) {
    setMinMistakesState(value);
  }

  function setMaxCorrectnessPercentage(value: number) {
    setMaxCorrectnessPercentageState(value);
  }

  return (
    <MistakeLogSettingsContext.Provider
      value={{ minMistakes, maxCorrectnessPercentage, setMinMistakes, setMaxCorrectnessPercentage }}
    >
      {children}
    </MistakeLogSettingsContext.Provider>
  );
}
