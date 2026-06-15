import { useState } from "react";
import type { QuestionReviewItem } from "@/types/review";
import {
  allReviewFilters,
  defaultReviewFilters,
  initialReviewQuestionIndex,
  matchesReviewFilter,
  toggleReviewFilter,
} from "@/lib/quizReview";

export function useAttemptReviewNavigation(items: QuestionReviewItem[]) {
  const [filters, setFilters] = useState(() => defaultReviewFilters(items));
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(() =>
    initialReviewQuestionIndex(items),
  );

  function handleFilterToggle(kind: Parameters<typeof toggleReviewFilter>[1]) {
    const nextFilters = toggleReviewFilter(filters, kind);
    setFilters(nextFilters);
    const nextFilteredItems = items.filter((item) =>
      matchesReviewFilter(item.record, nextFilters),
    );
    if (!nextFilteredItems.some((item) => item.index === activeQuestionIndex)) {
      setActiveQuestionIndex(nextFilteredItems[0]?.index ?? 0);
    }
  }

  function selectQuestion(index: number) {
    const item = items.find((entry) => entry.index === index);
    if (item && !matchesReviewFilter(item.record, filters)) {
      setFilters(allReviewFilters());
    }
    setActiveQuestionIndex(index);
  }

  return {
    filters,
    onFilterToggle: handleFilterToggle,
    activeQuestionIndex,
    onActiveQuestionIndexChange: setActiveQuestionIndex,
    selectQuestion,
  };
}
