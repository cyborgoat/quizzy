import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  CollapsibleSectionPanel,
  SectionPanel,
} from "@/components/ui/section-panel";

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
  if (collapsible) {
    return (
      <CollapsibleSectionPanel
        icon={Icon}
        title={title}
        count={count}
        defaultExpanded={defaultExpanded}
        expanded={expandedProp}
        onExpandedChange={onExpandedChange}
        headerAction={headerAction}
      >
        {children}
      </CollapsibleSectionPanel>
    );
  }

  return (
    <SectionPanel icon={Icon} title={title} count={count} headerAction={headerAction}>
      {children}
    </SectionPanel>
  );
}
