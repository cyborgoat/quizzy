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

type HelpTab = "import" | "format" | "samples";

const TABS: { value: HelpTab; label: string }[] = [
  { value: "import", label: "Import" },
  { value: "format", label: "File format" },
  { value: "samples", label: "Samples & AI" },
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
      title="How to import a quiz"
      description="Quizzy reads quizzes from JSON files in your quiz folder."
      footer={
        <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
          Close
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
            {item.label}
          </button>
        ))}
      </div>

      {tab === "import" && (
        <div className="space-y-5 text-sm leading-6 text-zinc-700">
          <section>
            <h3 className={sectionLabelClassName}>Option 1 · Import a file</h3>
            <p className="mt-2">
              Click the <FileUp className="inline size-4 align-text-bottom" aria-hidden="true" />{" "}
              <strong>Import quiz file</strong> button on the Quiz Library, pick a{" "}
              <code>.json</code> file, and Quizzy copies it into your quiz folder.
            </p>
            <Button className="mt-3" size="sm" disabled={!canUseLibrary} onClick={onImport}>
              <FileUp className="size-4" />
              Import a file now
            </Button>
          </section>
          <section>
            <h3 className={sectionLabelClassName}>Option 2 · Drop files into the folder</h3>
            <p className="mt-2">
              Open the quiz folder, add your <code>.json</code> files, then press{" "}
              <strong>Refresh</strong>. Only files directly in the folder are read.
            </p>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              disabled={!canUseLibrary}
              onClick={onOpenFolder}
            >
              <FolderOpen className="size-4" />
              Open quiz folder
            </Button>
          </section>
          <section>
            <h3 className={sectionLabelClassName}>If a file doesn't show up</h3>
            <p className="mt-2">
              Quizzy lists invalid files in a red notice on the Quiz Library with the reasons.
              Common causes: malformed JSON, a missing field, or a quiz <code>id</code> already
              used by another file.
            </p>
          </section>
        </div>
      )}

      {tab === "format" && (
        <div className="space-y-5 text-sm leading-6 text-zinc-700">
          <dl className="overflow-hidden rounded-lg border border-zinc-200">
            {FORMAT_RULES.map((row, index) => (
              <div
                key={row.field}
                className={cn(
                  "grid gap-1 px-3 py-2 sm:grid-cols-[10rem_1fr] sm:gap-3",
                  index > 0 && "border-t border-zinc-200",
                )}
              >
                <dt className="font-mono text-xs font-semibold text-zinc-950">{row.field}</dt>
                <dd>{row.rule}</dd>
              </div>
            ))}
          </dl>
          <section>
            <div className="flex items-center justify-between">
              <h3 className={sectionLabelClassName}>Example</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void copy(EXAMPLE_QUIZ_JSON, "Example copied.")}
              >
                <Copy className="size-3.5" />
                Copy
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
            <h3 className={sectionLabelClassName}>Try sample quizzes</h3>
            <p className="mt-2">
              Adds a few ready-made quizzes (CSS, JavaScript, React and a Markdown showcase) to
              your quiz folder. Existing files are never overwritten.
            </p>
            <Button
              className="mt-3"
              size="sm"
              disabled={!canUseLibrary || isAddingSamples}
              onClick={() => void addSamples()}
            >
              <FlaskConical className="size-4" />
              {isAddingSamples ? "Adding…" : "Add sample quizzes"}
            </Button>
          </section>
          <section>
            <h3 className={sectionLabelClassName}>Generate a quiz with AI</h3>
            <p className="mt-2">
              Copy this prompt into any AI assistant, replace <code>{"{topic}"}</code> with your
              subject, and save the reply as a <code>.json</code> file. Then import it.
            </p>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => void copy(AI_PROMPT_TEMPLATE, "Prompt copied.")}
            >
              <Sparkles className="size-4" />
              Copy AI prompt
            </Button>
          </section>
        </div>
      )}
    </ResizableDialogShell>
  );
}
