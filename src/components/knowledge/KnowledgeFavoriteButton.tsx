import { Star } from "lucide-react";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { cn } from "@/lib/utils";

export function KnowledgeFavoriteButton({
  favorite,
  onToggle,
  disabled = false,
  className,
  showTooltip = false,
}: {
  favorite: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
  showTooltip?: boolean;
}) {
  return (
    <IconActionButton
      icon={Star}
      label={favorite ? "Unfavorite" : "Favorite"}
      variant="ghost"
      showTooltip={showTooltip}
      className={cn(
        "size-7 shrink-0 text-zinc-400 hover:bg-zinc-100/60 hover:text-zinc-700",
        favorite && "text-amber-500 hover:text-amber-600",
        className,
      )}
      aria-pressed={favorite}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      <Star className={cn("size-4", favorite && "fill-current")} />
    </IconActionButton>
  );
}
