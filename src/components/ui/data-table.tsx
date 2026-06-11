import { type Column } from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const dataTableHeadClass = "h-auto px-3 py-2 text-left align-middle";
export const dataTableCellClass = "px-3 py-2 text-left align-middle";
export const dataTableFixedLayoutClass = "table-fixed w-full min-w-0";
export const dataTableFixedCellClass = "max-w-0 overflow-hidden";

const headerTextClass = "text-xs font-medium text-zinc-600";
const sortButtonClass =
  "h-auto w-full justify-start gap-1 rounded-none p-0 text-left text-xs font-medium text-zinc-600 hover:bg-transparent hover:text-zinc-950";

export const dataTableCellTextClass =
  "block min-w-0 text-left text-xs leading-normal text-zinc-950";
export const dataTableCellNumericClass =
  "block text-left text-xs font-medium leading-normal tabular-nums text-zinc-950";
export const dataTableCellMutedClass =
  "block min-w-0 text-left text-xs leading-normal tabular-nums text-zinc-600";

export function DataTableColumnHeader({ label }: { label: string }) {
  return <span className={headerTextClass}>{label}</span>;
}

export function DataTableColumnFilterHeader({
  label,
  filterValue,
  menuLabel,
  options,
  onFilterChange,
}: {
  label: string;
  filterValue: string;
  menuLabel: string;
  options: { value: string; label: string }[];
  onFilterChange: (value: string) => void;
}) {
  const isFiltered = filterValue !== "all";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            sortButtonClass,
            isFiltered && "text-zinc-950",
          )}
        >
          {label}
          <ChevronDown className="size-3 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
        <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={filterValue} onValueChange={onFilterChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DataTableSearchHeader({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Search className="size-3 shrink-0 text-zinc-400" aria-hidden="true" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-6 min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      />
    </div>
  );
}

export function DataTableSortableHeader<T>({
  label,
  column,
}: {
  label: string;
  column: Column<T, unknown>;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={sortButtonClass}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="size-3 shrink-0 opacity-60" />
    </Button>
  );
}

export function DataTableNumericCell({
  value,
  mutedWhenZero = false,
}: {
  value: number;
  mutedWhenZero?: boolean;
}) {
  return (
    <span
      className={cn(
        dataTableCellNumericClass,
        mutedWhenZero && value === 0 && "text-zinc-400",
      )}
    >
      {value}
    </span>
  );
}

export function DataTableTruncatedCell({
  value,
  variant = "text",
  showTooltip = true,
}: {
  value: string;
  variant?: "text" | "muted";
  showTooltip?: boolean;
}) {
  const className =
    variant === "muted" ? dataTableCellMutedClass : cn(dataTableCellTextClass, "font-medium");

  if (!showTooltip || !value || value === "—") {
    return <span className={cn(className, "truncate")}>{value}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(className, "truncate")}>{value}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm whitespace-normal break-words">
        {value}
      </TooltipContent>
    </Tooltip>
  );
}
