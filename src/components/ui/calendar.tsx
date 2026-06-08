import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames, type DayButton } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "size-8 p-0 font-normal aria-selected:opacity-100",
        "data-[selected-single=true]:bg-zinc-900 data-[selected-single=true]:text-white",
        "data-[range-middle=true]:bg-zinc-100 data-[range-middle=true]:text-zinc-900",
        "data-[range-start=true]:bg-zinc-900 data-[range-start=true]:text-white",
        "data-[range-end=true]:bg-zinc-900 data-[range-end=true]:text-white",
        className,
      )}
      {...props}
    />
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn("p-3", className)}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", defaultClassNames.nav),
        button_previous: cn(
          "inline-flex size-8 items-center justify-center rounded-md hover:bg-zinc-100",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "inline-flex size-8 items-center justify-center rounded-md hover:bg-zinc-100",
          defaultClassNames.button_next,
        ),
        month_caption: cn("flex h-8 w-full items-center justify-center px-8", defaultClassNames.month_caption),
        dropdowns: cn("flex items-center gap-2 text-sm font-medium", defaultClassNames.dropdowns),
        dropdown_root: cn("relative", defaultClassNames.dropdown_root),
        dropdown: cn("absolute z-10 rounded-md border border-zinc-200 bg-white p-1 shadow-md", defaultClassNames.dropdown),
        caption_label: cn("text-sm font-medium", defaultClassNames.caption_label),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn("w-8 rounded-md text-[0.8rem] font-normal text-zinc-500", defaultClassNames.weekday),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        day: cn("relative size-8 p-0 text-center text-sm", defaultClassNames.day),
        today: cn("bg-zinc-100 text-zinc-900", defaultClassNames.today),
        outside: cn("text-zinc-400 opacity-50", defaultClassNames.outside),
        disabled: cn("text-zinc-400 opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
