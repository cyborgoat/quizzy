import { useEffect, useState, type ReactNode } from "react";
import { QuizPreferencesContext } from "@/contexts/quiz-preferences-context";
import { loadAppSettings } from "@/lib/appSettings";

export function QuizPreferencesProvider({ children }: { children: ReactNode }) {
  const [shuffleMode, setShuffleModeState] = useState(false);

  useEffect(() => {
    void loadAppSettings().then((settings) => {
      setShuffleModeState(settings.shuffleMode);
    });
  }, []);

  function setShuffleMode(enabled: boolean) {
    setShuffleModeState(enabled);
  }

  return (
    <QuizPreferencesContext.Provider value={{ shuffleMode, setShuffleMode }}>
      {children}
    </QuizPreferencesContext.Provider>
  );
}
