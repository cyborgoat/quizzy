import type { QuizQuestion, SubmittedAnswer } from "@/types/quiz";

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
