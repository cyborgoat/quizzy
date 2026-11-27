import { Search } from "lucide-react";
import type {
  FocusEventHandler,
  KeyboardEventHandler,
  Ref,
} from "react";
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
  inputRef,
  id,
  role,
  autoComplete,
  onKeyDown,
  onFocus,
  onBlur,
  "aria-expanded": ariaExpanded,
  "aria-controls": ariaControls,
  "aria-activedescendant": ariaActivedescendant,
  "aria-autocomplete": ariaAutocomplete,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  disabled?: boolean;
  pending?: boolean;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  id?: string;
  role?: string;
  autoComplete?: string;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-activedescendant"?: string;
  "aria-autocomplete"?: "list" | "none" | "inline" | "both";
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
        ref={inputRef}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-label={label}
        disabled={disabled}
        autoComplete={autoComplete}
        role={role}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-activedescendant={ariaActivedescendant}
        aria-autocomplete={ariaAutocomplete}
        className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
