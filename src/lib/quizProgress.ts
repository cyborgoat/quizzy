import type { Goal } from "@/types/goal";
import type { QuizSource } from "@/types/quiz";

export type QuizProgressStatus =
  | "not-started"
  | "in-progress"
  | "target-reached";

export type QuizProgressMetrics = {
  attemptCount: number;
  highestScore?: number;
};

export type QuizLibraryFilter = "all" | QuizProgressStatus | "archived";

export const QUIZ_LIBRARY_FILTERS: Array<{
  value: QuizLibraryFilter;
  label: string;
}> = [
  { value: "all", label: "All active" },
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "target-reached", label: "Target reached" },
  { value: "archived", label: "Archived" },
];

export function filterQuizSources(
  sources: QuizSource[],
  goals: Goal[],
  filter: QuizLibraryFilter,
): QuizSource[] {
  if (filter === "archived") return sources.filter((source) => source.archived);

  const activeSources = sources.filter((source) => !source.archived);
  if (filter === "all") return activeSources;
  return activeSources.filter(
    (source) =>
      quizProgressStatus(goals.find((goal) => goal.quizId === source.quiz.id)) === filter,
  );
}

export function quizProgressMetrics(goal: Goal | undefined): QuizProgressMetrics {
  if (!goal || goal.attempts.length === 0) return { attemptCount: 0 };

  return {
    attemptCount: goal.attempts.length,
    highestScore: Math.max(...goal.attempts.map((attempt) => attempt.percentage)),
  };
}

export function quizProgressStatus(goal: Goal | undefined): QuizProgressStatus {
  const { attemptCount, highestScore } = quizProgressMetrics(goal);
  if (attemptCount === 0) return "not-started";
  if (
    goal?.targetScore !== undefined &&
    highestScore !== undefined &&
    highestScore >= goal.targetScore
  ) {
    return "target-reached";
  }
  return "in-progress";
}

export type QuizLibrarySortField =
  | "default"
  | "recent-attempt"
  | "attempts"
  | "best-score"
  | "target-score"
  | "title";

type QuizLibrarySortDirection = "asc" | "desc";

export type QuizLibrarySort = {
  field: QuizLibrarySortField;
  direction: QuizLibrarySortDirection;
};

type QuizLibrarySortOption = {
  value: QuizLibrarySortField;
  label: string;
  defaultDirection: QuizLibrarySortDirection;
  /** Direction labels, keyed by direction. */
  directionLabels: Record<QuizLibrarySortDirection, string>;
};

export const QUIZ_LIBRARY_SORT_GROUPS: Array<{
  label: string;
  options: QuizLibrarySortOption[];
}> = [
  {
    label: "Library",
    options: [
      {
        value: "default",
        label: "Default order",
        defaultDirection: "asc",
        directionLabels: { asc: "Default order", desc: "Default order" },
      },
      {
        value: "title",
        label: "Title",
        defaultDirection: "asc",
        directionLabels: { asc: "A to Z", desc: "Z to A" },
      },
    ],
  },
  {
    label: "Progress",
    options: [
      {
        value: "recent-attempt",
        label: "Last attempt",
        defaultDirection: "desc",
        directionLabels: { asc: "Oldest first", desc: "Newest first" },
      },
      {
        value: "attempts",
        label: "Attempts",
        defaultDirection: "desc",
        directionLabels: { asc: "Fewest first", desc: "Most first" },
      },
      {
        value: "best-score",
        label: "Best score",
        defaultDirection: "desc",
        directionLabels: { asc: "Lowest first", desc: "Highest first" },
      },
      {
        value: "target-score",
        label: "Target score",
        defaultDirection: "desc",
        directionLabels: { asc: "Lowest first", desc: "Highest first" },
      },
    ],
  },
];

const SORT_OPTIONS = QUIZ_LIBRARY_SORT_GROUPS.flatMap((group) => group.options);

export function quizLibrarySortOption(field: QuizLibrarySortField): QuizLibrarySortOption {
  return SORT_OPTIONS.find((option) => option.value === field) ?? SORT_OPTIONS[0];
}

/** Switching fields starts from that field's natural direction. */
export function withSortField(field: QuizLibrarySortField): QuizLibrarySort {
  return { field, direction: quizLibrarySortOption(field).defaultDirection };
}

export const DEFAULT_QUIZ_LIBRARY_SORT = withSortField("default");

export function parseQuizLibrarySort(value: unknown): QuizLibrarySort {
  if (typeof value !== "object" || value === null) return DEFAULT_QUIZ_LIBRARY_SORT;
  const { field, direction } = value as Record<string, unknown>;
  const option = SORT_OPTIONS.find((item) => item.value === field);
  if (!option) return DEFAULT_QUIZ_LIBRARY_SORT;
  return {
    field: option.value,
    direction:
      direction === "asc" || direction === "desc" ? direction : option.defaultDirection,
  };
}

function latestAttemptTime(goal: Goal | undefined): number | undefined {
  if (!goal || goal.attempts.length === 0) return undefined;
  const time = Math.max(...goal.attempts.map((attempt) => Date.parse(attempt.takenAt)));
  return Number.isNaN(time) ? undefined : time;
}

function sortValue(
  goal: Goal | undefined,
  field: QuizLibrarySortField,
): number | undefined {
  switch (field) {
    case "recent-attempt":
      return latestAttemptTime(goal);
    case "attempts":
      return quizProgressMetrics(goal).attemptCount;
    case "best-score":
      return quizProgressMetrics(goal).highestScore;
    case "target-score":
      return goal?.targetScore;
    default:
      return undefined;
  }
}

/**
 * Sorts quizzes by the chosen field and direction. Quizzes without a value
 * (no attempts, no target) stay last in either direction; ties keep their
 * incoming order, so search relevance still breaks ties.
 */
export function sortQuizSources(
  sources: QuizSource[],
  goals: Goal[],
  { field, direction }: QuizLibrarySort,
): QuizSource[] {
  if (field === "default") return sources;
  const sign = direction === "asc" ? 1 : -1;

  if (field === "title") {
    return [...sources].sort(
      (a, b) =>
        sign * a.quiz.title.localeCompare(b.quiz.title, undefined, { sensitivity: "base" }),
    );
  }

  const goalsByQuizId = new Map(goals.map((goal) => [goal.quizId, goal]));
  const values = new Map(
    sources.map((source) => [
      source.quiz.id,
      sortValue(goalsByQuizId.get(source.quiz.id), field),
    ]),
  );

  return [...sources].sort((a, b) => {
    const left = values.get(a.quiz.id);
    const right = values.get(b.quiz.id);
    if (left === undefined) return right === undefined ? 0 : 1;
    if (right === undefined) return -1;
    return sign * (left - right);
  });
}
