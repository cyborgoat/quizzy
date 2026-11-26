import type { MessageKey } from "@/lib/i18n-messages";
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
  labelKey: MessageKey;
}> = [
  { value: "all", labelKey: "home.filter.all" },
  { value: "not-started", labelKey: "home.filter.not-started" },
  { value: "in-progress", labelKey: "home.filter.in-progress" },
  { value: "target-reached", labelKey: "home.filter.target-reached" },
  { value: "archived", labelKey: "home.filter.archived" },
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
  labelKey: MessageKey;
  defaultDirection: QuizLibrarySortDirection;
  /** Direction labels, keyed by direction. */
  directionLabelKeys: Record<QuizLibrarySortDirection, MessageKey>;
};

export const QUIZ_LIBRARY_SORT_GROUPS: Array<{
  labelKey: MessageKey;
  options: QuizLibrarySortOption[];
}> = [
  {
    labelKey: "home.sort.group.library",
    options: [
      {
        value: "default",
        labelKey: "home.sort.default",
        defaultDirection: "asc",
        directionLabelKeys: { asc: "home.sort.dir.default", desc: "home.sort.dir.default" },
      },
      {
        value: "title",
        labelKey: "home.sort.title",
        defaultDirection: "asc",
        directionLabelKeys: { asc: "home.sort.dir.title.asc", desc: "home.sort.dir.title.desc" },
      },
    ],
  },
  {
    labelKey: "home.sort.group.progress",
    options: [
      {
        value: "recent-attempt",
        labelKey: "home.sort.recent-attempt",
        defaultDirection: "desc",
        directionLabelKeys: {
          asc: "home.sort.dir.recent-attempt.asc",
          desc: "home.sort.dir.recent-attempt.desc",
        },
      },
      {
        value: "attempts",
        labelKey: "home.sort.attempts",
        defaultDirection: "desc",
        directionLabelKeys: {
          asc: "home.sort.dir.attempts.asc",
          desc: "home.sort.dir.attempts.desc",
        },
      },
      {
        value: "best-score",
        labelKey: "home.sort.best-score",
        defaultDirection: "desc",
        directionLabelKeys: {
          asc: "home.sort.dir.best-score.asc",
          desc: "home.sort.dir.best-score.desc",
        },
      },
      {
        value: "target-score",
        labelKey: "home.sort.target-score",
        defaultDirection: "desc",
        directionLabelKeys: {
          asc: "home.sort.dir.target-score.asc",
          desc: "home.sort.dir.target-score.desc",
        },
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
