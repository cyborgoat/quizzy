import { useEffect, useState, type ReactNode } from "react";
import { QuizPreferencesContext } from "@/contexts/quiz-preferences-context";
import { loadAppSettings } from "@/lib/appSettings";

export function QuizPreferencesProvider({ children }: { children: ReactNode }) {
  const [shuffleQuestions, setShuffleQuestionsState] = useState(false);
  const [shuffleOptions, setShuffleOptionsState] = useState(false);

  useEffect(() => {
    void loadAppSettings().then((settings) => {
      setShuffleQuestionsState(settings.shuffleQuestions);
      setShuffleOptionsState(settings.shuffleOptions);
    });
  }, []);

  function setShuffleQuestions(enabled: boolean) {
    setShuffleQuestionsState(enabled);
  }

  function setShuffleOptions(enabled: boolean) {
    setShuffleOptionsState(enabled);
  }

  return (
    <QuizPreferencesContext.Provider
      value={{
        shuffleQuestions,
        shuffleOptions,
        setShuffleQuestions,
        setShuffleOptions,
      }}
    >
      {children}
    </QuizPreferencesContext.Provider>
  );
}
