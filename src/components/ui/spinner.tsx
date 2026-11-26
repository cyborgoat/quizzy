import type { ComponentProps } from "react";
import { LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

function Spinner({ className, ...props }: ComponentProps<"svg">) {
  const { t } = useI18n();

  return (
    <LoaderIcon
      role="status"
      aria-label={t("ui.loading")}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
