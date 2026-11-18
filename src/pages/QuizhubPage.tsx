import { confirm } from "@tauri-apps/plugin-dialog";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Download,
  PackagePlus,
  RefreshCw,
  SquareLetterQ,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/quiz/EmptyState";
import { ErrorState } from "@/components/quiz/ErrorState";
import { LoadingState } from "@/components/quiz/LoadingState";
import { QuizhubPreviewDialog } from "@/components/quizhub/QuizhubPreviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-styles";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchField } from "@/components/ui/search-field";
import { Spinner } from "@/components/ui/spinner";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";
import { useQuizhubCatalog } from "@/hooks/useQuizhubCatalog";
import { useQuizhubPreferences } from "@/hooks/useQuizhubPreferences";
import { formatShortDate } from "@/lib/formatDate";
import {
  errorMessage,
  nativeApi,
  type HubItem,
  type HubItemRef,
  type HubItemState,
} from "@/lib/native";
import {
  filterHubItems,
  formatBytes,
  groupHubItems,
  hubItemKey,
  hubStateDescription,
  hubStateLabel,
  isDownloadable,
  isFromHub,
  notifyQuizhubChanged,
  summarizeHubReport,
  type HubCategoryView,
} from "@/lib/quizhub";
import { cn } from "@/lib/utils";

const stateBadgeClass: Record<HubItemState, string> = {
  available: "",
  nameTaken: "border-amber-200 bg-amber-50 text-amber-800",
  installed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  updateAvailable: "border-sky-200 bg-sky-50 text-sky-800",
  modifiedLocally: "border-amber-200 bg-amber-50 text-amber-800",
  removedRemotely: "border-zinc-300 bg-zinc-100 text-zinc-600",
};

export function QuizhubPage() {
  const quizLibrary = useQuizLibrary();
  const knowledgeLibrary = useKnowledgeLibrary();
  const { quizhubEnabled, setQuizhubEnabled } = useQuizhubPreferences();
  const [isWorking, setIsWorking] = useState(false);
  const [downloadingKeys, setDownloadingKeys] = useState<ReadonlySet<string>>(new Set());
  const [isEnabling, setIsEnabling] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<HubItem | null>(null);

  const directoryReady = Boolean(quizLibrary.directoryPath && quizLibrary.directoryAvailable);

  const { catalog, error: loadError, isRefreshing: isLoading, refresh: load } =
    useQuizhubCatalog(quizLibrary.directoryPath, quizhubEnabled && directoryReady);
  const { openQuizStart } = useQuizStartDialog();
  const quizSources = useMemo(
    () => new Map(quizLibrary.quizzes.map((source) => [source.fileName, source])),
    [quizLibrary.quizzes],
  );

  const categories = useMemo(
    () => (catalog ? groupHubItems(catalog.categories, catalog.items) : []),
    [catalog],
  );
  const activeCategory = categories.find((category) => category.id === categoryId) ?? null;
  const updateCount = catalog?.items.filter((item) => item.state === "updateAvailable").length ?? 0;

  async function afterChange() {
    notifyQuizhubChanged();
    await Promise.all([
      quizLibrary.refresh({ background: true }),
      knowledgeLibrary.refresh({ background: true }),
      load(false, true),
    ]);
  }

  async function download(items: HubItemRef[], force = false) {
    if (items.length === 0 || isWorking) return;
    const keys = new Set(items.map(hubItemKey));
    setDownloadingKeys(keys);
    setIsWorking(true);
    try {
      const report = await nativeApi.hubDownload(items, force);
      const summary = summarizeHubReport(report);
      const problems = report.outcomes.filter(
        (outcome) => outcome.result === "failed" || outcome.result === "skipped",
      );
      if (report.failed > 0) {
        toast.error(summary, {
          description: problems.map((outcome) => `${outcome.title}: ${outcome.detail ?? outcome.result}`).join("\n"),
        });
      } else if (report.skipped > 0) {
        toast.warning(summary, {
          description: problems.map((outcome) => `${outcome.title}: ${outcome.detail ?? outcome.result}`).join("\n"),
        });
      } else {
        toast.success(summary);
        setPreviewItem(null);
      }
      setSelected(new Set());
      await afterChange();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setDownloadingKeys(new Set());
      setIsWorking(false);
    }
  }

  async function replaceWithRemote(item: HubItem) {
    const message =
      item.state === "modifiedLocally"
        ? `Replace your edited copy of "${item.title}" with the quizhub version? Your changes will be lost.`
        : `Replace the local file ${item.fileName} with "${item.title}" from quizhub? The local file will be overwritten.`;
    const approved = await confirm(message, { title: "Replace local file?", kind: "warning" });
    if (approved) await download([item], true);
  }

  async function remove(item: HubItem) {
    if (isWorking) return;
    const edited = item.state === "modifiedLocally";
    const approved = await confirm(
      edited
        ? `Delete "${item.title}"? You edited it after downloading, and your changes will be lost.`
        : `Delete "${item.title}" from your library? You can download it again later.`,
      { title: "Remove downloaded item?", kind: "warning" },
    );
    if (!approved) return;
    setIsWorking(true);
    try {
      await nativeApi.hubRemove(item, { force: edited });
      toast.success(`Removed ${item.title}.`);
      setPreviewItem(null);
      await afterChange();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsWorking(false);
    }
  }

  async function keepAsLocal(item: HubItem) {
    if (isWorking) return;
    setIsWorking(true);
    try {
      await nativeApi.hubRemove(item, { keepFile: true });
      toast.success(`${item.title} is now a local file.`);
      await afterChange();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsWorking(false);
    }
  }

  function toggle(item: HubItem) {
    if (!isDownloadable(item.state)) return;
    setSelected((current) => {
      const next = new Set(current);
      const key = hubItemKey(item);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function enableQuizhub() {
    if (isEnabling) return;
    setIsEnabling(true);
    try {
      await nativeApi.saveSettings({ quizhubEnabled: true });
      setQuizhubEnabled(true);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsEnabling(false);
    }
  }

  if (!quizhubEnabled) {
    return (
      <PageShell>
        <PageHeader title="Quizhub" description="Browse and download curated quizzes and notes." />
        <div className="mt-6">
          <EmptyState
            title="Quizhub is turned off"
            description="Enable Quizhub to browse curated quizzes and notes and download them into your working directory."
            icon={<PackagePlus className="mx-auto mb-4 size-9 text-zinc-400" aria-hidden="true" />}
            action={
              <Button className="mt-6" disabled={isEnabling} onClick={() => void enableQuizhub()}>
                <PackagePlus className="size-3.5" />
                {isEnabling ? "Enabling…" : "Enable Quizhub"}
              </Button>
            }
          />
        </div>
      </PageShell>
    );
  }

  if (!directoryReady) {
    return (
      <PageShell>
        <PageHeader title="Quizhub" description="Browse and download curated quizzes and notes." />
        <div className="mt-6">
          <EmptyState
            title="Choose a quiz folder first"
            description="Quizhub downloads quizzes and notes into your working directory. Select one in Settings to get started."
            action={
              <Link to="/settings" className={buttonClassName({ className: "mt-6" })}>
                Open Settings
              </Link>
            }
          />
        </div>
      </PageShell>
    );
  }

  const selectedRefs: HubItemRef[] =
    catalog?.items
      .filter((item) => selected.has(hubItemKey(item)) && isDownloadable(item.state))
      .map(({ kind, id }) => ({ kind, id })) ?? [];

  const previewSource =
    previewItem?.kind === "quiz" && isFromHub(previewItem.state)
      ? quizSources.get(previewItem.fileName)
      : undefined;
  const canStartPreviewQuiz = Boolean(previewSource && !previewSource.archived);

  return (
    <PageShell>
      <PageHeader
        title="Quizhub"
        description="Browse curated quizzes and notes, and download the ones you want. Downloaded files are marked as Quizhub content; edits you make are never overwritten."
        actions={
          <>
            {updateCount > 0 && (
              <Button
                size="sm"
                disabled={isWorking}
                onClick={() =>
                  void download(
                    catalog!.items
                      .filter((item) => item.state === "updateAvailable")
                      .map(({ kind, id }) => ({ kind, id })),
                  )
                }
              >
                <Download className="size-3.5" />
                Update all ({updateCount})
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading || isWorking}
              onClick={() => void load(true)}
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
              Check for updates
            </Button>
          </>
        }
      />

      <div className="mt-5">
        {loadError && catalog && (
          <p role="status" className="mb-3 text-sm text-amber-700">
            Couldn’t check for updates. Showing the saved catalog. {loadError}
          </p>
        )}
        {loadError && !catalog ? (
          <ErrorState
            title="Couldn't load quizhub"
            description={loadError}
            actionLabel="Try again"
            onAction={() => void load(true)}
          />
        ) : !catalog ? (
          <LoadingState message="Loading quizhub catalog…" />
        ) : activeCategory ? (
          <CategoryView
            category={activeCategory}
            query={query}
            onQueryChange={setQuery}
            selected={selected}
            isWorking={isWorking}
            downloadingKeys={downloadingKeys}
            onBack={() => {
              setCategoryId(null);
              setQuery("");
              setSelected(new Set());
            }}
            onToggle={toggle}
            onSelectAll={(items) =>
              setSelected(new Set(items.filter((item) => isDownloadable(item.state)).map(hubItemKey)))
            }
            onPreview={setPreviewItem}
            onDownload={(item) => void download([item])}
            onReplace={(item) => void replaceWithRemote(item)}
            onKeepAsLocal={(item) => void keepAsLocal(item)}
          />
        ) : (
          <CategoryGrid categories={categories} onOpen={setCategoryId} />
        )}
        {catalog && catalog.skipped.length > 0 && (
          <p className="mt-4 text-xs text-zinc-500">
            {catalog.skipped.length} item(s) need a newer Quizzy and were hidden: {catalog.skipped.join(", ")}
          </p>
        )}
      </div>

      <QuizhubPreviewDialog
        item={previewItem}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPreviewItem(null);
        }}
        isDownloading={Boolean(previewItem && downloadingKeys.has(hubItemKey(previewItem)))}
        isWorking={isWorking}
        onDownload={(item) => void download([item])}
        onRemove={(item) => void remove(item)}
        onStartQuiz={
          canStartPreviewQuiz
            ? (item) => {
                const source = quizSources.get(item.fileName);
                if (!source || source.archived) return;
                setPreviewItem(null);
                openQuizStart({ quizId: source.quiz.id });
              }
            : undefined
        }
      />

      {selectedRefs.length > 0 && (
        <div className="sticky bottom-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2 shadow-md">
          <span className="text-sm text-zinc-700">{selectedRefs.length} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button
              size="sm"
              disabled={isWorking}
              onClick={() => void download(selectedRefs)}
            >
              {downloadingKeys.size > 0 ? (
                <Spinner className="size-3.5" />
              ) : (
                <Download className="size-3.5" />
              )}
              {downloadingKeys.size > 0 ? "Downloading…" : "Download selected"}
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function CategoryGrid({
  categories,
  onOpen,
}: {
  categories: HubCategoryView[];
  onOpen: (id: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <EmptyState title="Quizhub is empty" description="No categories are published at this source yet." />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onOpen(category.id)}
          className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <span className="text-base font-semibold text-zinc-950">{category.title}</span>
          <span className="text-xs text-zinc-500">
            {category.quizCount} {category.quizCount === 1 ? "quiz" : "quizzes"} · {category.noteCount}{" "}
            {category.noteCount === 1 ? "note" : "notes"}
          </span>
          <span className="flex flex-wrap gap-1.5">
            {category.downloadedCount > 0 && (
              <Badge className="border-zinc-200 bg-zinc-100 text-zinc-600">
                {category.downloadedCount} downloaded
              </Badge>
            )}
            {category.updateCount > 0 && (
              <Badge className={stateBadgeClass.updateAvailable}>
                {category.updateCount} {category.updateCount === 1 ? "update" : "updates"}
              </Badge>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

function CategoryView({
  category,
  query,
  onQueryChange,
  selected,
  isWorking,
  downloadingKeys,
  onBack,
  onToggle,
  onSelectAll,
  onPreview,
  onDownload,
  onReplace,
  onKeepAsLocal,
}: {
  category: HubCategoryView;
  query: string;
  onQueryChange: (value: string) => void;
  selected: ReadonlySet<string>;
  isWorking: boolean;
  downloadingKeys: ReadonlySet<string>;
  onBack: () => void;
  onToggle: (item: HubItem) => void;
  onSelectAll: (items: HubItem[]) => void;
  onPreview: (item: HubItem) => void;
  onDownload: (item: HubItem) => void;
  onReplace: (item: HubItem) => void;
  onKeepAsLocal: (item: HubItem) => void;
}) {
  const items = filterHubItems(category.items, query);
  const quizzes = items.filter((item) => item.kind === "quiz");
  const notes = items.filter((item) => item.kind === "note");
  const selectable = items.filter((item) => isDownloadable(item.state));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-3.5" />
          All categories
        </Button>
        <h2 className="text-lg font-semibold text-zinc-950">{category.title}</h2>
        <div className="ml-auto flex items-center gap-2">
          <SearchField
            value={query}
            onChange={onQueryChange}
            placeholder="Search this category"
            className="w-64"
          />
          {selectable.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => onSelectAll(selectable)}>
              Select all ({selectable.length})
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">No items match.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {quizzes.length > 0 && (
            <HubItemSection
              title="Quizzes"
              icon={SquareLetterQ}
              items={quizzes}
              selected={selected}
              isWorking={isWorking}
              downloadingKeys={downloadingKeys}
              onToggle={onToggle}
              onPreview={onPreview}
              onDownload={onDownload}
              onReplace={onReplace}
              onKeepAsLocal={onKeepAsLocal}
            />
          )}
          {notes.length > 0 && (
            <HubItemSection
              title="Knowledge"
              icon={BookOpen}
              items={notes}
              selected={selected}
              isWorking={isWorking}
              downloadingKeys={downloadingKeys}
              onToggle={onToggle}
              onPreview={onPreview}
              onDownload={onDownload}
              onReplace={onReplace}
              onKeepAsLocal={onKeepAsLocal}
            />
          )}
        </div>
      )}
    </div>
  );
}

function HubItemSection({
  title,
  icon: Icon,
  items,
  selected,
  isWorking,
  downloadingKeys,
  onToggle,
  onPreview,
  onDownload,
  onReplace,
  onKeepAsLocal,
}: {
  title: string;
  icon: LucideIcon;
  items: HubItem[];
  selected: ReadonlySet<string>;
  isWorking: boolean;
  downloadingKeys: ReadonlySet<string>;
  onToggle: (item: HubItem) => void;
  onPreview: (item: HubItem) => void;
  onDownload: (item: HubItem) => void;
  onReplace: (item: HubItem) => void;
  onKeepAsLocal: (item: HubItem) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        <span className="text-xs text-zinc-500">{items.length}</span>
      </header>
      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {items.map((item) => {
          const key = hubItemKey(item);
          const canSelect = isDownloadable(item.state);
          const meta = [
            item.size > 0 ? formatBytes(item.size) : null,
            item.updated ? `Updated ${formatShortDate(item.updated)}` : null,
            item.tags.length > 0 ? item.tags.join(", ") : null,
          ].filter(Boolean);

          const showStateBadge = item.state !== "available" && item.state !== "installed";

          return (
            <li key={key} className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50">
              <button
                type="button"
                role="checkbox"
                aria-checked={selected.has(key)}
                aria-label={`Select ${item.title}`}
                disabled={!canSelect}
                onClick={() => onToggle(item)}
                className="disabled:cursor-default"
              >
                {canSelect ? (
                  <Checkbox checked={selected.has(key)} />
                ) : (
                  <span
                    className="flex size-5 items-center justify-center text-emerald-600"
                    title={item.state === "installed" ? hubStateDescription.installed : undefined}
                    aria-label={item.state === "installed" ? "Downloaded" : undefined}
                  >
                    {item.state === "installed" && <Check className="size-4" />}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="min-w-0 flex-1 cursor-pointer rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                aria-label={`Preview ${item.title}`}
                onClick={() => onPreview(item)}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-zinc-950">{item.title}</span>
                  {showStateBadge && (
                    <Badge
                      className={cn("px-2 py-0 text-[11px]", stateBadgeClass[item.state])}
                      title={hubStateDescription[item.state]}
                    >
                      {hubStateLabel[item.state]}
                    </Badge>
                  )}
                </div>
                {meta.length > 0 && (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{meta.join(" · ")}</p>
                )}
              </button>
              <ItemActions
                item={item}
                disabled={isWorking}
                isDownloading={downloadingKeys.has(key)}
                onDownload={onDownload}
                onReplace={onReplace}
                onKeepAsLocal={onKeepAsLocal}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ItemActions({
  item,
  disabled,
  isDownloading,
  onDownload,
  onReplace,
  onKeepAsLocal,
}: {
  item: HubItem;
  disabled: boolean;
  isDownloading: boolean;
  onDownload: (item: HubItem) => void;
  onReplace: (item: HubItem) => void;
  onKeepAsLocal: (item: HubItem) => void;
}) {
  const downloadIcon = isDownloading ? (
    <Spinner className="size-3.5" />
  ) : (
    <Download className="size-3.5" />
  );

  switch (item.state) {
    case "available":
      return (
        <Button
          size="icon"
          variant="outline"
          aria-label={isDownloading ? `Downloading ${item.title}` : `Download ${item.title}`}
          title={isDownloading ? "Downloading…" : "Download"}
          disabled={disabled}
          onClick={() => onDownload(item)}
        >
          {downloadIcon}
        </Button>
      );
    case "updateAvailable":
      return (
        <Button
          size="icon"
          aria-label={isDownloading ? `Updating ${item.title}` : `Update ${item.title}`}
          title={isDownloading ? "Updating…" : "Update"}
          disabled={disabled}
          onClick={() => onDownload(item)}
        >
          {downloadIcon}
        </Button>
      );
    case "modifiedLocally":
      return (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            title="Keep your edited copy as a local file and stop tracking it from quizhub"
            disabled={disabled}
            onClick={() => onKeepAsLocal(item)}
          >
            Keep as local
          </Button>
          <Button size="sm" variant="outline" disabled={disabled} onClick={() => onReplace(item)}>
            Replace with remote
          </Button>
        </div>
      );
    case "nameTaken":
      return (
        <Button size="sm" variant="outline" disabled={disabled} onClick={() => onReplace(item)}>
          Replace local file
        </Button>
      );
    case "removedRemotely":
      return (
        <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onKeepAsLocal(item)}>
          Keep as local
        </Button>
      );
    case "installed":
      return null;
  }
}
