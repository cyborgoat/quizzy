import type { QuestionReviewItem } from "@/types/review";
import type { AnswerRecord, QuizQuestion, SubmittedAnswer } from "@/types/quiz";

export type ReviewFilterKind = "incorrect" | "correct" | "flagged";
export type ReviewFilters = Set<ReviewFilterKind>;

export const REVIEW_FILTER_KINDS: ReviewFilterKind[] = ["incorrect", "correct", "flagged"];

export function allReviewFilters(): ReviewFilters {
  return new Set(REVIEW_FILTER_KINDS);
}

export function isShowingAllReviewFilters(filters: ReviewFilters) {
  return REVIEW_FILTER_KINDS.every((kind) => filters.has(kind));
}

export function matchesReviewFilter(record: AnswerRecord, filters: ReviewFilters) {
  if (filters.size === 0) return false;
  if (isShowingAllReviewFilters(filters)) return true;
  if (filters.has("correct") && record.isCorrect) return true;
  if (filters.has("incorrect") && !record.isCorrect) return true;
  if (filters.has("flagged") && record.flagged) return true;
  return false;
}

export function toggleReviewFilter(
  filters: ReviewFilters,
  kind: ReviewFilterKind | "all",
): ReviewFilters {
  if (kind === "all") {
    return isShowingAllReviewFilters(filters) ? new Set() : allReviewFilters();
  }
  const next = new Set(filters);
  if (next.has(kind)) {
    next.delete(kind);
  } else {
    next.add(kind);
  }
  return next;
}

export function defaultReviewFilters(items: { record: AnswerRecord }[]): ReviewFilters {
  return items.some((item) => !item.record.isCorrect)
    ? new Set<ReviewFilterKind>(["incorrect"])
    : allReviewFilters();
}

export function initialReviewQuestionIndex(
  items: { index: number; record: AnswerRecord }[],
  filters: ReviewFilters = defaultReviewFilters(items),
) {
  const filtered = items.filter((item) => matchesReviewFilter(item.record, filters));
  return filtered[0]?.index ?? items[0]?.index ?? 0;
}

export function getReviewFilterCounts(items: { record: AnswerRecord }[]) {
  let incorrect = 0;
  let flagged = 0;

  for (const item of items) {
    if (!item.record.isCorrect) incorrect += 1;
    if (item.record.flagged) flagged += 1;
  }

  return {
    incorrect,
    correct: items.length - incorrect,
    flagged,
    all: items.length,
  };
}

export function getFilteredPosition(
  filteredItems: { index: number }[],
  activeQuestionIndex: number,
) {
  const position = filteredItems.findIndex((item) => item.index === activeQuestionIndex);
  return position >= 0 ? position : 0;
}

export function remapAnswerToFileQuestion(
  fileQuestion: QuizQuestion,
  answer: SubmittedAnswer | undefined,
  sessionOptions?: string[],
): SubmittedAnswer | undefined {
  if (!answer || !sessionOptions?.length) return answer;
  if (fileQuestion.type === "true_false") return answer;

  if (fileQuestion.type === "single_choice" && answer.type === "single_choice") {
    const selectedText = sessionOptions[answer.selectedIndex];
    if (selectedText === undefined) return answer;
    const fileIndex = fileQuestion.options.indexOf(selectedText);
    if (fileIndex < 0) return answer;
    return { type: "single_choice", selectedIndex: fileIndex };
  }

  if (fileQuestion.type === "multiple_choice" && answer.type === "multiple_choice") {
    const fileIndices = answer.selectedIndices
      .map((index) => {
        const selectedText = sessionOptions[index];
        return selectedText !== undefined
          ? fileQuestion.options.indexOf(selectedText)
          : -1;
      })
      .filter((index) => index >= 0)
      .sort((left, right) => left - right);
    return { type: "multiple_choice", selectedIndices: fileIndices };
  }

  return answer;
}

export function isOptionCorrect(question: QuizQuestion, index: number) {
  if (question.type === "single_choice") return question.answerIndex === index;
  if (question.type === "multiple_choice") return question.answerIndices.includes(index);
  return (index === 0) === question.answer;
}

export function isOptionSelected(
  question: QuizQuestion,
  answer: SubmittedAnswer | undefined,
  index: number,
) {
  if (!answer) return false;
  if (question.type === "single_choice" && answer.type === "single_choice") {
    return answer.selectedIndex === index;
  }
  if (question.type === "multiple_choice" && answer.type === "multiple_choice") {
    return answer.selectedIndices.includes(index);
  }
  if (question.type === "true_false" && answer.type === "true_false") {
    return answer.selectedAnswer === (index === 0);
  }
  return false;
}

export function isOptionIncorrectSelection(
  question: QuizQuestion,
  answer: SubmittedAnswer | undefined,
  index: number,
) {
  return isOptionSelected(question, answer, index) && !isOptionCorrect(question, index);
}

function buildQuestionReviewItems(
  questions: QuizQuestion[],
  getRecord: (question: QuizQuestion) => AnswerRecord | undefined,
): QuestionReviewItem[] {
  return questions.flatMap((question, index) => {
    const record = getRecord(question);
    if (!record) return [];
    return [{ question, index, record }];
  });
}

export function buildSessionReviewItems(
  questions: QuizQuestion[],
  answers: AnswerRecord[],
): QuestionReviewItem[] {
  const answerByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));

  return buildQuestionReviewItems(questions, (question) =>
    answerByQuestionId.get(question.id),
  );
}
