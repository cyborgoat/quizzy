import { Copy, FileUp, FlaskConical, FolderOpen, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ResizableDialogShell } from "@/components/ui/resizable-dialog-shell";
import { Button } from "@/components/ui/button";
import { sectionLabelClassName } from "@/components/ui/section-label";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  AI_PROMPT_TEMPLATE,
  EXAMPLE_QUIZ_JSON,
  FORMAT_RULES,
} from "@/lib/importHelpContent";
import { errorMessage } from "@/lib/native";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { RichText } from "@/components/ui/rich-text";
import type { MessageKey } from "@/lib/i18n-messages";

type HelpTab = "import" | "format" | "samples";

const TABS: { value: HelpTab; labelKey: MessageKey }[] = [
  { value: "import", labelKey: "import.tab.import" },
  { value: "format", labelKey: "import.tab.format" },
  { value: "samples", labelKey: "import.tab.samples" },
];

export function ImportHelpDialog({
  open,
  onOpenChange,
  canUseLibrary,
  onImport,
  onOpenFolder,
  onAddSamples,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canUseLibrary: boolean;
  onImport: () => void;
  onOpenFolder: () => void;
  onAddSamples: () => Promise<void>;
}) {
  const [tab, setTab] = useState<HelpTab>("import");
  const [isAddingSamples, setIsAddingSamples] = useState(false);
  const { t } = useI18n();


  async function copy(text: string, message: string) {
    try {
      await copyTextToClipboard(text);
      toast.success(message);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function addSamples() {
    setIsAddingSamples(true);
    try {
      await onAddSamples();
    } finally {
      setIsAddingSamples(false);
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
      <div className="mb-5 inline-flex rounded-lg bg-zinc-100 p-0.5" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              tab === item.value
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950",
            )}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {tab === "import" && (
        <div className="space-y-5 text-sm leading-6 text-zinc-700">
          <section>
            <h3 className={sectionLabelClassName}>{t("import.opt1.title")}</h3>
            <p className="mt-2">
              <RichText
                text={t("import.opt1.body")}
                slots={{
                  icon: <FileUp className="inline size-4 align-text-bottom" aria-hidden="true" />,
                }}
              />
            </p>
            <Button className="mt-3" size="sm" disabled={!canUseLibrary} onClick={onImport}>
              <FileUp className="size-4" />
              {t("import.opt1.action")}
            </Button>
          </section>
          <section>
            <h3 className={sectionLabelClassName}>{t("import.opt2.title")}</h3>
            <p className="mt-2">
              <RichText text={t("import.opt2.body")} />
            </p>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              disabled={!canUseLibrary}
              onClick={onOpenFolder}
            >
              <FolderOpen className="size-4" />
              {t("import.opt2.action")}
            </Button>
          </section>
          <section>
            <h3 className={sectionLabelClassName}>{t("import.missing.title")}</h3>
            <p className="mt-2">
              <RichText text={t("import.missing.body")} />
            </p>
          </section>
        </div>
      )}

      {tab === "format" && (
        <div className="space-y-5 text-sm leading-6 text-zinc-700">
          <dl className="overflow-hidden rounded-lg border border-zinc-200">
            {FORMAT_RULES.map((row, index) => (
              <div
                key={row.field ?? row.fieldKey}
                className={cn(
                  "grid gap-1 px-3 py-2 sm:grid-cols-[10rem_1fr] sm:gap-3",
                  index > 0 && "border-t border-zinc-200",
                )}
              >
                <dt className="font-mono text-xs font-semibold text-zinc-950">
                  {row.fieldKey ? t(row.fieldKey) : row.field}
                </dt>
                <dd>{t(row.ruleKey)}</dd>
              </div>
            ))}
          </dl>
          <section>
            <div className="flex items-center justify-between">
              <h3 className={sectionLabelClassName}>{t("import.example")}</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void copy(EXAMPLE_QUIZ_JSON, t("import.exampleCopied"))}
              >
                <Copy className="size-3.5" />
                {t("import.copy")}
              </Button>
            </div>
            <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5">
              <code>{EXAMPLE_QUIZ_JSON}</code>
            </pre>
          </section>
        </div>
      )}

      {tab === "samples" && (
        <div className="space-y-5 text-sm leading-6 text-zinc-700">
          <section>
            <h3 className={sectionLabelClassName}>{t("import.samples.welcomeTitle")}</h3>
            <p className="mt-2">
              <RichText text={t("import.samples.welcomeBody")} />
            </p>
            <Button
              className="mt-3"
              size="sm"
              disabled={!canUseLibrary || isAddingSamples}
              onClick={() => void addSamples()}
            >
              <FlaskConical className="size-4" />
              {isAddingSamples ? t("import.samples.adding") : t("import.samples.add")}
            </Button>
          </section>
          <section>
            <h3 className={sectionLabelClassName}>{t("import.ai.title")}</h3>
            <p className="mt-2">
              <RichText text={t("import.ai.body")} />
            </p>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => void copy(AI_PROMPT_TEMPLATE, t("import.ai.copied"))}
            >
              <Sparkles className="size-4" />
              {t("import.ai.copy")}
            </Button>
          </section>
        </div>
      )}
    </ResizableDialogShell>
  );
}
