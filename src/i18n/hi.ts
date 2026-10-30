import type { Translations } from './types.js';

export const hi: Translations = {
  // === Common ===
  common: {
    fileNotFound: (path) => `❌ फ़ाइल नहीं मिली: ${path}`,
    sourceFileNotFound: (path) => `❌ स्रोत फ़ाइल नहीं मिली: ${path}`,
    pathNotFound: (path) => `❌ पथ नहीं मिला: ${path}`,
    error: (msg) => `❌ त्रुटि: ${msg}`,
    serverStarted: '🚀 ellmos CodeCommander MCP सर्वर शुरू हुआ',
  },

  // === Tool 1: cc_analyze_code ===
  cc_analyze_code: {
    header: (filename) => `🔍 **कोड विश्लेषण: ${filename}**`,
    metricTotalLines: 'कुल पंक्तियाँ',
    metricCodeLines: 'कोड पंक्तियाँ',
    metricCommentLines: 'टिप्पणी पंक्तियाँ',
    metricBlankLines: 'खाली पंक्तियाँ',
    metricClasses: 'क्लास',
    metricFunctions: 'फ़ंक्शन',
    metricImports: 'इम्पोर्ट',
    metricCyclomaticComplexity: 'चक्रीय जटिलता',
    metricFileSize: 'फ़ाइल का आकार',
    classesHeader: '**क्लास:**',
    classInfo: (name, bases, startLine, endLine, methodCount) =>
      `  📦 **${name}${bases}** (पं. ${startLine}-${endLine}, ${methodCount} मेथड)`,
    classMethods: (methods) => `    मेथड: ${methods}`,
    functionsHeader: '**फ़ंक्शन:**',
    functionInfo: (asyncPrefix, name, params, startLine, endLine) =>
      `  ⚙️ ${asyncPrefix}**${name}**(${params}) (पं. ${startLine}-${endLine})`,
    importsHeader: (stdlibCount, thirdPartyCount, localCount) =>
      `**इम्पोर्ट:** ${stdlibCount} stdlib, ${thirdPartyCount} third-party, ${localCount} स्थानीय`,
    thirdPartyList: (modules) => `  तृतीय-पक्ष: ${modules}`,
  },

  // === Tool 2: cc_analyze_methods ===
  cc_analyze_methods: {
    header: (filename) => `🔍 **मेथड विश्लेषण: ${filename}**`,
    classNotFound: (name, available) =>
      `❌ क्लास «${name}» नहीं मिली। उपलब्ध: ${available}`,
    inheritsFrom: (bases) => `इससे विरासत में: ${bases}`,
    visibility: 'दृश्यता',
    complexity: 'जटिलता',
    visibilityLabel: (visibility, complexity) =>
      `  दृश्यता: ${visibility} | जटिलता: ${complexity}`,
    decorators: (decorators) => `  डेकोरेटर: ${decorators}`,
    calls: (calls) => `  कॉल: ${calls}`,
    guardrailsHeader: '**BACH सुरक्षा जाँच:**',
    missingSignalCallbacksHeader: 'गुम signal callback:',
    missingSignalCallback: (line, method) => `  पं. ${line}: self.${method} callback नहीं मिला`,
    attributeIssuesHeader: 'एट्रिब्यूट क्रम की समस्याएँ:',
    attributeNeverDefined: (line, attr) => `  पं. ${line}: self.${attr} का उपयोग हुआ, परिभाषित नहीं है`,
    attributeBeforeDefinition: (useLine, attr, defLine) =>
      `  पं. ${useLine}: self.${attr} का उपयोग पं. ${defLine} पर परिभाषा से पहले हुआ`,
    underscoreMismatchesHeader: 'अंडरस्कोर में असंगति:',
    underscoreMismatch: (called, defined) => `  self.${called} कॉल हुआ, लेकिन ${defined} परिभाषित है`,
    topLevelFunctions: '## शीर्ष-स्तरीय फ़ंक्शन',
  },

  // === Tool 3: cc_extract_classes ===
  cc_extract_classes: {
    header: (filename) => `🔍 **क्लास निष्कर्षण: ${filename}**`,
    classInfo: (name, lineCount, methodCount) =>
      `📦 **${name}** (${lineCount} पंक्तियाँ, ${methodCount} मेथड)`,
    helperFunctions: 'सहायक फ़ंक्शन',
    helperFunctionsInfo: (lineCount) => `⚙️ **सहायक फ़ंक्शन** (${lineCount} पंक्तियाँ)`,
    contentHeader: '**निकाली गई सामग्री:**',
    contentTruncated: (maxChars) => `${maxChars} अक्षरों के बाद सामग्री काट दी गई। पूरी फ़ाइलों के लिए output_dir का उपयोग करें।`,
    filesWritten: (count, dir) => `✅ ${count} फ़ाइलें यहाँ लिखी गईं: ${dir}`,
    hintUseOutputDir: `💡 निकाली गई सामग्री को फ़ाइलों में सहेजने के लिए output_dir का उपयोग करें।`,
  },

  // === Tool 4: cc_organize_imports ===
  cc_organize_imports: {
    header: (filename) => `🔍 **इम्पोर्ट निदान: ${filename}**`,
    noImportsFound: (filename) => `${filename} में कोई इम्पोर्ट नहीं मिला।`,
    categoryFuture: '__future__',
    categoryStdlib: 'stdlib',
    categoryThirdParty: 'third-party',
    categoryLocal: 'स्थानीय',
    duplicatesRemoved: 'डुप्लिकेट हटाए गए',
    previewHeader: '**पूर्वावलोकन (क्रमबद्ध और समूहित):**',
    importsSaved: `✅ इम्पोर्ट व्यवस्थित करके सहेजे गए।`,
  },

  // === Tool 5: cc_diagnose_imports ===
  cc_diagnose_imports: {
    header: (filename) => `🔍 **इम्पोर्ट निदान: ${filename}**`,
    totalImports: 'कुल इम्पोर्ट',
    issues: 'समस्याएँ',
    warnings: 'चेतावनियाँ',
    issuesHeader: '**समस्याएँ:**',
    warningsHeader: '**चेतावनियाँ:**',
    noIssues: '✅ इम्पोर्ट में कोई समस्या नहीं मिली।',
    unusedImport: (line, name) => `पं. ${line}: \`${name}\` इम्पोर्ट हुआ, लेकिन उपयोग नहीं किया गया`,
    duplicateImport: (text) => `डुप्लिकेट: \`${text}\``,
    relativeImportsWarning: (count) =>
      `${count} relative imports मिले (चक्रीय इम्पोर्ट का संभावित जोखिम)`,
    importOrderWarning: (line) => `पं. ${line}: इम्पोर्ट क्रम PEP 8 के अनुरूप नहीं है`,
    hintOrganize: `💡 स्वचालित क्रमबद्धता के लिए \`cc_organize_imports\` का उपयोग करें।`,
  },

  // === Tool 6: cc_fix_json ===
  cc_fix_json: {
    validJson: (filename) => `✅ ${filename} वैध JSON है।`,
    analysisHeader: (filename) => `🔍 **JSON विश्लेषण: ${filename}**`,
    validAfterRepair: '✅ मरम्मत के बाद वैध',
    stillInvalid: (error) => `⚠️ अभी भी अमान्य: ${error}`,
    repairedHeader: (filename) => `✅ **JSON की मरम्मत: ${filename}**`,
    fixBomRemoved: 'BOM हटाया गया',
    fixNulRemoved: 'NUL बाइट हटाए गए',
    fixCommentsRemoved: 'टिप्पणियाँ हटाई गईं',
    fixBlockCommentsRemoved: 'ब्लॉक टिप्पणियाँ हटाई गईं',
    fixTrailingCommas: 'अंतिम कॉमा हटाए गए',
    fixSingleQuotes: 'एकल उद्धरण चिह्न ठीक किए गए',
  },

  // === Tool 7: cc_validate_json ===
  cc_validate_json: {
    validHeader: (filename) => `✅ **मान्य JSON: ${filename}**`,
    invalidHeader: (filename) => `❌ **अमान्य JSON: ${filename}**`,
    typeArray: (count) => `ऐरे (${count} तत्व)`,
    typeObject: (count) => `ऑब्जेक्ट (${count} कुंजियाँ)`,
    labelType: 'प्रकार',
    labelSize: 'आकार',
    labelBom: 'BOM',
    bomYes: '⚠️ हाँ',
    bomNo: 'नहीं',
    positionInfo: (line, col) => `\n**स्थिति:** पंक्ति ${line}, स्तंभ ${col}`,
    errorLabel: (msg) => `**त्रुटि:** ${msg}`,
    hintFix: `💡 स्वचालित मरम्मत के लिए \`cc_fix_json\` का उपयोग करें।`,
  },

  // === Tool 8: cc_fix_encoding ===
  cc_fix_encoding: {
    noErrors: (filename) => `✅ ${filename} में कोई एन्कोडिंग त्रुटि नहीं है।`,
    analysisHeader: (filename) => `🔍 **एन्कोडिंग विश्लेषण: ${filename}**`,
    repairedHeader: (filename) => `✅ **एन्कोडिंग ठीक की गई: ${filename}**`,
  },

  // === Tool 9: cc_cleanup_file ===
  cc_cleanup_file: {
    alreadyClean: (filename) => `✅ ${filename} पहले से साफ़ है।`,
    previewHeader: (filename) => `🔍 **पूर्वावलोकन: ${filename}**`,
    cleanedHeader: (filename) => `✅ **साफ़ किया गया: ${filename}**`,
    fixBomRemoved: 'BOM हटाया गया',
    fixNulRemoved: 'NUL बाइट हटाए गए',
    fixTrailingWhitespace: 'पंक्ति के अंत के खाली स्थान',
  },

  // === Tool 10: cc_convert_format ===
  cc_convert_format: {
    conversionHeader: (inputFormat, outputFormat) => `✅ **${inputFormat} → ${outputFormat}**`,
    csvMinRows: `❌ CSV: कम-से-कम एक हेडर और 1 डेटा पंक्ति आवश्यक है।`,
    csvRequiresArray: `❌ CSV निर्यात के लिए ऐरे आवश्यक है।`,
    iniRequiresObject: `❌ INI निर्यात के लिए ऑब्जेक्ट आवश्यक है।`,
    unsupportedFormat: (format) => `❌ असमर्थित फ़ॉर्मैट: ${format}`,
    labelSource: 'स्रोत',
    labelTarget: 'लक्ष्य',
    labelSize: 'आकार',
  },

  // === Tool 11: cc_fix_umlauts ===
  cc_fix_umlauts: {
    noIssues: (filename) => `✅ ${filename} में कोई बिगड़े हुए umlaut नहीं हैं।`,
    analysisHeader: (filename) => `🔍 **umlaut विश्लेषण: ${filename}**`,
    replacements: (count) => `${count} प्रतिस्थापन:`,
    repairedHeader: (filename) => `✅ **umlaut ठीक किए गए: ${filename}**`,
  },

  // === Tool 12: cc_scan_emoji ===
  cc_scan_emoji: {
    noEmojis: (fileCount) => `✅ ${fileCount} फ़ाइलों में कोई इमोजी नहीं मिला।`,
    scanHeader: (fileCount) => `🔍 **इमोजी स्कैन: ${fileCount} फ़ाइलें**`,
    emojiTableEmoji: 'इमोजी',
    emojiTableCount: 'गिनती',
    emojiTableCodepoint: 'कोड पॉइंट',
    occurrencesHeader: '**घटनाएँ (पहली 30):**',
    andMore: (count) => `  … और ${count}`,
  },

  // === Tool 13: cc_generate_licenses ===
  cc_generate_licenses: {
    noPackageFiles: (dir) => `❌ ${dir} में package.json या requirements.txt नहीं मिली।`,
    generatedHeader: (count) => `✅ **${count} पैकेज के लाइसेंस बनाए गए**`,
    labelFile: 'फ़ाइल',
    labelFormat: 'फ़ॉर्मैट',
    labelPackages: 'पैकेज',
  },

  // === Tool 14: cc_md_to_html ===
  cc_md_to_html: {
    conversionHeader: (filename) => `✅ **Markdown → HTML: ${filename}**`,
    labelSource: 'स्रोत',
    labelTarget: 'लक्ष्य',
    labelSize: 'आकार',
    hintPrint: `💡 ब्राउज़र में HTML फ़ाइल खोलें और PDF के रूप में प्रिंट करें।`,
  },

  // === Tool 15: cc_md_to_pdf ===
  cc_md_to_pdf: {
    conversionHeader: (filename) => `✅ **Markdown → PDF: ${filename}**`,
    labelSource: 'स्रोत',
    labelTarget: 'लक्ष्य',
    labelSize: 'आकार',
    noBrowser: 'कोई ब्राउज़र (Edge/Chrome) नहीं मिला। इसके बजाय HTML फ़ाइल बनाई गई।',
    browserUsed: (name) => `PDF बनाया गया: ${name}`,
  },

  // === Tool 16: cc_check_indentation ===
  cc_check_indentation: {
    description: 'Python फ़ाइलों में छूटे हुए कोलन, बिना इंडेंटेशन वाले return/yield कथन, और टैब व स्पेस के मिश्रण की जाँच करें।',
    header: (path) => `**Python इंडेंटेशन जाँच: ${path}**`,
    filesChecked: 'जाँची गई फ़ाइलें',
    filesWithIssues: 'समस्या वाली फ़ाइलें',
    totalIssues: 'कुल समस्याएँ',
    noIssues: '✅ इंडेंटेशन की कोई समस्या नहीं मिली।',
    issuesHeader: '**समस्याएँ:**',
    andMore: (count) => `… और ${count} समस्याएँ`,
  },

  // === Tool 17: cc_generate_python_code ===
  cc_generate_python_code: {
    description: 'BACH-आधारित टेम्पलेट से Python कोड स्निपेट बनाएँ, बिना फ़ाइलें लिखे',
    header: (kind) => `**जनरेट किया गया Python ${kind}**`,
  },

  cc_runtime_import_diagnose: {
    description: 'BACH-आधारित Python runtime import निदान को अलग-अलग subprocess में चलाएँ',
    header: (path) => `**रनटाइम इम्पोर्ट निदान: ${path}**`,
    python: 'Python',
    modulesTested: 'जाँचे गए मॉड्यूल',
    importsOk: 'Imports ठीक',
    failures: 'विफलताएँ',
    circularImports: 'चक्रीय इम्पोर्ट',
    initFiles: '__init__.py फ़ाइलें',
    timeoutSeconds: 'टाइमआउट (सेकंड)',
    noTargets: 'कोई इम्पोर्ट लक्ष्य नहीं मिला। मॉड्यूल दें या पथ को Python प्रोजेक्ट पर सेट करें।',
    singleImportsHeader: '**अलग-अलग इम्पोर्ट:**',
    importOk: (target, durationMs) => `- OK ${target} (${durationMs} ms)`,
    importFailed: (target, exitCode, output) => `- विफल ${target} (एक्ज़िट कोड ${exitCode}) ${output}`,
    importTimedOut: (target, durationMs) => `- टाइमआउट ${target} (${durationMs} ms)`,
    initFilesHeader: '**__init__.py फ़ाइलों का विश्लेषण:**',
    initFileInfo: (file, directImports, hasLazy) =>
      `- ${file}: ${directImports} सीधे imports${hasLazy ? ', lazy imports present' : ''}`,
    circularHeader: '**संभावित चक्रीय इम्पोर्ट:**',
    circularPair: (moduleA, moduleB) => `- ${moduleA} <-> ${moduleB}`,
    recommendationsHeader: '**सुझाव:**',
    noProblems: '✅ रनटाइम इम्पोर्ट में कोई समस्या नहीं मिली।',
    andMore: (count) => `… और ${count}`,
  },

  cc_python_structural_edit: {
    description: 'पूर्वावलोकन तथा टेस्ट-फ़ाइल और बैकअप सुरक्षा मोड के साथ BACH-आधारित संरचनात्मक Python बदलावों का निरीक्षण और अनुप्रयोग करें',
    header: (path) => `**Python संरचनात्मक संपादन: ${path}**`,
    operationLabel: 'कार्रवाई',
    modeLabel: 'मोड',
    changedLabel: 'बदला गया',
    syntaxLabel: 'सिंटैक्स',
    outputLabel: 'आउटपुट',
    backupLabel: 'बैकअप',
    structureHeader: '**संरचना:**',
    classLine: (name, startLine, endLine) => `- क्लास ${name} (पं.${startLine}-${endLine})`,
    functionLine: (name, startLine, endLine) => `- फ़ंक्शन ${name} (पं. ${startLine}-${endLine})`,
    methodLine: (name, startLine, endLine) => `- मेथड ${name} (पं. ${startLine}-${endLine})`,
    insertedAt: (line) => `पंक्ति ${line} पर सामग्री जोड़ी गई।`,
    deletedElement: (name, startLine, endLine) => `${name} हटाया गया (पं. ${startLine}-${endLine})।`,
    replacedLine: (line) => `पंक्ति ${line} बदली गई।`,
    editFileReady: (path) => `संपादित फ़ाइल लिखी गई: ${path}`,
    editFilePreview: '**संपादित फ़ाइल का पूर्वावलोकन:**',
    testWritten: (path) => `टेस्ट फ़ाइल लिखी गई: ${path}`,
    backupCreated: (path) => `बैकअप बनाया गया: ${path}`,
    appliedTo: (path) => `इस पर लागू किया गया: ${path}`,
    diffHeader: '**डिफ़ का पूर्वावलोकन:**',
    noChanges: 'कोई बदलाव नहीं।',
    elementNotFound: (name) => `तत्व नहीं मिला: ${name}`,
    syntaxFailed: (output) => `Python सिंटैक्स जाँच विफल: ${output}`,
  },

  // === Tool 16: cc_set_language ===
  cc_set_language: {
    languageSet: (lang) => `भाषा सेट की गई: ${lang}`,
    languageGet: (lang, supported) => `वर्तमान भाषा: ${lang} (समर्थित: ${supported.join(', ')})`,
  },

  // === Tool 17: cc_diff_files ===
  cc_diff_files: {
    description: 'दो फ़ाइलों की तुलना करें और unified diff फ़ॉर्मैट में अंतर दिखाएँ',
    header: (fileA, fileB) => `**Diff: ${fileA} ↔ ${fileB}**`,
    identical: 'दोनों फ़ाइलें समान हैं।',
    linesChanged: (added, removed) => `${added} पंक्तियाँ जोड़ी गईं, ${removed} पंक्तियाँ हटाई गईं`,
  },

  // === Tool 18: cc_regex_test ===
  cc_regex_test: {
    description: 'टेक्स्ट या फ़ाइल की सामग्री पर रेगुलर एक्सप्रेशन जाँचें',
    header: (pattern, flags) => `**रेगुलर एक्सप्रेशन: /${pattern}/${flags}**`,
    matchCount: (count) => `${count} मेल मिले`,
    noMatches: 'कोई मेल नहीं मिला।',
  },
};
