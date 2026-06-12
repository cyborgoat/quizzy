import { ChevronDown, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GoalsPanelSection({
  icon: Icon,
  title,
  count,
  children,
  collapsible = false,
  defaultExpanded = true,
  expanded: expandedProp,
  onExpandedChange,
  headerAction,
}: {
  icon: LucideIcon;
  title: string;
  count?: number;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  headerAction?: ReactNode;
}) {
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const expanded = expandedProp ?? expandedState;

  function setExpanded(next: boolean) {
    setExpandedState(next);
    onExpandedChange?.(next);
  }

  const titleContent = (
    <>
      <Icon className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
      <span className="text-sm font-semibold text-zinc-950">{title}</span>
      {count !== undefined && (
        <span className="text-xs text-zinc-500">({count})</span>
      )}
    </>
  );

  if (collapsible) {
    return (
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2",
            expanded && "border-b border-zinc-200/55",
          )}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 text-left transition-colors hover:bg-zinc-50"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-zinc-500 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
            {titleContent}
          </button>
          {headerAction}
        </div>
        {expanded && children}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <header className="flex items-center justify-between gap-2 border-b border-zinc-200/55 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">{titleContent}</div>
        {headerAction}
      </header>
      {children}
    </section>
  );
}
