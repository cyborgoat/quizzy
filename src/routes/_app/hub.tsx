import { createFileRoute } from "@tanstack/react-router";
import { QuizhubPage } from "@/pages/QuizhubPage";

export const Route = createFileRoute("/_app/hub")({
  component: QuizhubPage,
});
