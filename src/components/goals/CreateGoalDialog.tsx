import type { ReactNode } from "react";
import { useState } from "react";
import { GoalDetailsFields } from "@/components/goals/GoalDetailsFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGoals } from "@/hooks/useGoals";
import {
  detailsFormToGoalInput,
  type GoalDetailsFormValues,
} from "@/types/goal";
import type { Quiz } from "@/types/quiz";

const DEFAULT_FORM: GoalDetailsFormValues & { quizId: string } = {
  quizId: "",
  description: "",
  targetScore: "",
};

export function CreateGoalDialog({
  quiz,
  availableQuizzes = [],
  open: openProp,
  onOpenChange,
  trigger,
  triggerTooltip,
}: {
  quiz?: Quiz;
  availableQuizzes?: Quiz[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  triggerTooltip?: string;
}) {
  const { addGoal } = useGoals();
  const [openState, setOpenState] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState("");
  const open = openProp ?? openState;
  const selectedQuizId = quiz?.id ?? form.quizId;

  function setOpen(nextOpen: boolean) {
    if (openProp === undefined) setOpenState(nextOpen);
    onOpenChange?.(nextOpen);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setForm(DEFAULT_FORM);
      setValidationError("");
    }
  }

  function handleField(field: keyof typeof DEFAULT_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError("");
  }

  async function handleCreate() {
    const selectedQuiz =
      quiz ?? availableQuizzes.find((candidate) => candidate.id === selectedQuizId);
    if (!selectedQuiz) return;

    const input = detailsFormToGoalInput(form);
    if (
      input.targetScore !== undefined &&
      (!Number.isFinite(input.targetScore) ||
        input.targetScore < 0 ||
        input.targetScore > 100)
    ) {
      setValidationError("Target score must be between 0 and 100.");
      return;
    }

    setIsSaving(true);
    const created = await addGoal({
      quizId: selectedQuiz.id,
      quizTitle: selectedQuiz.title,
      ...input,
    });
    setIsSaving(false);
    if (!created) return;
    setForm(DEFAULT_FORM);
    setValidationError("");
    setOpen(false);
  }

  const triggerContent = trigger && (
    <DialogTrigger asChild>{trigger}</DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {triggerTooltip && triggerContent ? (
        <Tooltip>
          <TooltipTrigger asChild>{triggerContent}</TooltipTrigger>
          <TooltipContent>{triggerTooltip}</TooltipContent>
        </Tooltip>
      ) : (
        triggerContent
      )}

      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New goal</DialogTitle>
          <DialogDescription>
            {quiz ? (
              <>
                Set a goal for <span className="font-medium text-zinc-700">{quiz.title}</span>.
              </>
            ) : (
              "Choose a quiz and set the result you want to achieve."
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
        >
          <div className="space-y-3">
            {!quiz && (
              <div>
                <Label htmlFor="new-goal-quiz">
                  Quiz <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.quizId || undefined}
                  onValueChange={(value) => handleField("quizId", value)}
                  disabled={isSaving}
                >
                  <SelectTrigger id="new-goal-quiz" className="mt-1.5 w-full">
                    <SelectValue placeholder="Select a quiz…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableQuizzes.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <GoalDetailsFields
              idPrefix={quiz ? `quick-goal-${quiz.id}` : "new-goal"}
              values={form}
              onChange={handleField}
              disabled={isSaving}
            />
          </div>

          {validationError && (
            <p className="mt-2 text-xs text-red-600">{validationError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedQuizId || isSaving}>
              {isSaving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
