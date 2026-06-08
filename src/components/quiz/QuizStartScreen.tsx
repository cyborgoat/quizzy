import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  defaultPracticeQuestionCount,
  type QuizSessionMode,
} from "@/types/quizSession";
import type { Quiz } from "@/types/quiz";

export function QuizStartScreen({
  quiz,
  defaultMode,
}: {
  quiz: Quiz;
  defaultMode: QuizSessionMode;
}) {
  const navigate = useNavigate();
  const totalQuestions = quiz.questions.length;
  const [mode, setMode] = useState<QuizSessionMode>(defaultMode);
  const [questionCount, setQuestionCount] = useState(() =>
    defaultPracticeQuestionCount(totalQuestions),
  );

  function handleBegin() {
    navigate({
      to: "/quiz/$quizId",
      params: { quizId: quiz.id },
      search:
        mode === "practice"
          ? { mode: "practice", count: questionCount }
          : { mode: "scored" },
      replace: true,
    });
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Start quiz
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-zinc-950">
          {quiz.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} in this quiz
        </p>

        <div className="mt-6">
          <p className="text-xs font-medium text-zinc-700">Mode</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ModeOption
              label="Practice"
              description="Choose how many questions to take. Does not count toward goals."
              selected={mode === "practice"}
              onSelect={() => setMode("practice")}
            />
            <ModeOption
              label="Scored attempt"
              description="All questions. Counts toward your goals."
              selected={mode === "scored"}
              onSelect={() => setMode("scored")}
            />
          </div>
        </div>

        {mode === "practice" && totalQuestions > 1 && (
          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium text-zinc-700">Questions</p>
              <p className="text-sm font-semibold tabular-nums text-zinc-950">
                {questionCount} of {totalQuestions}
              </p>
            </div>
            <Slider
              className="mt-3"
              value={[questionCount]}
              min={1}
              max={totalQuestions}
              step={1}
              onValueChange={(value) => setQuestionCount(value[0] ?? 1)}
              aria-label="Number of practice questions"
            />
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Includes a mix of question types when possible, then applies your
              shuffle setting.
            </p>
          </div>
        )}

        {mode === "scored" && (
          <p className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs leading-5 text-zinc-600">
            You will answer all {totalQuestions} question
            {totalQuestions !== 1 ? "s" : ""}. Your result will be saved to any
            matching goals.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={handleBegin}>Begin</Button>
          <Button variant="outline" onClick={() => navigate({ to: "/" })}>
            Cancel
          </Button>
        </div>
      </div>
    </main>
  );
}

function ModeOption({
  label,
  description,
  selected,
  onSelect,
}: {
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
      }`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span
        className={`mt-1 block text-xs leading-5 ${
          selected ? "text-zinc-300" : "text-zinc-500"
        }`}
      >
        {description}
      </span>
    </button>
  );
}
