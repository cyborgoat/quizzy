import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  KNOWLEDGE_BASE_FOLDER,
  KnowledgeLibraryContext,
} from "@/contexts/knowledge-library-context";
import type { CreateKnowledgeDraft } from "@/contexts/knowledge-library-context";
import type { LibrarySession } from "@/contexts/working-directory-context";
import { parseKnowledgeFiles, type ParsedKnowledgeLibrary } from "@/data/knowledgeRepository";
import { useDirectoryLibrary } from "@/hooks/useDirectoryLibrary";
import { serializeKnowledgeFile } from "@/lib/frontMatter";
import { validateKnowledgeNote } from "@/lib/knowledgeDraft";
import { buildKnowledgeIndex, getKnowledgeForQuestion } from "@/lib/knowledgeIndex";
import { resolveUniqueFileName, slugifyTitle } from "@/lib/knowledgeLinks";
import { QUIZHUB_CHANGED_EVENT } from "@/lib/quizhub";
import { errorMessage, nativeApi } from "@/lib/native";
import type { KnowledgeItem } from "@/types/knowledge";
import { useI18n } from "@/lib/i18n";

const EMPTY_LIBRARY: ParsedKnowledgeLibrary = { items: [], invalidReports: [] };

const EMPTY_COUNTS: Record<string, number> = {};

export function KnowledgeLibraryProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  const {
    library,
    setLibrary,
    refresh,
    isLoading,
    directoryPath,
    directoryAvailable,
    session,
  } = useDirectoryLibrary({
    empty: EMPTY_LIBRARY,
    readFiles: nativeApi.readKnowledgeDirectory,
    parse: parseKnowledgeFiles,
    label: "knowledge",
  });
  const { items, invalidReports } = library;
  const knowledgeDirectoryPath = directoryPath
    ? `${directoryPath}/${KNOWLEDGE_BASE_FOLDER}`
    : null;

  const [views, setViews] = useState<{ session: LibrarySession; counts: Record<string, number> } | null>(null);
  const viewCounts = views?.session === session ? views.counts : EMPTY_COUNTS;

  useEffect(() => {
    if (!session) return;
    let latestRequest = 0;
    function loadCounts() {
      if (!session?.isCurrent()) return;
      const request = ++latestRequest;
      void nativeApi.listKnowledgeViewCounts(session.path).then((counts) => {
        if (session.isCurrent() && request === latestRequest) setViews({ session, counts });
      }).catch(() => {});
    }
    loadCounts();
    window.addEventListener(QUIZHUB_CHANGED_EVENT, loadCounts);
    return () => {
      latestRequest += 1;
      window.removeEventListener(QUIZHUB_CHANGED_EVENT, loadCounts);
    };
  }, [session]);

  const recordView = useCallback((noteId: string) => {
    if (!session?.isCurrent()) return;
    setViews((current) => {
      const counts = current?.session === session ? current.counts : EMPTY_COUNTS;
      return { session, counts: { ...counts, [noteId]: (counts[noteId] ?? 0) + 1 } };
    });
    void nativeApi.recordKnowledgeView(session.path, noteId).catch(() => {});
  }, [session]);

  const knowledgeIndex = useMemo(() => buildKnowledgeIndex(items), [items]);

  function setItems(update: (current: KnowledgeItem[]) => KnowledgeItem[]) {
    setLibrary((current) => ({ ...current, items: update(current.items) }));
  }

  const getNotesForQuestion = useCallback(
    (quizId: string, questionId: string) =>
      getKnowledgeForQuestion(knowledgeIndex, quizId, questionId),
    [knowledgeIndex],
  );

  async function createItem(draft: CreateKnowledgeDraft) {
    if (!session?.isCurrent()) throw new Error(t("error.directoryChanged"));
    const title = draft.title.trim();
    const content = draft.content?.trim() ?? "";
    const validationError = validateKnowledgeNote({ title, content });
    if (validationError) {
      throw new Error(t(validationError));
    }
    const existingFileNames = new Set(items.map((item) => item.fileName));
    const { fileName, id } = resolveUniqueFileName(slugifyTitle(title), existingFileNames);
    const timestamp = new Date().toISOString();
    const item: KnowledgeItem = {
      id,
      title,
      tags: draft.tags ?? [],
      linkedQuizQuestions: draft.linkedQuizQuestions ?? [],
      favorite: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      fileName,
      content,
    };
    const contents = serializeKnowledgeFile(item, item.content);
    await nativeApi.writeKnowledgeFile(session.path, { fileName, contents, overwrite: false });
    setItems((current) => [...current, item].sort((a, b) => a.title.localeCompare(b.title)));
    void refresh({ background: true });
    return item;
  }

  async function saveItem(
    item: KnowledgeItem,
    options?: { preserveUpdatedAt?: boolean },
  ) {
    if (!session?.isCurrent()) throw new Error(t("error.directoryChanged"));
    const updated = {
      ...item,
      updatedAt: options?.preserveUpdatedAt ? item.updatedAt : new Date().toISOString(),
    };
    setItems((current) =>
      current.map((entry) => entry.id === updated.id ? updated : entry)
        .sort((a, b) => a.title.localeCompare(b.title)),
    );

    const contents = serializeKnowledgeFile(updated, updated.content);
    await nativeApi.writeKnowledgeFile(session.path, {
      fileName: updated.fileName,
      contents,
      overwrite: true,
    });
    await refresh({ background: true });
  }

  async function toggleFavorite(item: KnowledgeItem) {
    await saveItem({ ...item, favorite: !item.favorite }, { preserveUpdatedAt: true });
  }

  async function deleteItem(fileName: string) {
    if (!session?.isCurrent()) throw new Error(t("error.directoryChanged"));
    await nativeApi.deleteKnowledgeFile(session.path, fileName);
    await refresh({ background: true });
  }

  async function openKnowledgeFolder() {
    try {
      await nativeApi.openKnowledgeFolder();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const value = {
    directoryPath,
    knowledgeDirectoryPath,
    directoryAvailable,
    items,
    invalidReports,
    isLoading,
    viewCounts,
    recordView,
    refresh,
    createItem,
    saveItem,
    toggleFavorite,
    deleteItem,
    openKnowledgeFolder,
    getNotesForQuestion,
  };

  return (
    <KnowledgeLibraryContext.Provider value={value}>
      {children}
    </KnowledgeLibraryContext.Provider>
  );
}
