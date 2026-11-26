import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AppLocale } from "@/lib/locale";

const messages = {
  en: {
    "nav.home": "Home",
    "nav.mistakes": "Mistake Log",
    "nav.knowledge": "Knowledge",
    "nav.history": "History",
    "nav.quizhub": "Quizhub",
    "nav.settings": "Settings",
    "nav.toggleSidebar": "Toggle sidebar",
    "home.greeting": "Hello, {name}",
    "home.greetingFallback": "there",
    "home.subtitle": "Ready to practice? Pick a quiz below and get started.",
    "home.welcomeTitle": "Welcome to Quizzy",
    "home.welcomeDescription":
      "Choose your language, then pick a folder for quizzes and notes. Quizzy will add a short Welcome quiz and knowledge note in that language.",
    "home.languageLabel": "Language",
    "home.languageHint":
      "Sets the app interface, QuizHub catalog (when available), and the Welcome quiz language.",
    "home.chooseDirectory": "Choose working directory",
    "home.choosingDirectory": "Choosing…",
    "home.openSettings": "Open Settings",
    "home.unavailableTitle": "Working directory unavailable",
    "home.unavailableDescription":
      "Quizzy could not access the configured directory. Choose a different folder or update it in Settings.",
    "settings.languageTitle": "Language",
    "settings.languageDescription":
      "App interface language. Also used as the default QuizHub edition and Welcome sample language.",
    "settings.reset.title": "Reset",
    "settings.reset.description":
      "Wipe Quizzy data at different levels. Quiz and knowledge files in your working folder are never deleted.",
    "settings.reset.action": "Reset…",
    "settings.reset.cancel": "Cancel",
    "settings.reset.working": "Working…",
    "settings.reset.quizhubCache": "QuizHub cache",
    "settings.reset.quizhubCacheDescription":
      "Clear temporary catalog and manifest downloads. Installed quizzes and notes stay.",
    "settings.reset.studyHistory": "Study progress",
    "settings.reset.studyHistoryDescription":
      "Delete goals, attempts, and Mistake Log data for the current working directory.",
    "settings.reset.libraryMetadata": "Library metadata",
    "settings.reset.libraryMetadataDescription":
      "Clear study progress, favorites, archives, knowledge views, and QuizHub install records for this folder. Files stay on disk.",
    "settings.reset.factory": "Factory reset",
    "settings.reset.factoryDescription":
      "Wipe all Quizzy app data and preferences, then return to first launch. Your working-folder files are kept.",
    "settings.reset.confirmQuizhubCache":
      "Clear the QuizHub cache? Catalogs will be downloaded again next time you browse.",
    "settings.reset.confirmStudyHistory":
      "Delete all study progress for this working directory? Goals, attempts, and Mistake Log data will be removed. This cannot be undone.",
    "settings.reset.confirmLibraryMetadata":
      "Clear library metadata for this folder? Study progress, favorites, archives, knowledge views, and QuizHub install records will be removed. Quiz and knowledge files stay. This cannot be undone.",
    "settings.reset.confirmFactory":
      "Factory-reset Quizzy? All app data and preferences will be wiped and the app will restart at first launch. Files in your working folder are not deleted. This cannot be undone.",
    "settings.reset.doneQuizhubCache": "QuizHub cache cleared.",
    "settings.reset.doneStudyHistory": "Study progress cleared.",
    "settings.reset.doneLibraryMetadata": "Library metadata cleared.",
    "toast.directoryReadyWelcome":
      "Working directory ready. Added Welcome to Quizzy to get you started.",
    "toast.directoryReady": "Working directory ready.",
    "toast.directoryUpdatedWelcome": "Working directory updated. Added Welcome to Quizzy.",
    "toast.directoryUpdated": "Working directory updated.",
    "toast.welcomeAdded": "Added Welcome to Quizzy.",
    "toast.welcomeExists": "Welcome to Quizzy is already in your folder.",
  },
  zh: {
    "nav.home": "首页",
    "nav.mistakes": "错题本",
    "nav.knowledge": "知识",
    "nav.history": "历史",
    "nav.quizhub": "QuizHub",
    "nav.settings": "设置",
    "nav.toggleSidebar": "展开/收起侧边栏",
    "home.greeting": "你好，{name}",
    "home.greetingFallback": "朋友",
    "home.subtitle": "准备好练习了吗？选择下方测验开始吧。",
    "home.welcomeTitle": "欢迎使用 Quizzy",
    "home.welcomeDescription":
      "先选择语言，再选择存放测验与笔记的文件夹。Quizzy 会用该语言添加一份欢迎测验和知识笔记。",
    "home.languageLabel": "语言",
    "home.languageHint": "同时用于应用界面、QuizHub 目录（若可用）以及欢迎测验语言。",
    "home.chooseDirectory": "选择工作目录",
    "home.choosingDirectory": "选择中…",
    "home.openSettings": "打开设置",
    "home.unavailableTitle": "无法访问工作目录",
    "home.unavailableDescription":
      "Quizzy 无法访问当前配置的目录。请另选文件夹，或在设置中更新。",
    "settings.languageTitle": "语言",
    "settings.languageDescription":
      "应用界面语言，并作为 QuizHub 默认语言与欢迎示例内容的语言。",
    "settings.reset.title": "重置",
    "settings.reset.description":
      "按不同级别清除 Quizzy 数据。工作文件夹中的测验与知识文件不会被删除。",
    "settings.reset.action": "重置…",
    "settings.reset.cancel": "取消",
    "settings.reset.working": "处理中…",
    "settings.reset.quizhubCache": "QuizHub 缓存",
    "settings.reset.quizhubCacheDescription":
      "清除临时目录与清单下载缓存。已安装的测验与笔记会保留。",
    "settings.reset.studyHistory": "学习进度",
    "settings.reset.studyHistoryDescription":
      "删除当前工作目录的目标、作答记录与错题本数据。",
    "settings.reset.libraryMetadata": "题库元数据",
    "settings.reset.libraryMetadataDescription":
      "清除本文件夹的学习进度、收藏、归档、知识浏览次数与 QuizHub 安装记录。磁盘上的文件会保留。",
    "settings.reset.factory": "恢复出厂设置",
    "settings.reset.factoryDescription":
      "清除全部 Quizzy 应用数据与偏好，并回到首次启动。工作文件夹中的文件会保留。",
    "settings.reset.confirmQuizhubCache":
      "清除 QuizHub 缓存？下次浏览时会重新下载目录。",
    "settings.reset.confirmStudyHistory":
      "删除当前工作目录的全部学习进度？目标、作答记录与错题本数据将被移除，且无法恢复。",
    "settings.reset.confirmLibraryMetadata":
      "清除本文件夹的题库元数据？学习进度、收藏、归档、知识浏览次数与 QuizHub 安装记录将被移除。测验与知识文件会保留，且无法恢复。",
    "settings.reset.confirmFactory":
      "将 Quizzy 恢复出厂设置？全部应用数据与偏好将被清除，应用会回到首次启动。工作文件夹中的文件不会删除，且无法恢复。",
    "settings.reset.doneQuizhubCache": "已清除 QuizHub 缓存。",
    "settings.reset.doneStudyHistory": "已清除学习进度。",
    "settings.reset.doneLibraryMetadata": "已清除题库元数据。",
    "toast.directoryReadyWelcome": "工作目录已就绪，并已添加「欢迎使用 Quizzy」。",
    "toast.directoryReady": "工作目录已就绪。",
    "toast.directoryUpdatedWelcome": "工作目录已更新，并已添加「欢迎使用 Quizzy」。",
    "toast.directoryUpdated": "工作目录已更新。",
    "toast.welcomeAdded": "已添加「欢迎使用 Quizzy」。",
    "toast.welcomeExists": "「欢迎使用 Quizzy」已在你的文件夹中。",
  },
} as const;

export type MessageKey = keyof (typeof messages)["en"];

type I18nValue = {
  locale: AppLocale;
  t: (key: MessageKey, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(() => {
    const table = messages[locale] ?? messages.en;
    return {
      locale,
      t: (key, vars) => {
        let text: string = table[key] ?? messages.en[key] ?? key;
        if (vars) {
          for (const [name, value] of Object.entries(vars)) {
            text = text.replaceAll(`{${name}}`, value);
          }
        }
        return text;
      },
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used within I18nProvider");
  return value;
}
