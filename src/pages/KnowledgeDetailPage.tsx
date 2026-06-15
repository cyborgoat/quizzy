import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { KnowledgeDetailEditor } from "@/components/knowledge/KnowledgeDetailEditor";
import { KnowledgeDetailViewer } from "@/components/knowledge/KnowledgeDetailViewer";
import { PageShell } from "@/components/layout/PageShell";
import { Route } from "@/routes/_app/knowledge/$knowledgeId";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useKnowledgeNoteEditor } from "@/hooks/useKnowledgeNoteEditor";
import { resolveKnowledgeNoteSource } from "@/lib/knowledgeDraft";
import { cn } from "@/lib/utils";
import type { KnowledgeItem } from "@/types/knowledge";

type KnowledgeDetailLocationState = {
  knowledgeDraft?: KnowledgeItem;
};

export function KnowledgeDetailPage() {
  const { knowledgeId } = Route.useParams();
  const { edit: editParam } = Route.useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const draftFromState = (location.state as KnowledgeDetailLocationState | undefined)
    ?.knowledgeDraft;
  const library = useKnowledgeLibrary();
  const { items } = library;
  const fallback =
    draftFromState?.id === knowledgeId ? draftFromState : undefined;
  const source = resolveKnowledgeNoteSource(knowledgeId, items, fallback);

  const startsInEditMode = editParam === "1" || editParam === "true";
  const previousKnowledgeIdRef = useRef<string | null>(null);

  const editor = useKnowledgeNoteEditor({
    ...library,
    source: source ?? {
      id: knowledgeId,
      fileName: "",
      title: "",
      tags: [],
      content: "",
      linkedQuizQuestions: [],
      createdAt: "",
      updatedAt: "",
    },
    initialMode: startsInEditMode ? "edit" : "view",
    onCreated: (created) => {
      void navigate({
        to: "/knowledge/$knowledgeId",
        params: { knowledgeId: created.id },
        search: {},
        replace: true,
      });
    },
    onUpdated: () => {
      void navigate({
        to: "/knowledge/$knowledgeId",
        params: { knowledgeId },
        search: {},
        replace: true,
      });
    },
    onDeleted: () => {
      navigate({ to: "/knowledge" });
    },
    onDiscardNewDraft: () => {
      navigate({ to: "/knowledge" });
    },
  });

  useEffect(() => {
    if (!source) {
      return;
    }

    const knowledgeIdChanged = previousKnowledgeIdRef.current !== knowledgeId;
    previousKnowledgeIdRef.current = knowledgeId;

    if (knowledgeIdChanged) {
      editor.resetFromSource(source, startsInEditMode ? "edit" : "view");
      return;
    }

    if (editor.draft.id !== knowledgeId) {
      editor.resetFromSource(source);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when route/library source changes
  }, [knowledgeId, source, startsInEditMode]);

  if (!source) {
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

  const { mode, setMode, draft, tagsInput, isSaving, isDeleting, isNewDraft, updateDraft, cancelEdit, save, deleteNote } =
    editor;

  function handleCancel() {
    cancelEdit();
    if (!isNewDraft) {
      void navigate({
        to: "/knowledge/$knowledgeId",
        params: { knowledgeId },
        search: {},
        replace: true,
      });
    }
  }

  return (
    <PageShell
      className={cn(
        "overflow-x-clip",
        mode === "edit" &&
          "flex h-[calc(100svh-(var(--app-page-py)*2))] min-h-0 flex-col overflow-hidden",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-3",
          mode === "edit" ? "mb-4" : "mb-6",
        )}
      >
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

        {mode === "edit" && (
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <IconActionButton
              icon={X}
              label="Cancel"
              onClick={handleCancel}
              disabled={isSaving || isDeleting}
            />
            {!isNewDraft && (
              <IconActionButton
                icon={Trash2}
                label="Delete"
                onClick={() => void deleteNote()}
                disabled={isDeleting || isSaving}
              />
            )}
            <Button size="sm" onClick={() => void save()} disabled={isSaving || isDeleting}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {mode === "view" && !isNewDraft ? (
        <KnowledgeDetailViewer item={draft} onEdit={() => setMode("edit")} />
      ) : (
        <KnowledgeDetailEditor
          item={draft}
          tagsInput={tagsInput}
          disabled={isSaving || isDeleting}
          fillHeight={mode === "edit"}
          onChange={updateDraft}
        />
      )}
    </PageShell>
  );
}
