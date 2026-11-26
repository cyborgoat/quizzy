import { confirm } from "@tauri-apps/plugin-dialog";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Languages,
  BookOpen,
  Check,
  Download,
  FolderOpen,
  PackagePlus,
  RefreshCw,
  SquareLetterQ,
  type LucideIcon,
} from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/quiz/EmptyState";
import { ErrorState } from "@/components/quiz/ErrorState";
import { LoadingState } from "@/components/quiz/LoadingState";
import { QuizhubConflictDialog } from "@/components/quizhub/QuizhubConflictDialog";
import { QuizhubPreviewDialog } from "@/components/quizhub/QuizhubPreviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-styles";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchField } from "@/components/ui/search-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useGoals } from "@/hooks/useGoals";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";
import { useQuizhubCatalog } from "@/hooks/useQuizhubCatalog";
import { useQuizhubScope } from "@/hooks/useQuizhubScope";
import { useQuizhubPreferences } from "@/hooks/useQuizhubPreferences";
import { formatShortDate } from "@/lib/formatDate";
import {
  errorMessage,
  nativeApi,
  type HubConflict,
  type HubResolution,
  type HubItem,
  type HubItemRef,
  type HubItemState,
  type HubScope,
  type HubLocale,
} from "@/lib/native";
import {
  filterHubItems,
  formatBytes,
  groupHubDomains,
  hubItemKey,
  hubStateDescription,
  hubStateLabel,
  isDownloadable,
  isFromHub,
  notifyQuizhubChanged,
  summarizeHubReport,
  type HubCategoryView,
  type HubDomainView,
} from "@/lib/quizhub";
import { cn } from "@/lib/utils";

const stateBadgeClass: Record<HubItemState, string> = {
  available: "",
  installed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  updateAvailable: "border-sky-200 bg-sky-50 text-sky-800",
  removedRemotely: "border-zinc-300 bg-zinc-100 text-zinc-600",
};

export function QuizhubPage() {
  const scope = useQuizhubScope();
  const { quizhubEnabled, setQuizhubEnabled } = useQuizhubPreferences();
  const [isEnabling, setIsEnabling] = useState(false);

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
        <PageHeader title="QuizHub" description="Browse and download curated quizzes and notes." />
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

  if (!scope) {
    return (
      <PageShell>
        <PageHeader title="QuizHub" description="Browse and download curated quizzes and notes." />
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

  return <QuizhubWorkspace key={JSON.stringify(scope)} scope={scope} />;
}

function QuizhubWorkspace({ scope }: { scope: HubScope }) {
  const preference = "quizzy:quizhub-language:" + scope.baseUrl;
  const { locale: appLocale, setAppLocale } = useAppLocale();
  const [locale, setLocale] = useState<string | null>(() => localStorage.getItem(preference) ?? appLocale);
  const [knownLocales, setKnownLocales] = useState<HubLocale[]>([]);
  const snapshot = useQuizhubCatalog(scope, locale);
  const { catalog } = snapshot;

  function selectLanguage(id: string) {
    if (id === (catalog?.activeLocale ?? locale)) return;
    setKnownLocales(catalog?.locales ?? knownLocales);
    localStorage.setItem(preference, id);
    setLocale(id);
    if (id === "en" || id === "zh") void setAppLocale(id);
  }
  return (
    <QuizhubBrowser
      scope={scope}
      languages={catalog?.locales ?? knownLocales}
      language={catalog?.activeLocale ?? locale ?? undefined}
      onSelectLocale={selectLanguage}
      {...snapshot}
    />
  );
}

function QuizhubBrowser({
  scope,
  catalog,
  error: loadError,
  isRefreshing: isLoading,
  refresh: load,
  languages,
  language,
  onSelectLocale,
}: ReturnType<typeof useQuizhubCatalog> & {
  scope: HubScope;
  languages: HubLocale[];
  language?: string;
  onSelectLocale: (locale: string) => void;
}) {
  const quizLibrary = useQuizLibrary();
  const knowledgeLibrary = useKnowledgeLibrary();
  const { refreshAfterSync } = useGoals();
  const { openQuizStart } = useQuizStartDialog();
  const isActive = useRef(false);
  const [conflict, setConflict] = useState<HubConflict | null>(null);
  const resolveConflict = useRef<((decision: HubResolution | null) => void) | null>(null);
  function finishConflict(decision: HubResolution | null) {
    const resolve = resolveConflict.current;
    if (!resolve) return;
    resolveConflict.current = null;
    setConflict(null);
    resolve(decision);
  }
  useLayoutEffect(() => {
    isActive.current = true;
    return () => {
      isActive.current = false;
      resolveConflict.current?.(null);
      resolveConflict.current = null;
    };
  }, []);

  const [isWorking, setIsWorking] = useState(false);
  const [downloadingKeys, setDownloadingKeys] = useState<ReadonlySet<string>>(new Set());
  const [domainId, setDomainId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<HubItem | null>(null);
  const previousLanguage = useRef(language);

  // Keep domain/category when switching editions; drop locale-specific UI only.
  useLayoutEffect(() => {
    if (previousLanguage.current === language) return;
    previousLanguage.current = language;
    setQuery("");
    setSelected(new Set());
    setPreviewItem(null);
    const resolve = resolveConflict.current;
    resolveConflict.current = null;
    setConflict(null);
    resolve?.(null);
  }, [language]);

  const activeLocale = catalog?.activeLocale;
  const manifestUrl = catalog?.manifestUrl;
  const selection = useMemo(() => activeLocale && manifestUrl
    ? { scope, locale: activeLocale, manifestUrl }
    : null, [scope, activeLocale, manifestUrl]);
  const canInstall = Boolean(selection);

  const grouped = useMemo(
    () => catalog ? groupHubDomains(catalog.domains, catalog.categories, catalog.items) : null,
    [catalog],
  );
  const domains = grouped?.domains ?? [];
  const activeDomain = domains.find((domain) => domain.id === domainId);
  const activeCategory = activeDomain?.categories.find((category) => category.id === categoryId) ??
    (grouped?.removed?.id === categoryId ? grouped?.removed : null);
  const updateCount = canInstall
    ? catalog?.items.filter((item) => item.state === "updateAvailable").length ?? 0
    : 0;
  const quizSources = useMemo(
    () => new Map(quizLibrary.quizzes.map((source) => [source.fileName, source])),
    [quizLibrary.quizzes],
  );

  async function afterChange() {
    await Promise.all([
      quizLibrary.refresh({ background: true }),
      knowledgeLibrary.refresh({ background: true }),
      refreshAfterSync(),
      load(false, true),
    ]);
  }

  async function download(items: HubItemRef[]) {
    if (!selection || !canInstall || items.length === 0 || isWorking || !isActive.current) return;
    setDownloadingKeys(new Set(items.map(hubItemKey)));
    setIsWorking(true);
    try {
      // Revalidate so renamed hub paths/ids are picked up before the download round-trip.
      await load(true, true);
      if (!isActive.current) return;
      const report = await nativeApi.hubDownload(selection, items);
      const pending = [...report.conflicts];
      while (pending.length > 0 && isActive.current) {
        const next = pending.shift()!;
        // Close preview first so its overlay does not sit above the conflict dialog.
        setPreviewItem(null);
        const decision = await new Promise<HubResolution | null>((resolve) => {
          resolveConflict.current = resolve;
          setConflict(next);
        });
        if (!decision) {
          report.skipped += 1;
          continue;
        }
        const result = await nativeApi.hubDownload(selection, [decision.item], decision);
        pending.unshift(...result.conflicts);
        report.added += result.added;
        report.updated += result.updated;
        report.unchanged += result.unchanged;
        report.skipped += result.skipped;
        report.failed += result.failed;
        report.outcomes.push(...result.outcomes);
      }
      notifyQuizhubChanged();
      if (!isActive.current) {
        await afterChange();
        return;
      }
      const summary = summarizeHubReport(report);
      const problems = report.outcomes.filter(
        (outcome) => outcome.result === "failed" || outcome.result === "skipped",
      );
      if (report.failed > 0 || report.skipped > 0) {
        const options = {
          description: problems.map((outcome) => `${outcome.title}: ${outcome.detail ?? outcome.result}`).join("\n"),
        };
        if (report.failed > 0) toast.error(summary, options);
        else toast.warning(summary, options);
      } else {
        toast.success(summary);
        setPreviewItem(null);
      }
      setSelected(new Set());
      await afterChange();
    } catch (error) {
      if (isActive.current) toast.error(errorMessage(error));
    } finally {
      if (isActive.current) {
        setDownloadingKeys(new Set());
        setIsWorking(false);
      }
    }
  }

  async function remove(item: HubItem, keepFile = false) {
    if (!selection || !canInstall || isWorking) return;
    if (!keepFile) {
      const approved = await confirm(
        `Delete "${item.title}" from your library? Any local edits will be deleted.`,
        { title: "Remove downloaded item?", kind: "warning" },
      );
      if (!approved) return;
    }
    if (!isActive.current) return;
    setIsWorking(true);
    try {
      await nativeApi.hubRemove(selection, item, { keepFile, force: !keepFile });
      notifyQuizhubChanged();
      if (!isActive.current) {
        await afterChange();
        return;
      }
      toast.success(keepFile ? `${item.title} is now a local file.` : `Removed ${item.title}.`);
      setPreviewItem(null);
      await afterChange();
    } catch (error) {
      if (isActive.current) toast.error(errorMessage(error));
    } finally {
      if (isActive.current) setIsWorking(false);
    }
  }

  function toggle(item: HubItem) {
    if (!canInstall || !isDownloadable(item.state)) return;
    setSelected((current) => {
      const next = new Set(current);
      const key = hubItemKey(item);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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
        title="QuizHub"
        description="Browse and download curated quizzes and notes."
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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <nav aria-label="Catalog location" className="min-w-0 text-sm">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                {activeDomain || activeCategory ? (
                  <button className="font-medium text-zinc-700 hover:underline" onClick={() => {
                    setDomainId(null);
                    setCategoryId(null);
                    setQuery("");
                    setSelected(new Set());
                  }}>QuizHub</button>
                ) : <span aria-current="location" className="font-semibold text-zinc-950">Domains</span>}
              </li>
              {activeDomain && (
                <li className="flex items-center gap-2">
                  <ChevronRight className="size-4 text-zinc-400" aria-hidden="true" />
                  {activeCategory ? (
                    <button className="font-medium text-zinc-700 hover:underline" onClick={() => {
                      setCategoryId(null);
                      setQuery("");
                      setSelected(new Set());
                    }}>{activeDomain.title}</button>
                  ) : <span aria-current="location" className="font-semibold text-zinc-950">{activeDomain.title}</span>}
                </li>
              )}
              {activeCategory && (
                <li aria-current="location" className="flex items-center gap-2 font-semibold text-zinc-950">
                  <ChevronRight className="size-4 text-zinc-400" aria-hidden="true" />
                  {activeCategory.title}
                </li>
              )}
            </ol>
          </nav>
          {languages.length > 0 && (
            <div className="flex items-center gap-2">
              <Languages className="size-4 text-zinc-600" aria-hidden="true" />
              <label htmlFor="quizhub-language" className="text-sm font-medium text-zinc-800">Language</label>
              <Select value={language} onValueChange={onSelectLocale}>
                <SelectTrigger id="quizhub-language" className="w-36 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {languages.map((edition) => (
                    <SelectItem key={edition.id} value={edition.id}>{edition.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
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
        ) : catalog.editionError ? (
          <ErrorState
            title="Couldn't load this edition"
            description={catalog.editionError}
            actionLabel="Try again"
            onAction={() => void load(true)}
          />
        ) : activeCategory ? (
          <CategoryView
            category={activeCategory}
            canInstall={canInstall}
            query={query}
            onQueryChange={setQuery}
            selected={selected}
            isWorking={isWorking}
            downloadingKeys={downloadingKeys}
            onToggle={toggle}
            onSelectAll={(items) =>
              setSelected(new Set(items.filter((item) => isDownloadable(item.state)).map(hubItemKey)))
            }
            onPreview={setPreviewItem}
            onDownload={(item) => void download([item])}
            onKeepAsLocal={(item) => void remove(item, true)}
          />
        ) : (
          activeDomain ? (
            <CategoryGrid categories={activeDomain.categories} onOpen={setCategoryId} />
          ) : (
            <DomainGrid
              domains={domains}
              removed={grouped?.removed}
              onOpen={setDomainId}
              onOpenRemoved={setCategoryId}
            />
          )
        )}
        {catalog && catalog.skipped.length > 0 && (
          <p className="mt-4 text-xs text-zinc-500">
            {catalog.skipped.length} item(s) need a newer Quizzy and were hidden: {catalog.skipped.join(", ")}
          </p>
        )}
      </div>

      <QuizhubConflictDialog conflict={conflict} onResolve={finishConflict} />

      <QuizhubPreviewDialog
        item={previewItem}
        selection={selection}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPreviewItem(null);
        }}
        isDownloading={Boolean(previewItem && downloadingKeys.has(hubItemKey(previewItem)))}
        isWorking={isWorking}
        onDownload={canInstall ? (item) => void download([item]) : undefined}
        onRemove={canInstall ? (item) => void remove(item) : undefined}
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

function DomainGrid({
  domains,
  removed,
  onOpen,
  onOpenRemoved,
}: {
  domains: HubDomainView[];
  removed?: HubCategoryView;
  onOpen: (id: string) => void;
  onOpenRemoved: (id: string) => void;
}) {
  if (domains.length === 0 && !removed) {
    return <EmptyState title="QuizHub is empty" description="No categories are published in this edition yet." />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {domains.map((domain) => (
        <button key={domain.id} type="button" onClick={() => onOpen(domain.id)} className={catalogTileClass}>
          <ChevronRight className={tileArrowClass} aria-hidden="true" />
          <span className="flex items-center gap-2 text-base font-semibold text-zinc-950">
            <FolderOpen className="size-4 text-zinc-500" aria-hidden="true" />
            {domain.title}
          </span>
          <span className="text-xs text-zinc-500">
            {domain.categories.length} {domain.categories.length === 1 ? "category" : "categories"}
          </span>
        </button>
      ))}
      {removed && (
        <button type="button" onClick={() => onOpenRemoved(removed.id)} className={catalogTileClass}>
          <ChevronRight className={tileArrowClass} aria-hidden="true" />
          <span className="text-base font-semibold text-zinc-950">{removed.title}</span>
          <span className="text-xs text-zinc-500">
            {removed.items.length} {removed.items.length === 1 ? "item" : "items"} kept in this library
          </span>
        </button>
      )}
    </div>
  );
}

const tileArrowClass = "absolute right-4 top-4 size-4 text-zinc-500 transition-transform group-hover:translate-x-0.5";

const catalogTileClass =
  "group relative flex min-h-24 flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 pr-10 text-left shadow-sm transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-sky-600";

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
          className={catalogTileClass}
        >
          <ChevronRight className={tileArrowClass} aria-hidden="true" />
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
  canInstall,
  query,
  onQueryChange,
  selected,
  isWorking,
  downloadingKeys,
  onToggle,
  onSelectAll,
  onPreview,
  onDownload,
  onKeepAsLocal,
}: {
  category: HubCategoryView;
  canInstall: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  selected: ReadonlySet<string>;
  isWorking: boolean;
  downloadingKeys: ReadonlySet<string>;
  onToggle: (item: HubItem) => void;
  onSelectAll: (items: HubItem[]) => void;
  onPreview: (item: HubItem) => void;
  onDownload: (item: HubItem) => void;
  onKeepAsLocal: (item: HubItem) => void;
}) {
  const items = filterHubItems(category.items, query);
  const quizzes = items.filter((item) => item.kind === "quiz");
  const notes = items.filter((item) => item.kind === "note");
  const selectable = canInstall ? items.filter((item) => isDownloadable(item.state)) : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-zinc-950">{category.title}</h2>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SearchField
            value={query}
            onChange={onQueryChange}
            placeholder="Search this category"
            className="w-full sm:w-64"
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
              canInstall={canInstall}
              selected={selected}
              isWorking={isWorking}
              downloadingKeys={downloadingKeys}
              onToggle={onToggle}
              onPreview={onPreview}
              onDownload={onDownload}
              onKeepAsLocal={onKeepAsLocal}
            />
          )}
          {notes.length > 0 && (
            <HubItemSection
              title="Knowledge"
              icon={BookOpen}
              items={notes}
              canInstall={canInstall}
              selected={selected}
              isWorking={isWorking}
              downloadingKeys={downloadingKeys}
              onToggle={onToggle}
              onPreview={onPreview}
              onDownload={onDownload}
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
  canInstall,
  selected,
  isWorking,
  downloadingKeys,
  onToggle,
  onPreview,
  onDownload,
  onKeepAsLocal,
}: {
  title: string;
  icon: LucideIcon;
  items: HubItem[];
  canInstall: boolean;
  selected: ReadonlySet<string>;
  isWorking: boolean;
  downloadingKeys: ReadonlySet<string>;
  onToggle: (item: HubItem) => void;
  onPreview: (item: HubItem) => void;
  onDownload: (item: HubItem) => void;
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
          const canSelect = canInstall && isDownloadable(item.state);
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
              {canInstall && (
                <ItemActions
                  item={item}
                  disabled={isWorking}
                  isDownloading={downloadingKeys.has(key)}
                  onDownload={onDownload}
                  onKeepAsLocal={onKeepAsLocal}
                />
              )}
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
  onKeepAsLocal,
}: {
  item: HubItem;
  disabled: boolean;
  isDownloading: boolean;
  onDownload: (item: HubItem) => void;
  onKeepAsLocal: (item: HubItem) => void;
}) {
  const downloadIcon = isDownloading ? (
    <Spinner className="size-3.5" />
  ) : (
    <Download className="size-3.5" />
  );

  if (item.state === "removedRemotely") {
    return <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onKeepAsLocal(item)}>Keep as local</Button>;
  }
  if (item.state === "installed") return null;

  const label = item.state === "updateAvailable" ? "Update" : "Download";
  return (
    <Button
      size="sm"
      className="min-w-9 justify-center sm:min-w-28"
      variant={item.state === "updateAvailable" ? "default" : "outline"}
      aria-label={`${label} ${item.title}`}
      title={label}
      disabled={disabled}
      onClick={() => onDownload(item)}
    >
      {downloadIcon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
