import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function OnboardingDirectoryStep({
  directoryPath,
  isPicking,
  onChooseDirectory,
}: {
  directoryPath: string | null;
  isPicking: boolean;
  onChooseDirectory: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
      <h2 className="text-xl font-semibold text-zinc-950">{t("onboarding.directoryTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        {t("onboarding.directoryDescription")}
      </p>

      {directoryPath ? (
        <div className="mt-5 w-full space-y-3">
          <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-left">
            <p className="text-xs font-medium text-zinc-500">{t("onboarding.directorySelected")}</p>
            <p className="mt-1 break-all font-mono text-xs text-zinc-800">{directoryPath}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isPicking}
            onClick={onChooseDirectory}
          >
            <FolderOpen className="size-3.5" />
            {isPicking ? t("home.choosingDirectory") : t("onboarding.directoryChange")}
          </Button>
        </div>
      ) : (
        <Button className="mt-5" disabled={isPicking} onClick={onChooseDirectory}>
          <FolderOpen className="size-4" />
          {isPicking ? t("home.choosingDirectory") : t("home.chooseDirectory")}
        </Button>
      )}
    </div>
  );
}
