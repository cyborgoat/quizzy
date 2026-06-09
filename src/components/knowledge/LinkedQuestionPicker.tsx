import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { formatQuizQuestionLabel } from "@/lib/linkedQuestionLabel";
import { getLinkWarnings, linkWarningKey } from "@/lib/knowledgeValidation";
import type { LinkedQuizQuestion } from "@/types/knowledge";

export function LinkedQuestionPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: LinkedQuizQuestion[];
  onChange: (links: LinkedQuizQuestion[]) => void;
  disabled?: boolean;
}) {
  const { quizzes } = useQuizLibrary();
  const [search, setSearch] = useState("");

  const warnings = useMemo(
    () => getLinkWarnings({ linkedQuizQuestions: value }, quizzes),
    [value, quizzes],
  );
  const warningKeys = new Set(warnings.map(linkWarningKey));

  const selectedKeys = new Set(
    value.map((link) => `${link.quizId}:${link.questionId}`),
  );

  const options = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return [];

    const entries: Array<{
      quizId: string;
      quizTitle: string;
      questionId: string;
      questionNumber: number;
      prompt: string;
    }> = [];

    for (const source of quizzes) {
      source.quiz.questions.forEach((question, index) => {
        const prompt = question.prompt.replace(/\s+/g, " ").trim();
        const questionNumber = index + 1;
        const haystack =
          `${source.quiz.title} q${questionNumber} ${question.id} ${prompt}`.toLowerCase();
        if (!haystack.includes(normalized)) return;
        entries.push({
          quizId: source.quiz.id,
          quizTitle: source.quiz.title,
          questionId: question.id,
          questionNumber,
          prompt,
        });
      });
    }

    return entries.slice(0, 8);
  }, [quizzes, search]);

  const showSuggestions = search.trim().length > 0;

  function removeLink(link: LinkedQuizQuestion) {
    onChange(
      value.filter(
        (entry) =>
          !(entry.quizId === link.quizId && entry.questionId === link.questionId),
      ),
    );
  }

  function addLink(link: LinkedQuizQuestion) {
    const key = `${link.quizId}:${link.questionId}`;
    if (selectedKeys.has(key)) return;
    onChange([...value, link]);
    setSearch("");
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((link) => {
            const hasWarning = warningKeys.has(`${link.quizId}:${link.questionId}`);
            return (
              <Badge
                key={`${link.quizId}:${link.questionId}`}
                className={`gap-1 pr-1 ${hasWarning ? "border-amber-300 bg-amber-50 text-amber-900" : ""}`}
              >
                <span className="max-w-[16rem] truncate">
                  {formatQuizQuestionLabel(link, quizzes)}
                </span>
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-zinc-200/80"
                  onClick={() => removeLink(link)}
                  disabled={disabled}
                  aria-label="Remove linked question"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search quizzes and questions to link"
          className="h-9 pl-9"
          disabled={disabled}
        />

        {showSuggestions && (
          <ul className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-sm">
            {options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-zinc-500">No matching questions.</li>
            ) : (
              options.map((option) => {
                const key = `${option.quizId}:${option.questionId}`;
                const isSelected = selectedKeys.has(key);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 disabled:opacity-50"
                      onClick={() =>
                        addLink({
                          quizId: option.quizId,
                          questionId: option.questionId,
                        })
                      }
                      disabled={disabled || isSelected}
                    >
                      <span className="font-medium text-zinc-950">
                        {option.quizTitle} · Q{option.questionNumber}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-zinc-500">
                        {option.prompt}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {warnings.length > 0 && (
        <p className="text-xs text-amber-700">
          {warnings.length} linked question{warnings.length === 1 ? "" : "s"} could not be found in
          the current quiz library.
        </p>
      )}
    </div>
  );
}
