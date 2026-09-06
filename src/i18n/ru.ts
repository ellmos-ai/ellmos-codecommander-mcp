import type { Translations } from './types.js';

export const ru: Translations = {
  common: {
    fileNotFound: (path) => `\u274C Файл не найден: ${path}`,
    sourceFileNotFound: (path) => `\u274C Исходный файл не найден: ${path}`,
    pathNotFound: (path) => `\u274C Путь не найден: ${path}`,
    error: (msg) => `\u274C Ошибка: ${msg}`,
    serverStarted: '\uD83D\uDE80 MCP-сервер ellmos CodeCommander запущен',
  },

  cc_analyze_code: {
    header: (filename) => `\uD83D\uDD0D **Анализ кода: ${filename}**`,
    metricTotalLines: 'Всего строк',
    metricCodeLines: 'Строк кода',
    metricCommentLines: 'Строк комментариев',
    metricBlankLines: 'Пустых строк',
    metricClasses: 'Классы',
    metricFunctions: 'Функции',
    metricImports: 'Импорты',
    metricCyclomaticComplexity: 'Цикломатическая сложность',
    metricFileSize: 'Размер файла',
    classesHeader: '**Классы:**',
    classInfo: (name, bases, startLine, endLine, methodCount) =>
      `  \uD83D\uDCE6 **${name}${bases}** (стр. ${startLine}-${endLine}, методов: ${methodCount})`,
    classMethods: (methods) => `    Методы: ${methods}`,
    functionsHeader: '**Функции:**',
    functionInfo: (asyncPrefix, name, params, startLine, endLine) =>
      `  \u2699\uFE0F ${asyncPrefix}**${name}**(${params}) (стр. ${startLine}-${endLine})`,
    importsHeader: (stdlibCount, thirdPartyCount, localCount) =>
      `**Импорты:** stdlib ${stdlibCount}, сторонние ${thirdPartyCount}, локальные ${localCount}`,
    thirdPartyList: (modules) => `  Сторонние: ${modules}`,
  },

  cc_analyze_methods: {
    header: (filename) => `\uD83D\uDD0D **Анализ методов: ${filename}**`,
    classNotFound: (name, available) =>
      `\u274C Класс "${name}" не найден. Доступно: ${available}`,
    inheritsFrom: (bases) => `Наследует от: ${bases}`,
    visibility: 'Видимость',
    complexity: 'Сложность',
    visibilityLabel: (visibility, complexity) =>
      `  Видимость: ${visibility} | Сложность: ${complexity}`,
    decorators: (decorators) => `  Декораторы: ${decorators}`,
    calls: (calls) => `  Вызовы: ${calls}`,
    guardrailsHeader: '**Проверки BACH:**',
    missingSignalCallbacksHeader: 'Отсутствующие signal-callbacks:',
    missingSignalCallback: (line, method) => `  Стр. ${line}: callback self.${method} не найден`,
    attributeIssuesHeader: 'Проблемы порядка атрибутов:',
    attributeNeverDefined: (line, attr) => `  Стр. ${line}: self.${attr} используется, но не определен`,
    attributeBeforeDefinition: (useLine, attr, defLine) =>
      `  Стр. ${useLine}: self.${attr} используется до определения на стр. ${defLine}`,
    underscoreMismatchesHeader: 'Несоответствия подчеркивания:',
    underscoreMismatch: (called, defined) => `  вызван self.${called}, но определен ${defined}`,
    topLevelFunctions: '## Функции верхнего уровня',
  },

  cc_extract_classes: {
    header: (filename) => `\uD83D\uDD0D **Извлечение классов: ${filename}**`,
    classInfo: (name, lineCount, methodCount) =>
      `\uD83D\uDCE6 **${name}** (строк: ${lineCount}, методов: ${methodCount})`,
    helperFunctions: 'ВспомогательныеФункции',
    helperFunctionsInfo: (lineCount) => `\u2699\uFE0F **Вспомогательные функции** (строк: ${lineCount})`,
    contentHeader: '**Извлеченное содержимое:**',
    contentTruncated: (maxChars) => `Содержимое обрезано после ${maxChars} символов. Используйте output_dir для полных файлов.`,
    filesWritten: (count, dir) => `\u2705 Записано файлов: ${count}, каталог: ${dir}`,
    hintUseOutputDir: `\uD83D\uDCA1 Используйте output_dir, чтобы сохранить извлечения как файлы.`,
  },

  cc_organize_imports: {
    header: (filename) => `\uD83D\uDD0D **Анализ импортов: ${filename}**`,
    noImportsFound: (filename) => `\uD83D\uDD0D Импорты в ${filename} не найдены.`,
    categoryFuture: '__future__',
    categoryStdlib: 'stdlib',
    categoryThirdParty: 'сторонние',
    categoryLocal: 'локальные',
    duplicatesRemoved: 'Дубликаты удалены',
    previewHeader: '**Предпросмотр (отсортировано и сгруппировано):**',
    importsSaved: `\u2705 Импорты организованы и сохранены.`,
  },

  cc_diagnose_imports: {
    header: (filename) => `\uD83D\uDD0D **Диагностика импортов: ${filename}**`,
    totalImports: 'Всего импортов',
    issues: 'Проблемы',
    warnings: 'Предупреждения',
    issuesHeader: '**Проблемы:**',
    warningsHeader: '**Предупреждения:**',
    noIssues: '\u2705 Проблемы с импортами не найдены.',
    unusedImport: (line, name) => `Стр. ${line}: \`${name}\` импортирован, но не используется`,
    duplicateImport: (text) => `Дубликат: \`${text}\``,
    relativeImportsWarning: (count) =>
      `Найдено относительных импортов: ${count} (потенциальный риск циклического импорта)`,
    importOrderWarning: (line) => `Стр. ${line}: порядок импортов не соответствует PEP 8`,
    hintOrganize: `\uD83D\uDCA1 Используйте \`cc_organize_imports\` для автоматической сортировки.`,
  },

  cc_fix_json: {
    validJson: (filename) => `\u2705 ${filename} содержит корректный JSON.`,
    analysisHeader: (filename) => `\uD83D\uDD0D **Анализ JSON: ${filename}**`,
    validAfterRepair: '\u2705 Корректно после восстановления',
    stillInvalid: (error) => `\u26A0\uFE0F Все еще некорректно: ${error}`,
    repairedHeader: (filename) => `\u2705 **JSON восстановлен: ${filename}**`,
    fixBomRemoved: 'BOM удален',
    fixNulRemoved: 'NUL-байты удалены',
    fixCommentsRemoved: 'Комментарии удалены',
    fixBlockCommentsRemoved: 'Блочные комментарии удалены',
    fixTrailingCommas: 'Завершающие запятые удалены',
    fixSingleQuotes: 'Одинарные кавычки исправлены',
  },

  cc_validate_json: {
    validHeader: (filename) => `\u2705 **Корректный JSON: ${filename}**`,
    invalidHeader: (filename) => `\u274C **Некорректный JSON: ${filename}**`,
    typeArray: (count) => `Массив (${count} элементов)`,
    typeObject: (count) => `Объект (${count} ключей)`,
    labelType: 'Тип',
    labelSize: 'Размер',
    labelBom: 'BOM',
    bomYes: '\u26A0\uFE0F Да',
    bomNo: 'Нет',
    positionInfo: (line, col) => `\n**Позиция:** строка ${line}, столбец ${col}`,
    errorLabel: (msg) => `**Ошибка:** ${msg}`,
    hintFix: `\uD83D\uDCA1 Используйте \`cc_fix_json\` для автоматического восстановления.`,
  },

  cc_fix_encoding: {
    noErrors: (filename) => `\u2705 В ${filename} нет ошибок кодировки.`,
    analysisHeader: (filename) => `\uD83D\uDD0D **Анализ кодировки: ${filename}**`,
    repairedHeader: (filename) => `\u2705 **Кодировка восстановлена: ${filename}**`,
  },

  cc_cleanup_file: {
    alreadyClean: (filename) => `\u2705 ${filename} уже очищен.`,
    previewHeader: (filename) => `\uD83D\uDD0D **Предпросмотр: ${filename}**`,
    cleanedHeader: (filename) => `\u2705 **Очищено: ${filename}**`,
    fixBomRemoved: 'BOM удален',
    fixNulRemoved: 'NUL-байты удалены',
    fixTrailingWhitespace: 'Концевые пробелы',
  },

  cc_convert_format: {
    conversionHeader: (inputFormat, outputFormat) => `\u2705 **${inputFormat} \u2192 ${outputFormat}**`,
    csvMinRows: `\u274C CSV: требуется минимум заголовок + 1 строка данных.`,
    csvRequiresArray: `\u274C Экспорт CSV требует массив.`,
    iniRequiresObject: `\u274C Экспорт INI требует объект.`,
    unsupportedFormat: (format) => `\u274C Неподдерживаемый формат: ${format}`,
    labelSource: 'Источник',
    labelTarget: 'Цель',
    labelSize: 'Размер',
  },

  cc_fix_umlauts: {
    noIssues: (filename) => `\u2705 В ${filename} нет поврежденных немецких умлаутов.`,
    analysisHeader: (filename) => `\uD83D\uDD0D **Анализ умлаутов: ${filename}**`,
    replacements: (count) => `Замен: ${count}:`,
    repairedHeader: (filename) => `\u2705 **Умлауты восстановлены: ${filename}**`,
  },

  cc_scan_emoji: {
    noEmojis: (fileCount) => `\u2705 Emoji не найдены в ${fileCount} файлах.`,
    scanHeader: (fileCount) => `\uD83D\uDD0D **Сканирование emoji: файлов ${fileCount}**`,
    emojiTableEmoji: 'Emoji',
    emojiTableCount: 'Количество',
    emojiTableCodepoint: 'Codepoint',
    occurrencesHeader: '**Вхождения (первые 30):**',
    andMore: (count) => `  ... и еще ${count}`,
  },

  cc_generate_licenses: {
    noPackageFiles: (dir) => `\u274C В ${dir} не найден package.json или requirements.txt.`,
    generatedHeader: (count) => `\u2705 **Лицензии сгенерированы: пакетов ${count}**`,
    labelFile: 'Файл',
    labelFormat: 'Формат',
    labelPackages: 'Пакеты',
  },

  cc_md_to_html: {
    conversionHeader: (filename) => `\u2705 **Markdown \u2192 HTML: ${filename}**`,
    labelSource: 'Источник',
    labelTarget: 'Цель',
    labelSize: 'Размер',
    hintPrint: `\uD83D\uDCA1 Откройте HTML-файл в браузере и напечатайте как PDF.`,
  },

  cc_md_to_pdf: {
    conversionHeader: (filename) => `\u2705 **Markdown \u2192 PDF: ${filename}**`,
    labelSource: 'Источник',
    labelTarget: 'Цель',
    labelSize: 'Размер',
    noBrowser: 'Браузер (Edge/Chrome) не найден. Вместо этого создан HTML-файл.',
    browserUsed: (name) => `PDF создан с помощью ${name}`,
  },

  cc_check_indentation: {
    description: 'Проверяет Python-файлы на пропущенные двоеточия, неотступленные return/yield и смешанную табуляцию/пробелы',
    header: (path) => `**Проверка отступов Python: ${path}**`,
    filesChecked: 'Проверено файлов',
    filesWithIssues: 'Файлов с проблемами',
    totalIssues: 'Всего проблем',
    noIssues: '\u2705 Проблемы с отступами не найдены.',
    issuesHeader: '**Проблемы:**',
    andMore: (count) => `... и еще ${count} проблем`,
  },

  cc_generate_python_code: {
    description: 'Генерирует фрагменты Python-кода из BACH-шаблонов без записи файлов',
    header: (kind) => `**Сгенерированный Python ${kind}**`,
  },

  cc_runtime_import_diagnose: {
    description: 'Запускает BACH-диагностику runtime-импортов Python в изолированных подпроцессах',
    header: (path) => `**Диагностика runtime-импортов: ${path}**`,
    python: 'Python',
    modulesTested: 'Проверено модулей',
    importsOk: 'Импорты OK',
    failures: 'Ошибки',
    circularImports: 'Циклические импорты',
    initFiles: 'Файлы __init__.py',
    timeoutSeconds: 'Таймаут, сек.',
    noTargets: 'Цели импорта не найдены. Передайте modules или укажите path на Python-проект.',
    singleImportsHeader: '**Изолированные импорты:**',
    importOk: (target, durationMs) => `- OK ${target} (${durationMs} ms)`,
    importFailed: (target, exitCode, output) => `- FAIL ${target} (exit ${exitCode}) ${output}`,
    importTimedOut: (target, durationMs) => `- TIMEOUT ${target} (${durationMs} ms)`,
    initFilesHeader: '**Анализ __init__.py:**',
    initFileInfo: (file, directImports, hasLazy) =>
      `- ${file}: прямых импортов ${directImports}${hasLazy ? ', есть lazy imports' : ''}`,
    circularHeader: '**Возможные циклические импорты:**',
    circularPair: (moduleA, moduleB) => `- ${moduleA} <-> ${moduleB}`,
    recommendationsHeader: '**Рекомендации:**',
    noProblems: '\u2705 Проблемы runtime-импортов не найдены.',
    andMore: (count) => `... и еще ${count}`,
  },

  cc_python_structural_edit: {
    description: 'Проверяет и применяет BACH-структурные правки Python с режимами предпросмотра, тестового файла и backup',
    header: (path) => `**Структурное редактирование Python: ${path}**`,
    operationLabel: 'Операция',
    modeLabel: 'Режим',
    changedLabel: 'Изменено',
    syntaxLabel: 'Синтаксис',
    outputLabel: 'Вывод',
    backupLabel: 'Backup',
    structureHeader: '**Структура:**',
    classLine: (name, startLine, endLine) => `- class ${name} (L.${startLine}-${endLine})`,
    functionLine: (name, startLine, endLine) => `- function ${name} (L.${startLine}-${endLine})`,
    methodLine: (name, startLine, endLine) => `- method ${name} (L.${startLine}-${endLine})`,
    insertedAt: (line) => `Содержимое вставлено на строке ${line}.`,
    deletedElement: (name, startLine, endLine) => `${name} удалено (L.${startLine}-${endLine}).`,
    replacedLine: (line) => `Строка ${line} заменена.`,
    editFileReady: (path) => `Файл редактирования записан: ${path}`,
    editFilePreview: '**Предпросмотр файла редактирования:**',
    testWritten: (path) => `Тестовый файл записан: ${path}`,
    backupCreated: (path) => `Backup создан: ${path}`,
    appliedTo: (path) => `Применено к: ${path}`,
    diffHeader: '**Предпросмотр diff:**',
    noChanges: 'Нет изменений.',
    elementNotFound: (name) => `Элемент не найден: ${name}`,
    syntaxFailed: (output) => `Проверка синтаксиса Python не прошла: ${output}`,
  },

  cc_set_language: {
    languageSet: (lang) => `Язык установлен: ${lang}`,
    languageGet: (lang, supported) => `Текущий язык: ${lang} (Поддерживаемые: ${supported.join(', ')})`,
  },

  cc_diff_files: {
    description: 'Сравнивает два файла и показывает различия в формате unified diff',
    header: (fileA, fileB) => `**Diff: ${fileA} \u2194 ${fileB}**`,
    identical: 'Файлы идентичны.',
    linesChanged: (added, removed) => `Добавлено строк: ${added}, удалено строк: ${removed}`,
  },

  cc_regex_test: {
    description: 'Проверяет регулярные выражения на тексте или содержимом файла',
    header: (pattern, flags) => `**Regex: /${pattern}/${flags}**`,
    matchCount: (count) => `Найдено совпадений: ${count}`,
    noMatches: 'Совпадения не найдены.',
  },
};
