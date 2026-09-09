import type { Translations } from './types.js';

export const es: Translations = {
  common: {
    fileNotFound: (path) => `\u274C Archivo no encontrado: ${path}`,
    sourceFileNotFound: (path) => `\u274C Archivo fuente no encontrado: ${path}`,
    pathNotFound: (path) => `\u274C Ruta no encontrada: ${path}`,
    error: (msg) => `\u274C Error: ${msg}`,
    serverStarted: '\uD83D\uDE80 Servidor MCP ellmos CodeCommander iniciado',
  },

  cc_analyze_code: {
    header: (filename) => `\uD83D\uDD0D **Análisis de código: ${filename}**`,
    metricTotalLines: 'Líneas totales',
    metricCodeLines: 'Líneas de código',
    metricCommentLines: 'Líneas de comentarios',
    metricBlankLines: 'Líneas en blanco',
    metricClasses: 'Clases',
    metricFunctions: 'Funciones',
    metricImports: 'Importaciones',
    metricCyclomaticComplexity: 'Complejidad ciclomática',
    metricFileSize: 'Tamaño de archivo',
    classesHeader: '**Clases:**',
    classInfo: (name, bases, startLine, endLine, methodCount) =>
      `  \uD83D\uDCE6 **${name}${bases}** (L.${startLine}-${endLine}, ${methodCount} métodos)`,
    classMethods: (methods) => `    Métodos: ${methods}`,
    functionsHeader: '**Funciones:**',
    functionInfo: (asyncPrefix, name, params, startLine, endLine) =>
      `  \u2699\uFE0F ${asyncPrefix}**${name}**(${params}) (L.${startLine}-${endLine})`,
    importsHeader: (stdlibCount, thirdPartyCount, localCount) =>
      `**Importaciones:** ${stdlibCount} stdlib, ${thirdPartyCount} terceros, ${localCount} locales`,
    thirdPartyList: (modules) => `  Terceros: ${modules}`,
  },

  cc_analyze_methods: {
    header: (filename) => `\uD83D\uDD0D **Análisis de métodos: ${filename}**`,
    classNotFound: (name, available) =>
      `\u274C Clase "${name}" no encontrada. Disponibles: ${available}`,
    inheritsFrom: (bases) => `Hereda de: ${bases}`,
    visibility: 'Visibilidad',
    complexity: 'Complejidad',
    visibilityLabel: (visibility, complexity) =>
      `  Visibilidad: ${visibility} | Complejidad: ${complexity}`,
    decorators: (decorators) => `  Decoradores: ${decorators}`,
    calls: (calls) => `  Llamadas: ${calls}`,
    guardrailsHeader: '**Comprobaciones BACH:**',
    missingSignalCallbacksHeader: 'Callbacks de señal faltantes:',
    missingSignalCallback: (line, method) => `  L.${line}: callback self.${method} no encontrado`,
    attributeIssuesHeader: 'Problemas de orden de atributos:',
    attributeNeverDefined: (line, attr) => `  L.${line}: self.${attr} se usa pero nunca se define`,
    attributeBeforeDefinition: (useLine, attr, defLine) =>
      `  L.${useLine}: self.${attr} se usa antes de definirse en L.${defLine}`,
    underscoreMismatchesHeader: 'Inconsistencias de guion bajo:',
    underscoreMismatch: (called, defined) => `  se llama self.${called}, pero está definido ${defined}`,
    topLevelFunctions: '## Funciones de nivel superior',
  },

  cc_extract_classes: {
    header: (filename) => `\uD83D\uDD0D **Extracción de clases: ${filename}**`,
    classInfo: (name, lineCount, methodCount) =>
      `\uD83D\uDCE6 **${name}** (${lineCount} líneas, ${methodCount} métodos)`,
    helperFunctions: 'FuncionesAuxiliares',
    helperFunctionsInfo: (lineCount) => `\u2699\uFE0F **Funciones auxiliares** (${lineCount} líneas)`,
    contentHeader: '**Contenido extraído:**',
    contentTruncated: (maxChars) => `Contenido truncado después de ${maxChars} caracteres. Usa output_dir para archivos completos.`,
    filesWritten: (count, dir) => `\u2705 ${count} archivos escritos en: ${dir}`,
    hintUseOutputDir: `\uD83D\uDCA1 Usa output_dir para guardar las extracciones como archivos.`,
  },

  cc_organize_imports: {
    header: (filename) => `\uD83D\uDD0D **Análisis de importaciones: ${filename}**`,
    noImportsFound: (filename) => `\uD83D\uDD0D No se encontraron importaciones en ${filename}.`,
    categoryFuture: '__future__',
    categoryStdlib: 'stdlib',
    categoryThirdParty: 'terceros',
    categoryLocal: 'local',
    duplicatesRemoved: 'Duplicados eliminados',
    previewHeader: '**Vista previa (ordenada y agrupada):**',
    importsSaved: `\u2705 Importaciones organizadas y guardadas.`,
  },

  cc_diagnose_imports: {
    header: (filename) => `\uD83D\uDD0D **Diagnóstico de importaciones: ${filename}**`,
    totalImports: 'Importaciones totales',
    issues: 'Problemas',
    warnings: 'Advertencias',
    issuesHeader: '**Problemas:**',
    warningsHeader: '**Advertencias:**',
    noIssues: '\u2705 No se encontraron problemas de importación.',
    unusedImport: (line, name) => `L.${line}: \`${name}\` se importa pero no se usa`,
    duplicateImport: (text) => `Duplicado: \`${text}\``,
    relativeImportsWarning: (count) =>
      `${count} importaciones relativas encontradas (riesgo potencial de importación circular)`,
    importOrderWarning: (line) => `L.${line}: orden de importaciones no conforme con PEP 8`,
    hintOrganize: `\uD83D\uDCA1 Usa \`cc_organize_imports\` para ordenar automáticamente.`,
  },

  cc_fix_json: {
    validJson: (filename) => `\u2705 ${filename} es JSON válido.`,
    analysisHeader: (filename) => `\uD83D\uDD0D **Análisis JSON: ${filename}**`,
    validAfterRepair: '\u2705 Válido después de la reparación',
    stillInvalid: (error) => `\u26A0\uFE0F Sigue siendo inválido: ${error}`,
    repairedHeader: (filename) => `\u2705 **JSON reparado: ${filename}**`,
    fixBomRemoved: 'BOM eliminado',
    fixNulRemoved: 'Bytes NUL eliminados',
    fixCommentsRemoved: 'Comentarios eliminados',
    fixBlockCommentsRemoved: 'Comentarios de bloque eliminados',
    fixTrailingCommas: 'Comas finales eliminadas',
    fixSingleQuotes: 'Comillas simples corregidas',
  },

  cc_validate_json: {
    validHeader: (filename) => `\u2705 **JSON válido: ${filename}**`,
    invalidHeader: (filename) => `\u274C **JSON inválido: ${filename}**`,
    typeArray: (count) => `Array (${count} elementos)`,
    typeObject: (count) => `Objeto (${count} claves)`,
    labelType: 'Tipo',
    labelSize: 'Tamaño',
    labelBom: 'BOM',
    bomYes: '\u26A0\uFE0F Sí',
    bomNo: 'No',
    positionInfo: (line, col) => `\n**Posición:** Línea ${line}, columna ${col}`,
    errorLabel: (msg) => `**Error:** ${msg}`,
    hintFix: `\uD83D\uDCA1 Usa \`cc_fix_json\` para reparación automática.`,
  },

  cc_fix_encoding: {
    noErrors: (filename) => `\u2705 No hay errores de codificación en ${filename}.`,
    analysisHeader: (filename) => `\uD83D\uDD0D **Análisis de codificación: ${filename}**`,
    repairedHeader: (filename) => `\u2705 **Codificación reparada: ${filename}**`,
  },

  cc_cleanup_file: {
    alreadyClean: (filename) => `\u2705 ${filename} ya está limpio.`,
    previewHeader: (filename) => `\uD83D\uDD0D **Vista previa: ${filename}**`,
    cleanedHeader: (filename) => `\u2705 **Limpiado: ${filename}**`,
    fixBomRemoved: 'BOM eliminado',
    fixNulRemoved: 'Bytes NUL eliminados',
    fixTrailingWhitespace: 'Espacios finales',
  },

  cc_convert_format: {
    conversionHeader: (inputFormat, outputFormat) => `\u2705 **${inputFormat} \u2192 ${outputFormat}**`,
    csvMinRows: `\u274C CSV: se requiere al menos encabezado + 1 fila de datos.`,
    csvRequiresArray: `\u274C La exportación CSV requiere un array.`,
    iniRequiresObject: `\u274C La exportación INI requiere un objeto.`,
    unsupportedFormat: (format) => `\u274C Formato no admitido: ${format}`,
    labelSource: 'Origen',
    labelTarget: 'Destino',
    labelSize: 'Tamaño',
  },

  cc_fix_umlauts: {
    noIssues: (filename) => `\u2705 No hay diéresis alemanas dañadas en ${filename}.`,
    analysisHeader: (filename) => `\uD83D\uDD0D **Análisis de diéresis: ${filename}**`,
    replacements: (count) => `${count} reemplazos:`,
    repairedHeader: (filename) => `\u2705 **Diéresis reparadas: ${filename}**`,
  },

  cc_scan_emoji: {
    noEmojis: (fileCount) => `\u2705 No se encontraron emojis en ${fileCount} archivos.`,
    scanHeader: (fileCount) => `\uD83D\uDD0D **Escaneo de emojis: ${fileCount} archivos**`,
    emojiTableEmoji: 'Emoji',
    emojiTableCount: 'Cantidad',
    emojiTableCodepoint: 'Codepoint',
    occurrencesHeader: '**Ocurrencias (primeras 30):**',
    andMore: (count) => `  ... y ${count} más`,
  },

  cc_generate_licenses: {
    noPackageFiles: (dir) => `\u274C No se encontró package.json ni requirements.txt en ${dir}.`,
    generatedHeader: (count) => `\u2705 **Licencias generadas: ${count} paquetes**`,
    labelFile: 'Archivo',
    labelFormat: 'Formato',
    labelPackages: 'Paquetes',
  },

  cc_md_to_html: {
    conversionHeader: (filename) => `\u2705 **Markdown \u2192 HTML: ${filename}**`,
    labelSource: 'Origen',
    labelTarget: 'Destino',
    labelSize: 'Tamaño',
    hintPrint: `\uD83D\uDCA1 Abre el archivo HTML en un navegador e imprímelo como PDF.`,
  },

  cc_md_to_pdf: {
    conversionHeader: (filename) => `\u2705 **Markdown \u2192 PDF: ${filename}**`,
    labelSource: 'Origen',
    labelTarget: 'Destino',
    labelSize: 'Tamaño',
    noBrowser: 'No se encontró navegador (Edge/Chrome). En su lugar se creó un archivo HTML.',
    browserUsed: (name) => `PDF creado con ${name}`,
  },

  cc_check_indentation: {
    description: 'Revisa archivos Python en busca de dos puntos faltantes, return/yield sin indentación y mezcla de tabs/espacios',
    header: (path) => `**Comprobación de indentación Python: ${path}**`,
    filesChecked: 'Archivos revisados',
    filesWithIssues: 'Archivos con problemas',
    totalIssues: 'Problemas totales',
    noIssues: '\u2705 No se encontraron problemas de indentación.',
    issuesHeader: '**Problemas:**',
    andMore: (count) => `... y ${count} problemas más`,
  },

  cc_generate_python_code: {
    description: 'Genera fragmentos de código Python desde plantillas derivadas de BACH sin escribir archivos',
    header: (kind) => `**Python ${kind} generado**`,
  },

  cc_runtime_import_diagnose: {
    description: 'Ejecuta diagnósticos de imports Python derivados de BACH en subprocesos aislados',
    header: (path) => `**Diagnóstico runtime de imports: ${path}**`,
    python: 'Python',
    modulesTested: 'Módulos revisados',
    importsOk: 'Imports OK',
    failures: 'Fallos',
    circularImports: 'Imports circulares',
    initFiles: 'Archivos __init__.py',
    timeoutSeconds: 'Segundos de timeout',
    noTargets: 'No se encontraron objetivos de import. Pasa modules o apunta path a un proyecto Python.',
    singleImportsHeader: '**Imports aislados:**',
    importOk: (target, durationMs) => `- OK ${target} (${durationMs} ms)`,
    importFailed: (target, exitCode, output) => `- FALLO ${target} (exit ${exitCode}) ${output}`,
    importTimedOut: (target, durationMs) => `- TIMEOUT ${target} (${durationMs} ms)`,
    initFilesHeader: '**Análisis de __init__.py:**',
    initFileInfo: (file, directImports, hasLazy) =>
      `- ${file}: ${directImports} imports directos${hasLazy ? ', imports lazy presentes' : ''}`,
    circularHeader: '**Posibles imports circulares:**',
    circularPair: (moduleA, moduleB) => `- ${moduleA} <-> ${moduleB}`,
    recommendationsHeader: '**Recomendaciones:**',
    noProblems: '\u2705 No se encontraron problemas runtime de imports.',
    andMore: (count) => `... y ${count} más`,
  },

  cc_python_structural_edit: {
    description: 'Inspecciona y aplica ediciones estructurales de Python derivadas de BACH con modos de vista previa, prueba y backup',
    header: (path) => `**Edición estructural Python: ${path}**`,
    operationLabel: 'Operación',
    modeLabel: 'Modo',
    changedLabel: 'Cambiado',
    syntaxLabel: 'Sintaxis',
    outputLabel: 'Salida',
    backupLabel: 'Backup',
    structureHeader: '**Estructura:**',
    classLine: (name, startLine, endLine) => `- clase ${name} (L.${startLine}-${endLine})`,
    functionLine: (name, startLine, endLine) => `- función ${name} (L.${startLine}-${endLine})`,
    methodLine: (name, startLine, endLine) => `- método ${name} (L.${startLine}-${endLine})`,
    insertedAt: (line) => `Contenido insertado en la línea ${line}.`,
    deletedElement: (name, startLine, endLine) => `${name} eliminado (L.${startLine}-${endLine}).`,
    replacedLine: (line) => `Línea ${line} reemplazada.`,
    editFileReady: (path) => `Archivo de edición escrito: ${path}`,
    editFilePreview: '**Vista previa del archivo de edición:**',
    testWritten: (path) => `Archivo de prueba escrito: ${path}`,
    backupCreated: (path) => `Backup creado: ${path}`,
    appliedTo: (path) => `Aplicado a: ${path}`,
    diffHeader: '**Diff de vista previa:**',
    noChanges: 'Sin cambios.',
    elementNotFound: (name) => `Elemento no encontrado: ${name}`,
    syntaxFailed: (output) => `La comprobación de sintaxis Python falló: ${output}`,
  },

  cc_set_language: {
    languageSet: (lang) => `Idioma establecido en: ${lang}`,
    languageGet: (lang, supported) => `Idioma actual: ${lang} (Soportados: ${supported.join(', ')})`,
  },

  cc_diff_files: {
    description: 'Compara dos archivos y muestra diferencias en formato unified diff',
    header: (fileA, fileB) => `**Diff: ${fileA} \u2194 ${fileB}**`,
    identical: 'Los archivos son idénticos.',
    linesChanged: (added, removed) => `${added} líneas añadidas, ${removed} líneas eliminadas`,
  },

  cc_regex_test: {
    description: 'Prueba expresiones regulares contra texto o contenido de archivo',
    header: (pattern, flags) => `**Regex: /${pattern}/${flags}**`,
    matchCount: (count) => `${count} coincidencias encontradas`,
    noMatches: 'No se encontraron coincidencias.',
  },
};
