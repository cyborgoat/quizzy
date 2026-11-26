import type { Translation } from "@mdxeditor/editor";
import type { AppLocale } from "@/lib/locale";

/** Simplified Chinese strings for the built-in MDXEditor UI. English uses the library defaults. */
const zhStrings: Record<string, string> = {
  "codeBlock.inlineLanguage": "语言",
  "codeBlock.language": "代码块语言",
  "codeBlock.selectLanguage": "选择代码块语言",
  "codeblock.delete": "删除代码块",
  "contentArea.editableMarkdown": "可编辑的 Markdown",
  "createLink.cancelTooltip": "取消更改",
  "createLink.saveTooltip": "设置链接",
  "createLink.text": "链接文字",
  "createLink.textTooltip": "链接显示的文字",
  "createLink.title": "链接标题",
  "createLink.titleTooltip": "链接的 title 属性，悬停时显示",
  "createLink.url": "URL",
  "createLink.urlPlaceholder": "选择或粘贴 URL",
  "dialog.close": "关闭对话框",
  "dialogControls.cancel": "取消",
  "dialogControls.save": "保存",
  "linkPreview.copied": "已复制！",
  "linkPreview.copyToClipboard": "复制到剪贴板",
  "linkPreview.edit": "编辑链接地址",
  "linkPreview.open": "在新窗口中打开 {{url}}",
  "linkPreview.remove": "移除链接",
  "table.alignCenter": "居中对齐",
  "table.alignLeft": "左对齐",
  "table.alignRight": "右对齐",
  "table.columnMenu": "列菜单",
  "table.deleteColumn": "删除此列",
  "table.deleteRow": "删除此行",
  "table.deleteTable": "删除表格",
  "table.insertColumnLeft": "在左侧插入列",
  "table.insertColumnRight": "在右侧插入列",
  "table.insertRowAbove": "在上方插入行",
  "table.insertRowBelow": "在下方插入行",
  "table.rowMenu": "行菜单",
  "table.textAlignment": "文字对齐",
  "toolbar.blockTypeSelect.placeholder": "块类型",
  "toolbar.blockTypeSelect.selectBlockTypeTooltip": "选择块类型",
  "toolbar.blockTypes.heading": "标题 {{level}}",
  "toolbar.blockTypes.paragraph": "正文",
  "toolbar.blockTypes.quote": "引用",
  "toolbar.bold": "加粗",
  "toolbar.bulletedList": "无序列表",
  "toolbar.checkList": "任务列表",
  "toolbar.codeBlock": "插入代码块",
  "toolbar.diffMode": "对比模式",
  "toolbar.inlineCode": "行内代码格式",
  "toolbar.italic": "斜体",
  "toolbar.link": "创建链接",
  "toolbar.numberedList": "有序列表",
  "toolbar.redo": "重做 {{shortcut}}",
  "toolbar.removeBold": "取消加粗",
  "toolbar.removeInlineCode": "取消代码格式",
  "toolbar.removeItalic": "取消斜体",
  "toolbar.removeStrikethrough": "取消删除线",
  "toolbar.removeUnderline": "取消下划线",
  "toolbar.richText": "富文本",
  "toolbar.source": "源码模式",
  "toolbar.strikethrough": "删除线",
  "toolbar.table": "插入表格",
  "toolbar.thematicBreak": "插入分隔线",
  "toolbar.toggleGroup": "切换组",
  "toolbar.underline": "下划线",
  "toolbar.undo": "撤销 {{shortcut}}",
};

function interpolate(template: string, values?: Record<string, unknown>) {
  if (!values) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

const zhTranslation: Translation = (key, defaultValue, interpolations) =>
  interpolate(zhStrings[key] ?? defaultValue, interpolations);

const enTranslation: Translation = (_key, defaultValue, interpolations) =>
  interpolate(defaultValue, interpolations);

export function getMdxEditorTranslation(locale: AppLocale): Translation {
  return locale === "zh" ? zhTranslation : enTranslation;
}
