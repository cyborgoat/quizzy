import { isAnswerCorrect } from "@/lib/scoring";
import type {
  AnswerRecord,
  Quiz,
  QuestionAttempt,
  SubmittedAnswer,
} from "@/types/quiz";

export type QuizSessionState = {
  currentQuestionIndex: number;
  attempts: Record<string, QuestionAttempt>;
  answers: AnswerRecord[];
  isComplete: boolean;
};

export type QuizSessionAction =
  | { type: "go_to_question"; index: number; totalQuestions: number }
  | { type: "set_answer"; questionId: string; answer?: SubmittedAnswer }
  | { type: "toggle_flag"; questionId: string }
  | { type: "submit_quiz"; quiz: Quiz }
  | { type: "restart" };

export const initialQuizSessionState: QuizSessionState = {
  currentQuestionIndex: 0,
  attempts: {},
  answers: [],
  isComplete: false,
};

function getAttempt(
  attempts: Record<string, QuestionAttempt>,
  questionId: string,
): QuestionAttempt {
  return attempts[questionId] ?? { questionId, flagged: false };
}

export function quizSessionReducer(
  state: QuizSessionState,
  action: QuizSessionAction,
): QuizSessionState {
  if (state.isComplete && action.type !== "restart") return state;

  switch (action.type) {
    case "go_to_question":
      return {
        ...state,
        currentQuestionIndex: Math.min(
          Math.max(action.index, 0),
          action.totalQuestions - 1,
        ),
      };
    case "set_answer": {
      const current = getAttempt(state.attempts, action.questionId);
      return {
        ...state,
        attempts: {
          ...state.attempts,
          [action.questionId]: {
            ...current,
            answer: action.answer,
          },
        },
      };
    }
    case "toggle_flag": {
      const current = getAttempt(state.attempts, action.questionId);
      return {
        ...state,
        attempts: {
          ...state.attempts,
          [action.questionId]: {
            ...current,
            flagged: !current.flagged,
          },
        },
      };
    }
    case "submit_quiz":
      return {
        ...state,
        isComplete: true,
        answers: action.quiz.questions.map((question) => {
          const attempt = getAttempt(state.attempts, question.id);
          return {
            questionId: question.id,
            answer: attempt.answer,
            flagged: attempt.flagged,
            isCorrect: attempt.answer
              ? isAnswerCorrect(question, attempt.answer)
              : false,
          };
        }),
      };
    case "restart":
      return initialQuizSessionState;
  }
}
