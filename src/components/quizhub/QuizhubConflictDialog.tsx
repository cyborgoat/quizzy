import { useLayoutEffect, useRef, useState } from "react";
import { FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle,
} from "@/components/ui/dialog";
import type { HubConflict, HubResolution } from "@/lib/native";
import { useI18n } from "@/lib/i18n";
import { RichText } from "@/components/ui/rich-text";

export function QuizhubConflictDialog({
  conflict,
  onResolve,
}: {
  conflict: HubConflict | null;
  onResolve: (decision: HubResolution | null) => void;
}) {
  const { t } = useI18n();

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
            <DialogTitle>{t("hub.conflict.title")}</DialogTitle>
            <DialogDescription>
              <RichText
                text={t("hub.conflict.description", {
                  title: active.title,
                  fileName: active.fileName,
                })}
              />
            </DialogDescription>
            {active.message && <p role="alert" className="mt-3 text-sm text-red-700">{active.message}</p>}
            {renaming ? (
              <div className="mt-5 space-y-2">
                <label htmlFor="quizhub-rename" className="block text-sm font-medium">{t("hub.conflict.renameLabel")}</label>
                <input
                  id="quizhub-rename"
                  className="h-9 w-full rounded-md border border-zinc-300 px-3 text-sm focus-visible:outline-2 focus-visible:outline-sky-600"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <p className="text-sm text-zinc-600">
                  <RichText text={t("hub.conflict.keepsName", { fileName: active.fileName })} />
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-600">
                {active.suggestedName
                  ? t("hub.conflict.canRename")
                  : t("hub.conflict.cannotOpen")}
              </p>
            )}
            <DialogFooter className="flex-wrap">
              <Button variant="outline" onClick={() => finish(null)}>{t("hub.conflict.skip")}</Button>
              {renaming ? (
                <>
                  <Button variant="ghost" onClick={() => setRenaming(false)}>{t("common.back")}</Button>
                  <Button disabled={!name.trim()} onClick={() => resolve(name.trim())}>{t("hub.conflict.renameAndDownload")}</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="text-red-700" onClick={() => resolve()}>{t("hub.conflict.overwrite")}</Button>
                  {active.suggestedName && <Button onClick={() => setRenaming(true)}>{t("hub.conflict.renameExisting")}</Button>}
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
