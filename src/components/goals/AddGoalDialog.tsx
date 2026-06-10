import * as Dialog from "@radix-ui/react-dialog";
import { Target, X } from "lucide-react";
import { useState } from "react";
import { GoalDetailsFields } from "@/components/goals/GoalDetailsFields";
import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/ui/icon-action-button";
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
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Dialog.Trigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-zinc-300 hover:text-zinc-600"
              aria-label={`Add ${quiz.title} to goals`}
            >
              <Target className="size-4" />
            </Button>
          </Dialog.Trigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to goal</p>
        </TooltipContent>
      </Tooltip>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-zinc-950/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl focus:outline-none">
          <Dialog.Title className="text-xl font-semibold text-zinc-950">
            Add to goal
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-zinc-500">
            Set a goal for <span className="font-medium text-zinc-700">{quiz.title}</span>.
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-4 top-4 text-zinc-500"
              aria-label="Close"
              disabled={isSaving}
            >
              <X className="size-4" />
            </Button>
          </Dialog.Close>

          <div className="mt-5">
            <GoalDetailsFields
              idPrefix={`quick-goal-${quiz.id}`}
              values={form}
              onChange={handleField}
              disabled={isSaving}
            />
            {validationError && (
              <p className="mt-2 text-xs text-red-600">{validationError}</p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <IconActionButton icon={X} label="Cancel" variant="outline" disabled={isSaving} />
            </Dialog.Close>
            <Button onClick={() => void handleCreate()} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create goal"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
