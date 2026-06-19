import type { Translations } from './types.js';

export const zh: Translations = {
  common: {
    fileNotFound: (path) => `\u274C 未找到文件：${path}`,
    sourceFileNotFound: (path) => `\u274C 未找到源文件：${path}`,
    pathNotFound: (path) => `\u274C 未找到路径：${path}`,
    error: (msg) => `\u274C 错误：${msg}`,
    serverStarted: '\uD83D\uDE80 ellmos CodeCommander MCP 服务器已启动',
  },

  cc_analyze_code: {
    header: (filename) => `\uD83D\uDD0D **代码分析：${filename}**`,
    metricTotalLines: '总行数',
    metricCodeLines: '代码行',
    metricCommentLines: '注释行',
    metricBlankLines: '空行',
    metricClasses: '类',
    metricFunctions: '函数',
    metricImports: '导入',
    metricCyclomaticComplexity: '圈复杂度',
    metricFileSize: '文件大小',
    classesHeader: '**类：**',
    classInfo: (name, bases, startLine, endLine, methodCount) =>
      `  \uD83D\uDCE6 **${name}${bases}** (行 ${startLine}-${endLine}，${methodCount} 个方法)`,
    classMethods: (methods) => `    方法：${methods}`,
    functionsHeader: '**函数：**',
    functionInfo: (asyncPrefix, name, params, startLine, endLine) =>
      `  \u2699\uFE0F ${asyncPrefix}**${name}**(${params}) (行 ${startLine}-${endLine})`,
    importsHeader: (stdlibCount, thirdPartyCount, localCount) =>
      `**导入：** ${stdlibCount} 个标准库，${thirdPartyCount} 个第三方，${localCount} 个本地`,
    thirdPartyList: (modules) => `  第三方：${modules}`,
  },

  cc_analyze_methods: {
    header: (filename) => `\uD83D\uDD0D **方法分析：${filename}**`,
    classNotFound: (name, available) =>
      `\u274C 未找到类 "${name}"。可用：${available}`,
    inheritsFrom: (bases) => `继承自：${bases}`,
    visibility: '可见性',
    complexity: '复杂度',
    visibilityLabel: (visibility, complexity) =>
      `  可见性：${visibility} | 复杂度：${complexity}`,
    decorators: (decorators) => `  装饰器：${decorators}`,
    calls: (calls) => `  调用：${calls}`,
    topLevelFunctions: '## 顶层函数',
  },

  cc_extract_classes: {
    header: (filename) => `\uD83D\uDD0D **类提取：${filename}**`,
    classInfo: (name, lineCount, methodCount) =>
      `\uD83D\uDCE6 **${name}**（${lineCount} 行，${methodCount} 个方法）`,
    helperFunctions: '辅助函数',
    helperFunctionsInfo: (lineCount) => `\u2699\uFE0F **辅助函数**（${lineCount} 行）`,
    filesWritten: (count, dir) => `\u2705 已将 ${count} 个文件写入：${dir}`,
    hintUseOutputDir: `\uD83D\uDCA1 使用 output_dir 将提取结果保存为文件。`,
  },

  cc_organize_imports: {
    header: (filename) => `\uD83D\uDD0D **导入分析：${filename}**`,
    noImportsFound: (filename) => `\uD83D\uDD0D 在 ${filename} 中未找到导入。`,
    categoryFuture: '__future__',
    categoryStdlib: '标准库',
    categoryThirdParty: '第三方',
    categoryLocal: '本地',
    duplicatesRemoved: '已移除重复项',
    previewHeader: '**预览（已排序并分组）：**',
    importsSaved: `\u2705 导入已整理并保存。`,
  },

  cc_diagnose_imports: {
    header: (filename) => `\uD83D\uDD0D **导入诊断：${filename}**`,
    totalImports: '导入总数',
    issues: '问题',
    warnings: '警告',
    issuesHeader: '**问题：**',
    warningsHeader: '**警告：**',
    noIssues: '\u2705 未发现导入问题。',
    unusedImport: (line, name) => `行 ${line}：\`${name}\` 已导入但未使用`,
    duplicateImport: (text) => `重复：\`${text}\``,
    relativeImportsWarning: (count) =>
      `发现 ${count} 个相对导入（可能存在循环导入风险）`,
    importOrderWarning: (line) => `行 ${line}：导入顺序不符合 PEP 8`,
    hintOrganize: `\uD83D\uDCA1 使用 \`cc_organize_imports\` 自动排序。`,
  },

  cc_fix_json: {
    validJson: (filename) => `\u2705 ${filename} 是有效 JSON。`,
    analysisHeader: (filename) => `\uD83D\uDD0D **JSON 分析：${filename}**`,
    validAfterRepair: '\u2705 修复后有效',
    stillInvalid: (error) => `\u26A0\uFE0F 仍然无效：${error}`,
    repairedHeader: (filename) => `\u2705 **JSON 已修复：${filename}**`,
    fixBomRemoved: '已移除 BOM',
    fixNulRemoved: '已移除 NUL 字节',
    fixCommentsRemoved: '已移除注释',
    fixBlockCommentsRemoved: '已移除块注释',
    fixTrailingCommas: '已移除尾随逗号',
    fixSingleQuotes: '已修复单引号',
  },

  cc_validate_json: {
    validHeader: (filename) => `\u2705 **有效 JSON：${filename}**`,
    invalidHeader: (filename) => `\u274C **无效 JSON：${filename}**`,
    typeArray: (count) => `数组（${count} 个元素）`,
    typeObject: (count) => `对象（${count} 个键）`,
    labelType: '类型',
    labelSize: '大小',
    labelBom: 'BOM',
    bomYes: '\u26A0\uFE0F 是',
    bomNo: '否',
    positionInfo: (line, col) => `\n**位置：** 第 ${line} 行，第 ${col} 列`,
    errorLabel: (msg) => `**错误：** ${msg}`,
    hintFix: `\uD83D\uDCA1 使用 \`cc_fix_json\` 自动修复。`,
  },

  cc_fix_encoding: {
    noErrors: (filename) => `\u2705 ${filename} 中没有编码错误。`,
    analysisHeader: (filename) => `\uD83D\uDD0D **编码分析：${filename}**`,
    repairedHeader: (filename) => `\u2705 **编码已修复：${filename}**`,
  },

  cc_cleanup_file: {
    alreadyClean: (filename) => `\u2705 ${filename} 已经干净。`,
    previewHeader: (filename) => `\uD83D\uDD0D **预览：${filename}**`,
    cleanedHeader: (filename) => `\u2705 **已清理：${filename}**`,
    fixBomRemoved: '已移除 BOM',
    fixNulRemoved: '已移除 NUL 字节',
    fixTrailingWhitespace: '尾随空白',
  },

  cc_convert_format: {
    conversionHeader: (inputFormat, outputFormat) => `\u2705 **${inputFormat} \u2192 ${outputFormat}**`,
    csvMinRows: `\u274C CSV：至少需要表头 + 1 行数据。`,
    csvRequiresArray: `\u274C CSV 导出需要数组。`,
    iniRequiresObject: `\u274C INI 导出需要对象。`,
    unsupportedFormat: (format) => `\u274C 不支持的格式：${format}`,
    labelSource: '来源',
    labelTarget: '目标',
    labelSize: '大小',
  },

  cc_fix_umlauts: {
    noIssues: (filename) => `\u2705 ${filename} 中没有损坏的德语变音字符。`,
    analysisHeader: (filename) => `\uD83D\uDD0D **德语变音字符分析：${filename}**`,
    replacements: (count) => `${count} 次替换：`,
    repairedHeader: (filename) => `\u2705 **德语变音字符已修复：${filename}**`,
  },

  cc_scan_emoji: {
    noEmojis: (fileCount) => `\u2705 在 ${fileCount} 个文件中未找到 emoji。`,
    scanHeader: (fileCount) => `\uD83D\uDD0D **Emoji 扫描：${fileCount} 个文件**`,
    emojiTableEmoji: 'Emoji',
    emojiTableCount: '数量',
    emojiTableCodepoint: '码点',
    occurrencesHeader: '**出现位置（前 30 个）：**',
    andMore: (count) => `  ... 还有 ${count} 个`,
  },

  cc_generate_licenses: {
    noPackageFiles: (dir) => `\u274C 在 ${dir} 中未找到 package.json 或 requirements.txt。`,
    generatedHeader: (count) => `\u2705 **已生成许可证：${count} 个包**`,
    labelFile: '文件',
    labelFormat: '格式',
    labelPackages: '包',
  },

  cc_md_to_html: {
    conversionHeader: (filename) => `\u2705 **Markdown \u2192 HTML：${filename}**`,
    labelSource: '来源',
    labelTarget: '目标',
    labelSize: '大小',
    hintPrint: `\uD83D\uDCA1 在浏览器中打开 HTML 文件并打印为 PDF。`,
  },

  cc_md_to_pdf: {
    conversionHeader: (filename) => `\u2705 **Markdown \u2192 PDF：${filename}**`,
    labelSource: '来源',
    labelTarget: '目标',
    labelSize: '大小',
    noBrowser: '未找到浏览器（Edge/Chrome）。已改为创建 HTML 文件。',
    browserUsed: (name) => `已使用 ${name} 创建 PDF`,
  },

  cc_check_indentation: {
    description: '检查 Python 文件中缺失冒号、未缩进的 return/yield 语句以及 tab/空格混用',
    header: (path) => `**Python 缩进检查：${path}**`,
    filesChecked: '已检查文件',
    filesWithIssues: '有问题的文件',
    totalIssues: '问题总数',
    noIssues: '\u2705 未发现缩进问题。',
    issuesHeader: '**问题：**',
    andMore: (count) => `... 还有 ${count} 个问题`,
  },

  cc_generate_python_code: {
    description: '从 BACH 派生模板生成 Python 代码片段，不写入文件',
    header: (kind) => `**已生成 Python ${kind}**`,
  },

  cc_set_language: {
    languageSet: (lang) => `语言已设置为：${lang}`,
  },

  cc_diff_files: {
    description: '比较两个文件，并以 unified diff 格式显示差异',
    header: (fileA, fileB) => `**Diff：${fileA} \u2194 ${fileB}**`,
    identical: '文件完全相同。',
    linesChanged: (added, removed) => `新增 ${added} 行，删除 ${removed} 行`,
  },

  cc_regex_test: {
    description: '对文本或文件内容测试正则表达式',
    header: (pattern, flags) => `**Regex：/${pattern}/${flags}**`,
    matchCount: (count) => `找到 ${count} 个匹配`,
    noMatches: '未找到匹配。',
  },
};
