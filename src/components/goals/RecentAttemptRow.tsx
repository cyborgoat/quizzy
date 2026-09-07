import type { MouseEvent } from "react";
import { GoalAttemptRow } from "@/components/goals/GoalAttemptRow";
import type { RecentAttemptEntry } from "@/lib/recentAttempts";

export function RecentAttemptRow({
  onDelete,
  ...entry
}: RecentAttemptEntry & { onDelete?: (event: MouseEvent) => void }) {
  return (
    <li>
      <GoalAttemptRow {...entry} onDelete={onDelete} />
    </li>
  );
}
