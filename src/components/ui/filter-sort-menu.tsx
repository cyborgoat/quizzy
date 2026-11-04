import { Fragment } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FilterMenuSection = {
  label: string;
  value: string;
  options: { value: string; label: string; group?: string }[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

export function FilterSortMenu({
  sections,
  toggles = [],
  active = false,
  label = "Filter and sort",
}: {
  sections: FilterMenuSection[];
  toggles?: {
    label: string;
    checked: boolean;
    onCheckedChange: (value: boolean) => void;
  }[];
  active?: boolean;
  label?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "size-9 shrink-0",
            active && "bg-zinc-100 text-zinc-950",
          )}
          aria-label={label}
          title={label}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {sections.map((section) => (
          <DropdownMenuSub key={section.label}>
            <DropdownMenuSubTrigger disabled={section.disabled}>
              <span className="min-w-0 truncate">
                {section.label}:{" "}
                {section.options.find(
                  (option) => option.value === section.value,
                )?.label ?? section.value}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))] w-56 overflow-y-auto">
                <DropdownMenuRadioGroup
                  value={section.value}
                  onValueChange={section.onValueChange}
                >
                  {section.options.map((option, index) => (
                    <Fragment key={option.value}>
                      {option.group &&
                        option.group !== section.options[index - 1]?.group && (
                          <>
                            {index > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel>
                              {option.group}
                            </DropdownMenuLabel>
                          </>
                        )}
                      <DropdownMenuRadioItem
                        value={option.value}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {option.label}
                      </DropdownMenuRadioItem>
                    </Fragment>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        ))}
        {toggles.length > 0 && <DropdownMenuSeparator />}
        {toggles.map((toggle) => (
          <DropdownMenuCheckboxItem
            key={toggle.label}
            className="pl-2 pr-8 [&>span]:left-auto [&>span]:right-2"
            checked={toggle.checked}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(value) => toggle.onCheckedChange(value === true)}
          >
            {toggle.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
