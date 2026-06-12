import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  KNOWLEDGE_BASE_FOLDER,
  KnowledgeLibraryContext,
} from "@/contexts/knowledge-library-context";
import type { CreateKnowledgeDraft } from "@/contexts/knowledge-library-context";
import { parseKnowledgeFiles } from "@/data/knowledgeRepository";
import { useBackgroundDataLoader } from "@/hooks/useBackgroundDataLoader";
import { useWorkingDirectory } from "@/hooks/useWorkingDirectory";
import { serializeKnowledgeFile } from "@/lib/frontMatter";
import { validateKnowledgeNote } from "@/lib/knowledgeDraft";
import { buildKnowledgeIndex, getKnowledgeForQuestion } from "@/lib/knowledgeIndex";
import { resolveUniqueFileName, slugifyTitle } from "@/lib/knowledgeLinks";
import { errorMessage, nativeApi } from "@/lib/native";
import type { InvalidKnowledgeReport, KnowledgeItem } from "@/types/knowledge";

export function KnowledgeLibraryProvider({ children }: { children: ReactNode }) {
  const { directoryPath, directoryAvailable } = useWorkingDirectory();
  const knowledgeDirectoryPath = directoryPath
    ? `${directoryPath}/${KNOWLEDGE_BASE_FOLDER}`
    : null;
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [invalidReports, setInvalidReports] = useState<InvalidKnowledgeReport[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const knowledgeIndex = useMemo(() => buildKnowledgeIndex(items), [items]);

  const load = useCallback(async () => {
    try {
      if (!directoryAvailable || !directoryPath) {
        setItems([]);
        setInvalidReports([]);
        return;
      }
      const files = await nativeApi.readKnowledgeDirectory();
      const library = parseKnowledgeFiles(files);
      setItems(library.items);
      setInvalidReports(library.invalidReports);
      if (import.meta.env.DEV && library.invalidReports.length > 0) {
        console.warn("Quizzy skipped invalid knowledge files:", library.invalidReports);
      }
    } catch (error) {
      setItems([]);
      setInvalidReports([]);
      toast.error(errorMessage(error));
    }
  }, [directoryAvailable, directoryPath]);

  const { refresh, isLoading } = useBackgroundDataLoader(load);

  useEffect(() => {
    void refresh({ background: true });
  }, [directoryAvailable, directoryPath, refresh]);

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
      views: 0,
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

  async function saveItem(item: KnowledgeItem) {
    const current = itemsRef.current.find((entry) => entry.id === item.id);
    const updated: KnowledgeItem = {
      ...item,
      views: current?.views ?? item.views,
      updatedAt: new Date().toISOString(),
    };
    const contents = serializeKnowledgeFile(updated, updated.content);
    await nativeApi.writeKnowledgeFile({
      fileName: updated.fileName,
      contents,
      overwrite: true,
    });
    setItems((current) =>
      current
        .map((entry) => (entry.id === updated.id ? updated : entry))
        .sort((a, b) => a.title.localeCompare(b.title)),
    );
    await refresh({ background: true });
  }

  async function recordView(id: string) {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (!item || item.fileName === "") {
      return;
    }

    const updated: KnowledgeItem = {
      ...item,
      views: item.views + 1,
    };

    setItems((current) =>
      current.map((entry) => (entry.id === id ? updated : entry)),
    );

    try {
      const contents = serializeKnowledgeFile(updated, updated.content);
      await nativeApi.writeKnowledgeFile({
        fileName: updated.fileName,
        contents,
        overwrite: true,
      });
    } catch {
      setItems((current) =>
        current.map((entry) => (entry.id === id ? item : entry)),
      );
    }
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
    recordView,
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
