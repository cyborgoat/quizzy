import {
  type PaginationState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { buildMistakeLogColumns } from "@/components/mistake-log/mistakeLogColumns";
import { appTableFeatures } from "@/lib/tableFeatures";
import {
  applyMistakeLogShuffle,
  buildMistakeEntryOrderKey,
  buildMistakeQuizFilterOptions,
  DEFAULT_MISTAKE_SORTING,
  describeFilteredEmptyMistakes,
  filterMistakeEntries,
  findMistakeEntryIndex,
  getMistakeQuestionContext,
  resolveActiveMistakeEntry,
  syncTablePageForEntry,
  type QuestionTypeFilter,
} from "@/lib/mistakeLogDisplay";
import { questionLinkKey } from "@/lib/knowledgeLinks";
import type { Goal } from "@/types/goal";
import type { KnowledgeItem } from "@/types/knowledge";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { QuizSource } from "@/types/quiz";

type UseMistakeLogPageStateOptions = {
  qualifyingEntries: MistakeEntry[];
  rawEntries: MistakeEntry[];
  quizzesWithMistakes: { quizId: string; quizTitle: string }[];
  /** Selected quiz id, or "all". Owned by the route so links can preset it. */
  quizFilter: string;
  onQuizFilterChange: (quizFilter: string) => void;
  goals: Goal[];
  quizzes: QuizSource[];
  getNotesForQuestion: (quizId: string, questionId: string) => KnowledgeItem[];
};

export function useMistakeLogPageState({
  qualifyingEntries,
  rawEntries,
  quizzesWithMistakes,
  quizFilter,
  onQuizFilterChange,
  goals,
  quizzes,
  getNotesForQuestion,
}: UseMistakeLogPageStateOptions) {
  const [questionTypeFilter, setQuestionTypeFilter] = useState<QuestionTypeFilter>("all");
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_MISTAKE_SORTING);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);
  const [isMistakeListExpanded, setIsMistakeListExpanded] = useState(true);
  const [studyMode, setStudyMode] = useState(true);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [shufflePinnedIndex, setShufflePinnedIndex] = useState(0);
  const [shufflePinnedKey, setShufflePinnedKey] = useState<string | null>(null);

  const filteredEntries = useMemo(
    () =>
      filterMistakeEntries(qualifyingEntries, {
        quizFilter,
        questionTypeFilter,
        quizzes,
      }),
    [qualifyingEntries, quizFilter, questionTypeFilter, quizzes],
  );

  const quizFilterOptions = useMemo(
    () => buildMistakeQuizFilterOptions({ quizzesWithMistakes, quizFilter, quizzes, goals }),
    [quizzesWithMistakes, quizFilter, quizzes, goals],
  );

  const filterResetKey = `${quizFilter}::${questionTypeFilter}`;
  const [prevFilterResetKey, setPrevFilterResetKey] = useState(filterResetKey);
  if (filterResetKey !== prevFilterResetKey) {
    setPrevFilterResetKey(filterResetKey);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  const shuffleOrderKey = useMemo(
    () => buildMistakeEntryOrderKey(filteredEntries),
    [filteredEntries],
  );

  const displayEntries = useMemo(
    () =>
      applyMistakeLogShuffle(filteredEntries, {
        enabled: shuffleEnabled,
        seed: shuffleSeed,
        pinnedIndex: shufflePinnedIndex,
        pinnedKey: shufflePinnedKey,
      }),
    [filteredEntries, shuffleEnabled, shuffleSeed, shufflePinnedIndex, shufflePinnedKey],
  );

  const columns = useMemo(
    () =>
      buildMistakeLogColumns({
        quizzes,
        quizFilterOptions,
        quizFilter,
        questionTypeFilter,
        onQuizFilterChange,
        onQuestionTypeFilterChange: setQuestionTypeFilter,
        getNotesForQuestion,
      }),
    [
      quizzes,
      quizFilterOptions,
      quizFilter,
      questionTypeFilter,
      onQuizFilterChange,
      getNotesForQuestion,
    ],
  );

  const table = useTable({
    features: appTableFeatures,
    data: displayEntries,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(nextSorting);
    },
    onPaginationChange: setPagination,
  });

  const sortedEntries = table.getSortedRowModel().rows.map((row) => row.original);
  const activeEntry = useMemo(
    () => resolveActiveMistakeEntry(sortedEntries, selectedEntryKey),
    [sortedEntries, selectedEntryKey],
  );

  const activePosition = useMemo(
    () => (activeEntry ? findMistakeEntryIndex(sortedEntries, activeEntry) : -1),
    [sortedEntries, activeEntry],
  );

  const [lastSelection, setLastSelection] = useState({
    entry: activeEntry,
    position: activePosition,
  });

  const [prevShuffleEnabled, setPrevShuffleEnabled] = useState(shuffleEnabled);
  const [prevShuffleOrderKey, setPrevShuffleOrderKey] = useState(shuffleOrderKey);

  if (shuffleEnabled !== prevShuffleEnabled || shuffleOrderKey !== prevShuffleOrderKey) {
    const justEnabled = shuffleEnabled && !prevShuffleEnabled;
    const orderChanged = prevShuffleOrderKey !== shuffleOrderKey;
    setPrevShuffleEnabled(shuffleEnabled);
    setPrevShuffleOrderKey(shuffleOrderKey);

    if (!shuffleEnabled) {
      setSorting(DEFAULT_MISTAKE_SORTING);
    } else {
      setSorting([]);

      if (orderChanged && !justEnabled) {
        const { entry, position } = lastSelection;
        if (entry) {
          const key = questionLinkKey(entry.quizId, entry.questionId);
          setSelectedEntryKey(key);
          setShufflePinnedKey(key);
          setShufflePinnedIndex(position >= 0 ? position : 0);
        }
      }

      setShuffleSeed((seed) => seed + 1);
    }
  }

  if (lastSelection.entry !== activeEntry || lastSelection.position !== activePosition) {
    setLastSelection({ entry: activeEntry, position: activePosition });
  }

  function pinShuffleSelection(entry: MistakeEntry, position: number) {
    const key = questionLinkKey(entry.quizId, entry.questionId);
    setSelectedEntryKey(key);
    setShufflePinnedKey(key);
    setShufflePinnedIndex(position >= 0 ? position : 0);
  }

  function toggleShuffle() {
    if (!shuffleEnabled && activeEntry) {
      pinShuffleSelection(activeEntry, activePosition);
    }
    setShuffleEnabled((enabled) => !enabled);
  }

  function selectEntry(entry: MistakeEntry) {
    setSelectedEntryKey(questionLinkKey(entry.quizId, entry.questionId));
    syncTablePageForEntry(table, entry);
  }

  function goToPreviousMistake() {
    if (activePosition <= 0) return;
    selectEntry(sortedEntries[activePosition - 1]);
  }

  function goToNextMistake() {
    if (activePosition < 0 || activePosition >= sortedEntries.length - 1) return;
    selectEntry(sortedEntries[activePosition + 1]);
  }

  const filteredEmptyMessage = useMemo(
    () =>
      filteredEntries.length > 0
        ? null
        : describeFilteredEmptyMistakes({
            quizFilter,
            qualifyingEntries,
            rawEntries,
            goals,
            quizzes,
          }),
    [filteredEntries.length, quizFilter, qualifyingEntries, rawEntries, goals, quizzes],
  );

  function clearFilters() {
    onQuizFilterChange("all");
    setQuestionTypeFilter("all");
  }

  const activeQuestionContext = useMemo(
    () => getMistakeQuestionContext(activeEntry, quizzes),
    [activeEntry, quizzes],
  );

  return {
    filteredEmptyMessage,
    clearFilters,
    isMistakeListExpanded,
    setIsMistakeListExpanded,
    studyMode,
    setStudyMode,
    table,
    sortedEntries,
    activeEntry,
    activePosition,
    activeQuestionContext,
    toggleShuffle,
    shuffleEnabled,
    selectEntry,
    goToPreviousMistake,
    goToNextMistake,
  };
}
