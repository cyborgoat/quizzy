import { useLayoutEffect, useRef, useState } from "react";
import { FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle,
} from "@/components/ui/dialog";
import type { HubConflict, HubResolution } from "@/lib/native";

export function QuizhubConflictDialog({
  conflict,
  onResolve,
}: {
  conflict: HubConflict | null;
  onResolve: (decision: HubResolution | null) => void;
}) {
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const settled = useRef(false);
  const shown = useRef<HubConflict | null>(conflict);
  if (conflict) shown.current = conflict;
  const active = shown.current;

  useLayoutEffect(() => {
    if (!conflict) return;
    settled.current = false;
    setName(conflict.suggestedName ?? "");
    setRenaming(false);
  }, [conflict]);

  function finish(decision: HubResolution | null) {
    if (settled.current) return;
    settled.current = true;
    onResolve(decision);
  }

  function resolve(renamedFileName?: string) {
    if (!active) return;
    finish({
      item: { kind: active.kind, id: active.id },
      existingSha: active.existingSha,
      remoteSha: active.remoteSha,
      renamedFileName,
    });
  }

  return (
    <Dialog open={conflict !== null} onOpenChange={(open) => { if (!open) finish(null); }}>
      <DialogContent
        className="z-80 w-[calc(100%-2rem)] max-w-lg"
        overlayClassName="z-80"
        // Keep focus on the page location; restoring into the hub chrome can feel like a jump.
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {active && (
          <>
            <FileWarning className="mb-3 size-6 text-amber-700" aria-hidden="true" />
            <DialogTitle>A local file already exists</DialogTitle>
            <DialogDescription>
              QuizHub downloads <strong className="font-semibold text-zinc-900">{active.title}</strong> to{" "}
              <code className="break-all text-zinc-900">{active.fileName}</code>.
            </DialogDescription>
            {active.message && <p role="alert" className="mt-3 text-sm text-red-700">{active.message}</p>}
            {renaming ? (
              <div className="mt-5 space-y-2">
                <label htmlFor="quizhub-rename" className="block text-sm font-medium">New name for the local file</label>
                <input
                  id="quizhub-rename"
                  className="h-9 w-full rounded-md border border-zinc-300 px-3 text-sm focus-visible:outline-2 focus-visible:outline-sky-600"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <p className="text-sm text-zinc-600">The download keeps <code className="break-all">{active.fileName}</code>.</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-600">
                {active.suggestedName
                  ? "Rename the existing file to keep both copies, or overwrite it with the download."
                  : "The existing file cannot be opened as a quiz or note. You can overwrite it or skip this download."}
              </p>
            )}
            <DialogFooter className="flex-wrap">
              <Button variant="outline" onClick={() => finish(null)}>Skip</Button>
              {renaming ? (
                <>
                  <Button variant="ghost" onClick={() => setRenaming(false)}>Back</Button>
                  <Button disabled={!name.trim()} onClick={() => resolve(name.trim())}>Rename and download</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="text-red-700" onClick={() => resolve()}>Overwrite</Button>
                  {active.suggestedName && <Button onClick={() => setRenaming(true)}>Rename existing</Button>}
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
