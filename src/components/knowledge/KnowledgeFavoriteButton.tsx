import { Star } from "lucide-react";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();

  return (
    <IconActionButton
      icon={Star}
      label={favorite ? t("knowledge.unfavorite") : t("knowledge.favorite")}
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
