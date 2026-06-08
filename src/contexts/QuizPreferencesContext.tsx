import { useState, type ReactNode } from "react";
import { QuizPreferencesContext } from "@/contexts/quiz-preferences-context";

const SHUFFLE_MODE_KEY = "quizzy:preferences:shuffle-mode";

function readShuffleMode() {
  return localStorage.getItem(SHUFFLE_MODE_KEY) === "true";
}

export function QuizPreferencesProvider({ children }: { children: ReactNode }) {
  const [shuffleMode, setShuffleModeState] = useState(readShuffleMode);

  function setShuffleMode(enabled: boolean) {
    localStorage.setItem(SHUFFLE_MODE_KEY, String(enabled));
    setShuffleModeState(enabled);
  }

  return (
    <QuizPreferencesContext.Provider value={{ shuffleMode, setShuffleMode }}>
      {children}
    </QuizPreferencesContext.Provider>
  );
}
