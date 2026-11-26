import { CircleHelp } from "lucide-react";
import { useState } from "react";
import { QuizhubHelpDialog } from "@/components/onboarding/QuizhubHelpDialog";
import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { QUIZHUB_DEFAULT_BASE_URL } from "@/lib/quizhub";

export function OnboardingQuizhubStep({
  enabled,
  baseUrl,
  saving,
  onEnabledChange,
  onBaseUrlChange,
  onBaseUrlReset,
}: {
  enabled: boolean;
  baseUrl: string;
  saving: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onBaseUrlChange: (url: string) => void;
  onBaseUrlReset: () => void;
}) {
  const { t } = useI18n();
  const [helpOpen, setHelpOpen] = useState(false);
  const isDefault = baseUrl.trim() === QUIZHUB_DEFAULT_BASE_URL;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
      <div className="flex items-center justify-center gap-2">
        <h2 className="text-xl font-semibold text-zinc-950">{t("onboarding.quizhubTitle")}</h2>
        <IconActionButton
          icon={CircleHelp}
          label={t("onboarding.quizhubHelpLabel")}
          variant="outline"
          onClick={() => setHelpOpen(true)}
        />
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        {t("onboarding.quizhubDescription")}
      </p>

      <div className="mt-5 flex w-full items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 text-left">
        <label htmlFor="onboarding-quizhub-enabled" className="text-sm font-medium text-zinc-900">
          {t("onboarding.quizhubEnable")}
        </label>
        <Switch
          id="onboarding-quizhub-enabled"
          checked={enabled}
          disabled={saving}
          onCheckedChange={onEnabledChange}
          aria-label={t("onboarding.quizhubEnable")}
        />
      </div>

      <div className="mt-4 w-full space-y-2 text-left">
        <label htmlFor="onboarding-quizhub-url" className="block text-sm font-medium text-zinc-800">
          {t("onboarding.quizhubUrlLabel")}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="onboarding-quizhub-url"
            value={baseUrl}
            disabled={saving || !enabled}
            onChange={(event) => onBaseUrlChange(event.target.value)}
            placeholder={QUIZHUB_DEFAULT_BASE_URL}
            className="h-8 min-w-0 flex-1 font-mono text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={saving || !enabled || isDefault}
            onClick={onBaseUrlReset}
          >
            {t("onboarding.quizhubResetUrl")}
          </Button>
        </div>
      </div>

      <QuizhubHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
