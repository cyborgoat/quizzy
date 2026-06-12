import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const iconActionButtonClass = "text-zinc-900 hover:bg-zinc-100/60";

type IconActionButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick?: ComponentProps<typeof Button>["onClick"];
  disabled?: boolean;
  variant?: "ghost" | "outline" | "default";
  className?: string;
  tooltipSide?: "bottom" | "top" | "left" | "right";
  showTooltip?: boolean;
  type?: "button" | "submit";
  children?: ReactNode;
} & Omit<ComponentProps<typeof Button>, "children" | "size" | "variant" | "type">;

export function IconActionButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  variant = "ghost",
  className,
  tooltipSide = "bottom",
  showTooltip = true,
  type = "button",
  children,
  ...props
}: IconActionButtonProps) {
  const button = (
    <Button
      type={type}
      size="icon"
      variant={variant}
      className={cn(
        "size-8",
        variant === "ghost" && iconActionButtonClass,
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      {...props}
    >
      {children ?? <Icon className="size-4" />}
    </Button>
  );

  if (!showTooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {button}
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}
