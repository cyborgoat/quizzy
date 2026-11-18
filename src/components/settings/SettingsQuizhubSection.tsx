import { ChevronDown, PackagePlus } from "lucide-react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSettingRow } from "@/components/settings/SettingsSettingRow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { QUIZHUB_DEFAULT_BASE_URL } from "@/lib/quizhub";
import type { SettingsDraft } from "@/lib/settingsDraft";

export function SettingsQuizhubSection({
  draft,
  savingFields,
  onQuizhubEnabledChange,
  onQuizhubBaseUrlChange,
  onQuizhubBaseUrlCommit,
  onQuizhubBaseUrlReset,
}: {
  draft: SettingsDraft;
  savingFields: ReadonlySet<keyof SettingsDraft | "workingDirectory">;
  onQuizhubEnabledChange: (value: boolean) => void;
  onQuizhubBaseUrlChange: (value: string) => void;
  onQuizhubBaseUrlCommit: () => void;
  onQuizhubBaseUrlReset: () => void;
}) {
  const savingUrl = savingFields.has("quizhubBaseUrl");
  const isDefaultSource = draft.quizhubBaseUrl.trim() === QUIZHUB_DEFAULT_BASE_URL;

  return (
    <SettingsSection icon={PackagePlus} title="Quizhub">
      <SettingsSettingRow
        label="Enable Quizhub"
        description="Browse and download curated quizzes and notes into your working directory."
      >
        <Switch
          checked={draft.quizhubEnabled}
          disabled={savingFields.has("quizhubEnabled")}
          onCheckedChange={onQuizhubEnabledChange}
          aria-label="Enable Quizhub"
        />
      </SettingsSettingRow>

      <Accordion type="single" collapsible className="border-t border-zinc-200/70">
        <AccordionItem value="source-url">
          <AccordionTrigger className="justify-between gap-3 px-0 py-3 hover:bg-transparent">
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-zinc-950">Source URL</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Advanced: change the catalog location if you host your own Quizhub.
              </p>
            </div>
            <ChevronDown className="accordion-chevron size-4 shrink-0 text-zinc-500 transition-transform duration-200 motion-reduce:transition-none" />
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-3 pt-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={draft.quizhubBaseUrl}
                disabled={savingUrl}
                onChange={(event) => onQuizhubBaseUrlChange(event.target.value)}
                onBlur={() => onQuizhubBaseUrlCommit()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                aria-label="Quizhub source URL"
                placeholder={QUIZHUB_DEFAULT_BASE_URL}
                className="h-8 min-w-0 flex-1 font-mono text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={savingUrl || isDefaultSource}
                onClick={() => onQuizhubBaseUrlReset()}
              >
                Reset
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </SettingsSection>
  );
}
