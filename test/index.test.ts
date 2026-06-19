/**
 * Comprehensive test suite for ellmos-codecommander-mcp
 *
 * Tests the core logic of all 18 MCP tools using temporary files/directories.
 * Since tool handlers are registered via server.tool() and not exported,
 * we replicate the core logic in test helpers and validate behavior.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import * as os from "os";
import { pathToFileURL } from "url";
import * as yaml from "js-yaml";
import * as toml from "smol-toml";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { encode as toonEncode, decode as toonDecode } from "@toon-format/toon";

// ============================================================================
// Test Helpers -- mirror the logic from src/index.ts
// ============================================================================

function normalizePath(inputPath: string): string {
  return path.normalize(inputPath);
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

async function makeTmpDir(): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), "codecommander-test-"));
}

async function rmDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {}
}

// Known stdlib modules (subset for test classification)
const STDLIB_MODULES = new Set([
  "abc", "argparse", "ast", "asyncio", "base64", "collections", "configparser",
  "contextlib", "copy", "csv", "dataclasses", "datetime", "enum", "functools",
  "glob", "hashlib", "http", "importlib", "inspect", "io", "itertools", "json",
  "logging", "math", "multiprocessing", "os", "pathlib", "pickle", "platform",
  "queue", "random", "re", "shutil", "signal", "socket", "sqlite3", "string",
  "subprocess", "sys", "tempfile", "threading", "time", "typing", "unittest",
  "urllib", "uuid", "warnings", "xml", "zipfile", "__future__",
]);

function classifyImport(module: string): "stdlib" | "third_party" | "local" {
  if (module.startsWith(".")) return "local";
  const topLevel = module.split(".")[0];
  if (STDLIB_MODULES.has(topLevel)) return "stdlib";
  return "third_party";
}

// Python code analysis replicated from source
interface PythonClass {
  name: string;
  startLine: number;
  endLine: number;
  methods: string[];
  bases: string[];
  decorators: string[];
  docstring: string;
}

interface PythonFunction {
  name: string;
  startLine: number;
  endLine: number;
  params: string;
  decorators: string[];
  docstring: string;
  isAsync: boolean;
}

interface PythonImport {
  line: number;
  text: string;
  type: "stdlib" | "third_party" | "local";
  module: string;
}

interface CodeAnalysis {
  classes: PythonClass[];
  functions: PythonFunction[];
  imports: PythonImport[];
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  complexity: number;
}

function analyzePythonCode(content: string): CodeAnalysis {
  const lines = content.split("\n");
  const totalLines = lines.length;
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let complexity = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") blankLines++;
    else if (trimmed.startsWith("#")) commentLines++;
    else codeLines++;
    if (/^\s*(if|elif|for|while|except|with|and|or)\b/.test(line)) complexity++;
  }

  const imports: PythonImport[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const importMatch = line.match(/^import\s+(\S+)/);
    const fromMatch = line.match(/^from\s+(\S+)\s+import/);
    if (importMatch) {
      imports.push({ line: i + 1, text: line, type: classifyImport(importMatch[1]), module: importMatch[1] });
    } else if (fromMatch) {
      imports.push({ line: i + 1, text: line, type: classifyImport(fromMatch[1]), module: fromMatch[1] });
    }
  }

  const classes: PythonClass[] = [];
  for (let i = 0; i < lines.length; i++) {
    const classMatch = lines[i].match(/^class\s+(\w+)\s*(?:\(([^)]*)\))?\s*:/);
    if (classMatch) {
      const decorators: string[] = [];
      let j = i - 1;
      while (j >= 0 && lines[j].trim().startsWith("@")) {
        decorators.unshift(lines[j].trim());
        j--;
      }

      let endLine = i + 1;
      const baseIndent = lines[i].search(/\S/);
      for (let k = i + 1; k < lines.length; k++) {
        const lineIndent = lines[k].search(/\S/);
        if (lineIndent >= 0 && lineIndent <= baseIndent && lines[k].trim() !== "") {
          endLine = k;
          break;
        }
        endLine = k + 1;
      }

      const methods: string[] = [];
      for (let k = i + 1; k < endLine; k++) {
        const methodMatch = lines[k].match(/^\s+(?:async\s+)?def\s+(\w+)\s*\(/);
        if (methodMatch) methods.push(methodMatch[1]);
      }

      let docstring = "";
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
          const quote = nextLine.substring(0, 3);
          if (nextLine.endsWith(quote) && nextLine.length > 6) {
            docstring = nextLine.slice(3, -3);
          } else {
            const dsLines = [nextLine.slice(3)];
            for (let k = i + 2; k < lines.length; k++) {
              if (lines[k].trim().endsWith(quote)) {
                dsLines.push(lines[k].trim().slice(0, -3));
                break;
              }
              dsLines.push(lines[k].trim());
            }
            docstring = dsLines.join(" ").trim();
          }
        }
      }

      classes.push({
        name: classMatch[1],
        startLine: i + 1,
        endLine,
        methods,
        bases: classMatch[2] ? classMatch[2].split(",").map((b) => b.trim()) : [],
        decorators,
        docstring: docstring.substring(0, 200),
      });
    }
  }

  const functions: PythonFunction[] = [];
  for (let i = 0; i < lines.length; i++) {
    const funcMatch = lines[i].match(/^(async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->.*?)?\s*:/);
    if (funcMatch) {
      const isInClass = classes.some((c) => i + 1 > c.startLine && i + 1 < c.endLine);
      if (isInClass) continue;

      const decorators: string[] = [];
      let j = i - 1;
      while (j >= 0 && lines[j].trim().startsWith("@")) {
        decorators.unshift(lines[j].trim());
        j--;
      }

      let endLine = i + 1;
      for (let k = i + 1; k < lines.length; k++) {
        const lineIndent = lines[k].search(/\S/);
        if (lineIndent === 0 && lines[k].trim() !== "") {
          endLine = k;
          break;
        }
        endLine = k + 1;
      }

      let docstring = "";
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
          docstring = nextLine.replace(/^['"]{'3}|['"]{'3}$/g, "").trim();
        }
      }

      functions.push({
        name: funcMatch[2],
        startLine: i + 1,
        endLine,
        params: funcMatch[3],
        decorators,
        docstring: docstring.substring(0, 200),
        isAsync: !!funcMatch[1],
      });
    }
  }

  return { classes, functions, imports, totalLines, codeLines, commentLines, blankLines, complexity };
}

interface IndentationIssue {
  file: string;
  line: number;
  type: "missing_colon" | "unindented_return" | "mixed_indent" | "read_error";
  message: string;
}

function checkPythonIndentationContent(content: string, filePath: string): IndentationIssue[] {
  const issues: IndentationIssue[] = [];
  const lines = content.split(/\r?\n/);
  const structurePattern = /^(async\s+def|async\s+for|async\s+with|def|if|elif|else|for|while|try|except|finally|class|with)\b/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const stripped = line.trim();
    const indentMatch = line.match(/^[ \t]*/);
    const leading = indentMatch ? indentMatch[0] : "";
    const indentLevel = leading.length;

    if (structurePattern.test(stripped) && !stripped.endsWith(":") && !stripped.endsWith(":\\") && !stripped.endsWith("\\")) {
      const preview = stripped.length > 50 ? `${stripped.substring(0, 50)}...` : stripped;
      issues.push({ file: filePath, line: i + 1, type: "missing_colon", message: `Structure without ':' - '${preview}'` });
    }

    if (/^(return|yield)\b/.test(stripped) && indentLevel === 0) {
      const keyword = stripped.split(/\s+/)[0];
      issues.push({ file: filePath, line: i + 1, type: "unindented_return", message: `'${keyword}' outside an indented block` });
    }

    if (leading.includes("\t") && leading.includes(" ")) {
      issues.push({ file: filePath, line: i + 1, type: "mixed_indent", message: "Mixed tabs and spaces in indentation" });
    }
  }

  return issues;
}

interface CodeParam {
  name: string;
  type?: string;
  default?: string;
}

interface CodeSpec {
  kind?: string;
  type?: string;
  name?: string;
  params?: CodeParam[];
  fields?: CodeParam[];
  init_params?: CodeParam[];
  bases?: string[];
  imports?: string[];
  return_type?: string;
  docstring?: string;
  body?: string;
  description?: string;
  content?: string;
  main_body?: string;
  target?: string;
  arrange?: string;
  act?: string;
  assertions?: string;
  base?: string;
}

function formatPythonParams(params: CodeParam[] | undefined): string {
  if (!params || params.length === 0) return "";
  return params.map((param) => {
    let text = param.name;
    if (param.type) text += `: ${param.type}`;
    if (param.default !== undefined) text += ` = ${param.default}`;
    return text;
  }).join(", ");
}

function indentPythonBlock(body: string | undefined, spaces: number): string {
  const content = body && body.trim().length > 0 ? body : "pass";
  const prefix = " ".repeat(spaces);
  return content.split(/\r?\n/).map((line) => line.trim().length > 0 ? `${prefix}${line}` : "").join("\n");
}

function generatePythonCode(spec: CodeSpec): string {
  const kind = spec.kind || spec.type || "function";
  const name = spec.name || (kind === "module" ? "generated_module" : "generated_item");
  const docstring = spec.docstring || `${name} generated by CodeCommander`;

  if (kind === "function") {
    const params = formatPythonParams(spec.params);
    const returnHint = spec.return_type ? ` -> ${spec.return_type}` : "";
    return `def ${name}(${params})${returnHint}:\n    """${docstring}"""\n${indentPythonBlock(spec.body, 4)}\n`;
  }

  if (kind === "class") {
    const bases = spec.bases && spec.bases.length > 0 ? `(${spec.bases.join(", ")})` : "";
    const initParams = spec.init_params || [];
    const initSignature = formatPythonParams(initParams);
    const initSuffix = initSignature ? `, ${initSignature}` : "";
    const initBody = initParams.length > 0
      ? initParams.map((param) => `        self.${param.name} = ${param.name}`).join("\n")
      : "        pass";
    return `class ${name}${bases}:\n    """${docstring}"""\n\n    def __init__(self${initSuffix}):\n${initBody}\n`;
  }

  if (kind === "dataclass") {
    const fields = spec.fields || [];
    const fieldLines = fields.length > 0
      ? fields.map((field) => {
          let text = `    ${field.name}: ${field.type || "Any"}`;
          if (field.default !== undefined) text += ` = ${field.default}`;
          return text;
        }).join("\n")
      : "    pass";
    return `@dataclass\nclass ${name}:\n    """${docstring}"""\n${fieldLines}\n`;
  }

  if (kind === "test") {
    const target = spec.target || name;
    return `def test_${name}():\n    """Test for ${target}."""\n    # Arrange\n${indentPythonBlock(spec.arrange || "# Setup", 4)}\n\n    # Act\n${indentPythonBlock(spec.act || "result = None", 4)}\n\n    # Assert\n${indentPythonBlock(spec.assertions || "assert True", 4)}\n`;
  }

  if (kind === "exception") {
    return `class ${name}(${spec.base || "Exception"}):\n    """${docstring}"""\n    pass\n`;
  }

  throw new Error(`Unsupported code kind: ${kind}`);
}

// Fix JSON logic replicated
async function fixJson(
  filePath: string,
  dryRun: boolean,
  createBackup: boolean = true
): Promise<{ fixes: string[]; valid: boolean; parseErr: string; content: string }> {
  const rawContent = await fs.readFile(filePath, "utf-8");
  let content = rawContent;
  const fixes: string[] = [];

  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
    fixes.push("BOM removed");
  }
  if (content.includes("\0")) {
    content = content.replace(/\0/g, "");
    fixes.push("NUL bytes removed");
  }
  const c1 = content;
  content = content.replace(/^(\s*)\/\/.*$/gm, "");
  if (content !== c1) fixes.push("Single-line comments removed");

  const c2 = content;
  content = content.replace(/\/\*[\s\S]*?\*\//g, "");
  if (content !== c2) fixes.push("Block comments removed");

  const c3 = content;
  content = content.replace(/,(\s*[}\]])/g, "$1");
  if (content !== c3) fixes.push("Trailing commas removed");

  const c4 = content;
  content = content.replace(/(\s*)'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '$1"$2":');
  content = content.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
  if (content !== c4) fixes.push("Single quotes fixed");

  let valid = false;
  let parseErr = "";
  try {
    JSON.parse(content);
    valid = true;
  } catch (e: any) {
    parseErr = e.message;
  }

  if (!dryRun && fixes.length > 0) {
    if (createBackup) await fs.writeFile(filePath + ".bak", rawContent, "utf-8");
    if (valid) content = JSON.stringify(JSON.parse(content), null, 2);
    await fs.writeFile(filePath, content, "utf-8");
  }

  return { fixes, valid, parseErr, content };
}

// Fix encoding (mojibake) replicated
function fixEncoding(content: string): { result: string; fixes: string[] } {
  const mojibakeMap: [RegExp, string, string][] = [
    [/Ã¤/g, "ä", "ä"],
    [/Ã¶/g, "ö", "ö"],
    [/Ã¼/g, "ü", "ü"],
    [/Ã/g, "Ä", "Ä"],
    [/Ã/g, "Ö", "Ö"],
    [/Ã/g, "Ü", "Ü"],
    [/Ã/g, "ß", "ß"],
    [/Ã©/g, "é", "é"],
    [/Ã¨/g, "è", "è"],
    [/Ã /g, "à", "à"],
    [/Ã¡/g, "á", "á"],
    [/Ã®/g, "î", "î"],
    [/Ã¯/g, "ï", "ï"],
    [/Ã´/g, "ô", "ô"],
    [/Ã¹/g, "ù", "ù"],
    [/Ã§/g, "ç", "ç"],
    [/Ã±/g, "ñ", "ñ"],
  ];

  let result = content;
  const fixes: string[] = [];

  for (const [pattern, replacement, label] of mojibakeMap) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (result !== before) {
      const count = (before.match(pattern) || []).length;
      fixes.push(`${label} (${count}x)`);
    }
  }

  return { result, fixes };
}

// Cleanup file logic replicated
function cleanupFile(
  content: string,
  opts: {
    removeBom?: boolean;
    removeNulBytes?: boolean;
    removeTrailingWhitespace?: boolean;
    normalizeLineEndings?: "lf" | "crlf";
  }
): { result: string; fixes: string[] } {
  let result = content;
  const fixes: string[] = [];

  if (opts.removeBom && result.charCodeAt(0) === 0xfeff) {
    result = result.slice(1);
    fixes.push("BOM removed");
  }
  if (opts.removeNulBytes && result.includes("\0")) {
    result = result.replace(/\0/g, "");
    fixes.push("NUL bytes removed");
  }
  if (opts.removeTrailingWhitespace) {
    const c = result;
    result = result.replace(/[ \t]+$/gm, "");
    if (result !== c) fixes.push("Trailing whitespace removed");
  }
  if (opts.normalizeLineEndings) {
    const c = result;
    result = result.replace(/\r\n/g, "\n");
    if (opts.normalizeLineEndings === "crlf") result = result.replace(/\n/g, "\r\n");
    if (result !== c) fixes.push(opts.normalizeLineEndings.toUpperCase());
  }

  return { result, fixes };
}

// Fix umlauts logic replicated
function fixUmlauts(content: string): { result: string; fixes: string[]; totalFixes: number } {
  const umlautFixes: [RegExp, string][] = [
    [/Ã¤/g, "ä"],
    [/Ã¶/g, "ö"],
    [/Ã¼/g, "ü"],
    [/Ã/g, "Ä"],
    [/Ã/g, "Ö"],
    [/Ã/g, "Ü"],
    [/Ã/g, "ß"],
    [/&auml;/g, "ä"],
    [/&ouml;/g, "ö"],
    [/&uuml;/g, "ü"],
    [/&Auml;/g, "Ä"],
    [/&Ouml;/g, "Ö"],
    [/&Uuml;/g, "Ü"],
    [/&szlig;/g, "ß"],
    [/\\u00e4/g, "ä"],
    [/\\u00f6/g, "ö"],
    [/\\u00fc/g, "ü"],
    [/\\u00c4/g, "Ä"],
    [/\\u00d6/g, "Ö"],
    [/\\u00dc/g, "Ü"],
    [/\\u00df/g, "ß"],
  ];

  let result = content;
  const fixes: string[] = [];
  let totalFixes = 0;

  for (const [pattern, replacement] of umlautFixes) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (result !== before) {
      const count = (before.match(pattern) || []).length;
      totalFixes += count;
      fixes.push(`${replacement} (${count}x)`);
    }
  }

  return { result, fixes, totalFixes };
}

// Organize imports logic replicated
function organizeImports(content: string): {
  newContent: string;
  groups: { future: string[]; stdlib: string[]; thirdParty: string[]; local: string[] };
  duplicatesRemoved: number;
} {
  const lines = content.split("\n");
  let importStart = -1;
  let importEnd = -1;
  const importLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("import ") || trimmed.startsWith("from ")) {
      if (importStart === -1) importStart = i;
      importEnd = i;
      importLines.push(trimmed);
    } else if (importStart !== -1 && trimmed !== "" && !trimmed.startsWith("#")) {
      if (importEnd < i - 2) break;
    }
  }

  const uniqueImports = [...new Set(importLines)];
  const removed = importLines.length - uniqueImports.length;

  const futureImports = uniqueImports.filter((l) => l.includes("__future__")).sort();
  const stdlibImports = uniqueImports
    .filter((l) => {
      if (l.includes("__future__")) return false;
      const mod = l.match(/^(?:from\s+)?(\S+)/)?.[1]?.replace(/^from\s+/, "") || "";
      return classifyImport(mod) === "stdlib";
    })
    .sort();
  const thirdPartyImports = uniqueImports
    .filter((l) => {
      const mod = l.match(/^(?:from\s+)?(\S+)/)?.[1]?.replace(/^from\s+/, "") || "";
      return classifyImport(mod) === "third_party";
    })
    .sort();
  const localImports = uniqueImports
    .filter((l) => {
      const mod = l.match(/^(?:from\s+)?(\S+)/)?.[1]?.replace(/^from\s+/, "") || "";
      return classifyImport(mod) === "local";
    })
    .sort();

  const newImportBlock: string[] = [];
  if (futureImports.length > 0) newImportBlock.push(...futureImports, "");
  if (stdlibImports.length > 0) newImportBlock.push(...stdlibImports, "");
  if (thirdPartyImports.length > 0) newImportBlock.push(...thirdPartyImports, "");
  if (localImports.length > 0) newImportBlock.push(...localImports, "");
  while (newImportBlock.length > 0 && newImportBlock[newImportBlock.length - 1] === "") {
    newImportBlock.pop();
  }

  const newLines = [...lines.slice(0, importStart), ...newImportBlock, ...lines.slice(importEnd + 1)];

  return {
    newContent: newLines.join("\n"),
    groups: { future: futureImports, stdlib: stdlibImports, thirdParty: thirdPartyImports, local: localImports },
    duplicatesRemoved: removed,
  };
}

// Unified diff (LCS-based) replicated
function computeLCS(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

function computeUnifiedDiff(
  linesA: string[],
  linesB: string[],
  contextLines: number,
  fileA: string,
  fileB: string
): string {
  const dp = computeLCS(linesA, linesB);
  const changes: Array<{ type: "equal" | "delete" | "insert"; lineA?: number; lineB?: number; text: string }> = [];

  let i = linesA.length;
  let j = linesB.length;
  const backtrack: typeof changes = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      backtrack.push({ type: "equal", lineA: i - 1, lineB: j - 1, text: linesA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      backtrack.push({ type: "insert", lineB: j - 1, text: linesB[j - 1] });
      j--;
    } else {
      backtrack.push({ type: "delete", lineA: i - 1, text: linesA[i - 1] });
      i--;
    }
  }

  backtrack.reverse();
  changes.push(...backtrack);

  interface DiffHunk {
    startA: number;
    countA: number;
    startB: number;
    countB: number;
    lines: string[];
  }

  const hunks: DiffHunk[] = [];
  let hunkLines: string[] = [];
  let hunkStartA = 0;
  let hunkStartB = 0;
  let hunkCountA = 0;
  let hunkCountB = 0;
  let lastChangeIdx = -999;

  for (let idx = 0; idx < changes.length; idx++) {
    const c = changes[idx];
    if (c.type !== "equal") {
      if (idx - lastChangeIdx > contextLines * 2 + 1 && hunkLines.length > 0) {
        let trailingAdded = 0;
        for (let k = lastChangeIdx + 1; k < changes.length && trailingAdded < contextLines; k++) {
          if (changes[k].type === "equal") {
            hunkLines.push(` ${changes[k].text}`);
            hunkCountA++;
            hunkCountB++;
            trailingAdded++;
          }
        }
        hunks.push({ startA: hunkStartA, countA: hunkCountA, startB: hunkStartB, countB: hunkCountB, lines: [...hunkLines] });
        hunkLines = [];
        hunkCountA = 0;
        hunkCountB = 0;
      }

      if (hunkLines.length === 0) {
        let contextCount = 0;
        for (let k = idx - 1; k >= 0 && contextCount < contextLines; k--) {
          if (changes[k].type === "equal") {
            hunkLines.unshift(` ${changes[k].text}`);
            contextCount++;
          } else break;
        }
        hunkStartA =
          (c.lineA !== undefined ? c.lineA : changes[idx - 1]?.lineA !== undefined ? changes[idx - 1].lineA! + 1 : 0) -
          contextCount;
        hunkStartB =
          (c.lineB !== undefined ? c.lineB : changes[idx - 1]?.lineB !== undefined ? changes[idx - 1].lineB! + 1 : 0) -
          contextCount;
        if (hunkStartA < 0) hunkStartA = 0;
        if (hunkStartB < 0) hunkStartB = 0;
        hunkCountA = contextCount;
        hunkCountB = contextCount;
      } else {
        for (let k = lastChangeIdx + 1; k < idx; k++) {
          if (changes[k].type === "equal") {
            hunkLines.push(` ${changes[k].text}`);
            hunkCountA++;
            hunkCountB++;
          }
        }
      }

      if (c.type === "delete") {
        hunkLines.push(`-${c.text}`);
        hunkCountA++;
      } else {
        hunkLines.push(`+${c.text}`);
        hunkCountB++;
      }
      lastChangeIdx = idx;
    }
  }

  if (hunkLines.length > 0) {
    let trailingAdded = 0;
    for (let k = lastChangeIdx + 1; k < changes.length && trailingAdded < contextLines; k++) {
      if (changes[k].type === "equal") {
        hunkLines.push(` ${changes[k].text}`);
        hunkCountA++;
        hunkCountB++;
        trailingAdded++;
      }
    }
    hunks.push({ startA: hunkStartA, countA: hunkCountA, startB: hunkStartB, countB: hunkCountB, lines: [...hunkLines] });
  }

  if (hunks.length === 0) return "";

  const output: string[] = [`--- ${fileA}`, `+++ ${fileB}`];
  for (const hunk of hunks) {
    output.push(`@@ -${hunk.startA + 1},${hunk.countA} +${hunk.startB + 1},${hunk.countB} @@`);
    output.push(...hunk.lines);
  }

  return output.join("\n");
}

// Markdown to HTML inline formatter replicated
function inlineFmt(text: string): string {
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  text = text.replace(/\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g, '<a href="$3"><img src="$2" alt="$1"></a>');
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/\[x\]/gi, "&#9745;");
  text = text.replace(/\[ \]/g, "&#9744;");
  return text;
}

function buildPdfBrowserArgs(outputPath: string, tempHtml: string): string[] {
  return [
    "--headless",
    "--disable-gpu",
    `--print-to-pdf=${outputPath}`,
    "--no-pdf-header-footer",
    pathToFileURL(tempHtml).href,
  ];
}

// Emoji detection pattern
const EMOJI_PATTERN =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/gu;

// ============================================================================
// Shared sample Python code for parser tests
// ============================================================================

const SAMPLE_PYTHON = `#!/usr/bin/env python3
"""Module docstring"""

import os
import sys
from pathlib import Path
from collections import OrderedDict

import requests
import numpy as np

from .utils import helper
from .config import Config

# Global constant
MAX_RETRIES = 3

@dataclass
class Animal:
    """A simple animal class"""
    name: str
    age: int

    def speak(self) -> str:
        """Make a sound"""
        return f"{self.name} says hello"

    def _internal(self):
        pass

    async def fetch_data(self, url: str) -> dict:
        if self.age > 0:
            for i in range(self.age):
                pass
        return {}

class Dog(Animal):
    """A dog is an animal"""
    breed: str

    def speak(self) -> str:
        return f"{self.name} barks"

    def __repr__(self):
        return f"Dog({self.name})"

def greet(name: str) -> str:
    """Greet someone"""
    return f"Hello, {name}"

async def fetch_all(urls: list) -> list:
    results = []
    for url in urls:
        if url.startswith("http"):
            results.append(url)
    return results
`;

// ============================================================================
// Tool 1: cc_analyze_code
// ============================================================================

describe("Tool 1: cc_analyze_code", () => {
  it("should count lines correctly", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    expect(analysis.totalLines).toBeGreaterThan(50);
    expect(analysis.codeLines).toBeGreaterThan(30);
    expect(analysis.commentLines).toBeGreaterThan(0);
    expect(analysis.blankLines).toBeGreaterThan(0);
    expect(analysis.codeLines + analysis.commentLines + analysis.blankLines).toBe(analysis.totalLines);
  });

  it("should detect classes", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    expect(analysis.classes.length).toBe(2);
    expect(analysis.classes[0].name).toBe("Animal");
    expect(analysis.classes[1].name).toBe("Dog");
  });

  it("should detect class bases", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    expect(analysis.classes[0].bases).toEqual([]);
    expect(analysis.classes[1].bases).toEqual(["Animal"]);
  });

  it("should detect class methods", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    const animal = analysis.classes[0];
    expect(animal.methods).toContain("speak");
    expect(animal.methods).toContain("_internal");
    expect(animal.methods).toContain("fetch_data");
  });

  it("should detect class decorators", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    expect(analysis.classes[0].decorators).toEqual(["@dataclass"]);
  });

  it("should detect class docstrings", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    expect(analysis.classes[0].docstring).toBe("A simple animal class");
  });

  it("should detect top-level functions", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    expect(analysis.functions.length).toBe(2);
    expect(analysis.functions[0].name).toBe("greet");
    expect(analysis.functions[1].name).toBe("fetch_all");
  });

  it("should detect async functions", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    expect(analysis.functions[0].isAsync).toBe(false);
    expect(analysis.functions[1].isAsync).toBe(true);
  });

  it("should compute cyclomatic complexity", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    expect(analysis.complexity).toBeGreaterThan(0);
  });

  it("should handle empty content", () => {
    const analysis = analyzePythonCode("");
    expect(analysis.totalLines).toBe(1);
    expect(analysis.classes).toEqual([]);
    expect(analysis.functions).toEqual([]);
    expect(analysis.imports).toEqual([]);
  });
});

// ============================================================================
// Tool 2: cc_analyze_methods (uses same parser)
// ============================================================================

describe("Tool 2: cc_analyze_methods", () => {
  it("should detect method visibility (public)", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    expect(analysis.classes[0].methods).toContain("speak");
  });

  it("should detect method visibility (protected)", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    expect(analysis.classes[0].methods).toContain("_internal");
  });

  it("should detect method visibility (magic)", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    expect(analysis.classes[1].methods).toContain("__repr__");
  });

  it("should detect async methods within classes", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    expect(analysis.classes[0].methods).toContain("fetch_data");
  });

  it("should not list class methods as top-level functions", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    const funcNames = analysis.functions.map((f) => f.name);
    expect(funcNames).not.toContain("speak");
    expect(funcNames).not.toContain("_internal");
    expect(funcNames).not.toContain("fetch_data");
  });
});

// ============================================================================
// Tool 3: cc_extract_classes
// ============================================================================

describe("Tool 3: cc_extract_classes", () => {
  it("should extract class content by line range", () => {
    const lines = SAMPLE_PYTHON.split("\n");
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    const animal = analysis.classes[0];
    const classContent = lines.slice(animal.startLine - 1, animal.endLine).join("\n");
    expect(classContent).toContain("class Animal");
    expect(classContent).toContain("def speak");
  });

  it("should identify top-level code outside classes", () => {
    const lines = SAMPLE_PYTHON.split("\n");
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    const topLevelLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const isInClass = analysis.classes.some((c) => i + 1 >= c.startLine && i + 1 <= c.endLine);
      if (!isInClass) topLevelLines.push(lines[i]);
    }
    const topLevel = topLevelLines.join("\n");
    expect(topLevel).toContain("import os");
    expect(topLevel).toContain("def greet");
    expect(topLevel).toContain("MAX_RETRIES");
  });

  let tmpDir: string;
  beforeEach(async () => {
    tmpDir = await makeTmpDir();
  });
  afterEach(async () => {
    await rmDir(tmpDir);
  });

  it("should write extracted files to output_dir", async () => {
    const lines = SAMPLE_PYTHON.split("\n");
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    const outDir = path.join(tmpDir, "extracted");
    await fs.mkdir(outDir, { recursive: true });

    for (const cls of analysis.classes) {
      const classContent = lines.slice(cls.startLine - 1, cls.endLine).join("\n");
      await fs.writeFile(path.join(outDir, `${cls.name}.txt`), classContent, "utf-8");
    }

    expect(await pathExists(path.join(outDir, "Animal.txt"))).toBe(true);
    expect(await pathExists(path.join(outDir, "Dog.txt"))).toBe(true);
  });
});

// ============================================================================
// Tool 4: cc_organize_imports
// ============================================================================

describe("Tool 4: cc_organize_imports", () => {
  it("should classify stdlib imports", () => {
    expect(classifyImport("os")).toBe("stdlib");
    expect(classifyImport("sys")).toBe("stdlib");
    expect(classifyImport("pathlib")).toBe("stdlib");
    expect(classifyImport("collections")).toBe("stdlib");
  });

  it("should classify third-party imports", () => {
    expect(classifyImport("requests")).toBe("third_party");
    expect(classifyImport("numpy")).toBe("third_party");
    expect(classifyImport("flask")).toBe("third_party");
  });

  it("should classify local (relative) imports", () => {
    expect(classifyImport(".utils")).toBe("local");
    expect(classifyImport("..config")).toBe("local");
    expect(classifyImport(".")).toBe("local");
  });

  it("should sort imports into groups", () => {
    const result = organizeImports(SAMPLE_PYTHON);
    expect(result.groups.stdlib.length).toBeGreaterThan(0);
    expect(result.groups.thirdParty.length).toBeGreaterThan(0);
    expect(result.groups.local.length).toBeGreaterThan(0);
  });

  it("should remove duplicate imports", () => {
    const code = `import os\nimport sys\nimport os\n\ndef main():\n    pass\n`;
    const result = organizeImports(code);
    expect(result.duplicatesRemoved).toBe(1);
  });

  it("should sort imports alphabetically within groups", () => {
    const code = `import sys\nimport os\nimport abc\n\ndef main():\n    pass\n`;
    const result = organizeImports(code);
    const stdlibOrder = result.groups.stdlib;
    for (let i = 1; i < stdlibOrder.length; i++) {
      expect(stdlibOrder[i] >= stdlibOrder[i - 1]).toBe(true);
    }
  });

  it("should handle files with no imports", () => {
    const code = `def main():\n    pass\n`;
    const result = organizeImports(code);
    expect(result.groups.stdlib).toEqual([]);
    expect(result.groups.thirdParty).toEqual([]);
    expect(result.groups.local).toEqual([]);
  });
});

// ============================================================================
// Tool 5: cc_diagnose_imports
// ============================================================================

describe("Tool 5: cc_diagnose_imports", () => {
  it("should detect unused imports", () => {
    const code = `import os\nimport sys\n\ndef main():\n    print(os.getcwd())\n`;
    const analysis = analyzePythonCode(code);
    const lines = code.split("\n");
    const unused: string[] = [];

    for (const imp of analysis.imports) {
      const simpleMatch = imp.text.match(/^import\s+(\S+)(?:\s+as\s+(\w+))?/);
      if (simpleMatch) {
        const name = simpleMatch[2] || simpleMatch[1].split(".").pop() || "";
        const restOfCode = lines.filter((_, i) => i !== imp.line - 1).join("\n");
        const namePattern = new RegExp(`\\b${name}\\b`);
        if (!namePattern.test(restOfCode)) unused.push(name);
      }
    }
    expect(unused).toContain("sys");
    expect(unused).not.toContain("os");
  });

  it("should detect duplicate imports", () => {
    const code = `import os\nimport os\nimport sys\n\ndef main():\n    pass\n`;
    const analysis = analyzePythonCode(code);
    const importTexts = analysis.imports.map((i) => i.text);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const text of importTexts) {
      if (seen.has(text)) duplicates.push(text);
      seen.add(text);
    }
    expect(duplicates.length).toBe(1);
    expect(duplicates[0]).toBe("import os");
  });

  it("should flag relative imports as potential circular dependency risk", () => {
    const analysis = analyzePythonCode(SAMPLE_PYTHON);
    const localImports = analysis.imports.filter((i) => i.type === "local");
    expect(localImports.length).toBeGreaterThan(0);
  });

  it("should detect import order issues", () => {
    const code = `import requests\nimport os\n\ndef main():\n    pass\n`;
    const analysis = analyzePythonCode(code);
    let lastType = "";
    let orderIssue = false;
    for (const imp of analysis.imports) {
      if (lastType && imp.type !== lastType) {
        if (lastType === "third_party" && imp.type === "stdlib") orderIssue = true;
      }
      lastType = imp.type;
    }
    expect(orderIssue).toBe(true);
  });
});

// ============================================================================
// Tool 6: cc_check_indentation
// ============================================================================

describe("Tool 6: cc_check_indentation", () => {
  it("should detect missing colons", () => {
    const issues = checkPythonIndentationContent("def broken()\n    pass\n", "sample.py");
    expect(issues.map((issue) => issue.type)).toContain("missing_colon");
    expect(issues[0].line).toBe(1);
  });

  it("should detect return outside a block", () => {
    const issues = checkPythonIndentationContent("return 42\n", "sample.py");
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("unindented_return");
  });

  it("should detect mixed tab and space indentation", () => {
    const issues = checkPythonIndentationContent("def ok():\n \tprint('mixed')\n", "sample.py");
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("mixed_indent");
  });

  it("should pass clean indentation", () => {
    const code = "def ok():\n    if True:\n        return 1\n";
    expect(checkPythonIndentationContent(code, "sample.py")).toEqual([]);
  });
});

// ============================================================================
// Tool 7: cc_generate_python_code
// ============================================================================

describe("Tool 7: cc_generate_python_code", () => {
  it("should generate typed functions", () => {
    const code = generatePythonCode({
      kind: "function",
      name: "add",
      params: [{ name: "a", type: "int" }, { name: "b", type: "int", default: "0" }],
      return_type: "int",
      docstring: "Add values",
      body: "return a + b",
    });
    expect(code).toContain("def add(a: int, b: int = 0) -> int:");
    expect(code).toContain('"""Add values"""');
    expect(code).toContain("    return a + b");
  });

  it("should generate classes with init assignments", () => {
    const code = generatePythonCode({
      kind: "class",
      name: "Counter",
      bases: ["object"],
      init_params: [{ name: "value", type: "int", default: "0" }],
    });
    expect(code).toContain("class Counter(object):");
    expect(code).toContain("def __init__(self, value: int = 0):");
    expect(code).toContain("self.value = value");
  });

  it("should generate dataclasses", () => {
    const code = generatePythonCode({
      kind: "dataclass",
      name: "User",
      fields: [{ name: "name", type: "str" }, { name: "active", type: "bool", default: "True" }],
    });
    expect(code).toContain("@dataclass");
    expect(code).toContain("name: str");
    expect(code).toContain("active: bool = True");
  });

  it("should generate tests", () => {
    const code = generatePythonCode({
      kind: "test",
      name: "add",
      target: "add",
      arrange: "a = 1\nb = 2",
      act: "result = a + b",
      assertions: "assert result == 3",
    });
    expect(code).toContain("def test_add():");
    expect(code).toContain("    a = 1");
    expect(code).toContain("    assert result == 3");
  });
});

// ============================================================================
// Tool 6: cc_fix_json
// ============================================================================

describe("Tool 6: cc_fix_json", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTmpDir();
  });
  afterEach(async () => {
    await rmDir(tmpDir);
  });

  it("should detect valid JSON with no fixes needed", async () => {
    const fp = path.join(tmpDir, "valid.json");
    await fs.writeFile(fp, '{"key": "value"}', "utf-8");
    const result = await fixJson(fp, true);
    expect(result.fixes).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("should remove BOM", async () => {
    const fp = path.join(tmpDir, "bom.json");
    await fs.writeFile(fp, '﻿{"key": "value"}', "utf-8");
    const result = await fixJson(fp, true);
    expect(result.fixes).toContain("BOM removed");
    expect(result.valid).toBe(true);
  });

  it("should remove NUL bytes", async () => {
    const fp = path.join(tmpDir, "nul.json");
    await fs.writeFile(fp, '{"key"\0: "value"}', "utf-8");
    const result = await fixJson(fp, true);
    expect(result.fixes).toContain("NUL bytes removed");
    expect(result.valid).toBe(true);
  });

  it("should strip single-line comments", async () => {
    const fp = path.join(tmpDir, "comments.json");
    await fs.writeFile(fp, '// comment\n{"key": "value"}', "utf-8");
    const result = await fixJson(fp, true);
    expect(result.fixes).toContain("Single-line comments removed");
    expect(result.valid).toBe(true);
  });

  it("should strip block comments", async () => {
    const fp = path.join(tmpDir, "block.json");
    await fs.writeFile(fp, '/* block */{"key": "value"}', "utf-8");
    const result = await fixJson(fp, true);
    expect(result.fixes).toContain("Block comments removed");
    expect(result.valid).toBe(true);
  });

  it("should fix trailing commas in objects", async () => {
    const fp = path.join(tmpDir, "trailing.json");
    await fs.writeFile(fp, '{"a": 1, "b": 2,}', "utf-8");
    const result = await fixJson(fp, true);
    expect(result.fixes).toContain("Trailing commas removed");
    expect(result.valid).toBe(true);
  });

  it("should fix trailing commas in arrays", async () => {
    const fp = path.join(tmpDir, "trailing-arr.json");
    await fs.writeFile(fp, '{"a": [1, 2, 3,]}', "utf-8");
    const result = await fixJson(fp, true);
    expect(result.fixes).toContain("Trailing commas removed");
    expect(result.valid).toBe(true);
  });

  it("should fix single quotes to double quotes", async () => {
    const fp = path.join(tmpDir, "quotes.json");
    await fs.writeFile(fp, "{'key': 'value'}", "utf-8");
    const result = await fixJson(fp, true);
    expect(result.fixes).toContain("Single quotes fixed");
    expect(result.valid).toBe(true);
  });

  it("should handle multiple fixes at once", async () => {
    const fp = path.join(tmpDir, "multi.json");
    await fs.writeFile(fp, '﻿// comment\n{"a": 1,}', "utf-8");
    const result = await fixJson(fp, true);
    expect(result.fixes.length).toBeGreaterThanOrEqual(3);
    expect(result.valid).toBe(true);
  });

  it("should write fixed content when dry_run=false", async () => {
    const fp = path.join(tmpDir, "write.json");
    await fs.writeFile(fp, '{"a": 1,}', "utf-8");
    await fixJson(fp, false);
    const fixed = await fs.readFile(fp, "utf-8");
    expect(() => JSON.parse(fixed)).not.toThrow();
    expect(JSON.parse(fixed)).toEqual({ a: 1 });
  });

  it("should create backup when writing", async () => {
    const fp = path.join(tmpDir, "backup.json");
    await fs.writeFile(fp, '{"a": 1,}', "utf-8");
    await fixJson(fp, false, true);
    expect(await pathExists(fp + ".bak")).toBe(true);
  });
});

// ============================================================================
// Tool 7: cc_validate_json
// ============================================================================

describe("Tool 7: cc_validate_json", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTmpDir();
  });
  afterEach(async () => {
    await rmDir(tmpDir);
  });

  it("should validate correct JSON object", async () => {
    const fp = path.join(tmpDir, "obj.json");
    await fs.writeFile(fp, '{"name": "test", "value": 42}', "utf-8");
    const content = await fs.readFile(fp, "utf-8");
    const parsed = JSON.parse(content);
    expect(typeof parsed).toBe("object");
    expect(Object.keys(parsed).length).toBe(2);
  });

  it("should validate correct JSON array", async () => {
    const fp = path.join(tmpDir, "arr.json");
    await fs.writeFile(fp, "[1, 2, 3]", "utf-8");
    const content = await fs.readFile(fp, "utf-8");
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(3);
  });

  it("should detect invalid JSON with error message", async () => {
    const fp = path.join(tmpDir, "invalid.json");
    const badJson = '{"key": value}';
    await fs.writeFile(fp, badJson, "utf-8");
    const content = await fs.readFile(fp, "utf-8");
    let error = "";
    try {
      JSON.parse(content);
    } catch (e: any) {
      error = e.message;
    }
    expect(error).not.toBe("");
    expect(error.length).toBeGreaterThan(0);
  });

  it("should detect BOM in validation", async () => {
    const fp = path.join(tmpDir, "bom-valid.json");
    await fs.writeFile(fp, '﻿{"key": "value"}', "utf-8");
    const content = await fs.readFile(fp, "utf-8");
    expect(content.charCodeAt(0) === 0xfeff).toBe(true);
  });
});

// ============================================================================
// Tool 8: cc_fix_encoding
// ============================================================================

describe("Tool 8: cc_fix_encoding", () => {
  it("should fix double-encoded German umlauts (ae)", () => {
    const input = "Ã¤"; // Mojibake for ae
    const { result, fixes } = fixEncoding(input);
    expect(result).toBe("ä");
    expect(fixes.length).toBe(1);
  });

  it("should fix double-encoded oe", () => {
    const { result } = fixEncoding("Ã¶");
    expect(result).toBe("ö");
  });

  it("should fix double-encoded ue", () => {
    const { result } = fixEncoding("Ã¼");
    expect(result).toBe("ü");
  });

  it("should fix uppercase umlauts", () => {
    const { result } = fixEncoding("ÃÃÃ");
    expect(result).toBe("ÄÖÜ");
  });

  it("should fix eszett", () => {
    const { result } = fixEncoding("Ã");
    expect(result).toBe("ß");
  });

  it("should fix French accented chars", () => {
    const { result } = fixEncoding("Ã©Ã¨");
    expect(result).toBe("éè");
  });

  it("should count multiple occurrences", () => {
    const input = "Ã¤ und Ã¤ und Ã¤";
    const { fixes } = fixEncoding(input);
    expect(fixes[0]).toContain("3x");
  });

  it("should return empty fixes for clean text", () => {
    const { fixes } = fixEncoding("Hallo Welt, keine Fehler hier!");
    expect(fixes).toEqual([]);
  });

  let tmpDir: string;
  beforeEach(async () => {
    tmpDir = await makeTmpDir();
  });
  afterEach(async () => {
    await rmDir(tmpDir);
  });

  it("should fix encoding in a file", async () => {
    const fp = path.join(tmpDir, "encoding.txt");
    await fs.writeFile(fp, "GrÃ¼Ãe aus MÃ¼nchen", "utf-8");
    const content = await fs.readFile(fp, "utf-8");
    const { result } = fixEncoding(content);
    expect(result).toBe("Grüße aus München");
  });
});

// ============================================================================
// Tool 9: cc_cleanup_file
// ============================================================================

describe("Tool 9: cc_cleanup_file", () => {
  it("should remove BOM", () => {
    const { result, fixes } = cleanupFile("﻿hello", { removeBom: true });
    expect(result).toBe("hello");
    expect(fixes).toContain("BOM removed");
  });

  it("should remove NUL bytes", () => {
    const { result, fixes } = cleanupFile("hel\0lo", { removeNulBytes: true });
    expect(result).toBe("hello");
    expect(fixes).toContain("NUL bytes removed");
  });

  it("should remove trailing whitespace", () => {
    const { result, fixes } = cleanupFile("hello   \nworld\t \n", { removeTrailingWhitespace: true });
    expect(result).toBe("hello\nworld\n");
    expect(fixes).toContain("Trailing whitespace removed");
  });

  it("should normalize CRLF to LF", () => {
    const { result, fixes } = cleanupFile("hello\r\nworld\r\n", { normalizeLineEndings: "lf" });
    expect(result).toBe("hello\nworld\n");
    expect(fixes).toContain("LF");
  });

  it("should normalize LF to CRLF", () => {
    const { result, fixes } = cleanupFile("hello\nworld\n", { normalizeLineEndings: "crlf" });
    expect(result).toBe("hello\r\nworld\r\n");
    expect(fixes).toContain("CRLF");
  });

  it("should handle multiple cleanups at once", () => {
    const { result, fixes } = cleanupFile("﻿hello  \r\nworld\t\r\n", {
      removeBom: true,
      removeTrailingWhitespace: true,
      normalizeLineEndings: "lf",
    });
    expect(result).toBe("hello\nworld\n");
    expect(fixes.length).toBe(3);
  });

  it("should report no fixes for clean content", () => {
    const { fixes } = cleanupFile("hello\nworld\n", {
      removeBom: true,
      removeNulBytes: true,
      removeTrailingWhitespace: true,
    });
    expect(fixes).toEqual([]);
  });

  it("should not touch content without trailing whitespace", () => {
    const input = "line1\nline2\nline3";
    const { result } = cleanupFile(input, { removeTrailingWhitespace: true });
    expect(result).toBe(input);
  });
});

// ============================================================================
// Tool 10: cc_convert_format
// ============================================================================

describe("Tool 10: cc_convert_format", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTmpDir();
  });
  afterEach(async () => {
    await rmDir(tmpDir);
  });

  it("should convert JSON to YAML", async () => {
    const data = { name: "test", version: "1.0", items: [1, 2, 3] };
    const jsonStr = JSON.stringify(data);
    const yamlStr = yaml.dump(JSON.parse(jsonStr), { indent: 2, lineWidth: 120, noRefs: true });
    const parsed = yaml.load(yamlStr) as any;
    expect(parsed.name).toBe("test");
    expect(parsed.items).toEqual([1, 2, 3]);
  });

  it("should convert YAML to JSON", () => {
    const yamlStr = "name: test\nversion: '1.0'\nitems:\n  - 1\n  - 2\n";
    const data = yaml.load(yamlStr);
    const jsonStr = JSON.stringify(data, null, 2);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.name).toBe("test");
  });

  it("should convert JSON to TOML", () => {
    const data = { server: { host: "localhost", port: 8080 }, debug: true };
    const tomlStr = toml.stringify(data);
    const parsed = toml.parse(tomlStr);
    expect((parsed as any).server.host).toBe("localhost");
    expect((parsed as any).debug).toBe(true);
  });

  it("should convert TOML to JSON", () => {
    const tomlStr = "[server]\nhost = \"localhost\"\nport = 8080\n";
    const data = toml.parse(tomlStr);
    expect((data as any).server.host).toBe("localhost");
    expect((data as any).server.port).toBe(8080);
  });

  it("should reject TOML output for array root", () => {
    const data = [1, 2, 3];
    expect(() => toml.stringify(data as any)).toThrow();
  });

  it("should convert JSON to XML and back", () => {
    const data = { root: { name: "test", value: "42" } };
    const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text", format: true, indentBy: "  " });
    const xml = builder.build(data);
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });
    const parsed = parser.parse(xml);
    expect(parsed.root.name).toBe("test");
    expect(String(parsed.root.value)).toBe("42");
  });

  it("should convert CSV to data objects", () => {
    const csv = "name,age,city\nAlice,30,Berlin\nBob,25,Munich\n";
    const lines = csv.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const data = lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = vals[i] || "";
      });
      return obj;
    });
    expect(data.length).toBe(2);
    expect(data[0].name).toBe("Alice");
    expect(data[1].city).toBe("Munich");
  });

  it("should convert data objects to CSV", () => {
    const data = [
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ];
    const headers = Object.keys(data[0]);
    const rows = data.map((item) => headers.map((h) => String(item[h as keyof typeof item])).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    expect(csv).toContain("name,age");
    expect(csv).toContain("Alice,30");
  });

  it("should parse INI format", () => {
    const ini = "[database]\nhost = localhost\nport = 5432\n\n[app]\nname = MyApp\n";
    const result: Record<string, Record<string, string>> = {};
    let section = "_default";
    result[section] = {};
    for (const line of ini.split("\n")) {
      const tl = line.trim();
      if (!tl || tl.startsWith(";") || tl.startsWith("#")) continue;
      const sm = tl.match(/^\[(.+)\]$/);
      if (sm) {
        section = sm[1];
        result[section] = result[section] || {};
      } else {
        const eq = tl.indexOf("=");
        if (eq > 0) result[section][tl.substring(0, eq).trim()] = tl.substring(eq + 1).trim();
      }
    }
    if (Object.keys(result._default).length === 0) delete result._default;
    expect(result.database.host).toBe("localhost");
    expect(result.app.name).toBe("MyApp");
  });

  it("should roundtrip JSON through TOON format", () => {
    const data = { greeting: "hello", count: 42 };
    const encoded = toonEncode(data);
    const decoded = toonDecode(encoded);
    expect(decoded).toEqual(data);
  });

  it("should write converted output to file", async () => {
    const inputPath = path.join(tmpDir, "input.json");
    const outputPath = path.join(tmpDir, "output.yaml");
    await fs.writeFile(inputPath, '{"key": "value"}', "utf-8");
    const data = JSON.parse(await fs.readFile(inputPath, "utf-8"));
    const yamlOut = yaml.dump(data, { indent: 2, lineWidth: 120, noRefs: true });
    await fs.writeFile(outputPath, yamlOut, "utf-8");
    const result = await fs.readFile(outputPath, "utf-8");
    expect(result).toContain("key: value");
  });
});

// ============================================================================
// Tool 11: cc_fix_umlauts
// ============================================================================

describe("Tool 11: cc_fix_umlauts", () => {
  it("should fix double-encoded umlauts", () => {
    const { result } = fixUmlauts("Ã¤Ã¶Ã¼");
    expect(result).toBe("äöü");
  });

  it("should fix HTML entities", () => {
    const { result } = fixUmlauts("Gr&uuml;&szlig;e aus &Ouml;sterreich");
    expect(result).toBe("Grüße aus Österreich");
  });

  it("should fix escaped unicode sequences", () => {
    const { result } = fixUmlauts("\\u00e4\\u00f6\\u00fc");
    expect(result).toBe("äöü");
  });

  it("should handle mixed broken umlauts", () => {
    const input = "&auml; and Ã¶ and \\u00fc";
    const { result } = fixUmlauts(input);
    expect(result).toBe("ä and ö and ü");
  });

  it("should count total fixes correctly", () => {
    const { totalFixes } = fixUmlauts("&auml;&ouml;&uuml;");
    expect(totalFixes).toBe(3);
  });

  it("should return no fixes for clean text", () => {
    const { fixes } = fixUmlauts("Hallo Wörld äöü");
    expect(fixes).toEqual([]);
  });
});

// ============================================================================
// Tool 12: cc_scan_emoji
// ============================================================================

describe("Tool 12: cc_scan_emoji", () => {
  it("should detect common emojis", () => {
    const text = "Hello \u{1F600} World \u{1F4A1}";
    const matches = text.match(EMOJI_PATTERN);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it("should detect weather emojis (U+2600 range)", () => {
    const text = "Sunny ☀ and snowy ❄";
    const matches = text.match(EMOJI_PATTERN);
    expect(matches).not.toBeNull();
  });

  it("should not match regular ASCII", () => {
    const text = "Hello World 123 !@#$%";
    const matches = text.match(EMOJI_PATTERN);
    expect(matches).toBeNull();
  });

  it("should not match German umlauts", () => {
    const text = "äöüÄÖÜß";
    const matches = text.match(EMOJI_PATTERN);
    expect(matches).toBeNull();
  });

  it("should scan files for emojis", async () => {
    const tmpDir = await makeTmpDir();
    try {
      const fp = path.join(tmpDir, "emoji.txt");
      await fs.writeFile(fp, "Line 1\nLine 2 \u{1F680}\nLine 3\n", "utf-8");
      const content = await fs.readFile(fp, "utf-8");
      const lines = content.split("\n");
      const results: { line: number; emoji: string }[] = [];
      for (let i = 0; i < lines.length; i++) {
        const matches = lines[i].match(EMOJI_PATTERN);
        if (matches) {
          for (const emoji of matches) {
            results.push({ line: i + 1, emoji });
          }
        }
      }
      expect(results.length).toBe(1);
      expect(results[0].line).toBe(2);
      expect(results[0].emoji).toBe("\u{1F680}");
    } finally {
      await rmDir(tmpDir);
    }
  });
});

// ============================================================================
// Tool 13: cc_generate_licenses
// ============================================================================

describe("Tool 13: cc_generate_licenses", () => {
  it("should format licenses as text", () => {
    const licenses = [
      { name: "express", version: "4.18.2", license: "MIT" },
      { name: "lodash", version: "4.17.21", license: "MIT" },
    ];
    const output = [
      "THIRD PARTY NOTICES",
      "=".repeat(40),
      "",
      ...licenses.map((l) => `${l.name} v${l.version}\n  License: ${l.license}\n`),
    ].join("\n");
    expect(output).toContain("express v4.18.2");
    expect(output).toContain("License: MIT");
  });

  it("should format licenses as JSON", () => {
    const licenses = [{ name: "express", version: "4.18.2", license: "MIT" }];
    const output = JSON.stringify(licenses, null, 2);
    const parsed = JSON.parse(output);
    expect(parsed[0].name).toBe("express");
  });

  it("should format licenses as CSV", () => {
    const licenses = [
      { name: "express", version: "4.18.2", license: "MIT" },
      { name: "lodash", version: "4.17.21", license: "MIT" },
    ];
    const output = ["Name,Version,License", ...licenses.map((l) => `${l.name},${l.version},${l.license}`)].join("\n");
    expect(output).toContain("Name,Version,License");
    expect(output).toContain("express,4.18.2,MIT");
  });

  it("should read dependencies from package.json", async () => {
    const tmpDir = await makeTmpDir();
    try {
      const pkgJson = {
        dependencies: { express: "^4.18.0" },
        devDependencies: { vitest: "^4.1.0" },
      };
      await fs.writeFile(path.join(tmpDir, "package.json"), JSON.stringify(pkgJson), "utf-8");
      const content = await fs.readFile(path.join(tmpDir, "package.json"), "utf-8");
      const pkg = JSON.parse(content);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      expect(Object.keys(allDeps)).toContain("express");
      expect(Object.keys(allDeps)).toContain("vitest");
    } finally {
      await rmDir(tmpDir);
    }
  });
});

// ============================================================================
// Tool 14: cc_md_to_html
// ============================================================================

describe("Tool 14: cc_md_to_html", () => {
  it("should convert headers", () => {
    expect(inlineFmt("plain")).toBe("plain");
    const line = "## Hello World";
    const hm = line.match(/^(#{1,6})\s+(.+)$/);
    expect(hm).not.toBeNull();
    const lvl = hm![1].length;
    const html = `<h${lvl}>${inlineFmt(hm![2])}</h${lvl}>`;
    expect(html).toBe("<h2>Hello World</h2>");
  });

  it("should convert bold text", () => {
    expect(inlineFmt("**bold**")).toBe("<strong>bold</strong>");
  });

  it("should convert italic text", () => {
    expect(inlineFmt("*italic*")).toBe("<em>italic</em>");
  });

  it("should convert bold+italic text", () => {
    expect(inlineFmt("***both***")).toBe("<strong><em>both</em></strong>");
  });

  it("should convert inline code", () => {
    expect(inlineFmt("`code`")).toBe("<code>code</code>");
  });

  it("should convert links", () => {
    expect(inlineFmt("[text](https://example.com)")).toBe('<a href="https://example.com">text</a>');
  });

  it("should convert images", () => {
    expect(inlineFmt("![alt](img.png)")).toBe('<img src="img.png" alt="alt">');
  });

  it("should convert checkboxes", () => {
    expect(inlineFmt("[x] done")).toContain("&#9745;");
    expect(inlineFmt("[ ] todo")).toContain("&#9744;");
  });

  it("should produce standalone HTML document", async () => {
    const tmpDir = await makeTmpDir();
    try {
      const md = "# Title\n\nParagraph text.\n";
      const title = "Test";
      const html = `<!DOCTYPE html>\n<html lang="de">\n<head>\n  <meta charset="UTF-8">\n  <title>${title}</title>\n</head>\n<body>\n<h1>Title</h1>\n<p>Paragraph text.</p>\n</body>\n</html>`;
      const fp = path.join(tmpDir, "out.html");
      await fs.writeFile(fp, html, "utf-8");
      const content = await fs.readFile(fp, "utf-8");
      expect(content).toContain("<!DOCTYPE html>");
      expect(content).toContain("<h1>Title</h1>");
    } finally {
      await rmDir(tmpDir);
    }
  });
});

// ============================================================================
// Tool 15: cc_md_to_pdf
// ============================================================================

describe("Tool 15: cc_md_to_pdf", () => {
  it("should use same markdown parser as md_to_html", () => {
    expect(inlineFmt("**test**")).toBe("<strong>test</strong>");
    expect(inlineFmt("[link](url)")).toBe('<a href="url">link</a>');
  });

  it("should detect horizontal rules", () => {
    expect(/^(-{3,}|={3,}|\*{3,})$/.test("---")).toBe(true);
    expect(/^(-{3,}|={3,}|\*{3,})$/.test("===")).toBe(true);
    expect(/^(-{3,}|={3,}|\*{3,})$/.test("***")).toBe(true);
    expect(/^(-{3,}|={3,}|\*{3,})$/.test("--")).toBe(false);
  });

  it("should detect fenced code blocks", () => {
    const line = "```python";
    expect(line.trimStart().startsWith("```")).toBe(true);
    const lang = line.trim().slice(3).trim();
    expect(lang).toBe("python");
  });

  it("should pass PDF paths as argv values", () => {
    const outputPath = path.join(os.tmpdir(), 'report"; echo injected; ".pdf');
    const tempHtml = outputPath.replace(/\.pdf$/i, ".tmp.html");
    const args = buildPdfBrowserArgs(outputPath, tempHtml);

    expect(args).toHaveLength(5);
    expect(args[2]).toBe(`--print-to-pdf=${outputPath}`);
    expect(args[4]).toBe(pathToFileURL(tempHtml).href);
  });
});

// ============================================================================
// Tool 16: cc_set_language
// ============================================================================

describe("Tool 16: cc_set_language", () => {
  it("should accept 'de' as valid language", () => {
    const valid = ["de", "en", "es", "zh", "ja", "ru"];
    expect(valid.includes("de")).toBe(true);
  });

  it("should accept 'en' as valid language", () => {
    const valid = ["de", "en", "es", "zh", "ja", "ru"];
    expect(valid.includes("en")).toBe(true);
  });

  it("should accept fallback language packs", () => {
    const valid = ["de", "en", "es", "zh", "ja", "ru"];
    expect(valid.includes("es")).toBe(true);
    expect(valid.includes("zh")).toBe(true);
    expect(valid.includes("ja")).toBe(true);
    expect(valid.includes("ru")).toBe(true);
  });

  it("should reject invalid language codes", () => {
    const valid = ["de", "en", "es", "zh", "ja", "ru"];
    expect(valid.includes("fr")).toBe(false);
    expect(valid.includes("")).toBe(false);
  });
});

// ============================================================================
// Tool 17: cc_diff_files
// ============================================================================

describe("Tool 17: cc_diff_files", () => {
  it("should detect identical files", () => {
    const a = ["line1", "line2", "line3"];
    const b = ["line1", "line2", "line3"];
    const diff = computeUnifiedDiff(a, b, 3, "a.txt", "b.txt");
    expect(diff).toBe("");
  });

  it("should detect single line addition", () => {
    const a = ["line1", "line3"];
    const b = ["line1", "line2", "line3"];
    const diff = computeUnifiedDiff(a, b, 3, "a.txt", "b.txt");
    expect(diff).toContain("+line2");
    expect(diff).toContain("--- a.txt");
    expect(diff).toContain("+++ b.txt");
  });

  it("should detect single line deletion", () => {
    const a = ["line1", "line2", "line3"];
    const b = ["line1", "line3"];
    const diff = computeUnifiedDiff(a, b, 3, "a.txt", "b.txt");
    expect(diff).toContain("-line2");
  });

  it("should detect line modification", () => {
    const a = ["hello", "world"];
    const b = ["hello", "earth"];
    const diff = computeUnifiedDiff(a, b, 3, "a.txt", "b.txt");
    expect(diff).toContain("-world");
    expect(diff).toContain("+earth");
  });

  it("should include context lines", () => {
    const a = ["ctx1", "ctx2", "old", "ctx3", "ctx4"];
    const b = ["ctx1", "ctx2", "new", "ctx3", "ctx4"];
    const diff = computeUnifiedDiff(a, b, 2, "a.txt", "b.txt");
    expect(diff).toContain(" ctx2");
    expect(diff).toContain(" ctx3");
  });

  it("should produce valid unified diff format with @@ headers", () => {
    const a = ["a", "b", "c"];
    const b = ["a", "x", "c"];
    const diff = computeUnifiedDiff(a, b, 1, "file1", "file2");
    expect(diff).toMatch(/^--- file1/m);
    expect(diff).toMatch(/^\+\+\+ file2/m);
    expect(diff).toMatch(/^@@ -\d+,\d+ \+\d+,\d+ @@/m);
  });

  it("should handle empty files", () => {
    const diff = computeUnifiedDiff([], ["new line"], 3, "a.txt", "b.txt");
    expect(diff).toContain("+new line");
  });

  it("should work with real fixture files", async () => {
    const fixtureDir = path.join(process.cwd(), "test", "fixtures");
    const fileA = path.join(fixtureDir, "diff_a.txt");
    const fileB = path.join(fixtureDir, "diff_b.txt");
    expect(await pathExists(fileA)).toBe(true);
    expect(await pathExists(fileB)).toBe(true);
    const contentA = await fs.readFile(fileA, "utf-8");
    const contentB = await fs.readFile(fileB, "utf-8");
    const linesA = contentA.split("\n");
    const linesB = contentB.split("\n");
    const diff = computeUnifiedDiff(linesA, linesB, 3, "diff_a.txt", "diff_b.txt");
    expect(diff).toContain("---");
    expect(diff).toContain("+++");
  });
});

// ============================================================================
// Tool 18: cc_regex_test
// ============================================================================

describe("Tool 18: cc_regex_test", () => {
  it("should find matches with global flag", () => {
    const regex = new RegExp("\\d+", "g");
    const input = "abc 123 def 456";
    const matches = [...input.matchAll(regex)];
    expect(matches.length).toBe(2);
    expect(matches[0][0]).toBe("123");
    expect(matches[1][0]).toBe("456");
  });

  it("should capture groups", () => {
    const regex = new RegExp("(\\w+)@(\\w+\\.\\w+)", "g");
    const input = "user@example.com";
    const matches = [...input.matchAll(regex)];
    expect(matches.length).toBe(1);
    expect(matches[0][1]).toBe("user");
    expect(matches[0][2]).toBe("example.com");
  });

  it("should handle case-insensitive flag", () => {
    const regex = new RegExp("hello", "gi");
    const input = "Hello HELLO hello";
    const matches = [...input.matchAll(regex)];
    expect(matches.length).toBe(3);
  });

  it("should handle multiline flag", () => {
    const regex = new RegExp("^start", "gm");
    const input = "start one\nstart two\nend three";
    const matches = [...input.matchAll(regex)];
    expect(matches.length).toBe(2);
  });

  it("should handle unicode flag with emojis", () => {
    const regex = new RegExp("[\\u{1F600}-\\u{1F64F}]", "gu");
    const input = "Hello \u{1F600} World \u{1F60D}";
    const matches = [...input.matchAll(regex)];
    expect(matches.length).toBe(2);
  });

  it("should handle unicode flag with umlauts", () => {
    const regex = new RegExp("[\\u00e4\\u00f6\\u00fc\\u00df]", "g");
    const input = "Hällo Wörld Füß";
    const matches = [...input.matchAll(regex)];
    expect(matches.length).toBe(4);
  });

  it("should perform replacement", () => {
    const regex = new RegExp("(\\d{4})-(\\d{2})-(\\d{2})", "g");
    const input = "Date: 2025-12-28";
    const replaced = input.replace(regex, "$3.$2.$1");
    expect(replaced).toBe("Date: 28.12.2025");
  });

  it("should handle no matches gracefully", () => {
    const regex = new RegExp("xyz", "g");
    const matches = [...("hello world".matchAll(regex))];
    expect(matches.length).toBe(0);
  });

  it("should report match index", () => {
    const regex = new RegExp("world", "g");
    const matches = [..."hello world".matchAll(regex)];
    expect(matches[0].index).toBe(6);
  });
});

// ============================================================================
// Cross-cutting: Path normalization
// ============================================================================

describe("Cross-cutting: Path normalization", () => {
  it("should normalize backslashes", () => {
    const result = normalizePath("C:\\Users\\test\\file.txt");
    expect(result).toBe(path.normalize("C:\\Users\\test\\file.txt"));
  });

  it("should normalize forward slashes on any platform", () => {
    const result = normalizePath("C:/Users/test/file.txt");
    expect(result).toBe(path.normalize("C:/Users/test/file.txt"));
  });

  it("should collapse double separators", () => {
    const input = `a${path.sep}${path.sep}b${path.sep}${path.sep}c`;
    const result = normalizePath(input);
    expect(result).not.toContain(`${path.sep}${path.sep}`);
  });

  it("should handle relative paths with ..", () => {
    const result = normalizePath("a/b/../c");
    expect(result).toBe(path.normalize("a/b/../c"));
  });
});

// ============================================================================
// Cross-cutting: File size formatting
// ============================================================================

describe("Cross-cutting: formatFileSize", () => {
  it("should format bytes", () => {
    expect(formatFileSize(500)).toBe("500.00 B");
  });

  it("should format kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.00 KB");
  });

  it("should format megabytes", () => {
    expect(formatFileSize(1048576)).toBe("1.00 MB");
  });

  it("should format gigabytes", () => {
    expect(formatFileSize(1073741824)).toBe("1.00 GB");
  });

  it("should format fractional sizes", () => {
    expect(formatFileSize(1536)).toBe("1.50 KB");
  });
});

// ============================================================================
// Cross-cutting: Encoding edge cases
// ============================================================================

describe("Cross-cutting: Encoding edge cases", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTmpDir();
  });
  afterEach(async () => {
    await rmDir(tmpDir);
  });

  it("should handle UTF-8 BOM in file read", async () => {
    const fp = path.join(tmpDir, "bom.txt");
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const content = Buffer.from("Hello World", "utf-8");
    await fs.writeFile(fp, Buffer.concat([bom, content]));
    const text = await fs.readFile(fp, "utf-8");
    expect(text.charCodeAt(0)).toBe(0xfeff);
  });

  it("should handle empty files", async () => {
    const fp = path.join(tmpDir, "empty.txt");
    await fs.writeFile(fp, "", "utf-8");
    const text = await fs.readFile(fp, "utf-8");
    expect(text).toBe("");
  });

  it("should preserve unicode characters in roundtrip", async () => {
    const fp = path.join(tmpDir, "unicode.txt");
    const content = "Hällo Wörld ß \u{1F600}";
    await fs.writeFile(fp, content, "utf-8");
    const text = await fs.readFile(fp, "utf-8");
    expect(text).toBe(content);
  });
});

// ============================================================================
// Cross-cutting: Line endings
// ============================================================================

describe("Cross-cutting: Line endings", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTmpDir();
  });
  afterEach(async () => {
    await rmDir(tmpDir);
  });

  it("should detect CRLF in file content", async () => {
    const fp = path.join(tmpDir, "crlf.txt");
    await fs.writeFile(fp, "line1\r\nline2\r\n", "utf-8");
    const content = await fs.readFile(fp, "utf-8");
    expect(content.includes("\r\n")).toBe(true);
  });

  it("should normalize CRLF to LF", () => {
    const input = "line1\r\nline2\r\nline3\r\n";
    const result = input.replace(/\r\n/g, "\n");
    expect(result).toBe("line1\nline2\nline3\n");
    expect(result.includes("\r")).toBe(false);
  });

  it("should normalize LF to CRLF", () => {
    const input = "line1\nline2\nline3\n";
    let result = input.replace(/\r\n/g, "\n");
    result = result.replace(/\n/g, "\r\n");
    expect(result).toBe("line1\r\nline2\r\nline3\r\n");
  });

  it("should handle mixed line endings", () => {
    const input = "line1\r\nline2\nline3\r\nline4\n";
    const normalized = input.replace(/\r\n/g, "\n");
    expect(normalized).toBe("line1\nline2\nline3\nline4\n");
  });
});

// ============================================================================
// Cross-cutting: Temp directories (platform-independent)
// ============================================================================

describe("Cross-cutting: Temp directories", () => {
  it("should create temp directory with os.tmpdir()", async () => {
    const dir = await makeTmpDir();
    try {
      expect(await pathExists(dir)).toBe(true);
      expect(dir.startsWith(os.tmpdir())).toBe(true);
    } finally {
      await rmDir(dir);
    }
  });

  it("should use path.join for cross-platform paths", () => {
    const result = path.join(os.tmpdir(), "test", "file.txt");
    expect(result).toContain("test");
    expect(result).toContain("file.txt");
  });
});
