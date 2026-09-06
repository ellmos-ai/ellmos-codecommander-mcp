import { afterEach, describe, expect, it } from "vitest";
import { getLanguage, getSupportedLanguages, setLanguage, t, type Lang } from "../src/i18n/index.js";

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
};

describe("i18n language packs", () => {
  afterEach(() => {
    setLanguage("de");
  });

  it("exposes all supported language codes in stable order", () => {
    expect(getSupportedLanguages()).toEqual(["de", "en", "es", "zh", "ja", "ru"]);
  });

  it("defaults back to German after tests reset the language", () => {
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
});
