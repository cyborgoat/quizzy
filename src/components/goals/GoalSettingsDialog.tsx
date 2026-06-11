import { confirm } from "@tauri-apps/plugin-dialog";
import { CheckCircle2, Trash2 } from "lucide-react";
import { useState } from "react";
import { GoalDetailsFields } from "@/components/goals/GoalDetailsFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { useGoals } from "@/hooks/useGoals";
import {
  anyAttemptMetTarget,
  detailsFormToGoalInput,
  goalToDetailsForm,
  type Goal,
  type GoalDetailsFormValues,
} from "@/types/goal";

export function GoalSettingsDialog({
  goal,
  open,
  onOpenChange,
}: {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateGoal, completeGoal, deleteGoal } = useGoals();
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

  async function handleComplete() {
    if (!anyAttemptMetTarget(goal)) {
      const ok = await confirm(
        `You haven't had any attempt that achieved the target score of ${goal.targetScore}%. Mark this goal as complete anyway?`,
        { title: "Target score not reached", kind: "warning" },
      );
      if (!ok) return;
    }
    setIsSaving(true);
    await completeGoal(goal.id);
    setIsSaving(false);
    onOpenChange(false);
  }

  async function handleDelete() {
    const ok = await confirm(
      `Delete the goal for "${goal.quizTitle}"? This cannot be undone.`,
      { title: "Delete goal?", kind: "warning" },
    );
    if (!ok) return;
    setIsSaving(true);
    await deleteGoal(goal.id);
    setIsSaving(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Goal settings</DialogTitle>
          <DialogDescription>
            Update details or change the status of{" "}
            <span className="font-medium text-zinc-700">{goal.quizTitle}</span>.
          </DialogDescription>
        </DialogHeader>

        <GoalDetailsFields
          idPrefix={`goal-settings-${goal.id}`}
          values={form}
          onChange={handleField}
          disabled={isSaving}
        />
        {validationError && (
          <p className="mt-2 text-xs text-red-600">{validationError}</p>
        )}

        <div className="mt-6 flex items-center gap-2 border-t border-zinc-100 pt-4">
          <div className="flex items-center gap-1">
            <IconActionButton
              icon={Trash2}
              label="Delete"
              className="text-zinc-500 hover:text-red-700"
              disabled={isSaving}
              onClick={() => void handleDelete()}
            />
            {!goal.completed && (
              <IconActionButton
                icon={CheckCircle2}
                label="Complete"
                variant="outline"
                disabled={isSaving}
                onClick={() => void handleComplete()}
              />
            )}
          </div>
          <Button
            type="button"
            className="ml-auto"
            disabled={isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
