import { ChevronDown, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  mutedCountTextClassName,
  panelHeadingClassName,
} from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const panelClassName = "overflow-hidden rounded-lg border border-zinc-200 bg-white";
const panelHeaderClassName =
  "flex items-center justify-between gap-2 border-b border-zinc-200/55 px-3 py-2";

function PanelTitle({
  icon: Icon,
  title,
  count,
  heading = false,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  count?: number;
  heading?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {Icon && <Icon className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />}
      {heading ? (
        <h2 className={panelHeadingClassName}>{title}</h2>
      ) : (
        <span className={panelHeadingClassName}>{title}</span>
      )}
      {count !== undefined && (
        <span className={mutedCountTextClassName}>({count})</span>
      )}
    </div>
  );
}

export function SectionPanel({
  icon,
  title,
  count,
  headerAction,
  children,
  className,
  headerClassName,
  contentClassName,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  count?: number;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn(panelClassName, className)}>
      <header className={cn(panelHeaderClassName, headerClassName)}>
        <PanelTitle icon={icon} title={title} count={count} heading />
        {headerAction}
      </header>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

export function CollapsibleSectionPanel({
  icon,
  title,
  count,
  headerAction,
  children,
  defaultExpanded = true,
  expanded: expandedProp,
  onExpandedChange,
  className,
  contentClassName,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  count?: number;
  headerAction?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
  contentClassName?: string;
}) {
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const expanded = expandedProp ?? expandedState;

  function handleExpandedChange(nextExpanded: boolean) {
    if (expandedProp === undefined) setExpandedState(nextExpanded);
    onExpandedChange?.(nextExpanded);
  }

  return (
    <section className={cn(panelClassName, className)}>
      <Accordion
        type="single"
        collapsible
        value={expanded ? "content" : ""}
        onValueChange={(value) => handleExpandedChange(value === "content")}
      >
        <AccordionItem value="content">
          <div className="flex items-center gap-2 px-3 py-2">
            <AccordionTrigger className="min-w-0 gap-2 p-0 hover:bg-zinc-50">
              <ChevronDown className="accordion-chevron size-4 shrink-0 text-zinc-500 transition-transform duration-200 motion-reduce:transition-none" />
              <PanelTitle icon={icon} title={title} count={count} />
            </AccordionTrigger>
            {headerAction}
          </div>
          <AccordionContent
            containerClassName="border-t border-zinc-200/55"
            className={cn("p-0", contentClassName)}
          >
            {children}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
