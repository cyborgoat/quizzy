import { createFileRoute } from "@tanstack/react-router";
import { AttemptReviewPage } from "@/pages/AttemptReviewPage";

export const Route = createFileRoute(
  "/_app/goals/$goalId/attempts/$attemptId",
)({
  component: AttemptReviewPage,
});
