import { useCallback, useState } from "react";
import {
  DEFAULT_QUIZ_LIBRARY_SORT,
  parseQuizLibrarySort,
  type QuizLibrarySort,
} from "@/lib/quizProgress";

const STORAGE_KEY = "quizzy:home:quiz-sort";

function readStoredSort(): QuizLibrarySort {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? parseQuizLibrarySort(JSON.parse(stored)) : DEFAULT_QUIZ_LIBRARY_SORT;
  } catch {
    return DEFAULT_QUIZ_LIBRARY_SORT;
  }
}

/** Home page sort order, remembered across visits and restarts. */
export function useQuizLibrarySort() {
  const [sort, setSortState] = useState<QuizLibrarySort>(readStoredSort);

  const setSort = useCallback((next: QuizLibrarySort) => {
    setSortState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable; keep the in-memory choice for this session.
    }
  }, []);

  return [sort, setSort] as const;
}
