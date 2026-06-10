import { type Column } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dataTableHeadClass = "h-auto px-3 py-2 text-left align-middle";
export const dataTableCellClass = "px-3 py-2 text-left align-middle";

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
