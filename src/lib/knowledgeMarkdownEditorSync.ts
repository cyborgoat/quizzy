export function shouldSyncKnowledgeEditorMarkdown(
  externalValue: string,
  lastEmittedValue: string,
) {
  return externalValue !== lastEmittedValue;
}
