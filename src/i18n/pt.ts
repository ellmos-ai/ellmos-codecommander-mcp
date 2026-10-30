import type { Translations } from './types.js';

export const pt: Translations = {
  // === Common ===
  common: {
    fileNotFound: (path) => `❌ Arquivo não encontrado: ${path}`,
    sourceFileNotFound: (path) => `❌ Arquivo de origem não encontrado: ${path}`,
    pathNotFound: (path) => `❌ Caminho não encontrado: ${path}`,
    error: (msg) => `❌ Erro: ${msg}`,
    serverStarted: '🚀 Servidor MCP ellmos CodeCommander iniciado',
  },

  // === Tool 1: cc_analyze_code ===
  cc_analyze_code: {
    header: (filename) => `🔍 **Análise de código: ${filename}**`,
    metricTotalLines: 'Total de linhas',
    metricCodeLines: 'Linhas de código',
    metricCommentLines: 'Linhas de comentários',
    metricBlankLines: 'Linhas em branco',
    metricClasses: 'Classes',
    metricFunctions: 'Funções',
    metricImports: 'Imports',
    metricCyclomaticComplexity: 'Complexidade ciclomática',
    metricFileSize: 'Tamanho do arquivo',
    classesHeader: '**Classes:**',
    classInfo: (name, bases, startLine, endLine, methodCount) =>
      `  📦 **${name}${bases}** (L.${startLine}-${endLine}, ${methodCount} métodos)`,
    classMethods: (methods) => `    Métodos: ${methods}`,
    functionsHeader: '**Funções:**',
    functionInfo: (asyncPrefix, name, params, startLine, endLine) =>
      `  ⚙️ ${asyncPrefix}**${name}**(${params}) (L.${startLine}-${endLine})`,
    importsHeader: (stdlibCount, thirdPartyCount, localCount) =>
      `**Imports:** ${stdlibCount} stdlib, ${thirdPartyCount} de terceiros, ${localCount} locais`,
    thirdPartyList: (modules) => `  Terceiros: ${modules}`,
  },

  // === Tool 2: cc_analyze_methods ===
  cc_analyze_methods: {
    header: (filename) => `🔍 **Análise de métodos: ${filename}**`,
    classNotFound: (name, available) =>
      `❌ Classe “${name}” não encontrada. Disponíveis: ${available}`,
    inheritsFrom: (bases) => `Herda de: ${bases}`,
    visibility: 'Visibilidade',
    complexity: 'Complexidade',
    visibilityLabel: (visibility, complexity) =>
      `  Visibilidade: ${visibility} | Complexidade: ${complexity}`,
    decorators: (decorators) => `  Decoradores: ${decorators}`,
    calls: (calls) => `  Chamadas: ${calls}`,
    guardrailsHeader: '**Proteções BACH:**',
    missingSignalCallbacksHeader: 'Callbacks de sinal ausentes:',
    missingSignalCallback: (line, method) => `  L.${line}: callback self.${method} não encontrado`,
    attributeIssuesHeader: 'Problemas na ordem dos atributos:',
    attributeNeverDefined: (line, attr) => `  L.${line}: self.${attr} usado, mas nunca definido`,
    attributeBeforeDefinition: (useLine, attr, defLine) =>
      `  L.${useLine}: self.${attr} usado antes da definição na L.${defLine}`,
    underscoreMismatchesHeader: 'Inconsistências de sublinhado:',
    underscoreMismatch: (called, defined) => `  self.${called} chamado, mas ${defined} está definido`,
    topLevelFunctions: '## Funções de nível superior',
  },

  // === Tool 3: cc_extract_classes ===
  cc_extract_classes: {
    header: (filename) => `🔍 **Extração de classes: ${filename}**`,
    classInfo: (name, lineCount, methodCount) =>
      `📦 **${name}** (${lineCount} linhas, ${methodCount} métodos)`,
    helperFunctions: 'Funções auxiliares',
    helperFunctionsInfo: (lineCount) => `⚙️ **Funções auxiliares** (${lineCount} linhas)`,
    contentHeader: '**Conteúdo extraído:**',
    contentTruncated: (maxChars) => `Conteúdo truncado após ${maxChars} caracteres. Use output_dir para obter os arquivos completos.`,
    filesWritten: (count, dir) => `✅ ${count} arquivos gravados em: ${dir}`,
    hintUseOutputDir: `💡 Use output_dir para salvar as extrações em arquivos.`,
  },

  // === Tool 4: cc_organize_imports ===
  cc_organize_imports: {
    header: (filename) => `🔍 **Diagnóstico de imports: ${filename}**`,
    noImportsFound: (filename) => `Nenhum import encontrado em ${filename}.`,
    categoryFuture: '__future__',
    categoryStdlib: 'stdlib',
    categoryThirdParty: 'de terceiros',
    categoryLocal: 'locais',
    duplicatesRemoved: 'Duplicatas removidas',
    previewHeader: '**Prévia (ordenada e agrupada):**',
    importsSaved: `✅ Imports organizados e salvos.`,
  },

  // === Tool 5: cc_diagnose_imports ===
  cc_diagnose_imports: {
    header: (filename) => `🔍 **Diagnóstico de imports: ${filename}**`,
    totalImports: 'Total de imports',
    issues: 'Problemas',
    warnings: 'Avisos',
    issuesHeader: '**Problemas:**',
    warningsHeader: '**Avisos:**',
    noIssues: '✅ Nenhum problema de import encontrado.',
    unusedImport: (line, name) => `L.${line}: \`${name}\` foi importado, mas não é usado`,
    duplicateImport: (text) => `Duplicado: \`${text}\``,
    relativeImportsWarning: (count) =>
      `${count} imports relativos encontrados (risco potencial de import circular)`,
    importOrderWarning: (line) => `L.${line}: a ordem dos imports não está conforme a PEP 8`,
    hintOrganize: `💡 Use \`cc_organize_imports\` para ordenar automaticamente.`,
  },

  // === Tool 6: cc_fix_json ===
  cc_fix_json: {
    validJson: (filename) => `✅ ${filename} é um JSON válido.`,
    analysisHeader: (filename) => `🔍 **Análise de JSON: ${filename}**`,
    validAfterRepair: '✅ Válido após a reparação',
    stillInvalid: (error) => `⚠️ Ainda inválido: ${error}`,
    repairedHeader: (filename) => `✅ **JSON reparado: ${filename}**`,
    fixBomRemoved: 'BOM removido',
    fixNulRemoved: 'Bytes NUL removidos',
    fixCommentsRemoved: 'Comentários removidos',
    fixBlockCommentsRemoved: 'Comentários de bloco removidos',
    fixTrailingCommas: 'Vírgulas finais removidas',
    fixSingleQuotes: 'Aspas simples corrigidas',
  },

  // === Tool 7: cc_validate_json ===
  cc_validate_json: {
    validHeader: (filename) => `✅ **JSON válido: ${filename}**`,
    invalidHeader: (filename) => `❌ **JSON inválido: ${filename}**`,
    typeArray: (count) => `Array (${count} elementos)`,
    typeObject: (count) => `Objeto (${count} chaves)`,
    labelType: 'Tipo',
    labelSize: 'Tamanho',
    labelBom: 'BOM',
    bomYes: '⚠️ Sim',
    bomNo: 'Não',
    positionInfo: (line, col) => `\n**Posição:** linha ${line}, coluna ${col}`,
    errorLabel: (msg) => `**Erro:** ${msg}`,
    hintFix: `💡 Use \`cc_fix_json\` para reparar automaticamente.`,
  },

  // === Tool 8: cc_fix_encoding ===
  cc_fix_encoding: {
    noErrors: (filename) => `✅ Nenhum erro de codificação em ${filename}.`,
    analysisHeader: (filename) => `🔍 **Análise de codificação: ${filename}**`,
    repairedHeader: (filename) => `✅ **Codificação reparada: ${filename}**`,
  },

  // === Tool 9: cc_cleanup_file ===
  cc_cleanup_file: {
    alreadyClean: (filename) => `✅ ${filename} já está limpo.`,
    previewHeader: (filename) => `🔍 **Prévia: ${filename}**`,
    cleanedHeader: (filename) => `✅ **Limpo: ${filename}**`,
    fixBomRemoved: 'BOM removido',
    fixNulRemoved: 'Bytes NUL removidos',
    fixTrailingWhitespace: 'Espaços em branco no fim da linha',
  },

  // === Tool 10: cc_convert_format ===
  cc_convert_format: {
    conversionHeader: (inputFormat, outputFormat) => `✅ **${inputFormat} → ${outputFormat}**`,
    csvMinRows: `❌ CSV: é necessário um cabeçalho e pelo menos 1 linha de dados.`,
    csvRequiresArray: `❌ A exportação CSV requer um array.`,
    iniRequiresObject: `❌ A exportação INI requer um objeto.`,
    unsupportedFormat: (format) => `❌ Formato não suportado: ${format}`,
    labelSource: 'Origem',
    labelTarget: 'Destino',
    labelSize: 'Tamanho',
  },

  // === Tool 11: cc_fix_umlauts ===
  cc_fix_umlauts: {
    noIssues: (filename) => `✅ Não há trema mal codificado em ${filename}.`,
    analysisHeader: (filename) => `🔍 **Análise de tremas: ${filename}**`,
    replacements: (count) => `${count} substituição(ões):`,
    repairedHeader: (filename) => `✅ **Tremas reparados: ${filename}**`,
  },

  // === Tool 12: cc_scan_emoji ===
  cc_scan_emoji: {
    noEmojis: (fileCount) => `✅ Nenhum emoji encontrado em ${fileCount} arquivo(s).`,
    scanHeader: (fileCount) => `🔍 **Varredura de emojis: ${fileCount} arquivos**`,
    emojiTableEmoji: 'Emoji',
    emojiTableCount: 'Contagem',
    emojiTableCodepoint: 'Ponto de código',
    occurrencesHeader: '**Ocorrências (primeiras 30):**',
    andMore: (count) => `  … e mais ${count}`,
  },

  // === Tool 13: cc_generate_licenses ===
  cc_generate_licenses: {
    noPackageFiles: (dir) => `❌ Não foi encontrado package.json nem requirements.txt em ${dir}.`,
    generatedHeader: (count) => `✅ **Licenças geradas: ${count} pacote(s)**`,
    labelFile: 'Arquivo',
    labelFormat: 'Formato',
    labelPackages: 'Pacotes',
  },

  // === Tool 14: cc_md_to_html ===
  cc_md_to_html: {
    conversionHeader: (filename) => `✅ **Markdown → HTML: ${filename}**`,
    labelSource: 'Origem',
    labelTarget: 'Destino',
    labelSize: 'Tamanho',
    hintPrint: `💡 Abra o arquivo HTML no navegador e imprima como PDF.`,
  },

  // === Tool 15: cc_md_to_pdf ===
  cc_md_to_pdf: {
    conversionHeader: (filename) => `✅ **Markdown → PDF: ${filename}**`,
    labelSource: 'Origem',
    labelTarget: 'Destino',
    labelSize: 'Tamanho',
    noBrowser: 'Nenhum navegador (Edge/Chrome) encontrado. O arquivo HTML foi criado em vez disso.',
    browserUsed: (name) => `PDF criado com ${name}`,
  },

  // === Tool 16: cc_check_indentation ===
  cc_check_indentation: {
    description: 'Verifique nos arquivos Python dois-pontos ausentes, instruções return/yield sem indentação e mistura de tabulações e espaços.',
    header: (path) => `**Verificação de indentação Python: ${path}**`,
    filesChecked: 'Arquivos verificados',
    filesWithIssues: 'Arquivos com problemas',
    totalIssues: 'Total de problemas',
    noIssues: '✅ Nenhum problema de indentação encontrado.',
    issuesHeader: '**Problemas:**',
    andMore: (count) => `… e mais ${count} problemas`,
  },

  // === Tool 17: cc_generate_python_code ===
  cc_generate_python_code: {
    description: 'Gere trechos de código Python a partir de modelos derivados do BACH sem gravar arquivos',
    header: (kind) => `**Python gerado ${kind}**`,
  },

  cc_runtime_import_diagnose: {
    description: 'Execute diagnósticos de importação do runtime Python derivados do BACH em subprocessos isolados',
    header: (path) => `**Diagnóstico de imports do runtime: ${path}**`,
    python: 'Python',
    modulesTested: 'Módulos testados',
    importsOk: 'Imports OK',
    failures: 'Falhas',
    circularImports: 'Imports circulares',
    initFiles: 'Arquivos __init__.py',
    timeoutSeconds: 'Tempo limite (segundos)',
    noTargets: 'Nenhum destino de importação encontrado. Informe módulos ou aponte o caminho para um projeto Python.',
    singleImportsHeader: '**Imports isolados:**',
    importOk: (target, durationMs) => `- OK ${target} (${durationMs} ms)`,
    importFailed: (target, exitCode, output) => `- FALHA ${target} (código de saída ${exitCode}) ${output}`,
    importTimedOut: (target, durationMs) => `- TEMPO ESGOTADO ${target} (${durationMs} ms)`,
    initFilesHeader: '**Análise dos arquivos __init__.py:**',
    initFileInfo: (file, directImports, hasLazy) =>
      `- ${file}: ${directImports} imports diretos${hasLazy ? ', lazy imports present' : ''}`,
    circularHeader: '**Possíveis imports circulares:**',
    circularPair: (moduleA, moduleB) => `- ${moduleA} <-> ${moduleB}`,
    recommendationsHeader: '**Recomendações:**',
    noProblems: '✅ Nenhum problema de import no runtime encontrado.',
    andMore: (count) => `… e mais ${count}`,
  },

  cc_python_structural_edit: {
    description: 'Inspecione e aplique edições estruturais de Python derivadas do BACH com prévia e modos de segurança para arquivos de teste e backups',
    header: (path) => `**Edição estrutural de Python: ${path}**`,
    operationLabel: 'Operação',
    modeLabel: 'Modo',
    changedLabel: 'Alterado',
    syntaxLabel: 'Sintaxe',
    outputLabel: 'Saída',
    backupLabel: 'Backup',
    structureHeader: '**Estrutura:**',
    classLine: (name, startLine, endLine) => `- classe ${name} (L.${startLine}-${endLine})`,
    functionLine: (name, startLine, endLine) => `- função ${name} (L.${startLine}-${endLine})`,
    methodLine: (name, startLine, endLine) => `- método ${name} (L.${startLine}-${endLine})`,
    insertedAt: (line) => `Conteúdo inserido na linha ${line}.`,
    deletedElement: (name, startLine, endLine) => `${name} removido(s) (L.${startLine}-${endLine}).`,
    replacedLine: (line) => `Linha ${line} substituída.`,
    editFileReady: (path) => `Arquivo editado gravado: ${path}`,
    editFilePreview: '**Prévia do arquivo editado:**',
    testWritten: (path) => `Arquivo de teste gravado: ${path}`,
    backupCreated: (path) => `Backup criado: ${path}`,
    appliedTo: (path) => `Aplicado a: ${path}`,
    diffHeader: '**Prévia do diff:**',
    noChanges: 'Nenhuma alteração.',
    elementNotFound: (name) => `Elemento não encontrado: ${name}`,
    syntaxFailed: (output) => `Falha na verificação de sintaxe Python: ${output}`,
  },

  // === Tool 16: cc_set_language ===
  cc_set_language: {
    languageSet: (lang) => `Idioma definido como: ${lang}`,
    languageGet: (lang, supported) => `Idioma atual: ${lang} (suportados: ${supported.join(', ')})`,
  },

  // === Tool 17: cc_diff_files ===
  cc_diff_files: {
    description: 'Compare dois arquivos e mostre as diferenças no formato diff unificado',
    header: (fileA, fileB) => `**Diff: ${fileA} ↔ ${fileB}**`,
    identical: 'Os arquivos são idênticos.',
    linesChanged: (added, removed) => `${added} linhas adicionadas, ${removed} linhas removidas`,
  },

  // === Tool 18: cc_regex_test ===
  cc_regex_test: {
    description: 'Teste expressões regulares em texto ou no conteúdo de um arquivo',
    header: (pattern, flags) => `**Expressão regular: /${pattern}/${flags}**`,
    matchCount: (count) => `${count} correspondência(s) encontrada(s)`,
    noMatches: 'Nenhuma correspondência encontrada.',
  },
};
