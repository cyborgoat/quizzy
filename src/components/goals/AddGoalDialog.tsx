import { Target } from "lucide-react";
import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog";
import { Button } from "@/components/ui/button";
import type { Quiz } from "@/types/quiz";

export function AddGoalDialog({ quiz }: { quiz: Quiz }) {
  return (
    <CreateGoalDialog
      quiz={quiz}
      triggerTooltip="Add goal"
      trigger={
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-zinc-300 hover:text-zinc-600"
          aria-label={`Add ${quiz.title} to goals`}
        >
          <Target className="size-4" />
        </Button>
      }
    />
  );
}
