import { createFileRoute } from "@tanstack/react-router";
import { LegacyAttemptRedirectPage } from "@/pages/LegacyAttemptRedirectPage";

export const Route = createFileRoute(
  "/_app/goals/$goalId/attempts/$attemptId",
)({
  component: LegacyAttemptRedirectPage,
});
