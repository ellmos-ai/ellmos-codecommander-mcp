import type { Translations } from './types.js';

export const bn: Translations = {
  // === Common ===
  common: {
    fileNotFound: (path) => `❌ ফাইল পাওয়া যায়নি: ${path}`,
    sourceFileNotFound: (path) => `❌ উৎস ফাইল পাওয়া যায়নি: ${path}`,
    pathNotFound: (path) => `❌ পথ পাওয়া যায়নি: ${path}`,
    error: (msg) => `❌ ত্রুটি: ${msg}`,
    serverStarted: '🚀 ellmos CodeCommander MCP সার্ভার চালু হয়েছে',
  },

  // === Tool 1: cc_analyze_code ===
  cc_analyze_code: {
    header: (filename) => `🔍 **কোড বিশ্লেষণ: ${filename}**`,
    metricTotalLines: 'মোট লাইন',
    metricCodeLines: 'কোড লাইন',
    metricCommentLines: 'মন্তব্যের লাইন',
    metricBlankLines: 'ফাঁকা লাইন',
    metricClasses: 'ক্লাস',
    metricFunctions: 'ফাংশন',
    metricImports: 'ইমপোর্ট',
    metricCyclomaticComplexity: 'সাইক্লোমেটিক জটিলতা',
    metricFileSize: 'ফাইলের আকার',
    classesHeader: '**ক্লাস:**',
    classInfo: (name, bases, startLine, endLine, methodCount) =>
      `  📦 **${name}${bases}** (লাইন ${startLine}-${endLine}, ${methodCount} মেথড)`,
    classMethods: (methods) => `    মেথড: ${methods}`,
    functionsHeader: '**ফাংশন:**',
    functionInfo: (asyncPrefix, name, params, startLine, endLine) =>
      `  ⚙️ ${asyncPrefix}**${name}**(${params}) (লাইন ${startLine}-${endLine})`,
    importsHeader: (stdlibCount, thirdPartyCount, localCount) =>
      `**ইমপোর্ট:** ${stdlibCount} stdlib, ${thirdPartyCount} তৃতীয়-পক্ষ, ${localCount} স্থানীয়`,
    thirdPartyList: (modules) => `  তৃতীয়-পক্ষ: ${modules}`,
  },

  // === Tool 2: cc_analyze_methods ===
  cc_analyze_methods: {
    header: (filename) => `🔍 **মেথড বিশ্লেষণ: ${filename}**`,
    classNotFound: (name, available) =>
      `❌ ক্লাস «${name}» পাওয়া যায়নি। উপলভ্য: ${available}`,
    inheritsFrom: (bases) => `উত্তরাধিকারসূত্রে: ${bases}`,
    visibility: 'দৃশ্যমানতা',
    complexity: 'জটিলতা',
    visibilityLabel: (visibility, complexity) =>
      `  দৃশ্যমানতা: ${visibility} | জটিলতা: ${complexity}`,
    decorators: (decorators) => `  ডেকোরেটর: ${decorators}`,
    calls: (calls) => `  কল: ${calls}`,
    guardrailsHeader: '**BACH সুরক্ষা-নিয়ম:**',
    missingSignalCallbacksHeader: 'অনুপস্থিত signal callback:',
    missingSignalCallback: (line, method) => `  লাইন ${line}: self.${method} callback পাওয়া যায়নি`,
    attributeIssuesHeader: 'অ্যাট্রিবিউটের ক্রম-সমস্যা:',
    attributeNeverDefined: (line, attr) => `  লাইন ${line}: self.${attr} ব্যবহৃত হয়েছে, কিন্তু কখনও সংজ্ঞায়িত হয়নি`,
    attributeBeforeDefinition: (useLine, attr, defLine) =>
      `  লাইন ${useLine}: self.${attr} লাইন ${defLine}-এ সংজ্ঞার আগে ব্যবহৃত হয়েছে`,
    underscoreMismatchesHeader: 'আন্ডারস্কোরের অমিল:',
    underscoreMismatch: (called, defined) => `  self.${called} কল করা হয়েছে, কিন্তু ${defined} সংজ্ঞায়িত`,
    topLevelFunctions: '## শীর্ষ-স্তরের ফাংশন',
  },

  // === Tool 3: cc_extract_classes ===
  cc_extract_classes: {
    header: (filename) => `🔍 **ক্লাস নিষ্কাশন: ${filename}**`,
    classInfo: (name, lineCount, methodCount) =>
      `📦 **${name}** (${lineCount} লাইন, ${methodCount} মেথড)`,
    helperFunctions: 'সহায়ক ফাংশন',
    helperFunctionsInfo: (lineCount) => `⚙️ **সহায়ক ফাংশন** (${lineCount} লাইন)`,
    contentHeader: '**নিষ্কাশিত বিষয়বস্তু:**',
    contentTruncated: (maxChars) => `${maxChars} অক্ষরের পরে বিষয়বস্তু ছাঁটা হয়েছে। সম্পূর্ণ ফাইলের জন্য output_dir ব্যবহার করুন।`,
    filesWritten: (count, dir) => `✅ ${count}টি ফাইল লেখা হয়েছে: ${dir}`,
    hintUseOutputDir: `💡 নিষ্কাশিত অংশগুলো ফাইলে সংরক্ষণ করতে output_dir ব্যবহার করুন।`,
  },

  // === Tool 4: cc_organize_imports ===
  cc_organize_imports: {
    header: (filename) => `🔍 **ইমপোর্ট নির্ণয়: ${filename}**`,
    noImportsFound: (filename) => `${filename}-এ কোনো ইমপোর্ট পাওয়া যায়নি।`,
    categoryFuture: '__future__',
    categoryStdlib: 'stdlib',
    categoryThirdParty: 'তৃতীয়-পক্ষ',
    categoryLocal: 'স্থানীয়',
    duplicatesRemoved: 'ডুপ্লিকেট সরানো হয়েছে',
    previewHeader: '**পূর্বরূপ (সাজানো ও গুচ্ছবদ্ধ):**',
    importsSaved: `✅ ইমপোর্ট সাজিয়ে সংরক্ষণ করা হয়েছে।`,
  },

  // === Tool 5: cc_diagnose_imports ===
  cc_diagnose_imports: {
    header: (filename) => `🔍 **ইমপোর্ট নির্ণয়: ${filename}**`,
    totalImports: 'মোট ইমপোর্ট',
    issues: 'সমস্যা',
    warnings: 'সতর্কতা',
    issuesHeader: '**সমস্যা:**',
    warningsHeader: '**সতর্কতা:**',
    noIssues: '✅ ইমপোর্টে কোনো সমস্যা পাওয়া যায়নি।',
    unusedImport: (line, name) => `লাইন ${line}: \`${name}\` ইমপোর্ট করা হয়েছে, কিন্তু ব্যবহার হয়নি`,
    duplicateImport: (text) => `ডুপ্লিকেট: \`${text}\``,
    relativeImportsWarning: (count) =>
      `${count}টি আপেক্ষিক ইমপোর্ট পাওয়া গেছে (চক্রাকার ইমপোর্টের সম্ভাব্য ঝুঁকি)`,
    importOrderWarning: (line) => `লাইন ${line}: ইমপোর্টের ক্রম PEP 8 অনুযায়ী নয়`,
    hintOrganize: `💡 স্বয়ংক্রিয়ভাবে সাজাতে \`cc_organize_imports\` ব্যবহার করুন।`,
  },

  // === Tool 6: cc_fix_json ===
  cc_fix_json: {
    validJson: (filename) => `✅ ${filename} একটি বৈধ JSON।`,
    analysisHeader: (filename) => `🔍 **JSON বিশ্লেষণ: ${filename}**`,
    validAfterRepair: '✅ মেরামতের পরে বৈধ',
    stillInvalid: (error) => `⚠️ এখনও অবৈধ: ${error}`,
    repairedHeader: (filename) => `✅ **JSON মেরামত হয়েছে: ${filename}**`,
    fixBomRemoved: 'BOM সরানো হয়েছে',
    fixNulRemoved: 'NUL বাইট সরানো হয়েছে',
    fixCommentsRemoved: 'মন্তব্য সরানো হয়েছে',
    fixBlockCommentsRemoved: 'ব্লক মন্তব্য সরানো হয়েছে',
    fixTrailingCommas: 'শেষের কমা সরানো হয়েছে',
    fixSingleQuotes: 'একক উদ্ধৃতি চিহ্ন ঠিক করা হয়েছে',
  },

  // === Tool 7: cc_validate_json ===
  cc_validate_json: {
    validHeader: (filename) => `✅ **বৈধ JSON: ${filename}**`,
    invalidHeader: (filename) => `❌ **অবৈধ JSON: ${filename}**`,
    typeArray: (count) => `অ্যারে (${count}টি উপাদান)`,
    typeObject: (count) => `অবজেক্ট (${count}টি কী)`,
    labelType: 'ধরন',
    labelSize: 'আকার',
    labelBom: 'BOM',
    bomYes: '⚠️ হ্যাঁ',
    bomNo: 'না',
    positionInfo: (line, col) => `\n**অবস্থান:** লাইন ${line}, কলাম ${col}`,
    errorLabel: (msg) => `**ত্রুটি:** ${msg}`,
    hintFix: `💡 স্বয়ংক্রিয় মেরামতের জন্য \`cc_fix_json\` ব্যবহার করুন।`,
  },

  // === Tool 8: cc_fix_encoding ===
  cc_fix_encoding: {
    noErrors: (filename) => `✅ ${filename}-এ কোনো এনকোডিং ত্রুটি নেই।`,
    analysisHeader: (filename) => `🔍 **এনকোডিং বিশ্লেষণ: ${filename}**`,
    repairedHeader: (filename) => `✅ **এনকোডিং মেরামত হয়েছে: ${filename}**`,
  },

  // === Tool 9: cc_cleanup_file ===
  cc_cleanup_file: {
    alreadyClean: (filename) => `✅ ${filename} ইতিমধ্যেই পরিষ্কার।`,
    previewHeader: (filename) => `🔍 **পূর্বরূপ: ${filename}**`,
    cleanedHeader: (filename) => `✅ **পরিষ্কার করা হয়েছে: ${filename}**`,
    fixBomRemoved: 'BOM সরানো হয়েছে',
    fixNulRemoved: 'NUL বাইট সরানো হয়েছে',
    fixTrailingWhitespace: 'লাইনের শেষে থাকা ফাঁকা স্থান',
  },

  // === Tool 10: cc_convert_format ===
  cc_convert_format: {
    conversionHeader: (inputFormat, outputFormat) => `✅ **${inputFormat} → ${outputFormat}**`,
    csvMinRows: `❌ CSV: অন্তত একটি হেডার ও ১টি ডেটা সারি আবশ্যক।`,
    csvRequiresArray: `❌ CSV রপ্তানির জন্য একটি অ্যারে প্রয়োজন।`,
    iniRequiresObject: `❌ INI রপ্তানির জন্য একটি অবজেক্ট প্রয়োজন।`,
    unsupportedFormat: (format) => `❌ অসমর্থিত ফরম্যাট: ${format}`,
    labelSource: 'উৎস',
    labelTarget: 'লক্ষ্য',
    labelSize: 'আকার',
  },

  // === Tool 11: cc_fix_umlauts ===
  cc_fix_umlauts: {
    noIssues: (filename) => `✅ ${filename}-এ কোনো বিকৃত umlaut নেই।`,
    analysisHeader: (filename) => `🔍 **umlaut বিশ্লেষণ: ${filename}**`,
    replacements: (count) => `${count}টি প্রতিস্থাপন:`,
    repairedHeader: (filename) => `✅ **umlaut মেরামত হয়েছে: ${filename}**`,
  },

  // === Tool 12: cc_scan_emoji ===
  cc_scan_emoji: {
    noEmojis: (fileCount) => `✅ ${fileCount}টি ফাইলে কোনো ইমোজি পাওয়া যায়নি।`,
    scanHeader: (fileCount) => `🔍 **ইমোজি স্ক্যান: ${fileCount}টি ফাইল**`,
    emojiTableEmoji: 'ইমোজি',
    emojiTableCount: 'সংখ্যা',
    emojiTableCodepoint: 'কোড পয়েন্ট',
    occurrencesHeader: '**ঘটনা (প্রথম ৩০টি):**',
    andMore: (count) => `  … এবং আরও ${count}টি`,
  },

  // === Tool 13: cc_generate_licenses ===
  cc_generate_licenses: {
    noPackageFiles: (dir) => `❌ ${dir}-এ package.json বা requirements.txt পাওয়া যায়নি।`,
    generatedHeader: (count) => `✅ **${count}টি প্যাকেজের লাইসেন্স তৈরি হয়েছে**`,
    labelFile: 'ফাইল',
    labelFormat: 'ফরম্যাট',
    labelPackages: 'প্যাকেজ',
  },

  // === Tool 14: cc_md_to_html ===
  cc_md_to_html: {
    conversionHeader: (filename) => `✅ **Markdown → HTML: ${filename}**`,
    labelSource: 'উৎস',
    labelTarget: 'লক্ষ্য',
    labelSize: 'আকার',
    hintPrint: `💡 ব্রাউজারে HTML ফাইল খুলে PDF হিসেবে প্রিন্ট করুন।`,
  },

  // === Tool 15: cc_md_to_pdf ===
  cc_md_to_pdf: {
    conversionHeader: (filename) => `✅ **Markdown → PDF: ${filename}**`,
    labelSource: 'উৎস',
    labelTarget: 'লক্ষ্য',
    labelSize: 'আকার',
    noBrowser: 'কোনো ব্রাউজার (Edge/Chrome) পাওয়া যায়নি। এর বদলে HTML ফাইল তৈরি করা হয়েছে।',
    browserUsed: (name) => `PDF তৈরি হয়েছে ${name} দিয়ে`,
  },

  // === Tool 16: cc_check_indentation ===
  cc_check_indentation: {
    description: 'Python ফাইলে অনুপস্থিত কোলন, ইনডেন্টেশনহীন return/yield বিবৃতি এবং ট্যাব-স্পেসের মিশ্রণ পরীক্ষা করুন।',
    header: (path) => `**Python ইনডেন্টেশন পরীক্ষা: ${path}**`,
    filesChecked: 'পরীক্ষিত ফাইল',
    filesWithIssues: 'সমস্যাযুক্ত ফাইল',
    totalIssues: 'মোট সমস্যা',
    noIssues: '✅ ইনডেন্টেশনে কোনো সমস্যা পাওয়া যায়নি।',
    issuesHeader: '**সমস্যা:**',
    andMore: (count) => `… এবং আরও ${count}টি সমস্যা`,
  },

  // === Tool 17: cc_generate_python_code ===
  cc_generate_python_code: {
    description: 'BACH-ভিত্তিক টেমপ্লেট থেকে Python কোড স্নিপেট তৈরি করুন, ফাইল না লিখে',
    header: (kind) => `**তৈরি করা Python ${kind}**`,
  },

  cc_runtime_import_diagnose: {
    description: 'BACH-ভিত্তিক Python রানটাইম ইমপোর্ট ডায়াগনস্টিক বিচ্ছিন্ন সাবপ্রসেসে চালান',
    header: (path) => `**রানটাইম ইমপোর্ট নির্ণয়: ${path}**`,
    python: 'Python',
    modulesTested: 'পরীক্ষিত মডিউল',
    importsOk: 'ইমপোর্ট ঠিক আছে',
    failures: 'ব্যর্থতা',
    circularImports: 'চক্রাকার ইমপোর্ট',
    initFiles: '__init__.py ফাইল',
    timeoutSeconds: 'টাইমআউট (সেকেন্ড)',
    noTargets: 'কোনো ইমপোর্ট লক্ষ্য পাওয়া যায়নি। মডিউল দিন অথবা পাথটি Python প্রকল্পে নির্দেশ করুন।',
    singleImportsHeader: '**বিচ্ছিন্ন ইমপোর্ট:**',
    importOk: (target, durationMs) => `- ঠিক ${target} (${durationMs} মি.সে.)`,
    importFailed: (target, exitCode, output) => `- ব্যর্থ ${target} (এক্সিট কোড ${exitCode}) ${output}`,
    importTimedOut: (target, durationMs) => `- টাইমআউট ${target} (${durationMs} মি.সে.)`,
    initFilesHeader: '**__init__.py ফাইল বিশ্লেষণ:**',
    initFileInfo: (file, directImports, hasLazy) =>
      `- ${file}: ${directImports}টি সরাসরি ইমপোর্ট${hasLazy ? ', lazy imports present' : ''}`,
    circularHeader: '**সম্ভাব্য চক্রাকার ইমপোর্ট:**',
    circularPair: (moduleA, moduleB) => `- ${moduleA} <-> ${moduleB}`,
    recommendationsHeader: '**সুপারিশ:**',
    noProblems: '✅ রানটাইম ইমপোর্টে কোনো সমস্যা পাওয়া যায়নি।',
    andMore: (count) => `… আরও ${count}টি`,
  },

  cc_python_structural_edit: {
    description: 'প্রিভিউ এবং টেস্ট-ফাইল ও ব্যাকআপ নিরাপত্তা মোডসহ BACH-ভিত্তিক কাঠামোগত Python সম্পাদনা পরীক্ষা করুন ও প্রয়োগ করুন',
    header: (path) => `**Python কাঠামোগত সম্পাদনা: ${path}**`,
    operationLabel: 'অপারেশন',
    modeLabel: 'মোড',
    changedLabel: 'পরিবর্তিত',
    syntaxLabel: 'সিনট্যাক্স',
    outputLabel: 'আউটপুট',
    backupLabel: 'ব্যাকআপ',
    structureHeader: '**কাঠামো:**',
    classLine: (name, startLine, endLine) => `- ক্লাস ${name} (লাইন ${startLine}-${endLine})`,
    functionLine: (name, startLine, endLine) => `- ফাংশন ${name} (লাইন ${startLine}-${endLine})`,
    methodLine: (name, startLine, endLine) => `- মেথড ${name} (লাইন ${startLine}-${endLine})`,
    insertedAt: (line) => `লাইন ${line}-এ বিষয়বস্তু যোগ করা হয়েছে।`,
    deletedElement: (name, startLine, endLine) => `${name} মুছে ফেলা হয়েছে (লাইন ${startLine}-${endLine})।`,
    replacedLine: (line) => `লাইন ${line} প্রতিস্থাপন করা হয়েছে।`,
    editFileReady: (path) => `সম্পাদিত ফাইল লেখা হয়েছে: ${path}`,
    editFilePreview: '**সম্পাদিত ফাইলের প্রিভিউ:**',
    testWritten: (path) => `টেস্ট ফাইল লেখা হয়েছে: ${path}`,
    backupCreated: (path) => `ব্যাকআপ তৈরি হয়েছে: ${path}`,
    appliedTo: (path) => `প্রয়োগ করা হয়েছে: ${path}`,
    diffHeader: '**ডিফের প্রিভিউ:**',
    noChanges: 'কোনো পরিবর্তন নেই।',
    elementNotFound: (name) => `উপাদান পাওয়া যায়নি: ${name}`,
    syntaxFailed: (output) => `Python সিনট্যাক্স পরীক্ষা ব্যর্থ: ${output}`,
  },

  // === Tool 16: cc_set_language ===
  cc_set_language: {
    languageSet: (lang) => `ভাষা সেট করা হয়েছে: ${lang}`,
    languageGet: (lang, supported) => `বর্তমান ভাষা: ${lang} (সমর্থিত: ${supported.join(', ')})`,
  },

  // === Tool 17: cc_diff_files ===
  cc_diff_files: {
    description: 'দুটি ফাইল তুলনা করে unified diff ফরম্যাটে পার্থক্য দেখান',
    header: (fileA, fileB) => `**ডিফ: ${fileA} ↔ ${fileB}**`,
    identical: 'ফাইল দুটি অভিন্ন।',
    linesChanged: (added, removed) => `${added}টি লাইন যোগ হয়েছে, ${removed}টি লাইন মুছে ফেলা হয়েছে`,
  },

  // === Tool 18: cc_regex_test ===
  cc_regex_test: {
    description: 'টেক্সট বা ফাইলের বিষয়বস্তুতে রেগুলার এক্সপ্রেশন পরীক্ষা করুন',
    header: (pattern, flags) => `**রেগুলার এক্সপ্রেশন: /${pattern}/${flags}**`,
    matchCount: (count) => `${count}টি মিল পাওয়া গেছে`,
    noMatches: 'কোনো মিল পাওয়া যায়নি।',
  },
};
