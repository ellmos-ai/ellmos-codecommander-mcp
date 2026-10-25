import type { Translations } from './types.js';

export const ar: Translations = {
  // === Common ===
  common: {
    fileNotFound: (path) => `❌ الملف غير موجود: ${path}`,
    sourceFileNotFound: (path) => `❌ الملف المصدر غير موجود: ${path}`,
    pathNotFound: (path) => `❌ المسار غير موجود: ${path}`,
    error: (msg) => `❌ خطأ: ${msg}`,
    serverStarted: '🚀 بدأ تشغيل خادم MCP ellmos CodeCommander',
  },

  // === Tool 1: cc_analyze_code ===
  cc_analyze_code: {
    header: (filename) => `🔍 **تحليل الشيفرة: ${filename}**`,
    metricTotalLines: 'إجمالي الأسطر',
    metricCodeLines: 'أسطر الشيفرة',
    metricCommentLines: 'أسطر التعليقات',
    metricBlankLines: 'الأسطر الفارغة',
    metricClasses: 'الفئات',
    metricFunctions: 'الدوال',
    metricImports: 'الاستيرادات',
    metricCyclomaticComplexity: 'التعقيد الدوري',
    metricFileSize: 'حجم الملف',
    classesHeader: '**الفئات:**',
    classInfo: (name, bases, startLine, endLine, methodCount) =>
      `  📦 **${name}${bases}** (سطر ${startLine}-${endLine}، ${methodCount} طرق)`,
    classMethods: (methods) => `    الطرق: ${methods}`,
    functionsHeader: '**الدوال:**',
    functionInfo: (asyncPrefix, name, params, startLine, endLine) =>
      `  ⚙️ ${asyncPrefix}**${name}**(${params}) (سطر ${startLine}-${endLine})`,
    importsHeader: (stdlibCount, thirdPartyCount, localCount) =>
      `**الاستيرادات:** ${stdlibCount} stdlib، ${thirdPartyCount} خارجية، ${localCount} محلية`,
    thirdPartyList: (modules) => `  جهات خارجية: ${modules}`,
  },

  // === Tool 2: cc_analyze_methods ===
  cc_analyze_methods: {
    header: (filename) => `🔍 **تحليل الطرق: ${filename}**`,
    classNotFound: (name, available) =>
      `❌ الفئة «${name}» غير موجودة. المتاح: ${available}`,
    inheritsFrom: (bases) => `يرث من: ${bases}`,
    visibility: 'إمكانية الوصول',
    complexity: 'التعقيد',
    visibilityLabel: (visibility, complexity) =>
      `  إمكانية الوصول: ${visibility} | التعقيد: ${complexity}`,
    decorators: (decorators) => `  المزخرفات: ${decorators}`,
    calls: (calls) => `  الاستدعاءات: ${calls}`,
    guardrailsHeader: '**ضوابط BACH:**',
    missingSignalCallbacksHeader: 'عمليات الاستدعاء للإشارات المفقودة:',
    missingSignalCallback: (line, method) => `  سطر ${line}: لم يتم العثور على callback لـ self.${method}`,
    attributeIssuesHeader: 'مشكلات ترتيب السمات:',
    attributeNeverDefined: (line, attr) => `  سطر ${line}: استُخدم self.${attr} لكنه لم يُعرّف قط`,
    attributeBeforeDefinition: (useLine, attr, defLine) =>
      `  سطر ${useLine}: استُخدم self.${attr} قبل تعريفه في السطر ${defLine}`,
    underscoreMismatchesHeader: 'اختلافات الشرطة السفلية:',
    underscoreMismatch: (called, defined) => `  تم استدعاء self.${called}، لكن المعرّف هو ${defined}`,
    topLevelFunctions: '## الدوال على المستوى الأعلى',
  },

  // === Tool 3: cc_extract_classes ===
  cc_extract_classes: {
    header: (filename) => `🔍 **استخراج الفئات: ${filename}**`,
    classInfo: (name, lineCount, methodCount) =>
      `📦 **${name}** (${lineCount} أسطر، ${methodCount} طرق)`,
    helperFunctions: 'الدوال المساعدة',
    helperFunctionsInfo: (lineCount) => `⚙️ **الدوال المساعدة** (${lineCount} أسطر)`,
    contentHeader: '**المحتوى المستخرج:**',
    contentTruncated: (maxChars) => `اقتُطع المحتوى بعد ${maxChars} حرفاً. استخدم output_dir للحصول على الملفات كاملة.`,
    filesWritten: (count, dir) => `✅ كُتب ${count} ملفاً في: ${dir}`,
    hintUseOutputDir: `💡 استخدم output_dir لحفظ المستخرجات كملفات.`,
  },

  // === Tool 4: cc_organize_imports ===
  cc_organize_imports: {
    header: (filename) => `🔍 **تشخيص الاستيرادات: ${filename}**`,
    noImportsFound: (filename) => `لم يتم العثور على استيرادات في ${filename}.`,
    categoryFuture: '__future__',
    categoryStdlib: 'stdlib',
    categoryThirdParty: 'جهات خارجية',
    categoryLocal: 'محلية',
    duplicatesRemoved: 'أُزيلت التكرارات',
    previewHeader: '**معاينة (مرتبة ومجمّعة):**',
    importsSaved: `✅ نُظّمت الاستيرادات وحُفظت.`,
  },

  // === Tool 5: cc_diagnose_imports ===
  cc_diagnose_imports: {
    header: (filename) => `🔍 **تشخيص الاستيرادات: ${filename}**`,
    totalImports: 'إجمالي الاستيرادات',
    issues: 'المشكلات',
    warnings: 'تحذيرات',
    issuesHeader: '**المشكلات:**',
    warningsHeader: '**التحذيرات:**',
    noIssues: '✅ لم يتم العثور على مشكلات في الاستيراد.',
    unusedImport: (line, name) => `سطر ${line}: تم استيراد \`${name}\` لكنه غير مستخدم`,
    duplicateImport: (text) => `مكرر: \`${text}\``,
    relativeImportsWarning: (count) =>
      `تم العثور على ${count} استيرادات نسبية (احتمال خطر استيراد دائري)`,
    importOrderWarning: (line) => `سطر ${line}: ترتيب الاستيرادات لا يتوافق مع PEP 8`,
    hintOrganize: `💡 استخدم \`cc_organize_imports\` للترتيب التلقائي.`,
  },

  // === Tool 6: cc_fix_json ===
  cc_fix_json: {
    validJson: (filename) => `✅ ${filename} ملف JSON صالح.`,
    analysisHeader: (filename) => `🔍 **تحليل JSON: ${filename}**`,
    validAfterRepair: '✅ صالح بعد الإصلاح',
    stillInvalid: (error) => `⚠️ ما زال غير صالح: ${error}`,
    repairedHeader: (filename) => `✅ **أُصلح JSON: ${filename}**`,
    fixBomRemoved: 'أُزيلت BOM',
    fixNulRemoved: 'أُزيلت بايتات NUL',
    fixCommentsRemoved: 'أُزيلت التعليقات',
    fixBlockCommentsRemoved: 'أُزيلت تعليقات الكتل',
    fixTrailingCommas: 'أُزيلت الفواصل الختامية',
    fixSingleQuotes: 'أُصلحت علامات الاقتباس المفردة',
  },

  // === Tool 7: cc_validate_json ===
  cc_validate_json: {
    validHeader: (filename) => `✅ **JSON صالح: ${filename}**`,
    invalidHeader: (filename) => `❌ **JSON غير صالح: ${filename}**`,
    typeArray: (count) => `مصفوفة (${count} عنصر)`,
    typeObject: (count) => `كائن (${count} مفتاح)`,
    labelType: 'النوع',
    labelSize: 'الحجم',
    labelBom: 'BOM',
    bomYes: '⚠️ نعم',
    bomNo: 'لا',
    positionInfo: (line, col) => `\n**الموضع:** السطر ${line}، العمود ${col}`,
    errorLabel: (msg) => `**الخطأ:** ${msg}`,
    hintFix: `💡 استخدم \`cc_fix_json\` للإصلاح التلقائي.`,
  },

  // === Tool 8: cc_fix_encoding ===
  cc_fix_encoding: {
    noErrors: (filename) => `✅ لا توجد أخطاء ترميز في ${filename}.`,
    analysisHeader: (filename) => `🔍 **تحليل الترميز: ${filename}**`,
    repairedHeader: (filename) => `✅ **أُصلح الترميز: ${filename}**`,
  },

  // === Tool 9: cc_cleanup_file ===
  cc_cleanup_file: {
    alreadyClean: (filename) => `✅ ${filename} نظيف بالفعل.`,
    previewHeader: (filename) => `🔍 **معاينة: ${filename}**`,
    cleanedHeader: (filename) => `✅ **نُظّف: ${filename}**`,
    fixBomRemoved: 'أُزيلت BOM',
    fixNulRemoved: 'أُزيلت بايتات NUL',
    fixTrailingWhitespace: 'المسافات البيضاء في نهاية السطر',
  },

  // === Tool 10: cc_convert_format ===
  cc_convert_format: {
    conversionHeader: (inputFormat, outputFormat) => `✅ **${inputFormat} → ${outputFormat}**`,
    csvMinRows: `❌ CSV: يلزم وجود ترويسة وصف بيانات واحد على الأقل.`,
    csvRequiresArray: `❌ يتطلب تصدير CSV مصفوفة.`,
    iniRequiresObject: `❌ يتطلب تصدير INI كائنًا.`,
    unsupportedFormat: (format) => `❌ تنسيق غير مدعوم: ${format}`,
    labelSource: 'المصدر',
    labelTarget: 'الهدف',
    labelSize: 'الحجم',
  },

  // === Tool 11: cc_fix_umlauts ===
  cc_fix_umlauts: {
    noIssues: (filename) => `✅ لا توجد أحرف ألمانية مشوهة الترميز في ${filename}.`,
    analysisHeader: (filename) => `🔍 **تحليل علامات التشكيل الألمانية: ${filename}**`,
    replacements: (count) => `عدد الاستبدالات: ${count}`,
    repairedHeader: (filename) => `✅ **أُصلحت علامات التشكيل: ${filename}**`,
  },

  // === Tool 12: cc_scan_emoji ===
  cc_scan_emoji: {
    noEmojis: (fileCount) => `✅ لم يُعثر على رموز تعبيرية في ${fileCount} ملف(ات).`,
    scanHeader: (fileCount) => `🔍 **فحص الرموز التعبيرية: ${fileCount} ملفات**`,
    emojiTableEmoji: 'رمز تعبيري',
    emojiTableCount: 'العدد',
    emojiTableCodepoint: 'نقطة الترميز',
    occurrencesHeader: '**مواضع الظهور (أول 30):**',
    andMore: (count) => `  … و${count} أخرى`,
  },

  // === Tool 13: cc_generate_licenses ===
  cc_generate_licenses: {
    noPackageFiles: (dir) => `❌ لم يُعثر على package.json أو requirements.txt في ${dir}.`,
    generatedHeader: (count) => `✅ **أُنشئت التراخيص لـ ${count} حزمة**`,
    labelFile: 'ملف',
    labelFormat: 'التنسيق',
    labelPackages: 'حزم',
  },

  // === Tool 14: cc_md_to_html ===
  cc_md_to_html: {
    conversionHeader: (filename) => `✅ **Markdown → HTML: ${filename}**`,
    labelSource: 'المصدر',
    labelTarget: 'الهدف',
    labelSize: 'الحجم',
    hintPrint: `💡 افتح ملف HTML في المتصفح واطبعه بصيغة PDF.`,
  },

  // === Tool 15: cc_md_to_pdf ===
  cc_md_to_pdf: {
    conversionHeader: (filename) => `✅ **Markdown → PDF: ${filename}**`,
    labelSource: 'المصدر',
    labelTarget: 'الهدف',
    labelSize: 'الحجم',
    noBrowser: 'لم يُعثر على متصفح (Edge/Chrome). أُنشئ ملف HTML بدلًا من ذلك.',
    browserUsed: (name) => `أُنشئ PDF باستخدام ${name}`,
  },

  // === Tool 16: cc_check_indentation ===
  cc_check_indentation: {
    description: 'تحقق في ملفات Python من النقطتين المفقودتين، وتعليمات return/yield غير المزاحة، وخلط علامات الجدولة بالمسافات.',
    header: (path) => `**فحص المسافة البادئة في Python: ${path}**`,
    filesChecked: 'الملفات التي تم فحصها',
    filesWithIssues: 'ملفات بها مشكلات',
    totalIssues: 'إجمالي المشكلات',
    noIssues: '✅ لم يُعثر على مشكلات في المسافة البادئة.',
    issuesHeader: '**المشكلات:**',
    andMore: (count) => `… و${count} مشكلات أخرى`,
  },

  // === Tool 17: cc_generate_python_code ===
  cc_generate_python_code: {
    description: 'أنشئ مقاطع Python من قوالب مشتقة من BACH دون كتابة ملفات',
    header: (kind) => `**Python المُنشأ ${kind}**`,
  },

  cc_runtime_import_diagnose: {
    description: 'شغّل تشخيصات استيراد وقت تشغيل Python المشتقة من BACH في عمليات فرعية معزولة',
    header: (path) => `**تشخيص استيراد وقت التشغيل: ${path}**`,
    python: 'Python',
    modulesTested: 'الوحدات التي تم اختبارها',
    importsOk: 'الاستيرادات سليمة',
    failures: 'حالات الفشل',
    circularImports: 'استيرادات دائرية',
    initFiles: 'ملفات __init__.py',
    timeoutSeconds: 'مهلة الانتظار (بالثواني)',
    noTargets: 'لم يُعثر على أهداف للاستيراد. مرّر وحدات أو اجعل المسار يشير إلى مشروع Python.',
    singleImportsHeader: '**الاستيرادات المعزولة:**',
    importOk: (target, durationMs) => `- سليم ${target} (${durationMs} مللي ثانية)`,
    importFailed: (target, exitCode, output) => `- فشل ${target} (رمز الخروج ${exitCode}) ${output}`,
    importTimedOut: (target, durationMs) => `- انتهت المهلة ${target} (${durationMs} مللي ثانية)`,
    initFilesHeader: '**تحليل ملفات __init__.py:**',
    initFileInfo: (file, directImports, hasLazy) =>
      `- ${file}: ${directImports} استيرادات مباشرة${hasLazy ? ', lazy imports present' : ''}`,
    circularHeader: '**استيرادات دائرية محتملة:**',
    circularPair: (moduleA, moduleB) => `- ${moduleA} <-> ${moduleB}`,
    recommendationsHeader: '**التوصيات:**',
    noProblems: '✅ لم تُعثر على مشكلات استيراد وقت التشغيل.',
    andMore: (count) => `… و${count} أخرى`,
  },

  cc_python_structural_edit: {
    description: 'افحص التعديلات البنيوية لـ Python المشتقة من BACH وطبّقها مع معاينة وأوضاع أمان لملفات الاختبار والنسخ الاحتياطية',
    header: (path) => `**تعديل بنيوي لـ Python: ${path}**`,
    operationLabel: 'العملية',
    modeLabel: 'الوضع',
    changedLabel: 'تم التغيير',
    syntaxLabel: 'الصياغة',
    outputLabel: 'المخرجات',
    backupLabel: 'نسخة احتياطية',
    structureHeader: '**البنية:**',
    classLine: (name, startLine, endLine) => `- الفئة ${name} (السطر ${startLine}-${endLine})`,
    functionLine: (name, startLine, endLine) => `- الدالة ${name} (السطر ${startLine}-${endLine})`,
    methodLine: (name, startLine, endLine) => `- الطريقة ${name} (السطر ${startLine}-${endLine})`,
    insertedAt: (line) => `أُدرج المحتوى في السطر ${line}.`,
    deletedElement: (name, startLine, endLine) => `حُذف ${name} (السطر ${startLine}-${endLine}).`,
    replacedLine: (line) => `تم استبدال السطر ${line}.`,
    editFileReady: (path) => `كُتب الملف المعدّل: ${path}`,
    editFilePreview: '**معاينة الملف المعدّل:**',
    testWritten: (path) => `كُتب ملف الاختبار: ${path}`,
    backupCreated: (path) => `أُنشئت نسخة احتياطية: ${path}`,
    appliedTo: (path) => `طُبّق على: ${path}`,
    diffHeader: '**معاينة الفروق:**',
    noChanges: 'لا توجد تغييرات.',
    elementNotFound: (name) => `العنصر غير موجود: ${name}`,
    syntaxFailed: (output) => `فشل فحص صياغة Python: ${output}`,
  },

  // === Tool 16: cc_set_language ===
  cc_set_language: {
    languageSet: (lang) => `تم ضبط اللغة على: ${lang}`,
    languageGet: (lang, supported) => `اللغة الحالية: ${lang} (اللغات المدعومة: ${supported.join(', ')})`,
  },

  // === Tool 17: cc_diff_files ===
  cc_diff_files: {
    description: 'قارن بين ملفين واعرض الفروق بتنسيق diff موحّد',
    header: (fileA, fileB) => `**الفرق: ${fileA} ↔ ${fileB}**`,
    identical: 'الملفان متطابقان.',
    linesChanged: (added, removed) => `أُضيف ${added} سطرًا وحُذف ${removed} سطر`,
  },

  // === Tool 18: cc_regex_test ===
  cc_regex_test: {
    description: 'اختبر التعبيرات النمطية على نص أو محتوى ملف',
    header: (pattern, flags) => `**تعبير نمطي: /${pattern}/${flags}**`,
    matchCount: (count) => `تم العثور على ${count} تطابق(ات)`,
    noMatches: 'لم يُعثر على تطابقات.',
  },
};
