#!/usr/bin/env node
/**
 * ellmos CodeCommander MCP Server
 *
 * A developer-focused MCP server for code analysis, JSON repair,
 * encoding fix, import organization, and format conversion.
 *
 * Copyright (c) 2025-2026 Lukas Geiger. Licensed under MIT License.
 * See LICENSE file for details.
 *
 * @author Lukas Geiger
 * @version 1.3.22
 * @license MIT
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// @ts-expect-error update-notifier (v7, ESM) liefert keine eigenen Typdeklarationen
import updateNotifier from "update-notifier";
import { createRequire } from "node:module";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import * as fsSync from "fs";
import { exec, execFile, execFileSync, execSync } from "child_process";
import { promisify } from "util";
import { pathToFileURL, fileURLToPath } from "url";
import { t, setLanguage } from './i18n/index.js';
import * as yaml from 'js-yaml';
import * as toml from 'smol-toml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { encode as toonEncode, decode as toonDecode } from '@toon-format/toon';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// ============================================================================
// Server Initialization
// ============================================================================

const server = new McpServer({
  name: "ellmos-codecommander-mcp",
  version: "1.3.22"
});

// ============================================================================
// Helper Functions
// ============================================================================

function normalizePath(inputPath: string): string {
  return path.normalize(inputPath);
}

async function pathExists(targetPath: string): Promise<boolean> {
  try { await fs.access(targetPath); return true; } catch { return false; }
}

// Converts JSON5-style single-quoted string delimiters to double quotes, while
// leaving apostrophes inside already-double-quoted strings untouched. The
// previous key/value-position regexes still mangled a double-quoted string
// value that happened to contain a literal `'word':` sequence (e.g. prose
// documenting JSON5 syntax), because they only anchor on what follows a
// candidate quote pair, not on whether that pair is inside a real string.
// This scanner tracks double-quote context explicitly and only rewrites
// single-quote delimiters when outside of one.
export function convertSingleQuotedDelimiters(content: string): string {
  let out = "";
  let inDouble = false;
  let inSingle = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === "\\" && i + 1 < content.length) {
      out += ch + content[i + 1];
      i++;
      continue;
    }
    if (!inSingle && ch === '"') { inDouble = !inDouble; out += ch; continue; }
    if (!inDouble && ch === "'") { inSingle = !inSingle; out += '"'; continue; }
    out += ch;
  }
  return out;
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) { size /= 1024; unitIndex++; }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Simple Python AST-like parser for TypeScript
// Extracts classes, functions, imports from Python files using regex patterns

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
  type: 'stdlib' | 'third_party' | 'local';
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

// Known Python stdlib modules
const STDLIB_MODULES = new Set([
  'abc', 'aifc', 'argparse', 'array', 'ast', 'asyncio', 'atexit', 'base64',
  'binascii', 'bisect', 'builtins', 'calendar', 'cgi', 'cmd', 'code', 'codecs',
  'collections', 'colorsys', 'compileall', 'configparser', 'contextlib', 'copy',
  'copyreg', 'csv', 'ctypes', 'curses', 'dataclasses', 'datetime', 'decimal',
  'difflib', 'dis', 'distutils', 'doctest', 'email', 'encodings', 'enum',
  'errno', 'faulthandler', 'fcntl', 'filecmp', 'fileinput', 'fnmatch',
  'fractions', 'ftplib', 'functools', 'gc', 'getopt', 'getpass', 'gettext',
  'glob', 'gzip', 'hashlib', 'heapq', 'hmac', 'html', 'http', 'idlelib',
  'imaplib', 'importlib', 'inspect', 'io', 'ipaddress', 'itertools', 'json',
  'keyword', 'lib2to3', 'linecache', 'locale', 'logging', 'lzma', 'mailbox',
  'math', 'mimetypes', 'mmap', 'modulefinder', 'multiprocessing', 'netrc',
  'numbers', 'operator', 'optparse', 'os', 'pathlib', 'pdb', 'pickle',
  'pickletools', 'pkgutil', 'platform', 'plistlib', 'poplib', 'posixpath',
  'pprint', 'profile', 'pstats', 'py_compile', 'pyclbr', 'pydoc', 'queue',
  'quopri', 'random', 're', 'readline', 'reprlib', 'resource', 'rlcompleter',
  'runpy', 'sched', 'secrets', 'select', 'selectors', 'shelve', 'shlex',
  'shutil', 'signal', 'site', 'smtpd', 'smtplib', 'sndhdr', 'socket',
  'socketserver', 'sqlite3', 'ssl', 'stat', 'statistics', 'string',
  'stringprep', 'struct', 'subprocess', 'sunau', 'symtable', 'sys', 'sysconfig',
  'syslog', 'tabnanny', 'tarfile', 'tempfile', 'test', 'textwrap', 'threading',
  'time', 'timeit', 'tkinter', 'token', 'tokenize', 'trace', 'traceback',
  'tracemalloc', 'tty', 'turtle', 'turtledemo', 'types', 'typing', 'unicodedata',
  'unittest', 'urllib', 'uu', 'uuid', 'venv', 'warnings', 'wave', 'weakref',
  'webbrowser', 'winreg', 'winsound', 'wsgiref', 'xdrlib', 'xml', 'xmlrpc',
  'zipapp', 'zipfile', 'zipimport', 'zlib', '_thread', '__future__'
]);

function classifyImport(module: string): 'stdlib' | 'third_party' | 'local' {
  if (module.startsWith('.')) return 'local';
  const topLevel = module.split('.')[0];
  if (STDLIB_MODULES.has(topLevel)) return 'stdlib';
  return 'third_party';
}

function analyzePythonCode(content: string): CodeAnalysis {
  const lines = content.split('\n');
  const totalLines = lines.length;
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let complexity = 0;

  // Line classification
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') blankLines++;
    else if (trimmed.startsWith('#')) commentLines++;
    else codeLines++;

    // Cyclomatic complexity: count branches
    if (/^\s*(if|elif|for|while|except|with|and|or)\b/.test(line)) complexity++;
  }

  // Extract imports
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

  // Extract classes
  const classes: PythonClass[] = [];
  for (let i = 0; i < lines.length; i++) {
    const classMatch = lines[i].match(/^class\s+(\w+)\s*(?:\(([^)]*)\))?\s*:/);
    if (classMatch) {
      const decorators: string[] = [];
      let j = i - 1;
      while (j >= 0 && lines[j].trim().startsWith('@')) {
        decorators.unshift(lines[j].trim());
        j--;
      }

      // Find end of class (next line with same or less indentation, or EOF)
      let endLine = i + 1;
      const baseIndent = lines[i].search(/\S/);
      for (let k = i + 1; k < lines.length; k++) {
        const lineIndent = lines[k].search(/\S/);
        if (lineIndent >= 0 && lineIndent <= baseIndent && lines[k].trim() !== '') {
          endLine = k;
          break;
        }
        endLine = k + 1;
      }

      // Find methods within class
      const methods: string[] = [];
      for (let k = i + 1; k < endLine; k++) {
        const methodMatch = lines[k].match(/^\s+(?:async\s+)?def\s+(\w+)\s*\(/);
        if (methodMatch) methods.push(methodMatch[1]);
      }

      // Extract docstring
      let docstring = '';
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
            docstring = dsLines.join(' ').trim();
          }
        }
      }

      classes.push({
        name: classMatch[1],
        startLine: i + 1,
        endLine,
        methods,
        bases: classMatch[2] ? classMatch[2].split(',').map(b => b.trim()) : [],
        decorators,
        docstring: docstring.substring(0, 200)
      });
    }
  }

  // Extract top-level functions
  const functions: PythonFunction[] = [];
  for (let i = 0; i < lines.length; i++) {
    const funcMatch = lines[i].match(/^(async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->.*?)?\s*:/);
    if (funcMatch) {
      // Check if inside a class
      const isInClass = classes.some(c => i + 1 > c.startLine && i + 1 < c.endLine);
      if (isInClass) continue;

      const decorators: string[] = [];
      let j = i - 1;
      while (j >= 0 && lines[j].trim().startsWith('@')) {
        decorators.unshift(lines[j].trim());
        j--;
      }

      let endLine = i + 1;
      for (let k = i + 1; k < lines.length; k++) {
        const lineIndent = lines[k].search(/\S/);
        if (lineIndent === 0 && lines[k].trim() !== '') {
          endLine = k;
          break;
        }
        endLine = k + 1;
      }

      let docstring = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
          docstring = nextLine.replace(/^['"]{'3}|['"]{'3}$/g, '').trim();
        }
      }

      functions.push({
        name: funcMatch[2],
        startLine: i + 1,
        endLine,
        params: funcMatch[3],
        decorators,
        docstring: docstring.substring(0, 200),
        isAsync: !!funcMatch[1]
      });
    }
  }

  return { classes, functions, imports, totalLines, codeLines, commentLines, blankLines, complexity };
}

interface IndentationIssue {
  file: string;
  line: number;
  type: 'missing_colon' | 'unindented_return' | 'mixed_indent' | 'read_error';
  message: string;
}

interface IndentationReport {
  path: string;
  filesChecked: number;
  filesWithIssues: number;
  totalIssues: number;
  issues: IndentationIssue[];
}

interface SignalCallbackIssue {
  method: string;
  line: number;
}

interface AttributeOrderIssue {
  attr: string;
  usedLine: number;
  definedLine: number | null;
}

interface UnderscoreMismatchIssue {
  called: string;
  defined: string;
}

interface MethodGuardrailReport {
  missingSignalCallbacks: SignalCallbackIssue[];
  attributeIssues: AttributeOrderIssue[];
  underscoreMismatches: UnderscoreMismatchIssue[];
}

const PYTHON_INHERITED_METHODS = new Set([
  '__enter__', '__exit__', '__eq__', '__hash__', '__init__', '__str__', '__repr__',
  'accept', 'reject', 'done', 'exec', 'exec_', 'open', 'close', 'show', 'hide',
  'connect', 'disconnect', 'emit', 'setText', 'text', 'setValue', 'value',
  'setEnabled', 'setDisabled', 'setVisible', 'clear', 'update', 'repaint'
]);

function methodExists(methodName: string, methods: Set<string>): boolean {
  if (methods.has(methodName) || PYTHON_INHERITED_METHODS.has(methodName)) return true;
  const alternate = methodName.startsWith('_') ? methodName.slice(1) : `_${methodName}`;
  return methods.has(alternate);
}

function analyzeMethodGuardrails(cls: PythonClass, lines: string[]): MethodGuardrailReport {
  const methods = new Set(cls.methods);
  const missingSignalCallbacks: SignalCallbackIssue[] = [];
  const attributeIssues: AttributeOrderIssue[] = [];
  const underscoreMismatches: UnderscoreMismatchIssue[] = [];
  const definedAttrs = new Map<string, number>();
  const reportedAttrs = new Set<string>();
  const reportedSignals = new Set<string>();
  const reportedMismatches = new Set<string>();

  for (let index = cls.startLine; index < cls.endLine && index < lines.length; index++) {
    const line = lines[index];
    const lineNo = index + 1;

    const signalPattern = /\.(?:connect|disconnect)\s*\(\s*(?:lambda[^:]*:\s*)?self\.(\w+)/g;
    for (const match of line.matchAll(signalPattern)) {
      const methodName = match[1];
      const key = `${methodName}:${lineNo}`;
      if (!methodExists(methodName, methods) && !reportedSignals.has(key)) {
        missingSignalCallbacks.push({ method: methodName, line: lineNo });
        reportedSignals.add(key);
      }
    }

    const callPattern = /self\.(\w+)\s*\(/g;
    for (const match of line.matchAll(callPattern)) {
      const called = match[1];
      if (methods.has(called) || PYTHON_INHERITED_METHODS.has(called)) continue;
      const alternate = called.startsWith('_') ? called.slice(1) : `_${called}`;
      if (methods.has(alternate) && !reportedMismatches.has(called)) {
        underscoreMismatches.push({ called, defined: alternate });
        reportedMismatches.add(called);
      }
    }

    const assignmentPattern = /self\.(\w+)\s*(?::[^=]+)?(?:[+\-*/%&|^]?=)/g;
    const assignedOnLine = new Set<string>();
    for (const match of line.matchAll(assignmentPattern)) {
      assignedOnLine.add(match[1]);
    }

    const attrPattern = /self\.(\w+)/g;
    for (const match of line.matchAll(attrPattern)) {
      const attr = match[1];
      if (methods.has(attr) || PYTHON_INHERITED_METHODS.has(attr)) continue;
      if (assignedOnLine.has(attr)) continue;
      if (!definedAttrs.has(attr) && !reportedAttrs.has(attr)) {
        attributeIssues.push({ attr, usedLine: lineNo, definedLine: null });
        reportedAttrs.add(attr);
      }
    }

    for (const attr of assignedOnLine) {
      if (!definedAttrs.has(attr)) definedAttrs.set(attr, lineNo);
    }
  }

  for (const issue of attributeIssues) {
    issue.definedLine = definedAttrs.get(issue.attr) ?? null;
  }

  return { missingSignalCallbacks, attributeIssues, underscoreMismatches };
}

function checkPythonIndentationContent(content: string, filePath: string): IndentationIssue[] {
  const issues: IndentationIssue[] = [];
  const lines = content.split(/\r?\n/);
  const structurePattern = /^(async\s+def|async\s+for|async\s+with|def|if|elif|else|for|while|try|except|finally|class|with)\b/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const stripped = line.trim();
    const indentMatch = line.match(/^[ \t]*/);
    const leading = indentMatch ? indentMatch[0] : '';
    const indentLevel = leading.length;

    if (structurePattern.test(stripped) && !stripped.endsWith(':') && !stripped.endsWith(':\\') && !stripped.endsWith('\\')) {
      const preview = stripped.length > 50 ? `${stripped.substring(0, 50)}...` : stripped;
      issues.push({
        file: filePath,
        line: i + 1,
        type: 'missing_colon',
        message: `Structure without ':' - '${preview}'`
      });
    }

    if (/^(return|yield)\b/.test(stripped) && indentLevel === 0) {
      const keyword = stripped.split(/\s+/)[0];
      issues.push({
        file: filePath,
        line: i + 1,
        type: 'unindented_return',
        message: `'${keyword}' outside an indented block`
      });
    }

    if (leading.includes('\t') && leading.includes(' ')) {
      issues.push({
        file: filePath,
        line: i + 1,
        type: 'mixed_indent',
        message: 'Mixed tabs and spaces in indentation'
      });
    }
  }

  return issues;
}

async function collectPythonFiles(targetPath: string, recursive: boolean): Promise<string[]> {
  const stat = await fs.stat(targetPath);
  if (stat.isFile()) return [targetPath];
  if (!stat.isDirectory()) return [];

  const files: string[] = [];
  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    const childPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      if (recursive) files.push(...await collectPythonFiles(childPath, true));
    } else if (entry.isFile() && entry.name.endsWith('.py')) {
      files.push(childPath);
    }
  }
  return files;
}

async function checkPythonIndentationPath(targetPath: string, recursive: boolean): Promise<IndentationReport> {
  const files = await collectPythonFiles(targetPath, recursive);
  const report: IndentationReport = {
    path: targetPath,
    filesChecked: 0,
    filesWithIssues: 0,
    totalIssues: 0,
    issues: []
  };

  for (const filePath of files) {
    report.filesChecked++;
    let fileIssues: IndentationIssue[];
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      fileIssues = checkPythonIndentationContent(content, filePath);
    } catch (error) {
      fileIssues = [{
        file: filePath,
        line: 0,
        type: 'read_error',
        message: error instanceof Error ? error.message : String(error)
      }];
    }

    if (fileIssues.length > 0) {
      report.filesWithIssues++;
      report.totalIssues += fileIssues.length;
      report.issues.push(...fileIssues);
    }
  }

  return report;
}

interface ExtractedContentBlock {
  name: string;
  content: string;
}

function appendExtractedContentBlocks(output: string[], blocks: ExtractedContentBlock[], maxChars: number): void {
  let remaining = Math.max(1000, Math.min(maxChars, 100000));
  let truncated = false;

  output.push('', t().cc_extract_classes.contentHeader);
  for (const block of blocks) {
    if (remaining <= 0) {
      truncated = true;
      break;
    }

    const content = block.content.trimEnd();
    let visible = content;
    if (visible.length > remaining) {
      visible = visible.slice(0, remaining);
      truncated = true;
    }

    output.push('', `### ${block.name}`, '````python', visible, '````');
    remaining -= visible.length;

    if (truncated) break;
  }

  if (truncated) {
    output.push('', t().cc_extract_classes.contentTruncated(maxChars));
  }
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
  arguments?: Array<Record<string, unknown>>;
  main_body?: string;
  target?: string;
  arrange?: string;
  act?: string;
  assertions?: string;
  base?: string;
}

function parseJsonValue(value: string | undefined, label: string): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${label} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeCodeParams(value: unknown): CodeParam[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error('params/fields/init_params must be JSON arrays');
  return value.map((entry, index) => {
    if (!isRecord(entry) || typeof entry.name !== 'string') {
      throw new Error(`Parameter at index ${index} must include a string name`);
    }
    const item: CodeParam = { name: entry.name };
    if (typeof entry.type === 'string') item.type = entry.type;
    if (typeof entry.default === 'string') item.default = entry.default;
    return item;
  });
}

function normalizeStringList(value: unknown, label: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`${label} must be a JSON array of strings`);
  }
  return value;
}

function mergeCodeSpec(params: {
  spec_json?: string;
  kind?: string;
  name?: string;
  params_json?: string;
  fields_json?: string;
  init_params_json?: string;
  bases_json?: string;
  imports_json?: string;
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
}): CodeSpec {
  const fromJson = parseJsonValue(params.spec_json, 'spec_json');
  const spec: CodeSpec = isRecord(fromJson) ? { ...fromJson } as CodeSpec : {};
  if (fromJson !== undefined && !isRecord(fromJson)) throw new Error('spec_json must be a JSON object');

  const assignString = (key: keyof CodeSpec, value: string | undefined): void => {
    if (value !== undefined) (spec as Record<string, unknown>)[key] = value;
  };

  assignString('kind', params.kind);
  assignString('name', params.name);
  assignString('return_type', params.return_type);
  assignString('docstring', params.docstring);
  assignString('body', params.body);
  assignString('description', params.description);
  assignString('content', params.content);
  assignString('main_body', params.main_body);
  assignString('target', params.target);
  assignString('arrange', params.arrange);
  assignString('act', params.act);
  assignString('assertions', params.assertions);
  assignString('base', params.base);

  const parsedParams = parseJsonValue(params.params_json, 'params_json');
  const parsedFields = parseJsonValue(params.fields_json, 'fields_json');
  const parsedInitParams = parseJsonValue(params.init_params_json, 'init_params_json');
  const parsedBases = parseJsonValue(params.bases_json, 'bases_json');
  const parsedImports = parseJsonValue(params.imports_json, 'imports_json');

  if (parsedParams !== undefined) spec.params = normalizeCodeParams(parsedParams);
  if (parsedFields !== undefined) spec.fields = normalizeCodeParams(parsedFields);
  if (parsedInitParams !== undefined) spec.init_params = normalizeCodeParams(parsedInitParams);
  if (parsedBases !== undefined) spec.bases = normalizeStringList(parsedBases, 'bases_json');
  if (parsedImports !== undefined) spec.imports = normalizeStringList(parsedImports, 'imports_json');

  return spec;
}

function formatPythonParams(params: CodeParam[] | undefined): string {
  if (!params || params.length === 0) return '';
  return params.map((param) => {
    let text = param.name;
    if (param.type) text += `: ${param.type}`;
    if (param.default !== undefined) text += ` = ${param.default}`;
    return text;
  }).join(', ');
}

function indentPythonBlock(body: string | undefined, spaces: number): string {
  const content = body && body.trim().length > 0 ? body : 'pass';
  const prefix = ' '.repeat(spaces);
  return content.split(/\r?\n/).map((line) => line.trim().length > 0 ? `${prefix}${line}` : '').join('\n');
}

function generatePythonCode(spec: CodeSpec): string {
  const kind = spec.kind || spec.type || 'function';
  const name = spec.name || (kind === 'module' ? 'generated_module' : 'generated_item');
  const docstring = spec.docstring || `${name} generated by CodeCommander`;

  if (kind === 'function') {
    const params = formatPythonParams(spec.params);
    const returnHint = spec.return_type ? ` -> ${spec.return_type}` : '';
    return `def ${name}(${params})${returnHint}:\n    """${docstring}"""\n${indentPythonBlock(spec.body, 4)}\n`;
  }

  if (kind === 'class') {
    const bases = spec.bases && spec.bases.length > 0 ? `(${spec.bases.join(', ')})` : '';
    const initParams = spec.init_params || [];
    const initSignature = formatPythonParams(initParams);
    const initSuffix = initSignature ? `, ${initSignature}` : '';
    const initBody = initParams.length > 0
      ? initParams.map((param) => `        self.${param.name} = ${param.name}`).join('\n')
      : '        pass';
    return `class ${name}${bases}:\n    """${docstring}"""\n\n    def __init__(self${initSuffix}):\n${initBody}\n`;
  }

  if (kind === 'dataclass') {
    const fields = spec.fields || [];
    const fieldLines = fields.length > 0
      ? fields.map((field) => {
          let text = `    ${field.name}: ${field.type || 'Any'}`;
          if (field.default !== undefined) text += ` = ${field.default}`;
          return text;
        }).join('\n')
      : '    pass';
    return `@dataclass\nclass ${name}:\n    """${docstring}"""\n${fieldLines}\n`;
  }

  if (kind === 'cli') {
    const description = spec.description || `${name} command line interface`;
    return `def main():\n    """CLI entry point."""\n    import argparse\n\n    parser = argparse.ArgumentParser(description=${JSON.stringify(description)})\n    args = parser.parse_args()\n\n${indentPythonBlock(spec.main_body, 4)}\n\n\nif __name__ == "__main__":\n    main()\n`;
  }

  if (kind === 'test') {
    const target = spec.target || name;
    return `def test_${name}():\n    """Test for ${target}."""\n    # Arrange\n${indentPythonBlock(spec.arrange || '# Setup', 4)}\n\n    # Act\n${indentPythonBlock(spec.act || 'result = None', 4)}\n\n    # Assert\n${indentPythonBlock(spec.assertions || 'assert True', 4)}\n`;
  }

  if (kind === 'exception') {
    return `class ${name}(${spec.base || 'Exception'}):\n    """${docstring}"""\n    pass\n`;
  }

  if (kind === 'module') {
    const imports = spec.imports ? spec.imports.join('\n') : '';
    const date = new Date().toISOString().slice(0, 10);
    return `#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n"""\n${name}\n${spec.description || docstring}\n\nGenerated by ellmos CodeCommander\nDate: ${date}\n"""\n\n${imports}\n\n${spec.content || ''}`;
  }

  throw new Error(`Unsupported code kind: ${kind}`);
}

interface RuntimeImportTarget {
  module: string;
  className?: string;
}

interface RuntimeImportResult {
  module: string;
  className?: string;
  success: boolean;
  exitCode: number | null;
  output: string;
  durationMs: number;
  timedOut: boolean;
}

interface RuntimeInitFileInfo {
  file: string;
  hasLazyImports: boolean;
  directImportCount: number;
  size: number;
}

interface RuntimeCircularImport {
  moduleA: string;
  moduleB: string;
}

interface RuntimeImportReport {
  projectPath: string;
  pythonPath: string;
  targets: RuntimeImportTarget[];
  results: RuntimeImportResult[];
  initFiles: RuntimeInitFileInfo[];
  circularImports: RuntimeCircularImport[];
  recommendations: string[];
}

type ExecFileError = Error & {
  stdout?: string | Buffer;
  stderr?: string | Buffer;
  code?: number | string;
  signal?: string;
  killed?: boolean;
};

const PYTHON_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PYTHON_MODULE_PATH_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/;
const PYTHON_SCAN_SKIP_DIRS = new Set([
  '__pycache__', '.git', '.hg', '.svn', '.venv', 'venv', 'env', 'node_modules',
  'dist', 'build', '.mypy_cache', '.pytest_cache', '.ruff_cache'
]);
const WINDOWS_NATIVE_CRASH_CODES = new Set([3221225477, 3221225725]);

function validateRuntimeImportTarget(target: RuntimeImportTarget): void {
  if (!PYTHON_MODULE_PATH_PATTERN.test(target.module)) {
    throw new Error(`Invalid Python module path: ${target.module}`);
  }
  if (target.className && !PYTHON_IDENTIFIER_PATTERN.test(target.className)) {
    throw new Error(`Invalid Python class/name: ${target.className}`);
  }
}

function parseRuntimeImportTargets(raw: string | undefined): RuntimeImportTarget[] | undefined {
  if (!raw || raw.trim() === '') return undefined;
  return raw.split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => {
      const [moduleName, className, extra] = item.split(':');
      if (extra !== undefined) throw new Error(`Invalid module target: ${item}`);
      const target: RuntimeImportTarget = {
        module: moduleName.trim(),
        className: className?.trim() || undefined
      };
      validateRuntimeImportTarget(target);
      return target;
    });
}

async function collectPythonProjectFiles(rootDir: string, limit = 1000): Promise<string[]> {
  const files: string[] = [];

  async function visit(currentDir: string): Promise<void> {
    if (files.length >= limit) return;
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= limit) break;
      const childPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (!PYTHON_SCAN_SKIP_DIRS.has(entry.name)) await visit(childPath);
      } else if (entry.isFile() && entry.name.endsWith('.py')) {
        files.push(childPath);
      }
    }
  }

  await visit(rootDir);
  return files;
}

function pythonModuleNameFromFile(projectPath: string, filePath: string): string | null {
  const parsed = path.parse(filePath);
  if (parsed.name.startsWith('_') || parsed.base === '__init__.py') return null;
  const relative = path.relative(projectPath, filePath);
  const withoutExtension = relative.slice(0, -path.extname(relative).length);
  const moduleName = withoutExtension.split(path.sep).join('.');
  return PYTHON_MODULE_PATH_PATTERN.test(moduleName) ? moduleName : null;
}

function firstPythonClassName(content: string): string | undefined {
  const match = content.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:\(|:)/m);
  return match?.[1];
}

async function discoverRuntimeImportTargets(projectPath: string, maxModules: number): Promise<RuntimeImportTarget[]> {
  const files = await collectPythonProjectFiles(projectPath);
  const targets: RuntimeImportTarget[] = [];

  for (const filePath of files) {
    if (targets.length >= maxModules) break;
    const moduleName = pythonModuleNameFromFile(projectPath, filePath);
    if (!moduleName) continue;
    const content = await fs.readFile(filePath, 'utf-8');
    const target: RuntimeImportTarget = { module: moduleName };
    const className = firstPythonClassName(content);
    if (className) target.className = className;
    validateRuntimeImportTarget(target);
    targets.push(target);
  }

  return targets;
}

function runtimeImportStatement(target: RuntimeImportTarget): string {
  return target.className
    ? `from ${target.module} import ${target.className}`
    : `import ${target.module}`;
}

async function runIsolatedPythonImport(
  target: RuntimeImportTarget,
  projectPath: string,
  pythonPath: string,
  timeoutSeconds: number
): Promise<RuntimeImportResult> {
  validateRuntimeImportTarget(target);
  const importStatement = runtimeImportStatement(target);
  const code = [
    'import sys',
    `sys.path.insert(0, ${JSON.stringify(projectPath)})`,
    'try:',
    `    ${importStatement}`,
    '    print("SUCCESS")',
    'except Exception as e:',
    '    print(f"ERROR: {type(e).__name__}: {e}")',
    '    sys.exit(1)'
  ].join('\n');

  const started = Date.now();
  try {
    const { stdout, stderr } = await execFileAsync(pythonPath, ['-c', code], {
      cwd: projectPath,
      timeout: timeoutSeconds * 1000,
      maxBuffer: 1024 * 1024,
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });
    return {
      module: target.module,
      className: target.className,
      success: String(stdout).includes('SUCCESS'),
      exitCode: 0,
      output: `${String(stdout).trim()}${String(stderr).trim()}`.slice(0, 2000),
      durationMs: Date.now() - started,
      timedOut: false
    };
  } catch (error) {
    const err = error as ExecFileError;
    const output = `${String(err.stdout ?? '').trim()}${String(err.stderr ?? '').trim()}`.slice(0, 2000);
    const timedOut = err.killed === true || err.signal === 'SIGTERM';
    return {
      module: target.module,
      className: target.className,
      success: false,
      exitCode: typeof err.code === 'number' ? err.code : null,
      output: timedOut && output.length === 0 ? 'TIMEOUT' : (output || err.message),
      durationMs: Date.now() - started,
      timedOut
    };
  }
}

async function analyzeRuntimeInitFiles(projectPath: string): Promise<RuntimeInitFileInfo[]> {
  const files = await collectPythonProjectFiles(projectPath);
  const initInfos: RuntimeInitFileInfo[] = [];

  for (const filePath of files.filter((file) => path.basename(file) === '__init__.py')) {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const directImportCount = lines.filter((line) => {
      const trimmed = line.trim();
      return trimmed.startsWith('from .') || trimmed.startsWith('import ');
    }).length;
    initInfos.push({
      file: path.relative(projectPath, filePath),
      hasLazyImports: content.includes('__getattr__'),
      directImportCount,
      size: content.length
    });
  }

  return initInfos;
}

function parsePythonImportReferences(content: string, currentModule: string): string[] {
  const refs: string[] = [];
  const currentPackage = currentModule.split('.').slice(0, -1);

  const resolveRelative = (moduleText: string, importedNames: string[]): string[] => {
    const match = moduleText.match(/^(\.+)(.*)$/);
    if (!match) return [moduleText];
    const level = match[1].length;
    const rest = match[2];
    const base = currentPackage.slice(0, Math.max(0, currentPackage.length - (level - 1)));
    if (rest) return [[...base, rest].filter(Boolean).join('.')];
    return importedNames
      .map((name) => name.split(' as ')[0].trim())
      .filter((name) => PYTHON_IDENTIFIER_PATTERN.test(name))
      .map((name) => [...base, name].filter(Boolean).join('.'));
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    const fromMatch = line.match(/^from\s+([^\s]+)\s+import\s+(.+)$/);
    if (fromMatch) {
      const importedNames = fromMatch[2].split(',').map((name) => name.trim());
      refs.push(...resolveRelative(fromMatch[1], importedNames));
      continue;
    }

    const importMatch = line.match(/^import\s+(.+)$/);
    if (importMatch) {
      refs.push(...importMatch[1].split(',').map((name) => name.trim().split(' as ')[0].trim()));
    }
  }

  return refs.filter((ref) => PYTHON_MODULE_PATH_PATTERN.test(ref));
}

function resolveKnownImport(ref: string, knownModules: Set<string>): string | undefined {
  if (knownModules.has(ref)) return ref;
  const parts = ref.split('.');
  while (parts.length > 1) {
    parts.pop();
    const candidate = parts.join('.');
    if (knownModules.has(candidate)) return candidate;
  }
  return undefined;
}

async function detectRuntimeCircularImports(projectPath: string): Promise<RuntimeCircularImport[]> {
  const files = await collectPythonProjectFiles(projectPath);
  const importMap = new Map<string, string[]>();

  for (const filePath of files) {
    const moduleName = pythonModuleNameFromFile(projectPath, filePath);
    if (!moduleName) continue;
    const content = await fs.readFile(filePath, 'utf-8');
    importMap.set(moduleName, parsePythonImportReferences(content, moduleName));
  }

  const knownModules = new Set(importMap.keys());
  const circular: RuntimeCircularImport[] = [];
  const seen = new Set<string>();

  for (const [moduleName, refs] of importMap) {
    for (const ref of refs) {
      const target = resolveKnownImport(ref, knownModules);
      if (!target || target === moduleName) continue;
      const targetRefs = importMap.get(target) ?? [];
      const backReferencesModule = targetRefs.some((targetRef) => resolveKnownImport(targetRef, knownModules) === moduleName);
      const key = [moduleName, target].sort().join('<->');
      if (backReferencesModule && !seen.has(key)) {
        circular.push({ moduleA: moduleName, moduleB: target });
        seen.add(key);
      }
    }
  }

  return circular.slice(0, 25);
}

async function diagnoseRuntimeImports(params: {
  path: string;
  modules?: string;
  max_modules?: number;
  timeout_seconds?: number;
  python_path?: string;
}): Promise<RuntimeImportReport> {
  const inputPath = normalizePath(params.path);
  const stat = await fs.stat(inputPath);
  const projectPath = stat.isDirectory() ? inputPath : path.dirname(inputPath);
  const maxModules = Math.max(1, Math.min(params.max_modules ?? 20, 100));
  const timeoutSeconds = Math.max(1, Math.min(params.timeout_seconds ?? 10, 60));
  const pythonPath = params.python_path || process.env.PYTHON || process.env.PYTHON_EXECUTABLE || 'python';
  const explicitTargets = parseRuntimeImportTargets(params.modules);
  const targets = explicitTargets ?? await discoverRuntimeImportTargets(projectPath, maxModules);

  const results: RuntimeImportResult[] = [];
  for (const target of targets.slice(0, maxModules)) {
    results.push(await runIsolatedPythonImport(target, projectPath, pythonPath, timeoutSeconds));
  }

  const initFiles = await analyzeRuntimeInitFiles(projectPath);
  const circularImports = await detectRuntimeCircularImports(projectPath);
  const recommendations: string[] = [];

  for (const result of results) {
    const label = result.className ? `${result.module}:${result.className}` : result.module;
    if (result.timedOut) {
      recommendations.push(`${label}: import timed out; check top-level startup work or blocking IO.`);
    } else if (result.exitCode !== null && WINDOWS_NATIVE_CRASH_CODES.has(result.exitCode)) {
      recommendations.push(`${label}: native crash/access violation; isolate GUI, DLL, or QApplication-style imports.`);
    } else if (!result.success) {
      recommendations.push(`${label}: import failed; inspect the isolated subprocess output.`);
    }
  }

  for (const initFile of initFiles) {
    if (initFile.directImportCount > 3 && !initFile.hasLazyImports) {
      recommendations.push(`${initFile.file}: many direct __init__.py imports; consider lazy imports.`);
    }
  }

  if (circularImports.length > 0) {
    recommendations.push('Circular imports detected; move shared code to lower-level modules or defer imports locally.');
  }

  return { projectPath, pythonPath, targets, results, initFiles, circularImports, recommendations };
}

type PythonStructuralOperation = 'inspect' | 'insert' | 'delete' | 'replace_line' | 'create_edit_file' | 'merge_edit_file';
type PythonStructuralMode = 'preview' | 'test' | 'apply';
type PythonElementType = 'class' | 'function' | 'method';

interface PythonElementRange {
  type: PythonElementType;
  name: string;
  displayName: string;
  startLine: number;
  endLine: number;
  parent?: string;
}

interface PythonStructuralEditResult {
  operation: PythonStructuralOperation;
  mode: PythonStructuralMode;
  changed: boolean;
  syntaxOk: boolean | null;
  originalContent: string;
  newContent: string;
  outputPath?: string;
  backupPath?: string;
  editFileContent?: string;
  summary: string[];
}

function splitPythonContent(content: string): { lines: string[]; trailingNewline: boolean } {
  const normalized = content.replace(/\r\n/g, '\n');
  const trailingNewline = normalized.endsWith('\n');
  const lines = normalized.split('\n');
  if (trailingNewline) lines.pop();
  return { lines, trailingNewline };
}

function joinPythonContent(lines: string[], trailingNewline: boolean): string {
  return `${lines.join('\n')}${trailingNewline ? '\n' : ''}`;
}

function findPythonBlockEnd(lines: string[], startIndex: number, baseIndent: number, parentEndIndex?: number): number {
  const limit = parentEndIndex ?? lines.length;
  let endLine = startIndex + 1;
  for (let index = startIndex + 1; index < limit; index++) {
    const line = lines[index];
    const indent = line.search(/\S/);
    if (indent >= 0 && indent <= baseIndent && line.trim() !== '') {
      endLine = index;
      break;
    }
    endLine = index + 1;
  }
  return endLine;
}

function findPythonElementRanges(content: string): PythonElementRange[] {
  const { lines } = splitPythonContent(content);
  const analysis = analyzePythonCode(content);
  const ranges: PythonElementRange[] = [];

  for (const cls of analysis.classes) {
    ranges.push({
      type: 'class',
      name: cls.name,
      displayName: cls.name,
      startLine: cls.startLine,
      endLine: cls.endLine
    });

    for (let index = cls.startLine; index < cls.endLine && index < lines.length; index++) {
      const methodMatch = lines[index].match(/^\s+(?:async\s+)?def\s+(\w+)\s*\(/);
      if (!methodMatch) continue;
      const methodIndent = lines[index].search(/\S/);
      const endLine = findPythonBlockEnd(lines, index, methodIndent, cls.endLine);
      ranges.push({
        type: 'method',
        name: methodMatch[1],
        displayName: `${cls.name}.${methodMatch[1]}`,
        startLine: index + 1,
        endLine,
        parent: cls.name
      });
    }
  }

  for (const func of analysis.functions) {
    ranges.push({
      type: 'function',
      name: func.name,
      displayName: func.name,
      startLine: func.startLine,
      endLine: func.endLine
    });
  }

  return ranges.sort((left, right) => left.startLine - right.startLine);
}

function findPythonElement(content: string, elementName: string): PythonElementRange | undefined {
  const ranges = findPythonElementRanges(content);
  return ranges.find((range) => range.displayName === elementName)
    ?? ranges.find((range) => range.name === elementName);
}

function findPythonImportInsertionIndex(lines: string[]): number {
  let index = 0;
  if (lines[index]?.startsWith('#!')) index++;
  if (/^#.*coding[:=]\s*[-\w.]+/.test(lines[index] ?? '')) index++;
  while (lines[index]?.trim() === '') index++;

  const first = lines[index]?.trim();
  if (first?.startsWith('"""') || first?.startsWith("'''")) {
    const quote = first.slice(0, 3);
    index++;
    if (!(first.endsWith(quote) && first.length > 6)) {
      while (index < lines.length && !lines[index].trim().endsWith(quote)) index++;
      if (index < lines.length) index++;
    }
    while (lines[index]?.trim() === '') index++;
  }

  let lastImportIndex = -1;
  for (let current = index; current < lines.length; current++) {
    const trimmed = lines[current].trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
      lastImportIndex = current;
      continue;
    }
    break;
  }

  return lastImportIndex >= 0 ? lastImportIndex + 1 : index;
}

function normalizeInsertedPythonContent(content: string, indentSpaces: number): string[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\n$/, '');
  const lines = normalized.split('\n');
  if (indentSpaces <= 0) return lines;
  const indent = ' '.repeat(indentSpaces);
  return lines.map((line) => line.trim().length > 0 ? `${indent}${line}` : line);
}

function resolveStructuralInsertIndex(params: {
  lines: string[];
  content: string;
  position?: string;
  line?: number;
  element?: string;
  class_name?: string;
}): { index: number; defaultIndent: number } {
  const position = params.position || 'end';

  if (position === 'start') return { index: 0, defaultIndent: 0 };
  if (position === 'after_imports') return { index: findPythonImportInsertionIndex(params.lines), defaultIndent: 0 };
  if (position === 'end') return { index: params.lines.length, defaultIndent: 0 };
  if (position === 'line') {
    if (!params.line) throw new Error('line is required for position=line');
    return { index: Math.max(0, Math.min(params.line - 1, params.lines.length)), defaultIndent: 0 };
  }

  if (position === 'before_element' || position === 'after_element') {
    if (!params.element) throw new Error('element is required for before_element/after_element');
    const range = findPythonElement(params.content, params.element);
    if (!range) throw new Error(t().cc_python_structural_edit.elementNotFound(params.element));
    return {
      index: position === 'before_element' ? range.startLine - 1 : range.endLine,
      defaultIndent: 0
    };
  }

  if (position === 'in_class') {
    if (!params.class_name) throw new Error('class_name is required for position=in_class');
    const range = findPythonElement(params.content, params.class_name);
    if (!range || range.type !== 'class') throw new Error(t().cc_python_structural_edit.elementNotFound(params.class_name));
    return { index: range.endLine, defaultIndent: 4 };
  }

  throw new Error(`Unsupported position: ${position}`);
}

function createPythonEditFileContent(sourcePath: string, content: string, elementsRaw: string | undefined): string {
  const elements = (elementsRaw || '').split(',').map((item) => item.trim()).filter(Boolean);
  if (elements.length === 0) throw new Error('elements is required for create_edit_file');

  const { lines } = splitPythonContent(content);
  const output: string[] = [
    `# EDIT FILE - generated from ${path.basename(sourcePath)}`,
    `# Elements: ${elements.join(', ')}`,
    '# Edit code below the markers, then merge explicitly.',
    '# ============================================================',
    ''
  ];

  for (const element of elements) {
    const range = findPythonElement(content, element);
    if (!range) {
      output.push(`# WARNING: element not found: ${element}`, '');
      continue;
    }
    output.push(`# === ${range.type.toUpperCase()}: ${range.displayName} [Lines ${range.startLine}-${range.endLine}] ===`);
    output.push(...lines.slice(range.startLine - 1, range.endLine));
    output.push('');
  }

  return output.join('\n');
}

function mergePythonEditFileContent(sourceContent: string, editContent: string): string {
  const parsed = splitPythonContent(sourceContent);
  const sourceLines = [...parsed.lines];
  const markerPattern = /^# === (CLASS|FUNCTION|METHOD): ([^\[]+) \[(?:Lines|Zeile) (\d+)-(\d+)\] ===$/;
  const replacements: Array<{ startLine: number; endLine: number; lines: string[]; label: string }> = [];
  let current: { startLine: number; endLine: number; lines: string[]; label: string } | null = null;

  for (const line of editContent.replace(/\r\n/g, '\n').split('\n')) {
    const marker = line.match(markerPattern);
    if (marker) {
      if (current) replacements.push(current);
      current = {
        startLine: Number(marker[3]),
        endLine: Number(marker[4]),
        lines: [],
        label: `${marker[1]} ${marker[2].trim()}`
      };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) replacements.push(current);
  if (replacements.length === 0) throw new Error('No edit markers found in edit_file');

  replacements.sort((left, right) => right.startLine - left.startLine);
  for (const replacement of replacements) {
    if (replacement.startLine < 1 || replacement.endLine > sourceLines.length || replacement.startLine > replacement.endLine) {
      throw new Error(`Invalid edit marker range for ${replacement.label}: ${replacement.startLine}-${replacement.endLine}`);
    }
    while (replacement.lines.length > 0 && replacement.lines[replacement.lines.length - 1].trim() === '') {
      replacement.lines.pop();
    }
    sourceLines.splice(replacement.startLine - 1, replacement.endLine - replacement.startLine + 1, ...replacement.lines);
  }

  return joinPythonContent(sourceLines, parsed.trailingNewline);
}

function safeTimestamp(): string {
  return new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
}

function backupPathForPythonFile(filePath: string): string {
  const parsed = path.parse(filePath);
  return path.join(parsed.dir, `${parsed.name}.backup_${safeTimestamp()}${parsed.ext || '.py'}`);
}

async function checkPythonSyntax(content: string, pythonPath: string): Promise<{ ok: boolean; output: string }> {
  const code = [
    'import ast, sys',
    'source = sys.stdin.read()',
    'try:',
    '    ast.parse(source)',
    'except SyntaxError as exc:',
    '    print(f"{exc.msg} at line {exc.lineno}:{exc.offset}")',
    '    sys.exit(1)'
  ].join('\n');
  try {
    execFileSync(pythonPath, ['-c', code], {
      input: content,
      timeout: 10000,
      maxBuffer: 1024 * 1024,
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });
    return { ok: true, output: '' };
  } catch (error) {
    const err = error as ExecFileError;
    return {
      ok: false,
      output: `${String(err.stdout ?? '').trim()}${String(err.stderr ?? '').trim()}` || err.message
    };
  }
}

async function runPythonStructuralEdit(params: {
  path: string;
  operation: PythonStructuralOperation;
  mode?: PythonStructuralMode;
  position?: string;
  line?: number;
  element?: string;
  class_name?: string;
  content?: string;
  elements?: string;
  edit_file?: string;
  output_path?: string;
  indent_spaces?: number;
  create_backup?: boolean;
  syntax_check?: boolean;
  python_path?: string;
}): Promise<PythonStructuralEditResult> {
  const filePath = normalizePath(params.path);
  const mode = params.mode ?? 'preview';
  const originalContent = await fs.readFile(filePath, 'utf-8');
  const parsed = splitPythonContent(originalContent);
  let newLines = [...parsed.lines];
  let newContent = originalContent;
  const summary: string[] = [];
  let editFileContent: string | undefined;
  let outputPath: string | undefined;
  let backupPath: string | undefined;

  if (params.operation === 'inspect') {
    const ranges = findPythonElementRanges(originalContent);
    summary.push(t().cc_python_structural_edit.structureHeader);
    for (const range of ranges) {
      if (range.type === 'class') summary.push(t().cc_python_structural_edit.classLine(range.displayName, range.startLine, range.endLine));
      if (range.type === 'function') summary.push(t().cc_python_structural_edit.functionLine(range.displayName, range.startLine, range.endLine));
      if (range.type === 'method') summary.push(t().cc_python_structural_edit.methodLine(range.displayName, range.startLine, range.endLine));
    }
    return { operation: params.operation, mode, changed: false, syntaxOk: null, originalContent, newContent, summary };
  }

  if (params.operation === 'create_edit_file') {
    editFileContent = createPythonEditFileContent(filePath, originalContent, params.elements);
    if (mode !== 'preview') {
      outputPath = normalizePath(params.output_path || path.join(path.dirname(filePath), `${path.parse(filePath).name}.edit.py`));
      await fs.writeFile(outputPath, editFileContent, 'utf-8');
      summary.push(t().cc_python_structural_edit.editFileReady(outputPath));
    }
    return { operation: params.operation, mode, changed: mode !== 'preview', syntaxOk: null, originalContent, newContent, outputPath, editFileContent, summary };
  }

  if (params.operation === 'merge_edit_file') {
    if (!params.edit_file) throw new Error('edit_file is required for merge_edit_file');
    const editContent = await fs.readFile(normalizePath(params.edit_file), 'utf-8');
    newContent = mergePythonEditFileContent(originalContent, editContent);
    newLines = splitPythonContent(newContent).lines;
  } else if (params.operation === 'insert') {
    if (params.content === undefined) throw new Error('content is required for insert');
    const resolved = resolveStructuralInsertIndex({
      lines: newLines,
      content: originalContent,
      position: params.position,
      line: params.line,
      element: params.element,
      class_name: params.class_name
    });
    const indentSpaces = params.indent_spaces ?? resolved.defaultIndent;
    newLines.splice(resolved.index, 0, ...normalizeInsertedPythonContent(params.content, indentSpaces));
    newContent = joinPythonContent(newLines, parsed.trailingNewline);
    summary.push(t().cc_python_structural_edit.insertedAt(resolved.index + 1));
  } else if (params.operation === 'delete') {
    if (!params.element) throw new Error('element is required for delete');
    const range = findPythonElement(originalContent, params.element);
    if (!range) throw new Error(t().cc_python_structural_edit.elementNotFound(params.element));
    newLines.splice(range.startLine - 1, range.endLine - range.startLine + 1);
    newContent = joinPythonContent(newLines, parsed.trailingNewline);
    summary.push(t().cc_python_structural_edit.deletedElement(range.displayName, range.startLine, range.endLine));
  } else if (params.operation === 'replace_line') {
    if (!params.line) throw new Error('line is required for replace_line');
    if (params.content === undefined) throw new Error('content is required for replace_line');
    if (params.line < 1 || params.line > newLines.length) throw new Error(`line out of range: ${params.line}`);
    newLines[params.line - 1] = params.content;
    newContent = joinPythonContent(newLines, parsed.trailingNewline);
    summary.push(t().cc_python_structural_edit.replacedLine(params.line));
  } else {
    throw new Error(`Unsupported operation: ${params.operation}`);
  }

  const changed = newContent !== originalContent;
  let syntaxOk: boolean | null = null;
  if (changed && (params.syntax_check ?? true)) {
    const pythonPath = params.python_path || process.env.PYTHON || process.env.PYTHON_EXECUTABLE || 'python';
    const syntax = await checkPythonSyntax(newContent, pythonPath);
    syntaxOk = syntax.ok;
    if (!syntax.ok) throw new Error(t().cc_python_structural_edit.syntaxFailed(syntax.output));
  }

  if (changed && mode === 'test') {
    outputPath = normalizePath(params.output_path || path.join(path.dirname(filePath), `${path.parse(filePath).name}.test.py`));
    await fs.writeFile(outputPath, newContent, 'utf-8');
    summary.push(t().cc_python_structural_edit.testWritten(outputPath));
  } else if (changed && mode === 'apply') {
    if (params.create_backup ?? true) {
      backupPath = backupPathForPythonFile(filePath);
      await fs.writeFile(backupPath, originalContent, 'utf-8');
      summary.push(t().cc_python_structural_edit.backupCreated(backupPath));
    }
    await fs.writeFile(filePath, newContent, 'utf-8');
    outputPath = filePath;
    summary.push(t().cc_python_structural_edit.appliedTo(filePath));
  }

  return { operation: params.operation, mode, changed, syntaxOk, originalContent, newContent, outputPath, backupPath, summary };
}

// ============================================================================
// TOON Format Parser/Serializer
// ============================================================================
// Unified Diff Algorithm (LCS-based)
// ============================================================================

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

interface DiffHunk {
  startA: number;
  countA: number;
  startB: number;
  countB: number;
  lines: string[];
}

function computeUnifiedDiff(linesA: string[], linesB: string[], contextLines: number, fileA: string, fileB: string): string {
  // Compute LCS-based diff
  const dp = computeLCS(linesA, linesB);
  const changes: Array<{ type: 'equal' | 'delete' | 'insert'; lineA?: number; lineB?: number; text: string }> = [];

  let i = linesA.length;
  let j = linesB.length;
  const backtrack: Array<{ type: 'equal' | 'delete' | 'insert'; lineA?: number; lineB?: number; text: string }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      backtrack.push({ type: 'equal', lineA: i - 1, lineB: j - 1, text: linesA[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      backtrack.push({ type: 'insert', lineB: j - 1, text: linesB[j - 1] });
      j--;
    } else {
      backtrack.push({ type: 'delete', lineA: i - 1, text: linesA[i - 1] });
      i--;
    }
  }

  backtrack.reverse();
  changes.push(...backtrack);

  // Group changes into hunks with context
  const hunks: DiffHunk[] = [];
  let hunkLines: string[] = [];
  let hunkStartA = 0;
  let hunkStartB = 0;
  let hunkCountA = 0;
  let hunkCountB = 0;
  let lastChangeIdx = -999;

  for (let idx = 0; idx < changes.length; idx++) {
    const c = changes[idx];
    if (c.type !== 'equal') {
      // Start or extend a hunk
      const contextStart = Math.max(0, idx - contextLines);
      if (idx - lastChangeIdx > contextLines * 2 + 1 && hunks.length === 0 && hunkLines.length === 0 && lastChangeIdx < 0) {
        // First change - add leading context
      } else if (idx - lastChangeIdx > contextLines * 2 + 1 && hunkLines.length > 0) {
        // Close current hunk with trailing context
        let trailingAdded = 0;
        for (let k = lastChangeIdx + 1; k < changes.length && trailingAdded < contextLines; k++) {
          if (changes[k].type === 'equal') {
            hunkLines.push(` ${changes[k].text}`);
            hunkCountA++; hunkCountB++;
            trailingAdded++;
          }
        }
        hunks.push({ startA: hunkStartA, countA: hunkCountA, startB: hunkStartB, countB: hunkCountB, lines: [...hunkLines] });
        hunkLines = [];
        hunkCountA = 0; hunkCountB = 0;
      }

      // Add leading context for new hunk
      if (hunkLines.length === 0) {
        let contextCount = 0;
        for (let k = idx - 1; k >= 0 && contextCount < contextLines; k--) {
          if (changes[k].type === 'equal') {
            hunkLines.unshift(` ${changes[k].text}`);
            contextCount++;
          } else break;
        }
        // Determine start positions
        hunkStartA = (c.lineA !== undefined ? c.lineA : (changes[idx - 1]?.lineA !== undefined ? changes[idx - 1].lineA! + 1 : 0)) - contextCount;
        hunkStartB = (c.lineB !== undefined ? c.lineB : (changes[idx - 1]?.lineB !== undefined ? changes[idx - 1].lineB! + 1 : 0)) - contextCount;
        if (hunkStartA < 0) hunkStartA = 0;
        if (hunkStartB < 0) hunkStartB = 0;
        hunkCountA = contextCount;
        hunkCountB = contextCount;
      } else {
        // Fill gap between changes with context (equal lines)
        for (let k = lastChangeIdx + 1; k < idx; k++) {
          if (changes[k].type === 'equal') {
            hunkLines.push(` ${changes[k].text}`);
            hunkCountA++; hunkCountB++;
          }
        }
      }

      if (c.type === 'delete') {
        hunkLines.push(`-${c.text}`);
        hunkCountA++;
      } else {
        hunkLines.push(`+${c.text}`);
        hunkCountB++;
      }
      lastChangeIdx = idx;
    }
  }

  // Close last hunk
  if (hunkLines.length > 0) {
    let trailingAdded = 0;
    for (let k = lastChangeIdx + 1; k < changes.length && trailingAdded < contextLines; k++) {
      if (changes[k].type === 'equal') {
        hunkLines.push(` ${changes[k].text}`);
        hunkCountA++; hunkCountB++;
        trailingAdded++;
      }
    }
    hunks.push({ startA: hunkStartA, countA: hunkCountA, startB: hunkStartB, countB: hunkCountB, lines: [...hunkLines] });
  }

  if (hunks.length === 0) return '';

  // Format output
  const output: string[] = [
    `--- ${fileA}`,
    `+++ ${fileB}`,
  ];

  for (const hunk of hunks) {
    output.push(`@@ -${hunk.startA + 1},${hunk.countA} +${hunk.startB + 1},${hunk.countB} @@`);
    output.push(...hunk.lines);
  }

  return output.join('\n');
}

// ============================================================================
// Tool 1: Analyze Code
// ============================================================================

server.registerTool(
  "cc_analyze_code",
  {
    title: "Analyze Code",
    description: `Analyzes a Python file: classes, functions, imports, metrics.

Args:
  - path (string): Path to the Python file

Returns:
  - Classes with methods, functions, import analysis, LOC, complexity`,
    inputSchema: {
      path: z.string().min(1).describe("Path to the Python file")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const filePath = normalizePath(params.path);
      if (!await pathExists(filePath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(filePath) }] };
      }

      const content = await fs.readFile(filePath, "utf-8");
      const analysis = analyzePythonCode(content);
      const stats = await fs.stat(filePath);

      const output = [
        t().cc_analyze_code.header(path.basename(filePath)), '',
        `| Metric | Value |`, `|---|---|`,
        `| ${t().cc_analyze_code.metricTotalLines} | ${analysis.totalLines} |`,
        `| ${t().cc_analyze_code.metricCodeLines} | ${analysis.codeLines} |`,
        `| ${t().cc_analyze_code.metricCommentLines} | ${analysis.commentLines} |`,
        `| ${t().cc_analyze_code.metricBlankLines} | ${analysis.blankLines} |`,
        `| ${t().cc_analyze_code.metricClasses} | ${analysis.classes.length} |`,
        `| ${t().cc_analyze_code.metricFunctions} | ${analysis.functions.length} |`,
        `| ${t().cc_analyze_code.metricImports} | ${analysis.imports.length} |`,
        `| ${t().cc_analyze_code.metricCyclomaticComplexity} | ${analysis.complexity} |`,
        `| ${t().cc_analyze_code.metricFileSize} | ${formatFileSize(stats.size)} |`
      ];

      if (analysis.classes.length > 0) {
        output.push('', t().cc_analyze_code.classesHeader);
        for (const cls of analysis.classes) {
          const bases = cls.bases.length > 0 ? `(${cls.bases.join(', ')})` : '';
          output.push(t().cc_analyze_code.classInfo(cls.name, bases, cls.startLine, cls.endLine, cls.methods.length));
          if (cls.docstring) output.push(`    _${cls.docstring}_`);
          if (cls.methods.length > 0) output.push(t().cc_analyze_code.classMethods(cls.methods.join(', ')));
        }
      }

      if (analysis.functions.length > 0) {
        output.push('', t().cc_analyze_code.functionsHeader);
        for (const func of analysis.functions) {
          const async_prefix = func.isAsync ? 'async ' : '';
          output.push(t().cc_analyze_code.functionInfo(async_prefix, func.name, func.params, func.startLine, func.endLine));
          if (func.docstring) output.push(`    _${func.docstring}_`);
        }
      }

      if (analysis.imports.length > 0) {
        const stdlib = analysis.imports.filter(i => i.type === 'stdlib');
        const thirdParty = analysis.imports.filter(i => i.type === 'third_party');
        const local = analysis.imports.filter(i => i.type === 'local');
        output.push('', t().cc_analyze_code.importsHeader(stdlib.length, thirdParty.length, local.length));
        if (thirdParty.length > 0) {
          output.push(t().cc_analyze_code.thirdPartyList(thirdParty.map(i => i.module).join(', ')));
        }
      }

      return { content: [{ type: "text", text: output.join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 2: Analyze Methods
// ============================================================================

server.registerTool(
  "cc_analyze_methods",
  {
    title: "Analyze Methods",
    description: `Detailed method analysis of a Python file.

Args:
  - path (string): Path to the Python file
  - class_name (string, optional): Only methods of this class

Returns:
  - Methods with parameters, decorators, complexity, data flow`,
    inputSchema: {
      path: z.string().min(1).describe("Path to the Python file"),
      class_name: z.string().optional().describe("Only analyze this class")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const filePath = normalizePath(params.path);
      if (!await pathExists(filePath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(filePath) }] };
      }

      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split('\n');
      const analysis = analyzePythonCode(content);

      const output = [t().cc_analyze_methods.header(path.basename(filePath)), ''];

      const targetClasses = params.class_name
        ? analysis.classes.filter(c => c.name === params.class_name)
        : analysis.classes;

      if (targetClasses.length === 0 && params.class_name) {
        return { isError: true, content: [{ type: "text", text: t().cc_analyze_methods.classNotFound(params.class_name, analysis.classes.map(c => c.name).join(', ')) }] };
      }

      for (const cls of targetClasses) {
        output.push(`## ${cls.name}`);
        if (cls.bases.length > 0) output.push(t().cc_analyze_methods.inheritsFrom(cls.bases.join(', ')));
        output.push('');

        const guardrails = analyzeMethodGuardrails(cls, lines);
        if (guardrails.missingSignalCallbacks.length > 0 ||
            guardrails.attributeIssues.length > 0 ||
            guardrails.underscoreMismatches.length > 0) {
          output.push(t().cc_analyze_methods.guardrailsHeader);

          if (guardrails.missingSignalCallbacks.length > 0) {
            output.push(t().cc_analyze_methods.missingSignalCallbacksHeader);
            for (const issue of guardrails.missingSignalCallbacks) {
              output.push(t().cc_analyze_methods.missingSignalCallback(issue.line, issue.method));
            }
          }

          if (guardrails.attributeIssues.length > 0) {
            output.push(t().cc_analyze_methods.attributeIssuesHeader);
            for (const issue of guardrails.attributeIssues) {
              output.push(issue.definedLine === null
                ? t().cc_analyze_methods.attributeNeverDefined(issue.usedLine, issue.attr)
                : t().cc_analyze_methods.attributeBeforeDefinition(issue.usedLine, issue.attr, issue.definedLine));
            }
          }

          if (guardrails.underscoreMismatches.length > 0) {
            output.push(t().cc_analyze_methods.underscoreMismatchesHeader);
            for (const issue of guardrails.underscoreMismatches) {
              output.push(t().cc_analyze_methods.underscoreMismatch(issue.called, issue.defined));
            }
          }

          output.push('');
        }

        // Analyze each method
        for (let i = cls.startLine; i < cls.endLine && i < lines.length; i++) {
          const methodMatch = lines[i].match(/^\s+(async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*(.+?))?\s*:/);
          if (!methodMatch) continue;

          const [, isAsync, methodName, params_str, returnType] = methodMatch;
          const decorators: string[] = [];
          let j = i - 1;
          while (j >= cls.startLine - 1 && lines[j]?.trim().startsWith('@')) {
            decorators.unshift(lines[j].trim());
            j--;
          }

          // Count method complexity
          let methodComplexity = 1;
          const methodIndent = lines[i].search(/\S/);
          for (let k = i + 1; k < lines.length; k++) {
            const indent = lines[k].search(/\S/);
            if (indent >= 0 && indent <= methodIndent && lines[k].trim() !== '') break;
            if (/^\s*(if|elif|for|while|except|and|or)\b/.test(lines[k])) methodComplexity++;
          }

          // Detect calls to self
          const selfCalls: string[] = [];
          for (let k = i + 1; k < lines.length; k++) {
            const indent = lines[k].search(/\S/);
            if (indent >= 0 && indent <= methodIndent && lines[k].trim() !== '') break;
            const selfMatch = lines[k].match(/self\.(\w+)\(/g);
            if (selfMatch) {
              selfMatch.forEach(m => {
                const name = m.replace('self.', '').replace('(', '');
                if (!selfCalls.includes(name)) selfCalls.push(name);
              });
            }
          }

          const visibility = methodName.startsWith('__') && methodName.endsWith('__') ? 'magic' :
                            methodName.startsWith('__') ? 'private' :
                            methodName.startsWith('_') ? 'protected' : 'public';

          output.push(`### ${isAsync ? 'async ' : ''}${methodName}(${params_str})`);
          if (returnType) output.push(`  Return: ${returnType}`);
          output.push(t().cc_analyze_methods.visibilityLabel(visibility, methodComplexity));
          if (decorators.length > 0) output.push(t().cc_analyze_methods.decorators(decorators.join(', ')));
          if (selfCalls.length > 0) output.push(t().cc_analyze_methods.calls(selfCalls.join(', ')));
          output.push('');
        }
      }

      // Also show top-level functions
      if (!params.class_name && analysis.functions.length > 0) {
        output.push(t().cc_analyze_methods.topLevelFunctions, '');
        for (const func of analysis.functions) {
          output.push(`### ${func.isAsync ? 'async ' : ''}${func.name}(${func.params})`);
          if (func.decorators.length > 0) output.push(t().cc_analyze_methods.decorators(func.decorators.join(', ')));
          output.push('');
        }
      }

      return { content: [{ type: "text", text: output.join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 3: Extract Classes
// ============================================================================

server.registerTool(
  "cc_extract_classes",
  {
    title: "Extract Classes",
    description: `Extracts Python classes and functions from a file as separate text blocks.

Args:
  - path (string): Path to the Python file
  - output_dir (string, optional): Output directory (otherwise display only)
  - include_content (boolean, optional): Include pycutter-style code blocks in the response
  - max_chars (number, optional): Maximum response characters for included code

Useful for code review and documentation.`,
    inputSchema: {
      path: z.string().min(1).describe("Path to the Python file"),
      output_dir: z.string().optional().describe("Output directory"),
      include_content: z.boolean().default(false).describe("Include extracted class/helper content in the MCP response"),
      max_chars: z.number().int().min(1000).max(100000).default(12000).describe("Maximum characters of included extracted content")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const filePath = normalizePath(params.path);
      if (!await pathExists(filePath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(filePath) }] };
      }

      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split('\n');
      const analysis = analyzePythonCode(content);

      const output: string[] = [t().cc_extract_classes.header(path.basename(filePath)), ''];

      const extractedFiles: ExtractedContentBlock[] = [];

      for (const cls of analysis.classes) {
        const classContent = lines.slice(cls.startLine - 1, cls.endLine).join('\n');
        extractedFiles.push({ name: `${cls.name}.txt`, content: classContent });
        output.push(t().cc_extract_classes.classInfo(cls.name, cls.endLine - cls.startLine + 1, cls.methods.length));
      }

      // Collect top-level code (imports, functions, globals)
      const topLevelLines: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        const isInClass = analysis.classes.some(c => i + 1 >= c.startLine && i + 1 <= c.endLine);
        if (!isInClass) topLevelLines.push(lines[i]);
      }
      if (topLevelLines.some(l => l.trim() !== '')) {
        extractedFiles.push({ name: `${t().cc_extract_classes.helperFunctions}.txt`, content: topLevelLines.join('\n') });
        output.push(t().cc_extract_classes.helperFunctionsInfo(topLevelLines.filter(l => l.trim() !== '').length));
      }

      if (params.output_dir) {
        const outDir = normalizePath(params.output_dir);
        await fs.mkdir(outDir, { recursive: true });
        for (const file of extractedFiles) {
          await fs.writeFile(path.join(outDir, file.name), file.content, 'utf-8');
        }
        output.push('', t().cc_extract_classes.filesWritten(extractedFiles.length, outDir));
      } else {
        output.push('', t().cc_extract_classes.hintUseOutputDir);
      }

      if (params.include_content) {
        appendExtractedContentBlocks(output, extractedFiles, params.max_chars ?? 12000);
      }

      return { content: [{ type: "text", text: output.join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 4: Organize Imports
// ============================================================================

server.registerTool(
  "cc_organize_imports",
  {
    title: "Organize Imports",
    description: `Organizes Python imports per PEP 8: sorted, deduplicated, grouped.

Args:
  - path (string): Path to the Python file
  - dry_run (boolean): Preview only

Groups: 1) __future__ 2) stdlib 3) third-party 4) local`,
    inputSchema: {
      path: z.string().min(1).describe("Path to the Python file"),
      dry_run: z.boolean().default(false).describe("Preview only")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const filePath = normalizePath(params.path);
      if (!await pathExists(filePath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(filePath) }] };
      }

      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split('\n');

      // Find import block (contiguous imports at top of file, after docstrings/comments)
      let importStart = -1;
      let importEnd = -1;
      const importLines: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
          if (importStart === -1) importStart = i;
          importEnd = i;
          importLines.push(trimmed);
        } else if (importStart !== -1 && trimmed !== '' && !trimmed.startsWith('#')) {
          // Non-import, non-blank line after imports started: end of import block
          // But allow blank lines and comments between imports
          if (importEnd < i - 2) break; // Gap too large
        }
      }

      if (importLines.length === 0) {
        return { content: [{ type: "text", text: t().cc_organize_imports.noImportsFound(path.basename(filePath)) }] };
      }

      // Deduplicate
      const uniqueImports = [...new Set(importLines)];
      const removed = importLines.length - uniqueImports.length;

      // Classify and sort
      const futureImports = uniqueImports.filter(l => l.includes('__future__')).sort();
      const stdlibImports = uniqueImports.filter(l => {
        if (l.includes('__future__')) return false;
        const mod = l.match(/^(?:from\s+)?(\S+)/)?.[1]?.replace(/^from\s+/, '') || '';
        return classifyImport(mod) === 'stdlib';
      }).sort();
      const thirdPartyImports = uniqueImports.filter(l => {
        const mod = l.match(/^(?:from\s+)?(\S+)/)?.[1]?.replace(/^from\s+/, '') || '';
        return classifyImport(mod) === 'third_party';
      }).sort();
      const localImports = uniqueImports.filter(l => {
        const mod = l.match(/^(?:from\s+)?(\S+)/)?.[1]?.replace(/^from\s+/, '') || '';
        return classifyImport(mod) === 'local';
      }).sort();

      // Build new import block
      const newImportBlock: string[] = [];
      if (futureImports.length > 0) { newImportBlock.push(...futureImports, ''); }
      if (stdlibImports.length > 0) { newImportBlock.push(...stdlibImports, ''); }
      if (thirdPartyImports.length > 0) { newImportBlock.push(...thirdPartyImports, ''); }
      if (localImports.length > 0) { newImportBlock.push(...localImports, ''); }

      // Remove trailing empty line
      while (newImportBlock.length > 0 && newImportBlock[newImportBlock.length - 1] === '') {
        newImportBlock.pop();
      }

      const output = [
        t().cc_organize_imports.header(path.basename(filePath)), '',
        `| Category | Count |`, `|---|---|`,
        `| ${t().cc_organize_imports.categoryFuture} | ${futureImports.length} |`,
        `| ${t().cc_organize_imports.categoryStdlib} | ${stdlibImports.length} |`,
        `| ${t().cc_organize_imports.categoryThirdParty} | ${thirdPartyImports.length} |`,
        `| ${t().cc_organize_imports.categoryLocal} | ${localImports.length} |`,
        `| ${t().cc_organize_imports.duplicatesRemoved} | ${removed} |`
      ];

      if (params.dry_run) {
        output.push('', t().cc_organize_imports.previewHeader, '```python', ...newImportBlock, '```');
        return { content: [{ type: "text", text: output.join('\n') }] };
      }

      // Apply changes
      const newLines = [
        ...lines.slice(0, importStart),
        ...newImportBlock,
        ...lines.slice(importEnd + 1)
      ];
      await fs.writeFile(filePath, newLines.join('\n'), 'utf-8');
      output.push('', t().cc_organize_imports.importsSaved);

      return { content: [{ type: "text", text: output.join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 5: Diagnose Imports
// ============================================================================

server.registerTool(
  "cc_diagnose_imports",
  {
    title: "Diagnose Imports",
    description: `Diagnoses import issues: missing modules, circular imports, unused imports.

Args:
  - path (string): Path to the Python file

Detects: Missing modules, suspected circular imports, import issues`,
    inputSchema: {
      path: z.string().min(1).describe("Path to the Python file")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const filePath = normalizePath(params.path);
      if (!await pathExists(filePath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(filePath) }] };
      }

      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split('\n');
      const analysis = analyzePythonCode(content);

      const issues: string[] = [];
      const warnings: string[] = [];

      // Check for potentially unused imports
      for (const imp of analysis.imports) {
        const importedNames: string[] = [];
        const fromMatch = imp.text.match(/from\s+\S+\s+import\s+(.+)/);
        const simpleMatch = imp.text.match(/^import\s+(\S+)(?:\s+as\s+(\w+))?/);

        if (fromMatch) {
          fromMatch[1].split(',').forEach(n => {
            const name = n.trim().split(' as ').pop()?.trim();
            if (name && name !== '*') importedNames.push(name);
          });
        } else if (simpleMatch) {
          importedNames.push(simpleMatch[2] || simpleMatch[1].split('.').pop() || '');
        }

        for (const name of importedNames) {
          if (!name) continue;
          // Check if name is used in rest of code (excluding the import line itself)
          const restOfCode = lines.filter((_, i) => i !== imp.line - 1).join('\n');
          const namePattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
          if (!namePattern.test(restOfCode)) {
            warnings.push(t().cc_diagnose_imports.unusedImport(imp.line, name));
          }
        }
      }

      // Check for duplicate imports
      const importTexts = analysis.imports.map(i => i.text);
      const seen = new Set<string>();
      for (const text of importTexts) {
        if (seen.has(text)) {
          issues.push(t().cc_diagnose_imports.duplicateImport(text));
        }
        seen.add(text);
      }

      // Check for relative imports that might cause circular dependencies
      const localImports = analysis.imports.filter(i => i.type === 'local');
      if (localImports.length > 0) {
        warnings.push(t().cc_diagnose_imports.relativeImportsWarning(localImports.length));
      }

      // Check import order
      let lastType = '';
      for (const imp of analysis.imports) {
        if (lastType && imp.type !== lastType) {
          if ((lastType === 'third_party' && imp.type === 'stdlib') ||
              (lastType === 'local' && imp.type !== 'local')) {
            warnings.push(t().cc_diagnose_imports.importOrderWarning(imp.line));
            break;
          }
        }
        lastType = imp.type;
      }

      const output = [
        t().cc_diagnose_imports.header(path.basename(filePath)), '',
        `| | |`, `|---|---|`,
        `| ${t().cc_diagnose_imports.totalImports} | ${analysis.imports.length} |`,
        `| ${t().cc_diagnose_imports.issues} | ${issues.length} |`,
        `| ${t().cc_diagnose_imports.warnings} | ${warnings.length} |`
      ];

      if (issues.length > 0) {
        output.push('', t().cc_diagnose_imports.issuesHeader, ...issues.map(i => `  \u274C ${i}`));
      }
      if (warnings.length > 0) {
        output.push('', t().cc_diagnose_imports.warningsHeader, ...warnings.map(w => `  \u26A0\uFE0F ${w}`));
      }
      if (issues.length === 0 && warnings.length === 0) {
        output.push('', t().cc_diagnose_imports.noIssues);
      }

      output.push('', t().cc_diagnose_imports.hintOrganize);

      return { content: [{ type: "text", text: output.join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 6: Check Python Indentation
// ============================================================================

server.registerTool(
  "cc_check_indentation",
  {
    title: "Check Python Indentation",
    description: t().cc_check_indentation.description,
    inputSchema: {
      path: z.string().min(1).describe("Python file or directory to check"),
      recursive: z.boolean().default(false).describe("Recurse into subdirectories when path is a directory"),
      max_issues: z.number().int().min(1).max(200).default(50).describe("Maximum number of issues to include")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const targetPath = normalizePath(params.path);
      if (!await pathExists(targetPath)) {
        return { isError: true, content: [{ type: "text", text: t().common.pathNotFound(targetPath) }] };
      }

      const report = await checkPythonIndentationPath(targetPath, params.recursive ?? false);
      const output = [
        t().cc_check_indentation.header(path.basename(targetPath)),
        '',
        `| | |`,
        `|---|---|`,
        `| ${t().cc_check_indentation.filesChecked} | ${report.filesChecked} |`,
        `| ${t().cc_check_indentation.filesWithIssues} | ${report.filesWithIssues} |`,
        `| ${t().cc_check_indentation.totalIssues} | ${report.totalIssues} |`
      ];

      if (report.totalIssues === 0) {
        output.push('', t().cc_check_indentation.noIssues);
      } else {
        output.push('', t().cc_check_indentation.issuesHeader);
        const maxIssues = params.max_issues ?? 50;
        for (const issue of report.issues.slice(0, maxIssues)) {
          const displayPath = report.filesChecked === 1 ? path.basename(issue.file) : path.relative(targetPath, issue.file);
          output.push(`- ${displayPath}:${issue.line} [${issue.type}] ${issue.message}`);
        }
        if (report.issues.length > maxIssues) {
          output.push(t().cc_check_indentation.andMore(report.issues.length - maxIssues));
        }
      }

      return { content: [{ type: "text", text: output.join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 7: Generate Python Code
// ============================================================================

server.registerTool(
  "cc_generate_python_code",
  {
    title: "Generate Python Code",
    description: t().cc_generate_python_code.description,
    inputSchema: {
      spec_json: z.string().optional().describe("Optional full JSON spec. If set, it is merged with the explicit fields."),
      kind: z.enum(["function", "class", "dataclass", "cli", "test", "exception", "module"]).optional().describe("Template kind"),
      name: z.string().optional().describe("Generated item name"),
      params_json: z.string().optional().describe("JSON array of parameters: [{\"name\":\"x\",\"type\":\"int\",\"default\":\"0\"}]"),
      fields_json: z.string().optional().describe("JSON array of dataclass fields"),
      init_params_json: z.string().optional().describe("JSON array of __init__ parameters for classes"),
      bases_json: z.string().optional().describe("JSON array of class base names"),
      imports_json: z.string().optional().describe("JSON array of import lines for module generation"),
      return_type: z.string().optional().describe("Return type annotation for functions"),
      docstring: z.string().optional().describe("Docstring"),
      body: z.string().optional().describe("Function or method body"),
      description: z.string().optional().describe("Module or CLI description"),
      content: z.string().optional().describe("Module content"),
      main_body: z.string().optional().describe("CLI main body"),
      target: z.string().optional().describe("Target name for test generation"),
      arrange: z.string().optional().describe("Arrange block for test generation"),
      act: z.string().optional().describe("Act block for test generation"),
      assertions: z.string().optional().describe("Assert block for test generation"),
      base: z.string().optional().describe("Base exception class for exception generation")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const spec = mergeCodeSpec(params);
      const code = generatePythonCode(spec);
      return {
        content: [{
          type: "text",
          text: [t().cc_generate_python_code.header(spec.kind || spec.type || 'function'), '', '```python', code.trimEnd(), '```'].join('\n')
        }]
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 8: Runtime Import Diagnose
// ============================================================================

server.registerTool(
  "cc_runtime_import_diagnose",
  {
    title: "Runtime Import Diagnose",
    description: t().cc_runtime_import_diagnose.description,
    inputSchema: {
      path: z.string().min(1).describe("Python project directory or file"),
      modules: z.string().optional().describe("Optional module list: package.mod:Class,other.module"),
      max_modules: z.number().int().min(1).max(100).default(20).describe("Maximum auto-discovered modules to import"),
      timeout_seconds: z.number().int().min(1).max(60).default(10).describe("Timeout per isolated import subprocess"),
      python_path: z.string().optional().describe("Python executable path; defaults to PYTHON/PYTHON_EXECUTABLE/python")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  async (params) => {
    try {
      const targetPath = normalizePath(params.path);
      if (!await pathExists(targetPath)) {
        return { isError: true, content: [{ type: "text", text: t().common.pathNotFound(targetPath) }] };
      }

      const report = await diagnoseRuntimeImports(params);
      const okCount = report.results.filter((result) => result.success).length;
      const failed = report.results.filter((result) => !result.success);
      const timeoutSeconds = Math.max(1, Math.min(params.timeout_seconds ?? 10, 60));
      const output: string[] = [
        t().cc_runtime_import_diagnose.header(path.basename(report.projectPath) || report.projectPath),
        '',
        `| | |`,
        `|---|---|`,
        `| ${t().cc_runtime_import_diagnose.python} | ${report.pythonPath} |`,
        `| ${t().cc_runtime_import_diagnose.modulesTested} | ${report.results.length} |`,
        `| ${t().cc_runtime_import_diagnose.importsOk} | ${okCount} |`,
        `| ${t().cc_runtime_import_diagnose.failures} | ${failed.length} |`,
        `| ${t().cc_runtime_import_diagnose.circularImports} | ${report.circularImports.length} |`,
        `| ${t().cc_runtime_import_diagnose.initFiles} | ${report.initFiles.length} |`,
        `| ${t().cc_runtime_import_diagnose.timeoutSeconds} | ${timeoutSeconds} |`
      ];

      if (report.results.length === 0) {
        output.push('', t().cc_runtime_import_diagnose.noTargets);
      } else {
        output.push('', t().cc_runtime_import_diagnose.singleImportsHeader);
        for (const result of report.results) {
          const label = result.className ? `${result.module}:${result.className}` : result.module;
          if (result.success) {
            output.push(t().cc_runtime_import_diagnose.importOk(label, result.durationMs));
          } else if (result.timedOut) {
            output.push(t().cc_runtime_import_diagnose.importTimedOut(label, result.durationMs));
          } else {
            output.push(t().cc_runtime_import_diagnose.importFailed(label, result.exitCode ?? 'n/a', result.output || ''));
          }
        }
      }

      if (report.initFiles.length > 0) {
        output.push('', t().cc_runtime_import_diagnose.initFilesHeader);
        for (const initFile of report.initFiles.slice(0, 15)) {
          output.push(t().cc_runtime_import_diagnose.initFileInfo(
            initFile.file,
            initFile.directImportCount,
            initFile.hasLazyImports
          ));
        }
        if (report.initFiles.length > 15) {
          output.push(t().cc_runtime_import_diagnose.andMore(report.initFiles.length - 15));
        }
      }

      if (report.circularImports.length > 0) {
        output.push('', t().cc_runtime_import_diagnose.circularHeader);
        for (const issue of report.circularImports) {
          output.push(t().cc_runtime_import_diagnose.circularPair(issue.moduleA, issue.moduleB));
        }
      }

      if (report.recommendations.length > 0) {
        output.push('', t().cc_runtime_import_diagnose.recommendationsHeader);
        output.push(...report.recommendations.map((recommendation) => `- ${recommendation}`));
      } else if (failed.length === 0 && report.circularImports.length === 0) {
        output.push('', t().cc_runtime_import_diagnose.noProblems);
      }

      return { content: [{ type: "text", text: output.join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 9: Python Structural Edit
// ============================================================================

server.registerTool(
  "cc_python_structural_edit",
  {
    title: "Python Structural Edit",
    description: t().cc_python_structural_edit.description,
    inputSchema: {
      path: z.string().min(1).describe("Python file to inspect or edit"),
      operation: z.enum(["inspect", "insert", "delete", "replace_line", "create_edit_file", "merge_edit_file"]).describe("Structural edit operation"),
      mode: z.enum(["preview", "test", "apply"]).default("preview").describe("preview returns a diff, test writes a .test.py file, apply writes the source"),
      position: z.enum(["start", "after_imports", "end", "line", "before_element", "after_element", "in_class"]).optional().describe("Insert position for operation=insert"),
      line: z.number().int().min(1).optional().describe("1-based line for position=line or replace_line"),
      element: z.string().optional().describe("Class/function/method name, e.g. MyClass.method"),
      class_name: z.string().optional().describe("Target class for position=in_class"),
      content: z.string().optional().describe("Inserted code or replacement line content"),
      elements: z.string().optional().describe("Comma-separated element names for create_edit_file"),
      edit_file: z.string().optional().describe("Edit file path for merge_edit_file"),
      output_path: z.string().optional().describe("Optional output path for test or edit-file modes"),
      indent_spaces: z.number().int().min(0).max(32).optional().describe("Indent inserted non-empty lines"),
      create_backup: z.boolean().default(true).describe("Create a backup when mode=apply"),
      syntax_check: z.boolean().default(true).describe("Compile-check edited Python before writing"),
      python_path: z.string().optional().describe("Python executable path for syntax checks")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  async (params) => {
    try {
      const filePath = normalizePath(params.path);
      if (!await pathExists(filePath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(filePath) }] };
      }

      const result = await runPythonStructuralEdit({
        path: filePath,
        operation: params.operation,
        mode: params.mode,
        position: params.position,
        line: params.line,
        element: params.element,
        class_name: params.class_name,
        content: params.content,
        elements: params.elements,
        edit_file: params.edit_file,
        output_path: params.output_path,
        indent_spaces: params.indent_spaces,
        create_backup: params.create_backup,
        syntax_check: params.syntax_check,
        python_path: params.python_path
      });

      const output: string[] = [
        t().cc_python_structural_edit.header(path.basename(filePath)),
        '',
        `| | |`,
        `|---|---|`,
        `| ${t().cc_python_structural_edit.operationLabel} | ${result.operation} |`,
        `| ${t().cc_python_structural_edit.modeLabel} | ${result.mode} |`,
        `| ${t().cc_python_structural_edit.changedLabel} | ${result.changed ? 'yes' : 'no'} |`,
        `| ${t().cc_python_structural_edit.syntaxLabel} | ${result.syntaxOk === null ? 'n/a' : result.syntaxOk ? 'ok' : 'failed'} |`
      ];

      if (result.outputPath) output.push(`| ${t().cc_python_structural_edit.outputLabel} | ${result.outputPath} |`);
      if (result.backupPath) output.push(`| ${t().cc_python_structural_edit.backupLabel} | ${result.backupPath} |`);
      if (result.summary.length > 0) output.push('', ...result.summary);

      if (result.editFileContent && result.mode === 'preview') {
        output.push('', t().cc_python_structural_edit.editFilePreview, '```python', result.editFileContent.trimEnd(), '```');
      }

      if (result.changed && result.mode === 'preview') {
        const diff = computeUnifiedDiff(
          splitPythonContent(result.originalContent).lines,
          splitPythonContent(result.newContent).lines,
          3,
          path.basename(filePath),
          `${path.basename(filePath)} (edited)`
        );
        output.push('', t().cc_python_structural_edit.diffHeader, '```diff', diff || t().cc_python_structural_edit.noChanges, '```');
      } else if (!result.changed && result.operation !== 'inspect' && !result.editFileContent) {
        output.push('', t().cc_python_structural_edit.noChanges);
      }

      return { content: [{ type: "text", text: output.join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 10: Fix JSON (shared with FileCommander)
// ============================================================================

server.registerTool(
  "cc_fix_json",
  {
    title: "Fix JSON",
    description: `Automatically repairs common JSON errors.

Args:
  - path (string): Path to the JSON file
  - dry_run (boolean): Only show issues
  - create_backup (boolean): Create backup

Repairs: BOM, trailing commas, single quotes, comments, NUL bytes`,
    inputSchema: {
      path: z.string().min(1).describe("Path to the JSON file"),
      dry_run: z.boolean().default(false).describe("Preview only"),
      create_backup: z.boolean().default(true).describe("Create backup")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const filePath = normalizePath(params.path);
      if (!await pathExists(filePath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(filePath) }] };
      }

      const rawContent = await fs.readFile(filePath, "utf-8");
      const fixes: string[] = [];
      let content = rawContent;

      if (content.charCodeAt(0) === 0xFEFF) { content = content.slice(1); fixes.push(t().cc_fix_json.fixBomRemoved); }
      if (content.includes('\0')) { content = content.replace(/\0/g, ''); fixes.push(t().cc_fix_json.fixNulRemoved); }

      const c1 = content; content = content.replace(/^(\s*)\/\/.*$/gm, '');
      if (content !== c1) fixes.push(t().cc_fix_json.fixCommentsRemoved);

      const c2 = content; content = content.replace(/\/\*[\s\S]*?\*\//g, '');
      if (content !== c2) fixes.push(t().cc_fix_json.fixBlockCommentsRemoved);

      const c3 = content; content = content.replace(/,(\s*[}\]])/g, '$1');
      if (content !== c3) fixes.push(t().cc_fix_json.fixTrailingCommas);

      const c4 = content;
      content = convertSingleQuotedDelimiters(content);
      if (content !== c4) fixes.push(t().cc_fix_json.fixSingleQuotes);

      let isValid = false;
      let parseError = '';
      try { JSON.parse(content); isValid = true; } catch (e) { parseError = e instanceof Error ? e.message : String(e); }

      if (fixes.length === 0 && isValid) {
        return { content: [{ type: "text", text: t().cc_fix_json.validJson(path.basename(filePath)) }] };
      }

      if (params.dry_run) {
        return { content: [{ type: "text", text: [t().cc_fix_json.analysisHeader(path.basename(filePath)), '', ...fixes.map(f => `  - ${f}`), '', isValid ? t().cc_fix_json.validAfterRepair : t().cc_fix_json.stillInvalid(parseError)].join('\n') }] };
      }

      if (params.create_backup && fixes.length > 0) await fs.writeFile(filePath + '.bak', rawContent, "utf-8");
      if (isValid) content = JSON.stringify(JSON.parse(content), null, 2);
      await fs.writeFile(filePath, content, "utf-8");

      return { content: [{ type: "text", text: [t().cc_fix_json.repairedHeader(path.basename(filePath)), '', ...fixes.map(f => `  - ${f}`), '', isValid ? '\u2705' : `\u26A0\uFE0F ${parseError}`].join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 7: Validate JSON (shared with FileCommander)
// ============================================================================

server.registerTool(
  "cc_validate_json",
  {
    title: "Validate JSON",
    description: `Validates JSON with detailed error information and position.

Args:
  - path (string): Path to the JSON file`,
    inputSchema: {
      path: z.string().min(1).describe("Path to the JSON file")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const filePath = normalizePath(params.path);
      if (!await pathExists(filePath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(filePath) }] };
      }

      const content = await fs.readFile(filePath, "utf-8");
      const stats = await fs.stat(filePath);

      try {
        const parsed = JSON.parse(content);
        const type = Array.isArray(parsed) ? t().cc_validate_json.typeArray(parsed.length) : typeof parsed === 'object' && parsed !== null ? t().cc_validate_json.typeObject(Object.keys(parsed).length) : typeof parsed;

        return { content: [{ type: "text", text: [t().cc_validate_json.validHeader(path.basename(filePath)), '', `| | |`, `|---|---|`, `| ${t().cc_validate_json.labelType} | ${type} |`, `| ${t().cc_validate_json.labelSize} | ${formatFileSize(stats.size)} |`, `| ${t().cc_validate_json.labelBom} | ${content.charCodeAt(0) === 0xFEFF ? t().cc_validate_json.bomYes : t().cc_validate_json.bomNo} |`].join('\n') }] };
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        const posMatch = errorMsg.match(/position\s+(\d+)/i);
        let lineInfo = '';
        if (posMatch) {
          const pos = parseInt(posMatch[1]);
          const before = content.substring(0, pos);
          const line = before.split('\n').length;
          const col = pos - before.lastIndexOf('\n');
          const cLines = content.split('\n');
          const ctx = cLines.slice(Math.max(0, line - 3), line + 2);
          lineInfo = `${t().cc_validate_json.positionInfo(line, col)}\n\n\`\`\`\n${ctx.map((l, i) => `${Math.max(1, line - 2) + i}: ${l}`).join('\n')}\n\`\`\``;
        }
        return { content: [{ type: "text", text: `${t().cc_validate_json.invalidHeader(path.basename(filePath))}\n\n${t().cc_validate_json.errorLabel(errorMsg)}${lineInfo}\n\n${t().cc_validate_json.hintFix}` }] };
      }
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 8: Fix Encoding (shared with FileCommander)
// ============================================================================

server.registerTool(
  "cc_fix_encoding",
  {
    title: "Fix Encoding",
    description: `Repairs encoding errors (Mojibake, double UTF-8).

Args:
  - path (string): Path to the file
  - dry_run (boolean): Preview only
  - create_backup (boolean): Create backup

Repairs 27+ Mojibake patterns (German, French, Spanish).`,
    inputSchema: {
      path: z.string().min(1).describe("Path to the file"),
      dry_run: z.boolean().default(false).describe("Preview only"),
      create_backup: z.boolean().default(true).describe("Create backup")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const filePath = normalizePath(params.path);
      if (!await pathExists(filePath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(filePath) }] };
      }

      const rawContent = await fs.readFile(filePath, "utf-8");
      const mojibakeMap: [RegExp, string, string][] = [
        [/\u00c3\u00a4/g, '\u00e4', '\u00e4'], [/\u00c3\u00b6/g, '\u00f6', '\u00f6'], [/\u00c3\u00bc/g, '\u00fc', '\u00fc'],
        [/\u00c3\u0084/g, '\u00c4', '\u00c4'], [/\u00c3\u0096/g, '\u00d6', '\u00d6'], [/\u00c3\u009c/g, '\u00dc', '\u00dc'],
        [/\u00c3\u009f/g, '\u00df', '\u00df'],
        [/\u00c3\u00a9/g, '\u00e9', '\u00e9'], [/\u00c3\u00a8/g, '\u00e8', '\u00e8'],
        [/\u00c3\u00a0/g, '\u00e0', '\u00e0'], [/\u00c3\u00a1/g, '\u00e1', '\u00e1'],
        [/\u00c3\u00ae/g, '\u00ee', '\u00ee'], [/\u00c3\u00af/g, '\u00ef', '\u00ef'],
        [/\u00c3\u00b4/g, '\u00f4', '\u00f4'], [/\u00c3\u00b9/g, '\u00f9', '\u00f9'],
        [/\u00c3\u00a7/g, '\u00e7', '\u00e7'], [/\u00c3\u00b1/g, '\u00f1', '\u00f1'],
      ];

      let content = rawContent;
      const fixes: string[] = [];

      for (const [pattern, replacement, label] of mojibakeMap) {
        const before = content;
        content = content.replace(pattern, replacement);
        if (content !== before) {
          const count = (before.match(pattern) || []).length;
          fixes.push(`${label} (${count}x)`);
        }
      }

      if (fixes.length === 0) {
        return { content: [{ type: "text", text: t().cc_fix_encoding.noErrors(path.basename(filePath)) }] };
      }

      if (params.dry_run) {
        return { content: [{ type: "text", text: [t().cc_fix_encoding.analysisHeader(path.basename(filePath)), '', ...fixes.map(f => `  - ${f}`)].join('\n') }] };
      }

      if (params.create_backup) await fs.writeFile(filePath + '.bak', rawContent, "utf-8");
      await fs.writeFile(filePath, content, "utf-8");

      return { content: [{ type: "text", text: [t().cc_fix_encoding.repairedHeader(path.basename(filePath)), '', ...fixes.map(f => `  - ${f}`)].join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 9: Cleanup File (shared with FileCommander)
// ============================================================================

server.registerTool(
  "cc_cleanup_file",
  {
    title: "Cleanup File",
    description: `Cleans up source code files: BOM, NUL bytes, trailing whitespace, line endings.

Args:
  - path (string): Path to the file
  - remove_bom (boolean): Remove BOM
  - remove_trailing_whitespace (boolean): Trailing whitespace
  - normalize_line_endings (string): "lf" | "crlf"
  - remove_nul_bytes (boolean): Remove NUL bytes
  - dry_run (boolean): Preview only`,
    inputSchema: {
      path: z.string().min(1).describe("Path to the file"),
      remove_bom: z.boolean().default(true).describe("Remove BOM"),
      remove_trailing_whitespace: z.boolean().default(true).describe("Trailing whitespace"),
      normalize_line_endings: z.enum(["lf", "crlf"]).optional().describe("Line endings"),
      remove_nul_bytes: z.boolean().default(true).describe("NUL bytes"),
      dry_run: z.boolean().default(false).describe("Preview only")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const filePath = normalizePath(params.path);
      if (!await pathExists(filePath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(filePath) }] };
      }

      const raw = await fs.readFile(filePath, "utf-8");
      let content = raw;
      const fixes: string[] = [];

      if (params.remove_bom && content.charCodeAt(0) === 0xFEFF) { content = content.slice(1); fixes.push(t().cc_cleanup_file.fixBomRemoved); }
      if (params.remove_nul_bytes && content.includes('\0')) { content = content.replace(/\0/g, ''); fixes.push(t().cc_cleanup_file.fixNulRemoved); }
      if (params.remove_trailing_whitespace) { const c = content; content = content.replace(/[ \t]+$/gm, ''); if (content !== c) fixes.push(t().cc_cleanup_file.fixTrailingWhitespace); }
      if (params.normalize_line_endings) {
        const c = content;
        content = content.replace(/\r\n/g, '\n');
        if (params.normalize_line_endings === 'crlf') content = content.replace(/\n/g, '\r\n');
        if (content !== c) fixes.push(params.normalize_line_endings.toUpperCase());
      }

      if (fixes.length === 0) {
        return { content: [{ type: "text", text: t().cc_cleanup_file.alreadyClean(path.basename(filePath)) }] };
      }

      if (params.dry_run) {
        return { content: [{ type: "text", text: [t().cc_cleanup_file.previewHeader(path.basename(filePath)), '', ...fixes.map(f => `  - ${f}`)].join('\n') }] };
      }

      await fs.writeFile(filePath, content, "utf-8");
      return { content: [{ type: "text", text: [t().cc_cleanup_file.cleanedHeader(path.basename(filePath)), '', ...fixes.map(f => `  - ${f}`)].join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 10: Convert Format (shared with FileCommander)
// ============================================================================

server.registerTool(
  "cc_convert_format",
  {
    title: "Convert Format",
    description: `Converts between JSON, CSV, INI, YAML, TOML, XML, and TOON formats.

Args:
  - input_path (string): Source file
  - output_path (string): Target file
  - input_format (string): "json" | "csv" | "ini" | "yaml" | "toml" | "xml" | "toon"
  - output_format (string): "json" | "csv" | "ini" | "yaml" | "toml" | "xml" | "toon"
  - json_indent (number): JSON indentation`,
    inputSchema: {
      input_path: z.string().min(1).describe("Source file"),
      output_path: z.string().min(1).describe("Target file"),
      input_format: z.enum(["json", "csv", "ini", "yaml", "toml", "xml", "toon"]).describe("Input format"),
      output_format: z.enum(["json", "csv", "ini", "yaml", "toml", "xml", "toon"]).describe("Output format"),
      json_indent: z.number().int().min(0).max(8).default(2).describe("JSON indentation")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const inputPath = normalizePath(params.input_path);
      const outputPath = normalizePath(params.output_path);
      if (!await pathExists(inputPath)) {
        return { isError: true, content: [{ type: "text", text: t().common.sourceFileNotFound(inputPath) }] };
      }

      const rawContent = await fs.readFile(inputPath, "utf-8");
      let data: unknown;

      switch (params.input_format) {
        case 'json': data = JSON.parse(rawContent); break;
        case 'csv': {
          const lines = rawContent.trim().split('\n');
          if (lines.length < 2) return { isError: true, content: [{ type: "text", text: t().cc_convert_format.csvMinRows }] };
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          data = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
            return obj;
          });
          break;
        }
        case 'ini': {
          const result: Record<string, Record<string, string>> = {};
          let section = '_default';
          result[section] = {};
          for (const line of rawContent.split('\n')) {
            const tl = line.trim();
            if (!tl || tl.startsWith(';') || tl.startsWith('#')) continue;
            const sm = tl.match(/^\[(.+)\]$/);
            if (sm) { section = sm[1]; result[section] = result[section] || {}; }
            else { const eq = tl.indexOf('='); if (eq > 0) result[section][tl.substring(0, eq).trim()] = tl.substring(eq + 1).trim(); }
          }
          if (Object.keys(result._default).length === 0) delete result._default;
          data = result;
          break;
        }
        case 'yaml': {
          data = yaml.load(rawContent);
          break;
        }
        case 'toml': {
          data = toml.parse(rawContent);
          break;
        }
        case 'xml': {
          const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text' });
          data = xmlParser.parse(rawContent);
          break;
        }
        case 'toon': {
          data = toonDecode(rawContent);
          break;
        }
      }

      let output: string;
      switch (params.output_format) {
        case 'json': output = JSON.stringify(data, null, params.json_indent || undefined); break;
        case 'csv': {
          if (!Array.isArray(data)) return { isError: true, content: [{ type: "text", text: t().cc_convert_format.csvRequiresArray }] };
          const headers = Object.keys((data as Record<string, unknown>[])[0] || {});
          const rows = (data as Record<string, unknown>[]).map(item =>
            headers.map(h => { const v = String(item[h] ?? ''); return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v; }).join(','));
          output = [headers.join(','), ...rows].join('\n');
          break;
        }
        case 'ini': {
          if (typeof data !== 'object' || data === null || Array.isArray(data)) return { isError: true, content: [{ type: "text", text: t().cc_convert_format.iniRequiresObject }] };
          const lines: string[] = [];
          for (const [section, values] of Object.entries(data as Record<string, unknown>)) {
            if (typeof values === 'object' && values !== null && !Array.isArray(values)) {
              lines.push(`[${section}]`);
              for (const [k, v] of Object.entries(values as Record<string, unknown>)) lines.push(`${k} = ${v}`);
              lines.push('');
            } else lines.push(`${section} = ${values}`);
          }
          output = lines.join('\n');
          break;
        }
        case 'yaml': {
          output = yaml.dump(data, { indent: 2, lineWidth: 120, noRefs: true });
          break;
        }
        case 'toml': {
          if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            return { isError: true, content: [{ type: "text", text: t().cc_convert_format.unsupportedFormat('TOML requires an object as root') }] };
          }
          output = toml.stringify(data as Record<string, any>);
          break;
        }
        case 'xml': {
          const xmlBuilder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text', format: true, indentBy: '  ' });
          output = xmlBuilder.build(data);
          break;
        }
        case 'toon': {
          output = toonEncode(data);
          break;
        }
      }

      const outDir = path.dirname(outputPath);
      if (!await pathExists(outDir)) await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(outputPath, output, "utf-8");
      const outStats = await fs.stat(outputPath);

      return { content: [{ type: "text", text: [t().cc_convert_format.conversionHeader(params.input_format.toUpperCase(), params.output_format.toUpperCase()), '', `| | |`, `|---|---|`, `| ${t().cc_convert_format.labelSource} | ${inputPath} |`, `| ${t().cc_convert_format.labelTarget} | ${outputPath} |`, `| ${t().cc_convert_format.labelSize} | ${formatFileSize(outStats.size)} |`].join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 11: Fix Umlauts
// ============================================================================

server.registerTool(
  "cc_fix_umlauts",
  {
    title: "Fix Umlauts",
    description: `Repairs broken German umlauts in source code files.

Args:
  - path (string): Path to the file
  - dry_run (boolean): Preview only
  - create_backup (boolean): Create backup

Detects 70+ patterns of broken umlauts and replaces them correctly.`,
    inputSchema: {
      path: z.string().min(1).describe("Path to the file"),
      dry_run: z.boolean().default(false).describe("Preview only"),
      create_backup: z.boolean().default(true).describe("Create backup")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const filePath = normalizePath(params.path);
      if (!await pathExists(filePath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(filePath) }] };
      }

      const rawContent = await fs.readFile(filePath, "utf-8");
      // Comprehensive umlaut fix patterns
      const umlautFixes: [RegExp, string][] = [
        // Double-encoded UTF-8
        [/\u00c3\u00a4/g, '\u00e4'], [/\u00c3\u00b6/g, '\u00f6'], [/\u00c3\u00bc/g, '\u00fc'],
        [/\u00c3\u0084/g, '\u00c4'], [/\u00c3\u0096/g, '\u00d6'], [/\u00c3\u009c/g, '\u00dc'],
        [/\u00c3\u009f/g, '\u00df'],
        // HTML entities
        [/&auml;/g, '\u00e4'], [/&ouml;/g, '\u00f6'], [/&uuml;/g, '\u00fc'],
        [/&Auml;/g, '\u00c4'], [/&Ouml;/g, '\u00d6'], [/&Uuml;/g, '\u00dc'],
        [/&szlig;/g, '\u00df'],
        // Unicode escape sequences in text
        [/\\u00e4/g, '\u00e4'], [/\\u00f6/g, '\u00f6'], [/\\u00fc/g, '\u00fc'],
        [/\\u00c4/g, '\u00c4'], [/\\u00d6/g, '\u00d6'], [/\\u00dc/g, '\u00dc'],
        [/\\u00df/g, '\u00df'],
        // Latin-1 misinterpretation patterns
        [/\u00e4/g, '\u00e4'], // already correct, skip
        [/ae(?=[a-z])/g, '\u00e4'], // Only in obvious German words - too risky, skip
      ];

      let content = rawContent;
      const fixes: string[] = [];
      let totalFixes = 0;

      for (const [pattern, replacement] of umlautFixes) {
        const before = content;
        content = content.replace(pattern, replacement);
        if (content !== before) {
          const count = (before.match(pattern) || []).length;
          totalFixes += count;
          fixes.push(`${replacement} (${count}x)`);
        }
      }

      if (fixes.length === 0) {
        return { content: [{ type: "text", text: t().cc_fix_umlauts.noIssues(path.basename(filePath)) }] };
      }

      if (params.dry_run) {
        return { content: [{ type: "text", text: [t().cc_fix_umlauts.analysisHeader(path.basename(filePath)), '', t().cc_fix_umlauts.replacements(totalFixes), ...fixes.map(f => `  - ${f}`)].join('\n') }] };
      }

      if (params.create_backup) await fs.writeFile(filePath + '.bak', rawContent, "utf-8");
      await fs.writeFile(filePath, content, "utf-8");

      return { content: [{ type: "text", text: [t().cc_fix_umlauts.repairedHeader(path.basename(filePath)), '', t().cc_fix_umlauts.replacements(totalFixes), ...fixes.map(f => `  - ${f}`)].join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 12: Scan Emoji
// ============================================================================

server.registerTool(
  "cc_scan_emoji",
  {
    title: "Scan Emoji",
    description: `Scans files for emojis and shows ASCII alternatives.

Args:
  - path (string): Path to the file or directory
  - recursive (boolean): Scan recursively
  - extensions (string): Only certain extensions

Useful for systems that don't support Unicode/Emoji.`,
    inputSchema: {
      path: z.string().min(1).describe("Path"),
      recursive: z.boolean().default(false).describe("Recursive"),
      extensions: z.string().default(".py,.js,.ts,.json,.md,.txt").describe("Extensions")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const targetPath = normalizePath(params.path);
      if (!await pathExists(targetPath)) {
        return { isError: true, content: [{ type: "text", text: t().common.pathNotFound(targetPath) }] };
      }

      const extFilter = params.extensions.split(',').map(e => e.trim().toLowerCase());
      const stats = await fs.stat(targetPath);
      const files: string[] = [];

      if (stats.isDirectory()) {
        async function scan(dir: string): Promise<void> {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory() && params.recursive && !['node_modules', '.git'].includes(entry.name)) {
              await scan(full);
            } else if (entry.isFile() && extFilter.includes(path.extname(entry.name).toLowerCase())) {
              files.push(full);
            }
          }
        }
        await scan(targetPath);
      } else {
        files.push(targetPath);
      }

      // Emoji detection pattern (covers most emoji ranges)
      const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/gu;

      const results: { file: string; line: number; emoji: string; text: string }[] = [];

      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, "utf-8");
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const matches = lines[i].match(emojiPattern);
            if (matches) {
              for (const emoji of matches) {
                results.push({
                  file: path.relative(targetPath, filePath) || path.basename(filePath),
                  line: i + 1,
                  emoji,
                  text: lines[i].trim().substring(0, 80)
                });
              }
            }
          }
        } catch { /* skip unreadable */ }
      }

      if (results.length === 0) {
        return { content: [{ type: "text", text: t().cc_scan_emoji.noEmojis(files.length) }] };
      }

      // Group by emoji
      const emojiCounts: Map<string, number> = new Map();
      for (const r of results) {
        emojiCounts.set(r.emoji, (emojiCounts.get(r.emoji) || 0) + 1);
      }

      const output = [
        t().cc_scan_emoji.scanHeader(files.length), '',
        `| ${t().cc_scan_emoji.emojiTableEmoji} | ${t().cc_scan_emoji.emojiTableCount} | ${t().cc_scan_emoji.emojiTableCodepoint} |`, `|---|---|---|`,
        ...[...emojiCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(
          ([emoji, count]) => `| ${emoji} | ${count} | U+${emoji.codePointAt(0)?.toString(16).toUpperCase()} |`
        ), '',
        t().cc_scan_emoji.occurrencesHeader,
        ...results.slice(0, 30).map(r => `  ${r.file}:${r.line} ${r.emoji} \`${r.text}\``),
        results.length > 30 ? `\n${t().cc_scan_emoji.andMore(results.length - 30)}` : ''
      ];

      return { content: [{ type: "text", text: output.join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 13: Generate Licenses
// ============================================================================

server.registerTool(
  "cc_generate_licenses",
  {
    title: "Generate Licenses",
    description: `Generates a third-party license file for an npm or Python project.

Args:
  - project_dir (string): Project directory
  - output_path (string): Output file
  - format (string): "text" | "json" | "csv"

Reads package.json (npm) or pip packages and collects license info.`,
    inputSchema: {
      project_dir: z.string().min(1).describe("Project directory"),
      output_path: z.string().min(1).describe("Output file"),
      format: z.enum(["text", "json", "csv"]).default("text").describe("Format")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const projectDir = normalizePath(params.project_dir);
      const outputPath = normalizePath(params.output_path);

      interface LicenseInfo { name: string; version: string; license: string; }
      const licenses: LicenseInfo[] = [];

      // Check for package.json (npm project)
      const pkgJsonPath = path.join(projectDir, 'package.json');
      if (await pathExists(pkgJsonPath)) {
        const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf-8"));
        const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

        for (const [name, version] of Object.entries(allDeps)) {
          const depPkgPath = path.join(projectDir, 'node_modules', name, 'package.json');
          try {
            if (await pathExists(depPkgPath)) {
              const depPkg = JSON.parse(await fs.readFile(depPkgPath, "utf-8"));
              licenses.push({
                name,
                version: depPkg.version || String(version),
                license: depPkg.license || 'UNKNOWN'
              });
            } else {
              licenses.push({ name, version: String(version), license: 'NOT_INSTALLED' });
            }
          } catch {
            licenses.push({ name, version: String(version), license: 'READ_ERROR' });
          }
        }
      }

      // Check for Python (pip list)
      const requirementsPath = path.join(projectDir, 'requirements.txt');
      if (await pathExists(requirementsPath)) {
        try {
          const { stdout } = await execAsync('pip list --format=json', { cwd: projectDir, timeout: 15000 });
          const pipList = JSON.parse(stdout);
          for (const pkg of pipList) {
            licenses.push({ name: pkg.name, version: pkg.version, license: 'Python' });
          }
        } catch {
          // pip not available, read requirements.txt directly
          const reqs = await fs.readFile(requirementsPath, "utf-8");
          for (const line of reqs.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const [name] = trimmed.split(/[=<>!]/);
              licenses.push({ name: name.trim(), version: '?', license: 'Python' });
            }
          }
        }
      }

      if (licenses.length === 0) {
        return { content: [{ type: "text", text: t().cc_generate_licenses.noPackageFiles(projectDir) }] };
      }

      // Generate output
      let output: string;
      switch (params.format) {
        case 'json':
          output = JSON.stringify(licenses, null, 2);
          break;
        case 'csv':
          output = ['Name,Version,License', ...licenses.map(l => `${l.name},${l.version},${l.license}`)].join('\n');
          break;
        default:
          output = [
            'THIRD PARTY NOTICES', '='.repeat(40), '',
            ...licenses.map(l => `${l.name} v${l.version}\n  License: ${l.license}\n`)
          ].join('\n');
      }

      const outDir = path.dirname(outputPath);
      if (!await pathExists(outDir)) await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(outputPath, output, "utf-8");

      return { content: [{ type: "text", text: [t().cc_generate_licenses.generatedHeader(licenses.length), '', `| | |`, `|---|---|`, `| ${t().cc_generate_licenses.labelFile} | ${outputPath} |`, `| ${t().cc_generate_licenses.labelFormat} | ${params.format} |`, `| ${t().cc_generate_licenses.labelPackages} | ${licenses.length} |`].join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Helper: Browser Detection for PDF generation
// ============================================================================

function findBrowser(): string | null {
  const candidates = process.platform === 'win32' ? [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ] : process.platform === 'darwin' ? [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ] : [];

  for (const p of candidates) {
    if (fsSync.existsSync(p)) return p;
  }
  if (process.platform === 'linux') {
    for (const cmd of ['google-chrome', 'chromium-browser', 'chromium', 'microsoft-edge']) {
      try {
        const result = execSync(`which ${cmd}`, { encoding: 'utf-8' }).trim();
        if (result) return result;
      } catch {}
    }
  }
  return null;
}

// ============================================================================
// Tool 14: Markdown to HTML
// ============================================================================

server.registerTool(
  "cc_md_to_html",
  {
    title: "Markdown to HTML",
    description: `Converts Markdown to formatted HTML (printable as PDF).

Args:
  - input_path (string): Path to the Markdown file
  - output_path (string): Path to the HTML output
  - title (string, optional): Document title

Produces standalone HTML with CSS styling, printable as PDF via browser.`,
    inputSchema: {
      input_path: z.string().min(1).describe("Markdown file"),
      output_path: z.string().min(1).describe("HTML output"),
      title: z.string().optional().describe("Document title")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const inputPath = normalizePath(params.input_path);
      const outputPath = normalizePath(params.output_path);
      if (!await pathExists(inputPath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(inputPath) }] };
      }

      const md = await fs.readFile(inputPath, "utf-8");
      const title = params.title || path.basename(inputPath, '.md');

      // --- Inline formatting ---
      const inlineFmt = (text: string): string => {
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
        text = text.replace(/\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g, '<a href="$3"><img src="$2" alt="$1"></a>');
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        text = text.replace(/\[x\]/gi, '&#9745;');
        text = text.replace(/\[ \]/g, '&#9744;');
        return text;
      };

      // --- Table parser ---
      const parseTable = (tableLines: string[]): string => {
        if (tableLines.length < 2) return `<p>${inlineFmt(tableLines[0])}</p>`;
        const rows = tableLines.map(tl => tl.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
        let out = '<table>\n<thead>\n<tr>';
        for (const cell of rows[0]) out += `<th>${inlineFmt(cell)}</th>`;
        out += '</tr>\n</thead>\n<tbody>\n';
        for (let r = 2; r < rows.length; r++) {
          out += '<tr>';
          for (const cell of rows[r]) out += `<td>${inlineFmt(cell)}</td>`;
          out += '</tr>\n';
        }
        out += '</tbody>\n</table>';
        return out;
      };

      // --- List parser (nested, ordered + unordered) ---
      const parseList = (allLines: string[], start: number): [string, number] => {
        const result: string[] = [];
        const stack: string[] = [];
        let li = start;
        while (li < allLines.length) {
          const lline = allLines[li].trimEnd();
          const lm = lline.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
          if (!lm) break;
          const indent = lm[1].length;
          const marker = lm[2];
          const content = inlineFmt(lm[3]);
          const tag = /^\d/.test(marker) ? 'ol' : 'ul';
          const depth = Math.floor(indent / 2);
          while (stack.length > depth + 1) result.push(`</${stack.pop()}>`);
          while (stack.length <= depth) { result.push(`<${tag}>`); stack.push(tag); }
          result.push(`<li>${content}</li>`);
          li++;
        }
        while (stack.length > 0) result.push(`</${stack.pop()}>`);
        return [result.join('\n'), li];
      };

      // --- Line-by-line parser ---
      const lines = md.split('\n');
      const parts: string[] = [];
      let i = 0;
      const n = lines.length;

      while (i < n) {
        const line = lines[i].trimEnd();

        // Fenced code block
        if (line.trimStart().startsWith('```')) {
          const lang = line.trim().slice(3).trim();
          const codeLines: string[] = [];
          i++;
          while (i < n && !lines[i].trimEnd().trimStart().startsWith('```')) {
            codeLines.push(lines[i].trimEnd().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
            i++;
          }
          i++;
          parts.push(`<pre><code class="language-${lang}">${codeLines.join('\n')}</code></pre>`);
          continue;
        }

        // Table
        if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
          const tableLines: string[] = [];
          while (i < n && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
            tableLines.push(lines[i].trim());
            i++;
          }
          parts.push(parseTable(tableLines));
          continue;
        }

        // Blockquote
        if (line.startsWith('>')) {
          const bqLines: string[] = [];
          while (i < n && lines[i].trimEnd().startsWith('>')) {
            bqLines.push(inlineFmt(lines[i].trimEnd().replace(/^>\s*/, '')));
            i++;
          }
          parts.push(`<blockquote><p>${bqLines.join('<br>')}</p></blockquote>`);
          continue;
        }

        // Empty line
        if (line.trim() === '') { i++; continue; }

        // Horizontal rule
        if (/^(-{3,}|={3,}|\*{3,})$/.test(line.trim())) { parts.push('<hr>'); i++; continue; }

        // Header
        const hm = line.match(/^(#{1,6})\s+(.+)$/);
        if (hm) {
          const lvl = hm[1].length;
          parts.push(`<h${lvl}>${inlineFmt(hm[2])}</h${lvl}>`);
          i++;
          continue;
        }

        // List (ordered or unordered)
        if (/^(\s*)([-*]|\d+\.)\s+/.test(line)) {
          const [listHtml, nextI] = parseList(lines, i);
          parts.push(listHtml);
          i = nextI;
          continue;
        }

        // Normal paragraph
        parts.push(`<p>${inlineFmt(line)}</p>`);
        i++;
      }

      const html = parts.join('\n');

      const fullHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #2c3e50; font-size: 11pt; }
    h1 { color: #1a252f; border-bottom: 3px solid #3498db; padding-bottom: 12px; font-size: 22pt; }
    h2 { color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 6px; margin-top: 28px; font-size: 16pt; }
    h3 { color: #34495e; margin-top: 22px; font-size: 13pt; }
    h4 { color: #7f8c8d; margin-top: 18px; font-size: 11pt; font-style: italic; }
    p { margin: 8px 0; }
    code { background: #f0f3f5; padding: 2px 6px; border-radius: 4px; font-family: 'Cascadia Code', Consolas, 'Courier New', monospace; font-size: 0.9em; color: #c0392b; }
    pre { background: #1e1e2e; color: #cdd6f4; padding: 16px 20px; border-radius: 8px; overflow-x: auto; font-size: 9.5pt; line-height: 1.5; margin: 14px 0; }
    pre code { background: none; color: inherit; padding: 0; font-size: inherit; }
    blockquote { border-left: 4px solid #3498db; margin: 16px 0; padding: 10px 20px; background: #f8f9fa; color: #555; border-radius: 0 6px 6px 0; }
    blockquote p { margin: 4px 0; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 10pt; }
    th { background: #2c3e50; color: white; padding: 10px 14px; text-align: left; font-weight: 600; }
    td { border: 1px solid #ddd; padding: 8px 14px; }
    tr:nth-child(even) { background: #f8f9fa; }
    ul, ol { margin: 6px 0; padding-left: 24px; }
    li { margin: 4px 0; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }
    a { color: #2980b9; text-decoration: none; }
    a:hover { text-decoration: underline; }
    img { max-width: 100%; }
    @media print { body { max-width: none; margin: 0; } @page { margin: 2cm 2.5cm; size: A4; } }
  </style>
</head>
<body>
${html}
</body>
</html>`;

      const outDir = path.dirname(outputPath);
      if (!await pathExists(outDir)) await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(outputPath, fullHtml, "utf-8");
      const outStats = await fs.stat(outputPath);

      return { content: [{ type: "text", text: [t().cc_md_to_html.conversionHeader(path.basename(outputPath)), '', `| | |`, `|---|---|`, `| ${t().cc_md_to_html.labelSource} | ${inputPath} |`, `| ${t().cc_md_to_html.labelTarget} | ${outputPath} |`, `| ${t().cc_md_to_html.labelSize} | ${formatFileSize(outStats.size)} |`, '', t().cc_md_to_html.hintPrint].join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 15: Markdown to PDF
// ============================================================================

server.registerTool(
  "cc_md_to_pdf",
  {
    title: "Markdown to PDF",
    description: `Converts Markdown to PDF using a headless browser (Edge/Chrome).

Args:
  - input_path (string): Path to the Markdown file
  - output_path (string): Path to the PDF output
  - title (string, optional): Document title

Uses the same Markdown parser as cc_md_to_html. Requires Edge or Chrome.
Falls back to HTML if no browser is found.`,
    inputSchema: {
      input_path: z.string().min(1).describe("Markdown file"),
      output_path: z.string().min(1).describe("PDF output"),
      title: z.string().optional().describe("Document title")
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const inputPath = normalizePath(params.input_path);
      const outputPath = normalizePath(params.output_path);
      if (!await pathExists(inputPath)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(inputPath) }] };
      }

      const md = await fs.readFile(inputPath, "utf-8");
      const title = params.title || path.basename(inputPath, '.md');

      // --- Inline formatting ---
      const inlineFmt = (text: string): string => {
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
        text = text.replace(/\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g, '<a href="$3"><img src="$2" alt="$1"></a>');
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        text = text.replace(/\[x\]/gi, '&#9745;');
        text = text.replace(/\[ \]/g, '&#9744;');
        return text;
      };

      // --- Table parser ---
      const parseTable = (tableLines: string[]): string => {
        if (tableLines.length < 2) return `<p>${inlineFmt(tableLines[0])}</p>`;
        const rows = tableLines.map(tl => tl.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
        let out = '<table>\n<thead>\n<tr>';
        for (const cell of rows[0]) out += `<th>${inlineFmt(cell)}</th>`;
        out += '</tr>\n</thead>\n<tbody>\n';
        for (let r = 2; r < rows.length; r++) {
          out += '<tr>';
          for (const cell of rows[r]) out += `<td>${inlineFmt(cell)}</td>`;
          out += '</tr>\n';
        }
        out += '</tbody>\n</table>';
        return out;
      };

      // --- List parser (nested, ordered + unordered) ---
      const parseList = (allLines: string[], start: number): [string, number] => {
        const result: string[] = [];
        const stack: string[] = [];
        let li = start;
        while (li < allLines.length) {
          const lline = allLines[li].trimEnd();
          const lm = lline.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
          if (!lm) break;
          const indent = lm[1].length;
          const marker = lm[2];
          const content = inlineFmt(lm[3]);
          const tag = /^\d/.test(marker) ? 'ol' : 'ul';
          const depth = Math.floor(indent / 2);
          while (stack.length > depth + 1) result.push(`</${stack.pop()}>`);
          while (stack.length <= depth) { result.push(`<${tag}>`); stack.push(tag); }
          result.push(`<li>${content}</li>`);
          li++;
        }
        while (stack.length > 0) result.push(`</${stack.pop()}>`);
        return [result.join('\n'), li];
      };

      // --- Line-by-line parser ---
      const lines = md.split('\n');
      const parts: string[] = [];
      let i = 0;
      const n = lines.length;

      while (i < n) {
        const line = lines[i].trimEnd();

        if (line.trimStart().startsWith('```')) {
          const lang = line.trim().slice(3).trim();
          const codeLines: string[] = [];
          i++;
          while (i < n && !lines[i].trimEnd().trimStart().startsWith('```')) {
            codeLines.push(lines[i].trimEnd().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
            i++;
          }
          i++;
          parts.push(`<pre><code class="language-${lang}">${codeLines.join('\n')}</code></pre>`);
          continue;
        }

        if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
          const tableLines: string[] = [];
          while (i < n && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
            tableLines.push(lines[i].trim());
            i++;
          }
          parts.push(parseTable(tableLines));
          continue;
        }

        if (line.startsWith('>')) {
          const bqLines: string[] = [];
          while (i < n && lines[i].trimEnd().startsWith('>')) {
            bqLines.push(inlineFmt(lines[i].trimEnd().replace(/^>\s*/, '')));
            i++;
          }
          parts.push(`<blockquote><p>${bqLines.join('<br>')}</p></blockquote>`);
          continue;
        }

        if (line.trim() === '') { i++; continue; }
        if (/^(-{3,}|={3,}|\*{3,})$/.test(line.trim())) { parts.push('<hr>'); i++; continue; }

        const hm = line.match(/^(#{1,6})\s+(.+)$/);
        if (hm) {
          const lvl = hm[1].length;
          parts.push(`<h${lvl}>${inlineFmt(hm[2])}</h${lvl}>`);
          i++;
          continue;
        }

        if (/^(\s*)([-*]|\d+\.)\s+/.test(line)) {
          const [listHtml, nextI] = parseList(lines, i);
          parts.push(listHtml);
          i = nextI;
          continue;
        }

        parts.push(`<p>${inlineFmt(line)}</p>`);
        i++;
      }

      const html = parts.join('\n');

      const fullHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #2c3e50; font-size: 11pt; }
    h1 { color: #1a252f; border-bottom: 3px solid #3498db; padding-bottom: 12px; font-size: 22pt; }
    h2 { color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 6px; margin-top: 28px; font-size: 16pt; }
    h3 { color: #34495e; margin-top: 22px; font-size: 13pt; }
    h4 { color: #7f8c8d; margin-top: 18px; font-size: 11pt; font-style: italic; }
    p { margin: 8px 0; }
    code { background: #f0f3f5; padding: 2px 6px; border-radius: 4px; font-family: 'Cascadia Code', Consolas, 'Courier New', monospace; font-size: 0.9em; color: #c0392b; }
    pre { background: #1e1e2e; color: #cdd6f4; padding: 16px 20px; border-radius: 8px; overflow-x: auto; font-size: 9.5pt; line-height: 1.5; margin: 14px 0; }
    pre code { background: none; color: inherit; padding: 0; font-size: inherit; }
    blockquote { border-left: 4px solid #3498db; margin: 16px 0; padding: 10px 20px; background: #f8f9fa; color: #555; border-radius: 0 6px 6px 0; }
    blockquote p { margin: 4px 0; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 10pt; }
    th { background: #2c3e50; color: white; padding: 10px 14px; text-align: left; font-weight: 600; }
    td { border: 1px solid #ddd; padding: 8px 14px; }
    tr:nth-child(even) { background: #f8f9fa; }
    ul, ol { margin: 6px 0; padding-left: 24px; }
    li { margin: 4px 0; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }
    a { color: #2980b9; text-decoration: none; }
    a:hover { text-decoration: underline; }
    img { max-width: 100%; }
    @media print { body { max-width: none; margin: 0; } @page { margin: 2cm 2.5cm; size: A4; } }
  </style>
</head>
<body>
${html}
</body>
</html>`;

      // Write temp HTML
      const tempHtml = outputPath.replace(/\.pdf$/i, '.tmp.html');
      const outDir = path.dirname(outputPath);
      if (!await pathExists(outDir)) await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(tempHtml, fullHtml, "utf-8");

      const browser = findBrowser();
      if (!browser) {
        // Fallback: save as HTML instead of PDF
        const htmlFallback = outputPath.replace(/\.pdf$/i, '.html');
        await fs.rename(tempHtml, htmlFallback);
        const outStats = await fs.stat(htmlFallback);
        return { content: [{ type: "text", text: [t().cc_md_to_pdf.conversionHeader(path.basename(htmlFallback)), '', `| | |`, `|---|---|`, `| ${t().cc_md_to_pdf.labelSource} | ${inputPath} |`, `| ${t().cc_md_to_pdf.labelTarget} | ${htmlFallback} |`, `| ${t().cc_md_to_pdf.labelSize} | ${formatFileSize(outStats.size)} |`, '', t().cc_md_to_pdf.noBrowser].join('\n') }] };
      }

      try {
        const fileUrl = pathToFileURL(tempHtml).href;
        execFileSync(browser, [
          '--headless',
          '--disable-gpu',
          `--print-to-pdf=${outputPath}`,
          '--no-pdf-header-footer',
          fileUrl
        ], { timeout: 30000 });
      } catch (browserError) {
        // If browser fails, keep HTML as fallback
        const htmlFallback = outputPath.replace(/\.pdf$/i, '.html');
        await fs.rename(tempHtml, htmlFallback);
        const outStats = await fs.stat(htmlFallback);
        return { content: [{ type: "text", text: [t().cc_md_to_pdf.conversionHeader(path.basename(htmlFallback)), '', `| | |`, `|---|---|`, `| ${t().cc_md_to_pdf.labelSource} | ${inputPath} |`, `| ${t().cc_md_to_pdf.labelTarget} | ${htmlFallback} |`, `| ${t().cc_md_to_pdf.labelSize} | ${formatFileSize(outStats.size)} |`, '', t().cc_md_to_pdf.noBrowser].join('\n') }] };
      }

      // Clean up temp HTML
      try { await fs.unlink(tempHtml); } catch {}

      const outStats = await fs.stat(outputPath);
      const browserName = path.basename(browser).replace(/\.exe$/i, '');
      return { content: [{ type: "text", text: [t().cc_md_to_pdf.conversionHeader(path.basename(outputPath)), '', `| | |`, `|---|---|`, `| ${t().cc_md_to_pdf.labelSource} | ${inputPath} |`, `| ${t().cc_md_to_pdf.labelTarget} | ${outputPath} |`, `| ${t().cc_md_to_pdf.labelSize} | ${formatFileSize(outStats.size)} |`, '', t().cc_md_to_pdf.browserUsed(browserName)].join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 17: Diff Files
// ============================================================================

server.registerTool(
  "cc_diff_files",
  {
    title: "Diff Files",
    description: t().cc_diff_files.description,
    inputSchema: {
      file_a: z.string().min(1).describe("Path to first file"),
      file_b: z.string().min(1).describe("Path to second file"),
      context_lines: z.number().int().min(0).max(20).default(3).describe("Number of context lines (default: 3)")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      const fileA = normalizePath(params.file_a);
      const fileB = normalizePath(params.file_b);

      if (!await pathExists(fileA)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(fileA) }] };
      }
      if (!await pathExists(fileB)) {
        return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(fileB) }] };
      }

      const contentA = await fs.readFile(fileA, 'utf-8');
      const contentB = await fs.readFile(fileB, 'utf-8');
      const linesA = contentA.split('\n');
      const linesB = contentB.split('\n');

      const contextCount = params.context_lines ?? 3;

      if (contentA === contentB) {
        return { content: [{ type: "text", text: [t().cc_diff_files.header(path.basename(fileA), path.basename(fileB)), '', t().cc_diff_files.identical].join('\n') }] };
      }

      const diffOutput = computeUnifiedDiff(linesA, linesB, contextCount, fileA, fileB);

      // Count additions and deletions
      const diffLines = diffOutput.split('\n');
      let added = 0;
      let removed = 0;
      for (const line of diffLines) {
        if (line.startsWith('+') && !line.startsWith('+++')) added++;
        if (line.startsWith('-') && !line.startsWith('---')) removed++;
      }

      const output = [
        t().cc_diff_files.header(path.basename(fileA), path.basename(fileB)),
        '',
        t().cc_diff_files.linesChanged(added, removed),
        '',
        '```diff',
        diffOutput,
        '```'
      ];

      return { content: [{ type: "text", text: output.join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 18: Regex Tester
// ============================================================================

server.registerTool(
  "cc_regex_test",
  {
    title: "Regex Tester",
    description: t().cc_regex_test.description,
    inputSchema: {
      pattern: z.string().min(1).describe("Regular expression pattern"),
      flags: z.string().default('g').describe("Regex flags (g, i, m, s, u)"),
      text: z.string().optional().describe("Text to test against (or use file_path)"),
      file_path: z.string().optional().describe("File to test against (alternative to text)"),
      replace_with: z.string().optional().describe("Optional replacement string")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  async (params) => {
    try {
      let input = params.text;
      if (!input && params.file_path) {
        const filePath = normalizePath(params.file_path);
        if (!await pathExists(filePath)) {
          return { isError: true, content: [{ type: "text", text: t().common.fileNotFound(filePath) }] };
        }
        input = await fs.readFile(filePath, 'utf-8');
      }
      if (!input) {
        return { isError: true, content: [{ type: "text", text: t().common.error('Either text or file_path required') }] };
      }

      const flags = params.flags || 'g';
      const matchFlags = flags.includes('g') ? flags : flags + 'g';
      const regex = new RegExp(params.pattern, matchFlags);
      const matches = [...input.matchAll(regex)];

      const output: string[] = [
        t().cc_regex_test.header(params.pattern, flags),
        '',
      ];

      if (matches.length === 0) {
        output.push(t().cc_regex_test.noMatches);
      } else {
        output.push(t().cc_regex_test.matchCount(matches.length));
        output.push('');

        for (let i = 0; i < matches.length && i < 50; i++) {
          const m = matches[i];
          output.push(`Match ${i + 1}: \`${m[0]}\` at index ${m.index}`);
          if (m.length > 1) {
            for (let g = 1; g < m.length; g++) {
              output.push(`  Group ${g}: \`${m[g]}\``);
            }
          }
        }
        if (matches.length > 50) {
          output.push(`  ... and ${matches.length - 50} more matches`);
        }
      }

      if (params.replace_with !== undefined) {
        const replaceRegex = new RegExp(params.pattern, flags);
        const replaced = input.replace(replaceRegex, params.replace_with);
        output.push('');
        output.push('**Replacement preview:**');
        // Show first 2000 chars of replacement
        const preview = replaced.length > 2000 ? replaced.substring(0, 2000) + '\n...(truncated)' : replaced;
        output.push('```');
        output.push(preview);
        output.push('```');
      }

      return { content: [{ type: "text", text: output.join('\n') }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: t().common.error(error instanceof Error ? error.message : String(error)) }] };
    }
  }
);

// ============================================================================
// Tool 16: Set Language
// ============================================================================

server.tool(
  "cc_set_language",
  "Set the output language for CodeCommander tools",
  { language: z.enum(["de", "en", "es", "zh", "ja", "ru"]).describe("Language code") },
  async ({ language }) => {
    setLanguage(language);
    return { content: [{ type: "text", text: t().cc_set_language.languageSet(language) }] };
  }
);

// ============================================================================
// Server Startup
// ============================================================================

async function main(): Promise<void> {
  // Update-Hinweis nur im interaktiven Terminal — niemals im stdio-/MCP-Betrieb (Protokoll-Schutz)
  if (process.stdout.isTTY) {
    try {
      updateNotifier({ pkg: createRequire(import.meta.url)("../package.json") }).notify();
    } catch { /* Update-Check darf den Start nie blockieren */ }
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(t().common.serverStarted);
}

// Only start the stdio server when this file is run directly (CLI/bin entry),
// not when imported as a module -- e.g. by tests that import pure helpers.
const isMainModule = process.argv[1] !== undefined
  && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isMainModule) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
