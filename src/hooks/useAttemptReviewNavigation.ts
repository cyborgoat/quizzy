import { useState } from "react";
import type { QuestionReviewItem } from "@/types/review";
import {
  defaultReviewFilter,
  initialReviewQuestionIndex,
  matchesReviewFilter,
  type ReviewFilter,
} from "@/lib/quizReview";

export function useAttemptReviewNavigation(items: QuestionReviewItem[]) {
  const [filter, setFilter] = useState<ReviewFilter>(() => defaultReviewFilter(items));
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(() =>
    initialReviewQuestionIndex(items),
  );

  function handleFilterChange(nextFilter: ReviewFilter) {
    setFilter(nextFilter);
    const nextFilteredItems = items.filter((item) =>
      matchesReviewFilter(item.record, nextFilter),
    );
    if (!nextFilteredItems.some((item) => item.index === activeQuestionIndex)) {
      setActiveQuestionIndex(nextFilteredItems[0]?.index ?? 0);
    }
  }

  function selectQuestion(index: number) {
    const item = items.find((entry) => entry.index === index);
    if (item && !matchesReviewFilter(item.record, filter)) {
      setFilter("all");
    }
    setActiveQuestionIndex(index);
  }

  return {
    filter,
    onFilterChange: handleFilterChange,
    activeQuestionIndex,
    onActiveQuestionIndexChange: setActiveQuestionIndex,
    selectQuestion,
  };
}
