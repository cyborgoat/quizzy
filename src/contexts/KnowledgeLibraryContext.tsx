import { useCallback, useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import {
  KNOWLEDGE_BASE_FOLDER,
  KnowledgeLibraryContext,
} from "@/contexts/knowledge-library-context";
import type { CreateKnowledgeDraft } from "@/contexts/knowledge-library-context";
import { parseKnowledgeFiles, type ParsedKnowledgeLibrary } from "@/data/knowledgeRepository";
import { useDirectoryLibrary } from "@/hooks/useDirectoryLibrary";
import { serializeKnowledgeFile } from "@/lib/frontMatter";
import { validateKnowledgeNote } from "@/lib/knowledgeDraft";
import { buildKnowledgeIndex, getKnowledgeForQuestion } from "@/lib/knowledgeIndex";
import { resolveUniqueFileName, slugifyTitle } from "@/lib/knowledgeLinks";
import { errorMessage, nativeApi } from "@/lib/native";
import type { KnowledgeItem } from "@/types/knowledge";

const EMPTY_LIBRARY: ParsedKnowledgeLibrary = { items: [], invalidReports: [] };

const readKnowledgeFiles = (knownVersions: Record<string, string>) =>
  nativeApi.readKnowledgeDirectory(knownVersions);

export function KnowledgeLibraryProvider({ children }: { children: ReactNode }) {
  const {
    library,
    setLibrary,
    refresh,
    isLoading,
    directoryPath,
    directoryAvailable,
  } = useDirectoryLibrary({
    empty: EMPTY_LIBRARY,
    readFiles: readKnowledgeFiles,
    parse: parseKnowledgeFiles,
    label: "knowledge",
  });
  const { items, invalidReports } = library;
  const knowledgeDirectoryPath = directoryPath
    ? `${directoryPath}/${KNOWLEDGE_BASE_FOLDER}`
    : null;

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
    const title = draft.title.trim();
    const content = draft.content?.trim() ?? "";
    const validationError = validateKnowledgeNote({ title, content });
    if (validationError) {
      throw new Error(validationError);
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
    await nativeApi.writeKnowledgeFile({ fileName, contents, overwrite: false });
    setItems((current) => [...current, item].sort((a, b) => a.title.localeCompare(b.title)));
    void refresh({ background: true });
    return item;
  }

  async function saveItem(
    item: KnowledgeItem,
    options?: { preserveUpdatedAt?: boolean },
  ) {
    const draft = { updated: undefined as KnowledgeItem | undefined };
    setItems((current) => {
      draft.updated = {
        ...item,
        updatedAt: options?.preserveUpdatedAt ? item.updatedAt : new Date().toISOString(),
      };
      return current
        .map((entry) => (entry.id === draft.updated!.id ? draft.updated! : entry))
        .sort((a, b) => a.title.localeCompare(b.title));
    });
    const updated = draft.updated;
    if (!updated) {
      return;
    }

    const contents = serializeKnowledgeFile(updated, updated.content);
    await nativeApi.writeKnowledgeFile({
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
    await nativeApi.deleteKnowledgeFile(fileName);
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
