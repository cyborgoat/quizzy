import { createFileRoute } from "@tanstack/react-router";
import { AttemptReviewPage } from "@/pages/AttemptReviewPage";

export const Route = createFileRoute(
  "/_app/quizzes/$quizId/attempts/$attemptId",
)({
  component: AttemptReviewPage,
});
