import type { MessageKey } from "@/lib/i18n-messages";
import type { QuizProgressStatus } from "@/lib/quizProgress";

export type QuizDisplayStatus = QuizProgressStatus | "archived";

export const statusStyles: Record<QuizDisplayStatus, { labelKey: MessageKey; className: string }> = {
  "not-started": {
    labelKey: "home.status.not-started",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600",
  },
  "in-progress": {
    labelKey: "home.status.in-progress",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  "target-reached": {
    labelKey: "home.status.target-reached",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  archived: {
    labelKey: "home.status.archived",
    className: "border-zinc-300 bg-zinc-100 text-zinc-700",
  },
};
