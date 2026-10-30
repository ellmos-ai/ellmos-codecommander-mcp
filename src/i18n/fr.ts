import type { Translations } from './types.js';

export const fr: Translations = {
  // === Common ===
  common: {
    fileNotFound: (path) => `❌ Fichier introuvable : ${path}`,
    sourceFileNotFound: (path) => `❌ Fichier source introuvable : ${path}`,
    pathNotFound: (path) => `❌ Chemin introuvable : ${path}`,
    error: (msg) => `❌ Erreur : ${msg}`,
    serverStarted: '🚀 Serveur MCP ellmos CodeCommander démarré',
  },

  // === Tool 1: cc_analyze_code ===
  cc_analyze_code: {
    header: (filename) => `🔍 **Analyse du code : ${filename}**`,
    metricTotalLines: 'Nombre total de lignes',
    metricCodeLines: 'Lignes de code',
    metricCommentLines: 'Lignes de commentaires',
    metricBlankLines: 'Lignes vides',
    metricClasses: 'Classes',
    metricFunctions: 'Fonctions',
    metricImports: 'Imports',
    metricCyclomaticComplexity: 'Complexité cyclomatique',
    metricFileSize: 'Taille du fichier',
    classesHeader: '**Classes :**',
    classInfo: (name, bases, startLine, endLine, methodCount) =>
      `  📦 **${name}${bases}** (L.${startLine}-${endLine}, ${methodCount} méthodes)`,
    classMethods: (methods) => `    Méthodes : ${methods}`,
    functionsHeader: '**Fonctions :**',
    functionInfo: (asyncPrefix, name, params, startLine, endLine) =>
      `  ⚙️ ${asyncPrefix}**${name}**(${params}) (L.${startLine}-${endLine})`,
    importsHeader: (stdlibCount, thirdPartyCount, localCount) =>
      `**Imports :** ${stdlibCount} stdlib, ${thirdPartyCount} tierces, ${localCount} locales`,
    thirdPartyList: (modules) => `  Tiers : ${modules}`,
  },

  // === Tool 2: cc_analyze_methods ===
  cc_analyze_methods: {
    header: (filename) => `🔍 **Analyse des méthodes : ${filename}**`,
    classNotFound: (name, available) =>
      `❌ Classe « ${name} » introuvable. Disponibles : ${available}`,
    inheritsFrom: (bases) => `Hérite de : ${bases}`,
    visibility: 'Visibilité',
    complexity: 'Complexité',
    visibilityLabel: (visibility, complexity) =>
      `  Visibilité : ${visibility} | Complexité : ${complexity}`,
    decorators: (decorators) => `  Décorateurs : ${decorators}`,
    calls: (calls) => `  Appels : ${calls}`,
    guardrailsHeader: '**Garde-fous BACH :**',
    missingSignalCallbacksHeader: 'Callbacks de signaux manquants :',
    missingSignalCallback: (line, method) => `  L.${line} : callback self.${method} introuvable`,
    attributeIssuesHeader: 'Problèmes d’ordre des attributs :',
    attributeNeverDefined: (line, attr) => `  L.${line} : self.${attr} utilisé mais jamais défini`,
    attributeBeforeDefinition: (useLine, attr, defLine) =>
      `  L.${useLine} : self.${attr} utilisé avant sa définition à la ligne ${defLine}`,
    underscoreMismatchesHeader: 'Incohérences des underscores :',
    underscoreMismatch: (called, defined) => `  self.${called} appelé, mais ${defined} est défini`,
    topLevelFunctions: '## Fonctions de niveau supérieur',
  },

  // === Tool 3: cc_extract_classes ===
  cc_extract_classes: {
    header: (filename) => `🔍 **Extraction de classes : ${filename}**`,
    classInfo: (name, lineCount, methodCount) =>
      `📦 **${name}** (${lineCount} lignes, ${methodCount} méthodes)`,
    helperFunctions: 'Fonctions auxiliaires',
    helperFunctionsInfo: (lineCount) => `⚙️ **Fonctions auxiliaires** (${lineCount} lignes)`,
    contentHeader: '**Contenu extrait :**',
    contentTruncated: (maxChars) => `Contenu tronqué après ${maxChars} caractères. Utilisez output_dir pour obtenir les fichiers complets.`,
    filesWritten: (count, dir) => `✅ ${count} fichiers écrits dans : ${dir}`,
    hintUseOutputDir: `💡 Utilisez output_dir pour enregistrer les extractions dans des fichiers.`,
  },

  // === Tool 4: cc_organize_imports ===
  cc_organize_imports: {
    header: (filename) => `🔍 **Diagnostic des imports : ${filename}**`,
    noImportsFound: (filename) => `Aucun import trouvé dans ${filename}.`,
    categoryFuture: '__future__',
    categoryStdlib: 'stdlib',
    categoryThirdParty: 'tiers',
    categoryLocal: 'local',
    duplicatesRemoved: 'Doublons supprimés',
    previewHeader: '**Aperçu (trié et regroupé) :**',
    importsSaved: `✅ Imports organisés et enregistrés.`,
  },

  // === Tool 5: cc_diagnose_imports ===
  cc_diagnose_imports: {
    header: (filename) => `🔍 **Diagnostic des imports : ${filename}**`,
    totalImports: 'Nombre total d’imports',
    issues: 'Problèmes',
    warnings: 'Avertissements',
    issuesHeader: '**Problèmes :**',
    warningsHeader: '**Avertissements :**',
    noIssues: '✅ Aucun problème d’import détecté.',
    unusedImport: (line, name) => `L.${line} : \`${name}\` est importé mais n’est pas utilisé`,
    duplicateImport: (text) => `Doublon : \`${text}\``,
    relativeImportsWarning: (count) =>
      `${count} imports relatifs détectés (risque potentiel d’import circulaire)`,
    importOrderWarning: (line) => `L.${line} : l’ordre des imports ne respecte pas PEP 8`,
    hintOrganize: `💡 Utilisez \`cc_organize_imports\` pour trier automatiquement.`,
  },

  // === Tool 6: cc_fix_json ===
  cc_fix_json: {
    validJson: (filename) => `✅ ${filename} est un JSON valide.`,
    analysisHeader: (filename) => `🔍 **Analyse JSON : ${filename}**`,
    validAfterRepair: '✅ Valide après réparation',
    stillInvalid: (error) => `⚠️ Toujours invalide : ${error}`,
    repairedHeader: (filename) => `✅ **JSON réparé : ${filename}**`,
    fixBomRemoved: 'BOM supprimé',
    fixNulRemoved: 'Octets NUL supprimés',
    fixCommentsRemoved: 'Commentaires supprimés',
    fixBlockCommentsRemoved: 'Commentaires de bloc supprimés',
    fixTrailingCommas: 'Virgules finales supprimées',
    fixSingleQuotes: 'Apostrophes simples corrigées',
  },

  // === Tool 7: cc_validate_json ===
  cc_validate_json: {
    validHeader: (filename) => `✅ **JSON valide : ${filename}**`,
    invalidHeader: (filename) => `❌ **JSON invalide : ${filename}**`,
    typeArray: (count) => `Tableau (${count} éléments)`,
    typeObject: (count) => `Objet (${count} clés)`,
    labelType: 'Type',
    labelSize: 'Taille',
    labelBom: 'BOM',
    bomYes: '⚠️ Oui',
    bomNo: 'Non',
    positionInfo: (line, col) => `\n**Position :** Ligne ${line}, colonne ${col}`,
    errorLabel: (msg) => `**Erreur :** ${msg}`,
    hintFix: `💡 Utilisez \`cc_fix_json\` pour réparer automatiquement.`,
  },

  // === Tool 8: cc_fix_encoding ===
  cc_fix_encoding: {
    noErrors: (filename) => `✅ Aucune erreur d’encodage dans ${filename}.`,
    analysisHeader: (filename) => `🔍 **Analyse de l’encodage : ${filename}**`,
    repairedHeader: (filename) => `✅ **Encodage réparé : ${filename}**`,
  },

  // === Tool 9: cc_cleanup_file ===
  cc_cleanup_file: {
    alreadyClean: (filename) => `✅ ${filename} est déjà propre.`,
    previewHeader: (filename) => `🔍 **Aperçu : ${filename}**`,
    cleanedHeader: (filename) => `✅ **Nettoyé : ${filename}**`,
    fixBomRemoved: 'BOM supprimé',
    fixNulRemoved: 'Octets NUL supprimés',
    fixTrailingWhitespace: 'Espaces blancs en fin de ligne',
  },

  // === Tool 10: cc_convert_format ===
  cc_convert_format: {
    conversionHeader: (inputFormat, outputFormat) => `✅ **${inputFormat} → ${outputFormat}**`,
    csvMinRows: `❌ CSV : au moins un en-tête et une ligne de données sont requis.`,
    csvRequiresArray: `❌ L’export CSV nécessite un tableau.`,
    iniRequiresObject: `❌ L’export INI nécessite un objet.`,
    unsupportedFormat: (format) => `❌ Format non pris en charge : ${format}`,
    labelSource: 'Source',
    labelTarget: 'Cible',
    labelSize: 'Taille',
  },

  // === Tool 11: cc_fix_umlauts ===
  cc_fix_umlauts: {
    noIssues: (filename) => `✅ Aucun tréma mal encodé dans ${filename}.`,
    analysisHeader: (filename) => `🔍 **Analyse des trémas : ${filename}**`,
    replacements: (count) => `${count} remplacement(s) :`,
    repairedHeader: (filename) => `✅ **Trémas réparés : ${filename}**`,
  },

  // === Tool 12: cc_scan_emoji ===
  cc_scan_emoji: {
    noEmojis: (fileCount) => `✅ Aucun emoji trouvé dans ${fileCount} fichier(s).`,
    scanHeader: (fileCount) => `🔍 **Analyse des emoji : ${fileCount} fichiers**`,
    emojiTableEmoji: 'Emoji',
    emojiTableCount: 'Nombre',
    emojiTableCodepoint: 'Point de code',
    occurrencesHeader: '**Occurrences (30 premières) :**',
    andMore: (count) => `  … et ${count} autres`,
  },

  // === Tool 13: cc_generate_licenses ===
  cc_generate_licenses: {
    noPackageFiles: (dir) => `❌ Aucun package.json ni requirements.txt trouvé dans ${dir}.`,
    generatedHeader: (count) => `✅ **Licences générées : ${count} paquet(s)**`,
    labelFile: 'Fichier',
    labelFormat: 'Format',
    labelPackages: 'Paquets',
  },

  // === Tool 14: cc_md_to_html ===
  cc_md_to_html: {
    conversionHeader: (filename) => `✅ **Markdown → HTML : ${filename}**`,
    labelSource: 'Source',
    labelTarget: 'Cible',
    labelSize: 'Taille',
    hintPrint: `💡 Ouvrez le fichier HTML dans un navigateur et imprimez-le au format PDF.`,
  },

  // === Tool 15: cc_md_to_pdf ===
  cc_md_to_pdf: {
    conversionHeader: (filename) => `✅ **Markdown → PDF : ${filename}**`,
    labelSource: 'Source',
    labelTarget: 'Cible',
    labelSize: 'Taille',
    noBrowser: 'Aucun navigateur (Edge/Chrome) trouvé. Le fichier HTML a été créé à la place.',
    browserUsed: (name) => `PDF créé avec ${name}`,
  },

  // === Tool 16: cc_check_indentation ===
  cc_check_indentation: {
    description: 'Vérifiez dans les fichiers Python les deux-points manquants, les instructions return/yield sans indentation et le mélange de tabulations et d’espaces.',
    header: (path) => `**Vérification de l’indentation Python : ${path}**`,
    filesChecked: 'Fichiers vérifiés',
    filesWithIssues: 'Fichiers avec problèmes',
    totalIssues: 'Total des problèmes',
    noIssues: '✅ Aucun problème d’indentation détecté.',
    issuesHeader: '**Problèmes :**',
    andMore: (count) => `… et ${count} problèmes supplémentaires`,
  },

  // === Tool 17: cc_generate_python_code ===
  cc_generate_python_code: {
    description: 'Générer des extraits de code Python à partir de modèles dérivés de BACH sans écrire de fichiers',
    header: (kind) => `**Python généré ${kind}**`,
  },

  cc_runtime_import_diagnose: {
    description: 'Exécuter les diagnostics d’imports du runtime Python dérivés de BACH dans des sous-processus isolés',
    header: (path) => `**Diagnostic des imports du runtime : ${path}**`,
    python: 'Python',
    modulesTested: 'Modules testés',
    importsOk: 'Imports OK',
    failures: 'Échecs',
    circularImports: 'Imports circulaires',
    initFiles: 'Fichiers __init__.py',
    timeoutSeconds: 'Délai d’attente (secondes)',
    noTargets: 'Aucune cible d’import trouvée. Indiquez des modules ou définissez le chemin d’accès à un projet Python.',
    singleImportsHeader: '**Imports isolés :**',
    importOk: (target, durationMs) => `- OK ${target} (${durationMs} ms)`,
    importFailed: (target, exitCode, output) => `- ÉCHEC ${target} (code de sortie ${exitCode}) ${output}`,
    importTimedOut: (target, durationMs) => `- DÉLAI DÉPASSÉ ${target} (${durationMs} ms)`,
    initFilesHeader: '**Analyse des fichiers __init__.py :**',
    initFileInfo: (file, directImports, hasLazy) =>
      `- ${file} : ${directImports} imports directs${hasLazy ? ', lazy imports present' : ''}`,
    circularHeader: '**Imports circulaires possibles :**',
    circularPair: (moduleA, moduleB) => `- ${moduleA} <-> ${moduleB}`,
    recommendationsHeader: '**Recommandations :**',
    noProblems: '✅ Aucun problème d’import au runtime détecté.',
    andMore: (count) => `… et ${count} de plus`,
  },

  cc_python_structural_edit: {
    description: 'Inspecter et appliquer des modifications structurelles Python dérivées de BACH avec aperçu et modes de sécurité pour les fichiers de test et les sauvegardes',
    header: (path) => `**Modification structurelle Python : ${path}**`,
    operationLabel: 'Opération',
    modeLabel: 'Mode',
    changedLabel: 'Modifié',
    syntaxLabel: 'Syntaxe',
    outputLabel: 'Sortie',
    backupLabel: 'Sauvegarde',
    structureHeader: '**Structure :**',
    classLine: (name, startLine, endLine) => `- classe ${name} (L.${startLine}-${endLine})`,
    functionLine: (name, startLine, endLine) => `- fonction ${name} (L.${startLine}-${endLine})`,
    methodLine: (name, startLine, endLine) => `- méthode ${name} (L.${startLine}-${endLine})`,
    insertedAt: (line) => `Contenu inséré à la ligne ${line}.`,
    deletedElement: (name, startLine, endLine) => `${name} supprimé(s) (L.${startLine}-${endLine}).`,
    replacedLine: (line) => `Ligne ${line} remplacée.`,
    editFileReady: (path) => `Fichier modifié écrit : ${path}`,
    editFilePreview: '**Aperçu du fichier modifié :**',
    testWritten: (path) => `Fichier de test écrit : ${path}`,
    backupCreated: (path) => `Sauvegarde créée : ${path}`,
    appliedTo: (path) => `Appliqué à : ${path}`,
    diffHeader: '**Diff aperçu :**',
    noChanges: 'Aucune modification.',
    elementNotFound: (name) => `Élément introuvable : ${name}`,
    syntaxFailed: (output) => `Échec de la vérification de syntaxe Python : ${output}`,
  },

  // === Tool 16: cc_set_language ===
  cc_set_language: {
    languageSet: (lang) => `Langue définie sur : ${lang}`,
    languageGet: (lang, supported) => `Langue actuelle : ${lang} (prises en charge : ${supported.join(', ')})`,
  },

  // === Tool 17: cc_diff_files ===
  cc_diff_files: {
    description: 'Comparer deux fichiers et afficher les différences au format diff unifié',
    header: (fileA, fileB) => `**Diff : ${fileA} ↔ ${fileB}**`,
    identical: 'Les fichiers sont identiques.',
    linesChanged: (added, removed) => `${added} lignes ajoutées, ${removed} lignes supprimées`,
  },

  // === Tool 18: cc_regex_test ===
  cc_regex_test: {
    description: 'Tester des expressions régulières sur du texte ou le contenu d’un fichier',
    header: (pattern, flags) => `**Expression régulière : /${pattern}/${flags}**`,
    matchCount: (count) => `${count} correspondance(s) trouvée(s)`,
    noMatches: 'Aucune correspondance trouvée.',
  },
};
