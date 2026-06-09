import { cn } from "@/lib/utils";

export type PageShellWidth = "wide" | "narrow" | "quiz";

const widthClass: Record<PageShellWidth, string> = {
  wide: "max-w-[min(100%,var(--app-content-max-wide))]",
  narrow: "max-w-[min(100%,var(--app-content-max-narrow))]",
  quiz: "max-w-[min(100%,var(--app-content-max-quiz))]",
};

const paddingClass =
  "px-[var(--app-page-px)] sm:px-[calc(var(--app-page-px)*1.25)] lg:px-[calc(var(--app-page-px)*1.5)]";

/** Inner width + horizontal padding for quiz header/footer and in-session content. */
export const quizChromeInnerClass = cn(
  "mx-auto w-full",
  paddingClass,
  widthClass.quiz,
);

export const pageShellPaddingClass = paddingClass;

export const pageShellWidthClass = widthClass;
