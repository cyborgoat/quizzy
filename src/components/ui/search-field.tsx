import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchField({
  value,
  onChange,
  placeholder,
  label = placeholder,
  disabled = false,
  pending = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  disabled?: boolean;
  pending?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 transition-opacity motion-reduce:transition-none",
        pending && "opacity-70",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        disabled={disabled}
        className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
