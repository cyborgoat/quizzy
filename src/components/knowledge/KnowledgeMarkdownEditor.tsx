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
import { shouldSyncKnowledgeEditorMarkdown } from "@/lib/knowledgeMarkdownEditorSync";
import { cn } from "@/lib/utils";

const CODE_BLOCK_LANGUAGES = {
  txt: "Plain text",
  js: "JavaScript",
  ts: "TypeScript",
  tsx: "TypeScript (React)",
  css: "CSS",
  json: "JSON",
  bash: "Bash",
  python: "Python",
} as const;

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
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    if (!shouldSyncKnowledgeEditorMarkdown(value, lastEmittedRef.current)) {
      return;
    }
    editorRef.current?.setMarkdown(value);
    lastEmittedRef.current = value;
  }, [value]);

  function handleChange(markdown: string) {
    lastEmittedRef.current = markdown;
    onChange(markdown);
  }

  return (
    <div
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
