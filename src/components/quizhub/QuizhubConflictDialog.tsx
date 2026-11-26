import { useState } from "react";
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
  conflict: HubConflict;
  onResolve: (decision: HubResolution | null) => void;
}) {
  const [name, setName] = useState(conflict.suggestedName ?? "");
  const [renaming, setRenaming] = useState(false);

  function resolve(renamedFileName?: string) {
    onResolve({
      item: { kind: conflict.kind, id: conflict.id },
      existingSha: conflict.existingSha,
      remoteSha: conflict.remoteSha,
      renamedFileName,
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onResolve(null); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg">
        <FileWarning className="mb-3 size-6 text-amber-700" aria-hidden="true" />
        <DialogTitle>A local file already exists</DialogTitle>
        <DialogDescription>
          QuizHub downloads <strong className="font-semibold text-zinc-900">{conflict.title}</strong> to{" "}
          <code className="break-all text-zinc-900">{conflict.fileName}</code>.
        </DialogDescription>
        {conflict.message && <p role="alert" className="mt-3 text-sm text-red-700">{conflict.message}</p>}
        {renaming ? (
          <div className="mt-5 space-y-2">
            <label htmlFor="quizhub-rename" className="block text-sm font-medium">New name for the local file</label>
            <input
              id="quizhub-rename"
              className="h-9 w-full rounded-md border border-zinc-300 px-3 text-sm focus-visible:outline-2 focus-visible:outline-sky-600"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <p className="text-sm text-zinc-600">The download keeps <code className="break-all">{conflict.fileName}</code>.</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-600">
            {conflict.suggestedName
              ? "Rename the existing file to keep both copies, or overwrite it with the download."
              : "The existing file cannot be opened as a quiz or note. You can overwrite it or skip this download."}
          </p>
        )}
        <DialogFooter className="flex-wrap">
          <Button variant="outline" onClick={() => onResolve(null)}>Skip</Button>
          {renaming ? (
            <>
              <Button variant="ghost" onClick={() => setRenaming(false)}>Back</Button>
              <Button disabled={!name.trim()} onClick={() => resolve(name.trim())}>Rename and download</Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="text-red-700" onClick={() => resolve()}>Overwrite</Button>
              {conflict.suggestedName && <Button onClick={() => setRenaming(true)}>Rename existing</Button>}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
