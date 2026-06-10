import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  KNOWLEDGE_BASE_FOLDER,
  KnowledgeLibraryContext,
} from "@/contexts/knowledge-library-context";
import type { CreateKnowledgeDraft } from "@/contexts/knowledge-library-context";
import { parseKnowledgeFiles } from "@/data/knowledgeRepository";
import { serializeKnowledgeFile } from "@/lib/frontMatter";
import { validateKnowledgeNote } from "@/lib/knowledgeDraft";
import { resolveUniqueFileName, slugifyTitle } from "@/lib/knowledgeLinks";
import { errorMessage, nativeApi } from "@/lib/native";
import type { InvalidKnowledgeReport, KnowledgeItem } from "@/types/knowledge";

export function KnowledgeLibraryProvider({ children }: { children: ReactNode }) {
  const [directoryPath, setDirectoryPath] = useState<string | null>(null);
  const [knowledgeDirectoryPath, setKnowledgeDirectoryPath] = useState<string | null>(null);
  const [directoryAvailable, setDirectoryAvailable] = useState(false);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [invalidReports, setInvalidReports] = useState<InvalidKnowledgeReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? false;
    if (!background) {
      setIsLoading(true);
    }
    try {
      const settings = await nativeApi.getSettings();
      setDirectoryPath(settings.workingDirectory);
      setKnowledgeDirectoryPath(
        settings.workingDirectory
          ? `${settings.workingDirectory}/${KNOWLEDGE_BASE_FOLDER}`
          : null,
      );
      setDirectoryAvailable(settings.workingDirectoryAvailable);
      if (!settings.workingDirectoryAvailable) {
        setKnowledgeDirectoryPath(null);
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
      setDirectoryAvailable(false);
      toast.error(errorMessage(error));
    } finally {
      if (!background) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    function handleFocus() {
      void refresh({ background: true });
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

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
    const updated: KnowledgeItem = {
      ...item,
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
    deleteItem,
    openKnowledgeFolder,
  };

  return (
    <KnowledgeLibraryContext.Provider value={value}>
      {children}
    </KnowledgeLibraryContext.Provider>
  );
}
