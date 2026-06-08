import { createContext } from "react";

export type MistakeLogSettingsContextValue = {
  minMistakes: number;
  maxCorrectnessPercentage: number;
  setMinMistakes: (value: number) => void;
  setMaxCorrectnessPercentage: (value: number) => void;
};

export const MistakeLogSettingsContext =
  createContext<MistakeLogSettingsContextValue | null>(null);
