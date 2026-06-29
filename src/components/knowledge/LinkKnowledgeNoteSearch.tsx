import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { questionLinkKey } from "@/lib/knowledgeLinks";
import { searchKnowledgeItems } from "@/lib/knowledgeSearch";
import { errorMessage } from "@/lib/native";
import type { KnowledgeItem } from "@/types/knowledge";

export function LinkKnowledgeNoteSearch({
  open,
  onOpenChange,
  quizId,
  questionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  questionId: string;
}) {
  const { items, saveItem } = useKnowledgeLibrary();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [isLinking, setIsLinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const questionKey = questionLinkKey(quizId, questionId);

  const linkableItems = useMemo(
    () =>
      items.filter(
        (item) =>
          !item.linkedQuizQuestions.some(
            (link) => questionLinkKey(link.quizId, link.questionId) === questionKey,
          ),
      ),
    [items, questionKey],
  );

  const options = useMemo(() => {
    if (!deferredSearch.trim()) return [];

    return searchKnowledgeItems(linkableItems, deferredSearch, { limit: 8 });
  }, [linkableItems, deferredSearch]);

  const showSuggestions = search.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  function handleOpenChange(nextOpen: boolean) {
    if (isLinking) return;
    if (!nextOpen) setSearch("");
    onOpenChange(nextOpen);
  }

  async function handleLink(item: KnowledgeItem) {
    setIsLinking(true);
    try {
      await saveItem({
        ...item,
        linkedQuizQuestions: [
          ...item.linkedQuizQuestions,
          { quizId, questionId },
        ],
      });
      handleOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsLinking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showClose={false}
        overlayClassName="z-60 bg-zinc-950/15 backdrop-blur-[2px]"
        className="z-60 max-w-lg gap-0 overflow-hidden p-0 shadow-xl"
      >
        <DialogTitle className="sr-only">Link knowledge note</DialogTitle>

        <div className="relative border-b border-zinc-100">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search knowledge notes"
            className="h-11 rounded-none border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
            disabled={isLinking}
            autoComplete="off"
            aria-label="Search knowledge notes to link"
          />
        </div>

        {showSuggestions && (
          <ul className="max-h-64 overflow-y-auto py-1">
            {options.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-zinc-500">No matching notes.</li>
            ) : (
              options.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-zinc-50 disabled:opacity-50"
                    onClick={() => void handleLink(item)}
                    disabled={isLinking}
                  >
                    <span className="font-medium text-zinc-950">{item.title}</span>
                    {item.tags.length > 0 && (
                      <span className="mt-0.5 block truncate text-xs text-zinc-500">
                        {item.tags.join(", ")}
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
