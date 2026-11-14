import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RootLayout } from "@/components/layout/RootLayout";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";

vi.mock("@/hooks/useQuizLibrary", () => ({ useQuizLibrary: () => ({ quizzes: [] }) }));
vi.mock("@/hooks/useGoals", () => ({ useGoals: () => ({ goals: [] }) }));
vi.mock("@tanstack/react-router", () => ({
  Outlet: () => <StandaloneQuizReview />,
}));

function StandaloneQuizReview() {
  const { openQuizStart } = useQuizStartDialog();
  return <button onClick={() => openQuizStart({ quizId: "quiz" })}>Retake quiz</button>;
}

describe("root route providers", () => {
  it("provides the start dialog to routes outside AppLayout, including quiz review", () => {
    expect(renderToStaticMarkup(<RootLayout />)).toContain("Retake quiz");
  });
});
