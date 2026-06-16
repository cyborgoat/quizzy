import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toggleOutlineButtonClass } from "@/lib/toggleOutlineButtonClass";
import {
  defaultPracticeQuestionCount,
  type QuizSessionMode,
} from "@/types/quizSession";
import type { Quiz } from "@/types/quiz";

export function QuizStartDialog({
  open,
  onOpenChange,
  quiz,
  defaultMode,
  from,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: Quiz;
  defaultMode: QuizSessionMode;
  from?: "home" | "goals";
}) {
  const navigate = useNavigate();
  const totalQuestions = quiz.questions.length;
  const [mode, setMode] = useState<QuizSessionMode>(defaultMode);
  const [questionCount, setQuestionCount] = useState(() =>
    defaultPracticeQuestionCount(totalQuestions),
  );

  function handleBegin() {
    onOpenChange(false);
    navigate({
      to: "/quiz/$quizId",
      params: { quizId: quiz.id },
      search:
        mode === "practice"
          ? { mode: "practice", count: questionCount, from }
          : { mode: "scored", from },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" showClose={false}>
        <DialogHeader>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Start quiz
          </p>
          <DialogTitle className="mt-1">{quiz.title}</DialogTitle>
          <DialogDescription>
            {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} in this quiz
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <p className="text-xs font-medium text-zinc-700">Mode</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ModeOption
              label="Practice"
              description="Choose how many questions to take. Does not count toward goals."
              selected={mode === "practice"}
              onSelect={() => setMode("practice")}
            />
            <ModeOption
              label="Scored"
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
            {totalQuestions !== 1 ? "s" : ""}. Your result will be saved to this
            quiz&apos;s goal, if one exists.
          </p>
        )}

        <DialogFooter className="mt-6 sm:justify-start">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleBegin}>Begin</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      className={cn(
        "rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50",
        toggleOutlineButtonClass(selected),
        selected && "hover:bg-zinc-800 hover:text-white",
      )}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span
        className={cn(
          "mt-1 block text-xs leading-5",
          selected ? "text-zinc-300" : "text-zinc-500",
        )}
      >
        {description}
      </span>
    </button>
  );
}
