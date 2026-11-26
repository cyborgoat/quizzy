import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function QuizhubHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("onboarding.quizhubHelpTitle")}</DialogTitle>
          <DialogDescription className="text-sm leading-6">
            {t("onboarding.quizhubHelpBody")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            {t("onboarding.quizhubHelpClose")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
