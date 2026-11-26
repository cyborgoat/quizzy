import { Copy, FileUp, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { MarkdownContent } from "@/components/quiz/MarkdownContent";
import { ResizableDialogShell } from "@/components/ui/resizable-dialog-shell";
import { Button } from "@/components/ui/button";
import { useAppLocale } from "@/hooks/useAppLocale";
import { copyTextToClipboard } from "@/lib/clipboard";
import { AI_PROMPT_TEMPLATE, getImportHelpMarkdown } from "@/lib/importHelpContent";
import { errorMessage } from "@/lib/native";
import { useI18n } from "@/lib/i18n";

export function ImportHelpDialog({
  open,
  onOpenChange,
  canUseLibrary,
  onImport,
  onOpenFolder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canUseLibrary: boolean;
  onImport: () => void;
  onOpenFolder: () => void;
}) {
  const { t } = useI18n();
  const { locale } = useAppLocale();
  const guide = getImportHelpMarkdown(locale);

  async function copyPrompt() {
    try {
      await copyTextToClipboard(AI_PROMPT_TEMPLATE);
      toast.success(t("import.ai.copied"));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <ResizableDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("import.title")}
      description={t("import.description")}
      footer={
        <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
          {t("common.close")}
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" disabled={!canUseLibrary} onClick={onImport}>
          <FileUp className="size-4" />
          {t("import.opt1.action")}
        </Button>
        <Button size="sm" variant="outline" disabled={!canUseLibrary} onClick={onOpenFolder}>
          <FolderOpen className="size-4" />
          {t("import.opt2.action")}
        </Button>
      </div>

      <div className="relative text-sm leading-6 text-zinc-700">
        <Button
          size="sm"
          variant="outline"
          className="absolute right-0 top-0 z-10"
          onClick={() => void copyPrompt()}
        >
          <Copy className="size-3.5" />
          {t("import.ai.copy")}
        </Button>

        <div
          className={[
            "pr-40",
            "[&_h2]:mt-5 [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-zinc-500",
            "[&_h2:first-child]:mt-0",
            "[&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-zinc-950",
            "[&_p]:mt-2 [&_p]:first:mt-0",
            "[&_ul]:mt-2 [&_ol]:mt-2 [&_li]:text-sm",
            "[&_pre]:mt-2 [&_table]:mt-2",
          ].join(" ")}
        >
          <MarkdownContent>{guide}</MarkdownContent>
        </div>
      </div>
    </ResizableDialogShell>
  );
}
