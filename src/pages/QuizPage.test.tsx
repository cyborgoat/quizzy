import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuizPage } from "@/pages/QuizPage";

const mocks = vi.hoisted(() => ({
  goals: vi.fn(),
  recordAttempt: vi.fn(),
  review: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/routes/quiz_.$quizId", () => ({ Route: { useParams: () => ({ quizId: "q" }) } }));
vi.mock("@/hooks/useGoals", () => ({ useGoals: mocks.goals }));
vi.mock("@/hooks/useQuizLibrary", () => ({
  useQuizLibrary: () => ({ quizzes: [{ archived: false, quiz: { id: "q", title: "Practice quiz", questions: [] } }], isLoading: false }),
}));
vi.mock("@/hooks/useQuizSession", () => ({
  useQuizSession: () => ({
    isComplete: true, currentQuestionIndex: 0, totalQuestions: 1,
    questions: [{ id: "answer", type: "true_false", prompt: "True?", answer: true, explanation: "Here is why." }],
    answers: [{ questionId: "answer", isCorrect: true, flagged: false, answer: { type: "true_false", selectedAnswer: true } }],
    restart: vi.fn(),
  }),
}));
vi.mock("@/components/goals/QuizReviewView", () => ({
  QuizReviewView: mocks.review,
}));
vi.mock("@/components/goals/CreateGoalDialog", () => ({ CreateGoalDialog: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.goals.mockReturnValue({ goals: [], isLoading: false, recordAttempt: mocks.recordAttempt });
  mocks.review.mockImplementation(({ notification }: { notification?: ReactNode }) => <div>{notification}Answer review</div>);
});

describe("quiz completion", () => {
  it("reviews a completed quiz without requiring a goal and offers to create one", () => {
    const html = renderToStaticMarkup(<QuizPage />);
    expect(html).toContain("Answer review");
    expect(html).toContain("Set a goal");
    expect(html).toContain("save this attempt");
    expect(html).not.toContain("No goal for this quiz");
    const props = mocks.review.mock.calls[0][0];
    expect(props.goalContext).toBeNull();
    expect(props.score).toMatchObject({ score: 1, total: 1, percentage: 100 });
    expect(props.items[0].question.explanation).toBe("Here is why.");
    expect(mocks.recordAttempt).not.toHaveBeenCalled();
  });

  it("keeps the save-and-review flow for a quiz with a goal", () => {
    mocks.goals.mockReturnValue({ goals: [{ id: "goal", quizId: "q" }], isLoading: false, recordAttempt: mocks.recordAttempt });
    const html = renderToStaticMarkup(<QuizPage />);
    expect(html).toContain("Saving attempt and opening review");
    expect(mocks.review).not.toHaveBeenCalled();
  });
});
