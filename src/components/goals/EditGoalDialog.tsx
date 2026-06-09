import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import { GoalDetailsFields } from "@/components/goals/GoalDetailsFields";
import { Button } from "@/components/ui/button";
import { useGoals } from "@/hooks/useGoals";
import {
  detailsFormToGoalInput,
  goalToDetailsForm,
  type Goal,
  type GoalDetailsFormValues,
} from "@/types/goal";

export function EditGoalDialog({
  goal,
  open,
  onOpenChange,
}: {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateGoal } = useGoals();
  const [form, setForm] = useState<GoalDetailsFormValues>(() =>
    goalToDetailsForm(goal),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving) return;
    if (!nextOpen) {
      setForm(goalToDetailsForm(goal));
      setValidationError("");
    }
    onOpenChange(nextOpen);
  }

  function handleField(field: keyof GoalDetailsFormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "targetScore") setValidationError("");
  }

  async function handleSave() {
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
    const updated = await updateGoal(goal.id, input);
    setIsSaving(false);
    if (!updated) return;
    setValidationError("");
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-zinc-950/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl focus:outline-none">
          <Dialog.Title className="text-xl font-semibold text-zinc-950">
            Edit goal
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-zinc-500">
            Update the goal for{" "}
            <span className="font-medium text-zinc-700">{goal.quizTitle}</span>.
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
              idPrefix={`quick-edit-goal-${goal.id}`}
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
              <Button variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
