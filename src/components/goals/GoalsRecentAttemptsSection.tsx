import { History } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GoalsPanelSection } from "@/components/goals/GoalsPanelSection";
import { RecentAttemptRow } from "@/components/goals/RecentAttemptRow";
import {
  RECENT_ATTEMPTS_INITIAL_COUNT,
  RECENT_ATTEMPTS_LOAD_MORE_COUNT,
  type RecentAttemptEntry,
} from "@/lib/recentAttempts";

export function GoalsRecentAttemptsSection({
  attempts,
}: {
  attempts: RecentAttemptEntry[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(RECENT_ATTEMPTS_INITIAL_COUNT);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const visibleAttempts = attempts.slice(0, visibleCount);
  const hasMore = visibleCount < attempts.length;

  useEffect(() => {
    if (!expanded || !hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCount((count) =>
          Math.min(count + RECENT_ATTEMPTS_LOAD_MORE_COUNT, attempts.length),
        );
      },
      { rootMargin: "120px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [attempts.length, expanded, hasMore]);

  return (
    <GoalsPanelSection
      icon={History}
      title="Recent attempts"
      count={attempts.length}
      collapsible
      expanded={expanded}
      onExpandedChange={setExpanded}
    >
      <ul className="divide-y divide-zinc-100">
        {visibleAttempts.map((entry) => (
          <RecentAttemptRow key={entry.attempt.id} {...entry} />
        ))}
      </ul>
      {hasMore && <div ref={sentinelRef} className="h-px" aria-hidden="true" />}
    </GoalsPanelSection>
  );
}
