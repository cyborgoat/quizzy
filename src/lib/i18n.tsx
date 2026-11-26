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
