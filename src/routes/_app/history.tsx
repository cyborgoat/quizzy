import { createFileRoute } from "@tanstack/react-router";
import { AttemptHistoryPage } from "@/pages/AttemptHistoryPage";

export const Route = createFileRoute("/_app/history")({
  component: AttemptHistoryPage,
});
