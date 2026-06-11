import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function SettingsSwitchRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
  divider = false,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  divider?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3",
        divider && "border-t border-zinc-200 pt-3",
      )}
    >
      <div className="min-w-0">
        <p id={id} className="text-sm font-medium text-zinc-700">
          {label}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={id}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}
