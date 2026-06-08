import type { QuizQuestion } from "@/types/quiz";

const TYPE_ORDER: Record<QuizQuestion["type"], number> = {
  single_choice: 0,
  multiple_choice: 1,
  true_false: 2,
};

export const QUESTION_TYPE_LABELS: Record<QuizQuestion["type"], string> = {
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  true_false: "True or false",
};

export function orderQuestionsByType(questions: QuizQuestion[]): QuizQuestion[] {
  return [...questions]
    .map((question, index) => ({ question, index }))
    .sort((left, right) => {
      const typeDiff =
        TYPE_ORDER[left.question.type] - TYPE_ORDER[right.question.type];
      if (typeDiff !== 0) return typeDiff;
      return left.index - right.index;
    })
    .map(({ question }) => question);
}

function shuffleArray<T>(items: T[], random: () => number = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function shuffleQuestionsWithinGroups(
  questions: QuizQuestion[],
  random: () => number = Math.random,
) {
  return groupQuestionsByType(questions).flatMap((group) =>
    shuffleArray(group.questions, random),
  );
}

export function orderQuizQuestions(
  questions: QuizQuestion[],
  shuffle: boolean,
  random: () => number = Math.random,
) {
  if (shuffle) return shuffleQuestionsWithinGroups(questions, random);
  return orderQuestionsByType(questions);
}

export function selectPracticeQuestions(
  questions: QuizQuestion[],
  count: number,
): QuizQuestion[] {
  const total = questions.length;
  if (total === 0) return [];
  const limit = Math.min(count, total);
  if (limit >= total) return [...questions];

  const typeOrder: QuizQuestion["type"][] = [];
  const pools = new Map<QuizQuestion["type"], QuizQuestion[]>();

  for (const question of questions) {
    if (!pools.has(question.type)) {
      pools.set(question.type, []);
      typeOrder.push(question.type);
    }
    pools.get(question.type)!.push(question);
  }

  const selected: QuizQuestion[] = [];
  while (selected.length < limit) {
    let picked = false;
    for (const type of typeOrder) {
      if (selected.length >= limit) break;
      const pool = pools.get(type);
      if (pool && pool.length > 0) {
        selected.push(pool.shift()!);
        picked = true;
      }
    }
    if (!picked) break;
  }

  return selected;
}

export function buildQuizSessionQuestions(
  questions: QuizQuestion[],
  options: {
    mode: "practice" | "scored";
    questionCount?: number;
    shuffle: boolean;
  },
  random: () => number = Math.random,
): QuizQuestion[] {
  const pool =
    options.mode === "practice" && options.questionCount != null
      ? selectPracticeQuestions(questions, options.questionCount)
      : questions;
  return orderQuizQuestions(pool, options.shuffle, random);
}

export type QuestionTypeGroup = {
  type: QuizQuestion["type"];
  questions: QuizQuestion[];
};

export function groupQuestionsByType(
  questions: QuizQuestion[],
): QuestionTypeGroup[] {
  const groups: QuestionTypeGroup[] = [];
  for (const question of orderQuestionsByType(questions)) {
    const last = groups[groups.length - 1];
    if (last?.type === question.type) {
      last.questions.push(question);
      continue;
    }
    groups.push({ type: question.type, questions: [question] });
  }
  return groups;
}
