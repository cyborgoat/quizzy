import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

export function QuizhubSourceUrlDialog({
  open,
  onOpenChange,
  initialUrl,
  defaultUrl,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl: string;
  defaultUrl: string;
  saving: boolean;
  onSave: (url: string) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(initialUrl);

  useEffect(() => {
    if (open) setDraft(initialUrl);
  }, [open, initialUrl]);

  const trimmed = draft.trim();
  const isDefault = !trimmed || trimmed === defaultUrl.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (saving) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent showClose={!saving}>
        <DialogHeader>
          <DialogTitle>{t("hub.changeSourceUrlTitle")}</DialogTitle>
          <DialogDescription>{t("hub.changeSourceUrlDescription")}</DialogDescription>
        </DialogHeader>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={draft}
            disabled={saving}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !saving) {
                event.preventDefault();
                void onSave(trimmed);
              }
            }}
            aria-label={t("settings.quizhub.sourceUrlAria")}
            placeholder={defaultUrl}
            className="h-8 min-w-0 flex-1 font-mono text-xs"
            autoFocus
          />
          <Button
            size="sm"
            variant="outline"
            disabled={saving || isDefault}
            onClick={() => setDraft(defaultUrl)}
          >
            {t("common.reset")}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={saving} onClick={() => void onSave(trimmed)}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
