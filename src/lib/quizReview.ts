import type { QuestionReviewItem } from "@/types/review";
import type { AnswerRecord, QuizQuestion, SubmittedAnswer } from "@/types/quiz";

export type ReviewFilter = "incorrect" | "correct" | "flagged" | "all";

export function matchesReviewFilter(record: AnswerRecord, filter: ReviewFilter) {
  if (filter === "correct") return record.isCorrect;
  if (filter === "incorrect") return !record.isCorrect;
  if (filter === "flagged") return record.flagged;
  return true;
}

export function defaultReviewFilter(items: { record: AnswerRecord }[]) {
  return items.some((item) => !item.record.isCorrect) ? "incorrect" : "all";
}

export function initialReviewQuestionIndex(
  items: { index: number; record: AnswerRecord }[],
  filter: ReviewFilter = defaultReviewFilter(items),
) {
  const filtered = items.filter((item) => matchesReviewFilter(item.record, filter));
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
