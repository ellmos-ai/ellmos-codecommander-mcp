import { afterEach, describe, expect, it, vi } from "vitest";
import { getLanguage, getSupportedLanguages, setLanguage, t, type Lang } from "../src/i18n/index.js";
import { CC_LANGUAGE_ENUM, getLanguageReport } from "../src/index.js";

const localizedExpectations = {
  es: {
    serverStarted: "Servidor MCP ellmos CodeCommander iniciado",
    validAfterRepair: "\u2705 Válido después de la reparación",
    noMatches: "No se encontraron coincidencias.",
  },
  zh: {
    serverStarted: "ellmos CodeCommander MCP 服务器已启动",
    validAfterRepair: "\u2705 修复后有效",
    noMatches: "未找到匹配。",
  },
  ja: {
    serverStarted: "ellmos CodeCommander MCP サーバーを開始しました",
    validAfterRepair: "\u2705 修復後は有効です",
    noMatches: "一致は見つかりませんでした。",
  },
  ru: {
    serverStarted: "MCP-сервер ellmos CodeCommander запущен",
    validAfterRepair: "\u2705 Корректно после восстановления",
    noMatches: "Совпадения не найдены.",
  },
  fr: {
    serverStarted: "Serveur MCP ellmos CodeCommander démarré",
    validAfterRepair: "✅ Valide après réparation",
    noMatches: "Aucune correspondance trouvée.",
  },
  hi: {
    serverStarted: "ellmos CodeCommander MCP सर्वर शुरू हुआ",
    validAfterRepair: "✅ मरम्मत के बाद वैध",
    noMatches: "कोई मेल नहीं मिला।",
  },
  ar: {
    serverStarted: "بدأ تشغيل خادم MCP ellmos CodeCommander",
    validAfterRepair: "✅ صالح بعد الإصلاح",
    noMatches: "لم يُعثر على تطابقات.",
  },
  bn: {
    serverStarted: "ellmos CodeCommander MCP সার্ভার চালু হয়েছে",
    validAfterRepair: "✅ মেরামতের পরে বৈধ",
    noMatches: "কোনো মিল পাওয়া যায়নি।",
  },
  pt: {
    serverStarted: "Servidor MCP ellmos CodeCommander iniciado",
    validAfterRepair: "✅ Válido após a reparação",
    noMatches: "Nenhuma correspondência encontrada.",
  },
};

const newLocales = ["fr", "hi", "ar", "bn", "pt"] as const;

async function loadI18nForLanguage(language: string | undefined) {
  const previous = process.env.CC_LANGUAGE;
  if (language === undefined) delete process.env.CC_LANGUAGE;
  else process.env.CC_LANGUAGE = language;

  vi.resetModules();
  try {
    return await import("../src/i18n/index.js");
  } finally {
    if (previous === undefined) delete process.env.CC_LANGUAGE;
    else process.env.CC_LANGUAGE = previous;
    vi.resetModules();
  }
}

describe("i18n language packs", () => {
  afterEach(() => {
    setLanguage("de");
  });

  it("exposes all supported language codes in stable order", () => {
    expect(getSupportedLanguages()).toEqual(["de", "en", "es", "zh", "ja", "ru", "fr", "hi", "ar", "bn", "pt"]);
  });

  it("uses the runtime language list as the cc_set_language MCP enum", () => {
    const supported = getSupportedLanguages();
    expect(CC_LANGUAGE_ENUM.options).toEqual(supported);
    for (const language of supported) {
      expect(CC_LANGUAGE_ENUM.parse(language)).toBe(language);
    }
    expect(CC_LANGUAGE_ENUM.safeParse("xx").success).toBe(false);
  });

  for (const language of newLocales) {
    it(`selects ${language} at startup through CC_LANGUAGE`, async () => {
      const freshI18n = await loadI18nForLanguage(language);
      expect(freshI18n.getLanguage()).toBe(language);
      expect(freshI18n.t().common.serverStarted).toContain(localizedExpectations[language].serverStarted);
    });
  }

  it("uses German when CC_LANGUAGE is missing or unsupported", async () => {
    for (const language of [undefined, "xx"]) {
      const freshI18n = await loadI18nForLanguage(language);
      expect(freshI18n.getLanguage()).toBe("de");
      expect(freshI18n.t().common.serverStarted).toBe("🚀 ellmos CodeCommander MCP Server gestartet");
    }
  });

  it("uses German after an explicit language reset", () => {
    setLanguage("de");
    expect(getLanguage()).toBe("de");
    expect(t().common.serverStarted).toBe("\uD83D\uDE80 ellmos CodeCommander MCP Server gestartet");
  });

  for (const [lang, expected] of Object.entries(localizedExpectations) as Array<[Exclude<Lang, "de" | "en">, typeof localizedExpectations.es]>) {
    it(`uses real ${lang} translations instead of English fallback`, () => {
      setLanguage(lang);

      expect(t().common.serverStarted).toContain(expected.serverStarted);
      expect(t().cc_fix_json.validAfterRepair).toBe(expected.validAfterRepair);
      expect(t().cc_regex_test.noMatches).toBe(expected.noMatches);
      expect(t().common.serverStarted).not.toContain("Server started");
      expect(t().cc_regex_test.noMatches).not.toBe("No matches found.");
    });
  }

  it("keeps placeholder interpolation intact across non-English languages", () => {
    setLanguage("zh");
    expect(t().cc_validate_json.positionInfo(12, 3)).toContain("12");
    expect(t().cc_validate_json.positionInfo(12, 3)).toContain("3");

    setLanguage("ru");
    expect(t().cc_diff_files.linesChanged(4, 2)).toContain("4");
    expect(t().cc_diff_files.linesChanged(4, 2)).toContain("2");

    setLanguage("es");
    expect(t().cc_fix_json.stillInvalid("coma")).toContain("coma");

    for (const language of newLocales) {
      setLanguage(language);
      const classInfo = t().cc_analyze_code.classInfo("Widget", "Base", 12, 24, 3);
      expect(classInfo).toContain("WidgetBase");
      expect(classInfo).toContain("12");
      expect(classInfo).toContain("24");
      expect(classInfo).toContain("3");
      expect(t().cc_validate_json.positionInfo(12, 3)).toContain("12");
      expect(t().cc_validate_json.positionInfo(12, 3)).toContain("3");
      expect(t().cc_diff_files.linesChanged(4, 2)).toContain("4");
      expect(t().cc_diff_files.linesChanged(4, 2)).toContain("2");
      expect(t().cc_fix_json.stillInvalid("trailing comma")).toContain("trailing comma");
    }
  });

  it("formats languageGet output correctly across languages", () => {
    const supported = getSupportedLanguages();
    setLanguage("de");
    expect(t().cc_set_language.languageGet("de", supported)).toContain("Aktuelle Sprache: de");
    setLanguage("en");
    expect(t().cc_set_language.languageGet("en", supported)).toContain("Current language: en");
    setLanguage("es");
    expect(t().cc_set_language.languageGet("es", supported)).toContain("Idioma actual: es");
    setLanguage("zh");
    expect(t().cc_set_language.languageGet("zh", supported)).toContain("当前语言: zh");
    setLanguage("ja");
    expect(t().cc_set_language.languageGet("ja", supported)).toContain("現在の言語: ja");
    setLanguage("ru");
    expect(t().cc_set_language.languageGet("ru", supported)).toContain("Текущий язык: ru");
  });

  it("cc_get_language reports the full supported list for every locale", () => {
    const supportedText = getSupportedLanguages().join(", ");
    for (const language of getSupportedLanguages()) {
      setLanguage(language);
      const report = getLanguageReport();
      expect(report).toContain(language);
      expect(report).toContain(supportedText);
    }
  });
});
