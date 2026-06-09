import { createContext } from "react";

export type MistakeLogSettingsContextValue = {
  minMistakes: number;
  minFlags: number;
  maxCorrectnessPercentage: number;
  setMinMistakes: (value: number) => void;
  setMinFlags: (value: number) => void;
  setMaxCorrectnessPercentage: (value: number) => void;
};

export const MistakeLogSettingsContext =
  createContext<MistakeLogSettingsContextValue | null>(null);
