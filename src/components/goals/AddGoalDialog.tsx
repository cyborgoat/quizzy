import { Target } from "lucide-react";
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

const DEFAULT_FORM: GoalDetailsFormValues = {
  description: "",
  targetScore: "",
};

export function AddGoalDialog({ quiz }: { quiz: Quiz }) {
  const { addGoal } = useGoals();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setForm(DEFAULT_FORM);
      setValidationError("");
    }
  }

  function handleField(field: keyof GoalDetailsFormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError("");
  }

  async function handleCreate() {
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
      quizId: quiz.id,
      quizTitle: quiz.title,
      ...input,
    });
    setIsSaving(false);
    if (!created) return;
    setForm(DEFAULT_FORM);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-zinc-300 hover:text-zinc-600"
              aria-label={`Add ${quiz.title} to goals`}
            >
              <Target className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add goal</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New goal</DialogTitle>
          <DialogDescription>
            Set a goal for <span className="font-medium text-zinc-700">{quiz.title}</span>.
          </DialogDescription>
        </DialogHeader>

        <GoalDetailsFields
          idPrefix={`quick-goal-${quiz.id}`}
          values={form}
          onChange={handleField}
          disabled={isSaving}
        />
        {validationError && (
          <p className="mt-2 text-xs text-red-600">{validationError}</p>
        )}

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreate()} disabled={isSaving}>
            {isSaving ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
