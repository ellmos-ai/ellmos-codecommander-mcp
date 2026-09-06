import type { Translations } from './types.js';

export const ja: Translations = {
  common: {
    fileNotFound: (path) => `\u274C ファイルが見つかりません: ${path}`,
    sourceFileNotFound: (path) => `\u274C ソースファイルが見つかりません: ${path}`,
    pathNotFound: (path) => `\u274C パスが見つかりません: ${path}`,
    error: (msg) => `\u274C エラー: ${msg}`,
    serverStarted: '\uD83D\uDE80 ellmos CodeCommander MCP サーバーを開始しました',
  },

  cc_analyze_code: {
    header: (filename) => `\uD83D\uDD0D **コード解析: ${filename}**`,
    metricTotalLines: '総行数',
    metricCodeLines: 'コード行',
    metricCommentLines: 'コメント行',
    metricBlankLines: '空行',
    metricClasses: 'クラス',
    metricFunctions: '関数',
    metricImports: 'インポート',
    metricCyclomaticComplexity: '循環的複雑度',
    metricFileSize: 'ファイルサイズ',
    classesHeader: '**クラス:**',
    classInfo: (name, bases, startLine, endLine, methodCount) =>
      `  \uD83D\uDCE6 **${name}${bases}** (${startLine}-${endLine} 行, ${methodCount} メソッド)`,
    classMethods: (methods) => `    メソッド: ${methods}`,
    functionsHeader: '**関数:**',
    functionInfo: (asyncPrefix, name, params, startLine, endLine) =>
      `  \u2699\uFE0F ${asyncPrefix}**${name}**(${params}) (${startLine}-${endLine} 行)`,
    importsHeader: (stdlibCount, thirdPartyCount, localCount) =>
      `**インポート:** 標準ライブラリ ${stdlibCount}, サードパーティ ${thirdPartyCount}, ローカル ${localCount}`,
    thirdPartyList: (modules) => `  サードパーティ: ${modules}`,
  },

  cc_analyze_methods: {
    header: (filename) => `\uD83D\uDD0D **メソッド解析: ${filename}**`,
    classNotFound: (name, available) =>
      `\u274C クラス "${name}" が見つかりません。利用可能: ${available}`,
    inheritsFrom: (bases) => `継承元: ${bases}`,
    visibility: '可視性',
    complexity: '複雑度',
    visibilityLabel: (visibility, complexity) =>
      `  可視性: ${visibility} | 複雑度: ${complexity}`,
    decorators: (decorators) => `  デコレーター: ${decorators}`,
    calls: (calls) => `  呼び出し: ${calls}`,
    guardrailsHeader: '**BACH ガードレール:**',
    missingSignalCallbacksHeader: '不足しているシグナルコールバック:',
    missingSignalCallback: (line, method) => `  ${line} 行: self.${method} コールバックが見つかりません`,
    attributeIssuesHeader: '属性順序の問題:',
    attributeNeverDefined: (line, attr) => `  ${line} 行: self.${attr} は使用されていますが未定義です`,
    attributeBeforeDefinition: (useLine, attr, defLine) =>
      `  ${useLine} 行: self.${attr} は ${defLine} 行の定義前に使用されています`,
    underscoreMismatchesHeader: 'アンダースコアの不一致:',
    underscoreMismatch: (called, defined) => `  self.${called} が呼ばれていますが ${defined} が定義されています`,
    topLevelFunctions: '## トップレベル関数',
  },

  cc_extract_classes: {
    header: (filename) => `\uD83D\uDD0D **クラス抽出: ${filename}**`,
    classInfo: (name, lineCount, methodCount) =>
      `\uD83D\uDCE6 **${name}** (${lineCount} 行, ${methodCount} メソッド)`,
    helperFunctions: '補助関数',
    helperFunctionsInfo: (lineCount) => `\u2699\uFE0F **補助関数** (${lineCount} 行)`,
    contentHeader: '**抽出内容:**',
    contentTruncated: (maxChars) => `内容は ${maxChars} 文字で切り詰められました。完全なファイルには output_dir を使用してください。`,
    filesWritten: (count, dir) => `\u2705 ${count} 個のファイルを書き込みました: ${dir}`,
    hintUseOutputDir: `\uD83D\uDCA1 抽出結果をファイルとして保存するには output_dir を使用してください。`,
  },

  cc_organize_imports: {
    header: (filename) => `\uD83D\uDD0D **インポート解析: ${filename}**`,
    noImportsFound: (filename) => `\uD83D\uDD0D ${filename} にインポートは見つかりませんでした。`,
    categoryFuture: '__future__',
    categoryStdlib: '標準ライブラリ',
    categoryThirdParty: 'サードパーティ',
    categoryLocal: 'ローカル',
    duplicatesRemoved: '重複を削除しました',
    previewHeader: '**プレビュー (並べ替え・グループ化済み):**',
    importsSaved: `\u2705 インポートを整理して保存しました。`,
  },

  cc_diagnose_imports: {
    header: (filename) => `\uD83D\uDD0D **インポート診断: ${filename}**`,
    totalImports: 'インポート総数',
    issues: '問題',
    warnings: '警告',
    issuesHeader: '**問題:**',
    warningsHeader: '**警告:**',
    noIssues: '\u2705 インポートの問題は見つかりませんでした。',
    unusedImport: (line, name) => `${line} 行: \`${name}\` はインポートされていますが未使用です`,
    duplicateImport: (text) => `重複: \`${text}\``,
    relativeImportsWarning: (count) =>
      `${count} 個の相対インポートが見つかりました (循環インポートの可能性)`,
    importOrderWarning: (line) => `${line} 行: インポート順序が PEP 8 に準拠していません`,
    hintOrganize: `\uD83D\uDCA1 自動整列には \`cc_organize_imports\` を使用してください。`,
  },

  cc_fix_json: {
    validJson: (filename) => `\u2705 ${filename} は有効な JSON です。`,
    analysisHeader: (filename) => `\uD83D\uDD0D **JSON 解析: ${filename}**`,
    validAfterRepair: '\u2705 修復後は有効です',
    stillInvalid: (error) => `\u26A0\uFE0F まだ無効です: ${error}`,
    repairedHeader: (filename) => `\u2705 **JSON を修復しました: ${filename}**`,
    fixBomRemoved: 'BOM を削除しました',
    fixNulRemoved: 'NUL バイトを削除しました',
    fixCommentsRemoved: 'コメントを削除しました',
    fixBlockCommentsRemoved: 'ブロックコメントを削除しました',
    fixTrailingCommas: '末尾のカンマを削除しました',
    fixSingleQuotes: 'シングルクォートを修正しました',
  },

  cc_validate_json: {
    validHeader: (filename) => `\u2705 **有効な JSON: ${filename}**`,
    invalidHeader: (filename) => `\u274C **無効な JSON: ${filename}**`,
    typeArray: (count) => `配列 (${count} 要素)`,
    typeObject: (count) => `オブジェクト (${count} キー)`,
    labelType: '型',
    labelSize: 'サイズ',
    labelBom: 'BOM',
    bomYes: '\u26A0\uFE0F はい',
    bomNo: 'いいえ',
    positionInfo: (line, col) => `\n**位置:** ${line} 行, ${col} 列`,
    errorLabel: (msg) => `**エラー:** ${msg}`,
    hintFix: `\uD83D\uDCA1 自動修復には \`cc_fix_json\` を使用してください。`,
  },

  cc_fix_encoding: {
    noErrors: (filename) => `\u2705 ${filename} にエンコーディングエラーはありません。`,
    analysisHeader: (filename) => `\uD83D\uDD0D **エンコーディング解析: ${filename}**`,
    repairedHeader: (filename) => `\u2705 **エンコーディングを修復しました: ${filename}**`,
  },

  cc_cleanup_file: {
    alreadyClean: (filename) => `\u2705 ${filename} はすでにクリーンです。`,
    previewHeader: (filename) => `\uD83D\uDD0D **プレビュー: ${filename}**`,
    cleanedHeader: (filename) => `\u2705 **クリーンアップ済み: ${filename}**`,
    fixBomRemoved: 'BOM を削除しました',
    fixNulRemoved: 'NUL バイトを削除しました',
    fixTrailingWhitespace: '行末の空白',
  },

  cc_convert_format: {
    conversionHeader: (inputFormat, outputFormat) => `\u2705 **${inputFormat} \u2192 ${outputFormat}**`,
    csvMinRows: `\u274C CSV: ヘッダーと 1 行以上のデータが必要です。`,
    csvRequiresArray: `\u274C CSV エクスポートには配列が必要です。`,
    iniRequiresObject: `\u274C INI エクスポートにはオブジェクトが必要です。`,
    unsupportedFormat: (format) => `\u274C 未対応の形式: ${format}`,
    labelSource: '入力',
    labelTarget: '出力',
    labelSize: 'サイズ',
  },

  cc_fix_umlauts: {
    noIssues: (filename) => `\u2705 ${filename} に壊れたドイツ語ウムラウトはありません。`,
    analysisHeader: (filename) => `\uD83D\uDD0D **ウムラウト解析: ${filename}**`,
    replacements: (count) => `${count} 件の置換:`,
    repairedHeader: (filename) => `\u2705 **ウムラウトを修復しました: ${filename}**`,
  },

  cc_scan_emoji: {
    noEmojis: (fileCount) => `\u2705 ${fileCount} 個のファイルに emoji は見つかりませんでした。`,
    scanHeader: (fileCount) => `\uD83D\uDD0D **Emoji スキャン: ${fileCount} ファイル**`,
    emojiTableEmoji: 'Emoji',
    emojiTableCount: '件数',
    emojiTableCodepoint: 'コードポイント',
    occurrencesHeader: '**出現箇所 (先頭 30 件):**',
    andMore: (count) => `  ... さらに ${count} 件`,
  },

  cc_generate_licenses: {
    noPackageFiles: (dir) => `\u274C ${dir} に package.json または requirements.txt が見つかりません。`,
    generatedHeader: (count) => `\u2705 **ライセンスを生成しました: ${count} パッケージ**`,
    labelFile: 'ファイル',
    labelFormat: '形式',
    labelPackages: 'パッケージ',
  },

  cc_md_to_html: {
    conversionHeader: (filename) => `\u2705 **Markdown \u2192 HTML: ${filename}**`,
    labelSource: '入力',
    labelTarget: '出力',
    labelSize: 'サイズ',
    hintPrint: `\uD83D\uDCA1 HTML ファイルをブラウザーで開き、PDF として印刷してください。`,
  },

  cc_md_to_pdf: {
    conversionHeader: (filename) => `\u2705 **Markdown \u2192 PDF: ${filename}**`,
    labelSource: '入力',
    labelTarget: '出力',
    labelSize: 'サイズ',
    noBrowser: 'ブラウザー (Edge/Chrome) が見つかりません。代わりに HTML ファイルを作成しました。',
    browserUsed: (name) => `${name} で PDF を作成しました`,
  },

  cc_check_indentation: {
    description: 'Python ファイルのコロン不足、未インデントの return/yield、タブとスペースの混在を確認します',
    header: (path) => `**Python インデントチェック: ${path}**`,
    filesChecked: 'チェックしたファイル',
    filesWithIssues: '問題のあるファイル',
    totalIssues: '問題合計',
    noIssues: '\u2705 インデントの問題は見つかりませんでした。',
    issuesHeader: '**問題:**',
    andMore: (count) => `... さらに ${count} 件の問題`,
  },

  cc_generate_python_code: {
    description: 'BACH 由来テンプレートから、ファイルを書き込まずに Python コードスニペットを生成します',
    header: (kind) => `**生成された Python ${kind}**`,
  },

  cc_runtime_import_diagnose: {
    description: 'BACH 由来の Python ランタイム import 診断を隔離サブプロセスで実行します',
    header: (path) => `**ランタイム import 診断: ${path}**`,
    python: 'Python',
    modulesTested: 'テスト済みモジュール',
    importsOk: 'import OK',
    failures: '失敗',
    circularImports: '循環 import',
    initFiles: '__init__.py ファイル',
    timeoutSeconds: 'タイムアウト秒',
    noTargets: 'import 対象が見つかりません。modules を渡すか、path を Python プロジェクトに向けてください。',
    singleImportsHeader: '**隔離 import:**',
    importOk: (target, durationMs) => `- OK ${target} (${durationMs} ms)`,
    importFailed: (target, exitCode, output) => `- FAIL ${target} (exit ${exitCode}) ${output}`,
    importTimedOut: (target, durationMs) => `- TIMEOUT ${target} (${durationMs} ms)`,
    initFilesHeader: '**__init__.py 解析:**',
    initFileInfo: (file, directImports, hasLazy) =>
      `- ${file}: 直接 import ${directImports} 件${hasLazy ? '、遅延 import あり' : ''}`,
    circularHeader: '**循環 import の可能性:**',
    circularPair: (moduleA, moduleB) => `- ${moduleA} <-> ${moduleB}`,
    recommendationsHeader: '**推奨事項:**',
    noProblems: '\u2705 ランタイム import 問題は見つかりませんでした。',
    andMore: (count) => `... ほか ${count} 件`,
  },

  cc_python_structural_edit: {
    description: 'BACH 由来の Python 構造編集を、プレビュー、テストファイル、バックアップ安全モードで確認・適用します',
    header: (path) => `**Python 構造編集: ${path}**`,
    operationLabel: '操作',
    modeLabel: 'モード',
    changedLabel: '変更',
    syntaxLabel: '構文',
    outputLabel: '出力',
    backupLabel: 'バックアップ',
    structureHeader: '**構造:**',
    classLine: (name, startLine, endLine) => `- class ${name} (L.${startLine}-${endLine})`,
    functionLine: (name, startLine, endLine) => `- function ${name} (L.${startLine}-${endLine})`,
    methodLine: (name, startLine, endLine) => `- method ${name} (L.${startLine}-${endLine})`,
    insertedAt: (line) => `${line} 行目に内容を挿入しました。`,
    deletedElement: (name, startLine, endLine) => `${name} を削除しました (L.${startLine}-${endLine})。`,
    replacedLine: (line) => `${line} 行目を置換しました。`,
    editFileReady: (path) => `編集ファイルを書き込みました: ${path}`,
    editFilePreview: '**編集ファイルのプレビュー:**',
    testWritten: (path) => `テストファイルを書き込みました: ${path}`,
    backupCreated: (path) => `バックアップを作成しました: ${path}`,
    appliedTo: (path) => `適用先: ${path}`,
    diffHeader: '**プレビュー diff:**',
    noChanges: '変更はありません。',
    elementNotFound: (name) => `要素が見つかりません: ${name}`,
    syntaxFailed: (output) => `Python 構文チェックに失敗しました: ${output}`,
  },

  cc_set_language: {
    languageSet: (lang) => `言語を設定しました: ${lang}`,
    languageGet: (lang, supported) => `現在の言語: ${lang} (対応言語: ${supported.join(', ')})`,
  },

  cc_diff_files: {
    description: '2 つのファイルを比較し、unified diff 形式で差分を表示します',
    header: (fileA, fileB) => `**Diff: ${fileA} \u2194 ${fileB}**`,
    identical: 'ファイルは同一です。',
    linesChanged: (added, removed) => `${added} 行追加、${removed} 行削除`,
  },

  cc_regex_test: {
    description: 'テキストまたはファイル内容に対して正規表現をテストします',
    header: (pattern, flags) => `**Regex: /${pattern}/${flags}**`,
    matchCount: (count) => `${count} 件の一致が見つかりました`,
    noMatches: '一致は見つかりませんでした。',
  },
};
