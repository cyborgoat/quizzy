import { Suspense, lazy, useEffect, useRef, type ComponentProps } from "react";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  CodeToggle,
  ConditionalContents,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertCodeBlock,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  Separator,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  tablePlugin,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import { CODE_BLOCK_LANGUAGES } from "@/lib/codeBlockLanguages";
import { cn } from "@/lib/utils";

function handleEditorTableWheel(wrapper: HTMLElement, event: WheelEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.closest("table")) return;

  const inner = wrapper.querySelector<HTMLElement>(".mdxeditor-root-contenteditable");
  let scrollContainer: HTMLElement | null =
    inner && inner.scrollHeight > inner.clientHeight ? inner : null;

  if (!scrollContainer) {
    let node: HTMLElement | null = target.parentElement;
    while (node && wrapper.contains(node)) {
      const { overflowY } = getComputedStyle(node);
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        node.scrollHeight > node.clientHeight
      ) {
        scrollContainer = node;
        break;
      }
      node = node.parentElement;
    }
  }

  scrollContainer ??= document.scrollingElement as HTMLElement | null;
  if (!scrollContainer) return;

  const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
  if (maxScroll <= 0) return;

  const nextScrollTop = Math.min(
    maxScroll,
    Math.max(0, scrollContainer.scrollTop + event.deltaY),
  );

  if (nextScrollTop !== scrollContainer.scrollTop) {
    scrollContainer.scrollTop = nextScrollTop;
    event.preventDefault();
  }
}

function KnowledgeMarkdownEditorToolbar() {
  return (
    <DiffSourceToggleWrapper options={["rich-text", "source"]}>
      <ConditionalContents
        options={[
          {
            when: (editor) => editor?.editorType === "codeblock",
            contents: () => <ChangeCodeMirrorLanguage />,
          },
          {
            fallback: () => (
              <>
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertTable />
                <InsertThematicBreak />
                <InsertCodeBlock />
              </>
            ),
          },
        ]}
      />
    </DiffSourceToggleWrapper>
  );
}

const editorPlugins = [
  headingsPlugin(),
  quotePlugin(),
  listsPlugin(),
  thematicBreakPlugin(),
  markdownShortcutPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  tablePlugin(),
  codeBlockPlugin({ defaultCodeBlockLanguage: "txt" }),
  codeMirrorPlugin({ codeBlockLanguages: CODE_BLOCK_LANGUAGES }),
  diffSourcePlugin({ viewMode: "rich-text" }),
  toolbarPlugin({
    toolbarContents: () => <KnowledgeMarkdownEditorToolbar />,
    toolbarClassName: "knowledge-mdx-toolbar",
  }),
];

export function KnowledgeMarkdownEditor({
  value,
  onChange,
  disabled = false,
  fillHeight = false,
  className,
}: {
  value: string;
  onChange: (markdown: string) => void;
  disabled?: boolean;
  fillHeight?: boolean;
  className?: string;
}) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    if (value === lastEmittedRef.current) {
      return;
    }
    editorRef.current?.setMarkdown(value);
    lastEmittedRef.current = value;
  }, [value]);

  useEffect(() => {
    const wrapper = editorWrapperRef.current;
    if (!wrapper) return;

    const onWheel = (event: WheelEvent) => handleEditorTableWheel(wrapper, event);

    wrapper.addEventListener("wheel", onWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", onWheel);
  }, []);

  function handleChange(markdown: string) {
    lastEmittedRef.current = markdown;
    onChange(markdown);
  }

  return (
    <div
      ref={editorWrapperRef}
      className={cn(
        "knowledge-mdx-editor mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/50",
        fillHeight && "knowledge-mdx-editor-fill flex min-h-0 flex-1 flex-col",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={handleChange}
        readOnly={disabled}
        placeholder="Write your notes… Use $…$ or $$…$$ for math (rendered in view mode)."
        contentEditableClassName="knowledge-prose knowledge-mdx-content"
        className="knowledge-mdx-root"
        plugins={editorPlugins}
      />
    </div>
  );
}

const LazyKnowledgeMarkdownEditor = lazy(async () => ({
  default: KnowledgeMarkdownEditor,
}));

export function KnowledgeMarkdownEditorLazy(
  props: ComponentProps<typeof KnowledgeMarkdownEditor>,
) {
  return (
    <Suspense
      fallback={
        <div
          className={cn(
            "mt-1 rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500",
            props.fillHeight && "flex min-h-0 flex-1 items-center justify-center",
          )}
        >
          Loading editor…
        </div>
      }
    >
      <LazyKnowledgeMarkdownEditor {...props} />
    </Suspense>
  );
}
