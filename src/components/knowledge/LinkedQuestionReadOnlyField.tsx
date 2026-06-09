import { useMemo } from "react";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { formatQuizQuestionLabel } from "@/lib/linkedQuestionLabel";
import type { LinkedQuizQuestion } from "@/types/knowledge";

export function LinkedQuestionReadOnlyField({
  link,
  placeholder = "Linked to the question you are reviewing",
}: {
  link: LinkedQuizQuestion;
  placeholder?: string;
}) {
  const { quizzes } = useQuizLibrary();
  const label = useMemo(
    () => formatQuizQuestionLabel(link, quizzes),
    [link, quizzes],
  );

  return (
    <input
      readOnly
      tabIndex={-1}
      value={label}
      placeholder={placeholder}
      aria-readonly="true"
      className="mt-2 w-full max-w-full cursor-default border-0 border-b border-zinc-200 bg-transparent px-0 text-sm text-zinc-600 shadow-none outline-none placeholder:text-zinc-400"
    />
  );
}
