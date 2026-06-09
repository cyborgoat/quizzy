import { confirm } from "@tauri-apps/plugin-dialog";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KnowledgeDetailEditor } from "@/components/knowledge/KnowledgeDetailEditor";
import { KnowledgeDetailViewer } from "@/components/knowledge/KnowledgeDetailViewer";
import { PageShell } from "@/components/layout/PageShell";
import { Route } from "@/routes/_app/knowledge/$knowledgeId";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import {
  clearKnowledgeDraft,
  formatTagsInput,
  isUnsavedKnowledgeDraft,
  parseTagsInput,
  readKnowledgeDraft,
  stashKnowledgeDraft,
  validateKnowledgeNote,
} from "@/lib/knowledgeDraft";
import { errorMessage } from "@/lib/native";
import type { KnowledgeItem } from "@/types/knowledge";

type KnowledgeDetailLocationState = {
  knowledgeDraft?: KnowledgeItem;
};

function resolveKnowledgeSource(
  knowledgeId: string,
  persisted: KnowledgeItem | undefined,
  draftFromState: KnowledgeItem | undefined,
) {
  if (persisted) return persisted;
  if (draftFromState?.id === knowledgeId) return draftFromState;
  return readKnowledgeDraft(knowledgeId);
}

export function KnowledgeDetailPage() {
  const { knowledgeId } = Route.useParams();
  const { edit: editParam } = Route.useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const draftFromState = (location.state as KnowledgeDetailLocationState | undefined)
    ?.knowledgeDraft;
  const { items, createItem, saveItem, deleteItem } = useKnowledgeLibrary();
  const persisted = items.find((item) => item.id === knowledgeId);
  const source = resolveKnowledgeSource(knowledgeId, persisted, draftFromState);

  const startsInEditMode = editParam === "1" || editParam === "true";
  const [mode, setMode] = useState<"view" | "edit">(startsInEditMode ? "edit" : "view");
  const [draft, setDraft] = useState<KnowledgeItem | null>(source ?? null);
  const [tagsInput, setTagsInput] = useState(() => formatTagsInput(source?.tags ?? []));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- keep page form aligned with library and navigation */
    if (persisted) {
      setDraft(persisted);
      setTagsInput(formatTagsInput(persisted.tags));
      if (!startsInEditMode) {
        setMode("view");
      }
      return;
    }

    const nextSource = resolveKnowledgeSource(knowledgeId, undefined, draftFromState);
    if (!nextSource) {
      setDraft(null);
      return;
    }

    setDraft(nextSource);
    setTagsInput(formatTagsInput(nextSource.tags));
    if (startsInEditMode) {
      setMode("edit");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [knowledgeId, persisted, draftFromState, startsInEditMode]);

  if (!draft) {
    return (
      <PageShell className="overflow-x-clip">
        <Alert>
          <AlertTitle>Knowledge note not found</AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap items-center gap-3">
              <span>The note may have been deleted or is still loading.</span>
              <Link
                to="/knowledge"
                className="inline-flex items-center gap-1 text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-700"
              >
                <ArrowLeft className="size-3.5" />
                Back to Knowledge Base
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  const item = draft;
  const isNewDraft = isUnsavedKnowledgeDraft(item);

  function updateDraft(patch: Partial<KnowledgeItem> & { tagsInput?: string }) {
    const { tagsInput: nextTagsInput, ...itemPatch } = patch;
    if (nextTagsInput !== undefined) {
      setTagsInput(nextTagsInput);
    }
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current, ...itemPatch };
      if (isUnsavedKnowledgeDraft(next)) {
        stashKnowledgeDraft(next);
      }
      return next;
    });
  }

  function discardDraft() {
    clearKnowledgeDraft(knowledgeId);
    navigate({ to: "/knowledge" });
  }

  function handleCancel() {
    if (isNewDraft) {
      discardDraft();
      return;
    }
    if (persisted) {
      setDraft(persisted);
      setTagsInput(formatTagsInput(persisted.tags));
    }
    setMode("view");
    void navigate({
      to: "/knowledge/$knowledgeId",
      params: { knowledgeId },
      search: {},
      replace: true,
    });
  }

  async function handleSave() {
    const validationError = validateKnowledgeNote(item);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: item.title.trim(),
        content: item.content.trim(),
        tags: parseTagsInput(tagsInput),
        linkedQuizQuestions: item.linkedQuizQuestions,
      };

      if (isNewDraft) {
        const created = await createItem(payload);
        clearKnowledgeDraft(knowledgeId);
        setDraft(created);
        setTagsInput(formatTagsInput(created.tags));
        toast.success("Knowledge note saved.");
        setMode("view");
        void navigate({
          to: "/knowledge/$knowledgeId",
          params: { knowledgeId: created.id },
          search: {},
          replace: true,
        });
        return;
      }

      await saveItem({ ...item, ...payload });
      toast.success("Knowledge note saved.");
      setMode("view");
      void navigate({
        to: "/knowledge/$knowledgeId",
        params: { knowledgeId },
        search: {},
        replace: true,
      });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (isNewDraft) {
      discardDraft();
      return;
    }

    const approved = await confirm(
      `Delete "${item.title}"? This cannot be undone.`,
      { title: "Delete note?", kind: "warning" },
    );
    if (!approved) return;
    setIsDeleting(true);
    try {
      await deleteItem(item.fileName);
      toast.success("Knowledge note deleted.");
      navigate({ to: "/knowledge" });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <PageShell className="overflow-x-clip">
      <div className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-3">
        {isNewDraft && mode === "edit" ? (
          <Button
            type="button"
            variant="ghost"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 px-1 text-sm font-medium text-zinc-900 hover:bg-zinc-100/60"
            onClick={handleCancel}
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Button>
        ) : (
          <Link
            to="/knowledge"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-1 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100/60"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
        )}

        {mode === "view" ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 shrink-0 px-2 text-zinc-900 hover:bg-zinc-100/60"
            onClick={() => setMode("edit")}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-zinc-900 hover:bg-zinc-100/60"
              onClick={handleCancel}
              disabled={isSaving || isDeleting}
            >
              Cancel
            </Button>
            {!isNewDraft && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-zinc-900 hover:bg-zinc-100/60"
                onClick={() => void handleDelete()}
                disabled={isDeleting || isSaving}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            )}
            <Button size="sm" onClick={() => void handleSave()} disabled={isSaving || isDeleting}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {mode === "view" && !isNewDraft ? (
        <KnowledgeDetailViewer item={item} onAddContent={() => setMode("edit")} />
      ) : (
        <KnowledgeDetailEditor
          item={item}
          tagsInput={tagsInput}
          disabled={isSaving || isDeleting}
          onChange={updateDraft}
        />
      )}
    </PageShell>
  );
}
