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

/** Spanish strings for the built-in MDXEditor UI. */
const esStrings: Record<string, string> = {
  "codeBlock.inlineLanguage": "Idioma",
  "codeBlock.language": "Idioma del bloque de código",
  "codeBlock.selectLanguage": "Seleccionar idioma del bloque de código",
  "codeblock.delete": "Eliminar bloque de código",
  "contentArea.editableMarkdown": "Markdown editable",
  "createLink.cancelTooltip": "Cancelar cambios",
  "createLink.saveTooltip": "Establecer enlace",
  "createLink.text": "Texto del enlace",
  "createLink.textTooltip": "Texto que se muestra para el enlace",
  "createLink.title": "Título del enlace",
  "createLink.titleTooltip": "Atributo title del enlace, visible al pasar el cursor",
  "createLink.url": "URL",
  "createLink.urlPlaceholder": "Seleccionar o pegar URL",
  "dialog.close": "Cerrar diálogo",
  "dialogControls.cancel": "Cancelar",
  "dialogControls.save": "Guardar",
  "linkPreview.copied": "¡Copiado!",
  "linkPreview.copyToClipboard": "Copiar al portapapeles",
  "linkPreview.edit": "Editar dirección del enlace",
  "linkPreview.open": "Abrir {{url}} en una ventana nueva",
  "linkPreview.remove": "Quitar enlace",
  "table.alignCenter": "Alinear al centro",
  "table.alignLeft": "Alinear a la izquierda",
  "table.alignRight": "Alinear a la derecha",
  "table.columnMenu": "Menú de columna",
  "table.deleteColumn": "Eliminar esta columna",
  "table.deleteRow": "Eliminar esta fila",
  "table.deleteTable": "Eliminar tabla",
  "table.insertColumnLeft": "Insertar columna a la izquierda",
  "table.insertColumnRight": "Insertar columna a la derecha",
  "table.insertRowAbove": "Insertar fila arriba",
  "table.insertRowBelow": "Insertar fila abajo",
  "table.rowMenu": "Menú de fila",
  "table.textAlignment": "Alineación del texto",
  "toolbar.blockTypeSelect.placeholder": "Tipo de bloque",
  "toolbar.blockTypeSelect.selectBlockTypeTooltip": "Seleccionar tipo de bloque",
  "toolbar.blockTypes.heading": "Título {{level}}",
  "toolbar.blockTypes.paragraph": "Párrafo",
  "toolbar.blockTypes.quote": "Cita",
  "toolbar.bold": "Negrita",
  "toolbar.bulletedList": "Lista con viñetas",
  "toolbar.checkList": "Lista de tareas",
  "toolbar.codeBlock": "Insertar bloque de código",
  "toolbar.diffMode": "Modo comparación",
  "toolbar.inlineCode": "Código en línea",
  "toolbar.italic": "Cursiva",
  "toolbar.link": "Crear enlace",
  "toolbar.numberedList": "Lista numerada",
  "toolbar.redo": "Rehacer {{shortcut}}",
  "toolbar.removeBold": "Quitar negrita",
  "toolbar.removeInlineCode": "Quitar formato de código",
  "toolbar.removeItalic": "Quitar cursiva",
  "toolbar.removeStrikethrough": "Quitar tachado",
  "toolbar.removeUnderline": "Quitar subrayado",
  "toolbar.richText": "Texto enriquecido",
  "toolbar.source": "Modo código fuente",
  "toolbar.strikethrough": "Tachado",
  "toolbar.table": "Insertar tabla",
  "toolbar.thematicBreak": "Insertar línea horizontal",
  "toolbar.toggleGroup": "Grupo de conmutación",
  "toolbar.underline": "Subrayado",
  "toolbar.undo": "Deshacer {{shortcut}}",
};

function interpolate(template: string, values?: Record<string, unknown>) {
  if (!values) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

const zhTranslation: Translation = (key, defaultValue, interpolations) =>
  interpolate(zhStrings[key] ?? defaultValue, interpolations);

const esTranslation: Translation = (key, defaultValue, interpolations) =>
  interpolate(esStrings[key] ?? defaultValue, interpolations);

const enTranslation: Translation = (_key, defaultValue, interpolations) =>
  interpolate(defaultValue, interpolations);

export function getMdxEditorTranslation(locale: AppLocale): Translation {
  if (locale === "zh") return zhTranslation;
  if (locale === "es") return esTranslation;
  return enTranslation;
}
