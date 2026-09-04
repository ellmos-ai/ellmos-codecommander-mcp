/**
 * Test Script for ellmos-codecommander-mcp new tools:
 *   - cc_convert_format (YAML, TOML, XML, TOON)
 *   - cc_diff_files
 *   - cc_regex_test
 *
 * Starts the MCP server as a child process and communicates via JSON-RPC
 * over stdin/stdout using newline-delimited JSON (as per MCP SDK stdio transport).
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
const fixturesDir = path.join(__dirname, 'fixtures');
const generatedFixtureNames = [
  'test_out.yaml', 'test_out.toml', 'test_out.xml', 'test_out.toon', 'test_roundtrip.json',
  'analysis_sample.js', 'analysis_sample.jsx', 'analysis_sample.ts', 'analysis_sample.tsx',
  'analysis_sample.lua', 'analysis_sample.luau'
];
let activeServer = null;
let shuttingDown = false;

function cleanupGeneratedFixtures() {
  const errors = [];
  for (const name of generatedFixtureNames) {
    const fixturePath = path.join(fixturesDir, name);
    try {
      fs.rmSync(fixturePath, { force: true });
    } catch (error) {
      errors.push(`${name}: ${error.message}`);
    }
  }
  return errors;
}

async function stopServer(server) {
  if (!server || server.exitCode !== null || server.signalCode !== null) {
    if (activeServer === server) activeServer = null;
    return;
  }

  await new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(forceKillTimer);
      resolve();
    };
    const forceKillTimer = setTimeout(() => {
      if (server.exitCode === null && server.signalCode === null) {
        try {
          server.kill('SIGKILL');
        } catch {
          // The child may have exited between the state check and kill.
        }
      }
      finish();
    }, 2000);
    forceKillTimer.unref();
    server.once('exit', finish);
    server.once('error', finish);
    try {
      server.kill('SIGTERM');
    } catch {
      finish();
    }
  });

  if (activeServer === server) activeServer = null;
}

async function abortTestRun(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  cleanupGeneratedFixtures();
  await stopServer(activeServer);
  process.exit(exitCode);
}

process.once('SIGINT', () => void abortTestRun(130));
process.once('SIGTERM', () => void abortTestRun(143));
process.once('exit', () => {
  cleanupGeneratedFixtures();
});

// ============================================================================
// MCP stdio transport helpers (newline-delimited JSON-RPC)
// ============================================================================

let requestId = 0;

function createRequest(method, params) {
  return JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }) + '\n';
}

function createNotification(method, params) {
  const msg = { jsonrpc: '2.0', method };
  if (params) msg.params = params;
  return JSON.stringify(msg) + '\n';
}

// ============================================================================
// Test runner
// ============================================================================

const results = [];
let passed = 0;
let failed = 0;

function assert(testName, condition, detail = '') {
  if (condition) {
    passed++;
    results.push({ name: testName, status: 'PASS' });
    console.log(`  PASS: ${testName}`);
  } else {
    failed++;
    results.push({ name: testName, status: 'FAIL', detail });
    console.log(`  FAIL: ${testName}${detail ? ' -- ' + detail : ''}`);
  }
}

async function runTests() {
  console.log('Starting ellmos-codecommander-mcp test suite...\n');
  console.log(`Server: ${serverPath}`);
  console.log(`Fixtures: ${fixturesDir}\n`);

  // Start server
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });
  activeServer = server;

  let stderrOutput = '';
  server.stderr.on('data', (data) => {
    stderrOutput += data.toString();
  });

  // Buffer for incoming newline-delimited JSON
  let buffer = '';
  const pendingResponses = new Map(); // id -> {resolve, reject}

  server.once('exit', (code, signal) => {
    const error = new Error(`MCP server exited before responding (code=${code}, signal=${signal})`);
    for (const pending of pendingResponses.values()) pending.reject(error);
    pendingResponses.clear();
  });

  server.stdout.on('data', (data) => {
    buffer += data.toString('utf-8');
    // Parse newline-delimited JSON messages
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete last line in buffer
    for (const line of lines) {
      const trimmed = line.replace(/\r$/, '').trim();
      if (!trimmed) continue;
      try {
        const msg = JSON.parse(trimmed);
        if (msg.id !== undefined && pendingResponses.has(msg.id)) {
          pendingResponses.get(msg.id).resolve(msg);
          pendingResponses.delete(msg.id);
        }
        // Notifications (no id) are ignored silently
      } catch (e) {
        // Skip unparseable lines
      }
    }
  });

  function sendAndWait(method, params, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const id = requestId + 1;
      const msg = createRequest(method, params);
      server.stdin.write(msg);

      const timer = setTimeout(() => {
        pendingResponses.delete(id);
        reject(new Error(`Timeout waiting for response id=${id} method=${method}`));
      }, timeout);

      pendingResponses.set(id, {
        resolve: (resp) => {
          clearTimeout(timer);
          resolve(resp);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        }
      });
    });
  }

  function callTool(name, args, timeout = 15000) {
    return sendAndWait('tools/call', { name, arguments: args }, timeout);
  }

  try {
    // ========================================================================
    // Initialize MCP session
    // ========================================================================
    console.log('--- Initializing MCP session ---');
    const initResp = await sendAndWait('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-runner', version: '1.0.0' }
    });
    const serverName = initResp.result?.serverInfo?.name || 'unknown';
    console.log(`Server: ${serverName} v${initResp.result?.serverInfo?.version || '?'}\n`);

    // Send initialized notification (no response expected)
    server.stdin.write(createNotification('notifications/initialized'));
    await new Promise(r => setTimeout(r, 500)); // give server a moment

    // ========================================================================
    // Stage 1 language dispatch and Python-only path gates
    // ========================================================================
    console.log('--- Stage 1: JavaScript/TypeScript analysis dispatch ---');
    const languageFixtures = {
      'analysis_sample.js': `import { readFile } from 'node:fs/promises';\nexport class Greeter {\n  async greet(name) {\n    return name && await readFile(name);\n  }\n}\nexport const run = async () => new Greeter();\n`,
      'analysis_sample.jsx': `import React from 'react';\nexport class Panel extends React.Component {\n  render() {\n    return <section>{this.props.title}</section>;\n  }\n}\n`,
      'analysis_sample.ts': `import { join, resolve } from 'node:path';\nexport function makePath(value: string): string {\n  return join('', value);\n}\n`,
      'analysis_sample.tsx': `import React from 'react';\ntype Props = { name: string };\nexport const View = ({ name }: Props) => <strong>{name}</strong>;\n`,
      'analysis_sample.lua': `local function greet(name)\n  return 'hello ' .. name\nend\n`,
      'analysis_sample.luau': `local function typed(name: string): string\n  return name\nend\n`
    };
    for (const [name, content] of Object.entries(languageFixtures)) {
      fs.writeFileSync(path.join(fixturesDir, name), content, 'utf-8');
    }

    const jsAnalyze = await callTool('cc_analyze_code', { path: path.join(fixturesDir, 'analysis_sample.js') });
    const jsAnalyzeText = jsAnalyze.result?.content?.[0]?.text || '';
    assert('JS dispatch: cc_analyze_code succeeds', !jsAnalyze.result?.isError, jsAnalyzeText);
    assert('JS dispatch: class and function are reported', jsAnalyzeText.includes('Greeter') && jsAnalyzeText.includes('run'), jsAnalyzeText);

    const jsxMethods = await callTool('cc_analyze_methods', { path: path.join(fixturesDir, 'analysis_sample.jsx') });
    const jsxMethodsText = jsxMethods.result?.content?.[0]?.text || '';
    assert('JSX dispatch: cc_analyze_methods succeeds', !jsxMethods.result?.isError, jsxMethodsText);
    assert('JSX dispatch: class method is reported', jsxMethodsText.includes('Panel') && jsxMethodsText.includes('render()'), jsxMethodsText);

    const tsImports = await callTool('cc_diagnose_imports', { path: path.join(fixturesDir, 'analysis_sample.ts') });
    const tsImportsText = tsImports.result?.content?.[0]?.text || '';
    assert('TS dispatch: cc_diagnose_imports succeeds', !tsImports.result?.isError, tsImportsText);
    assert('TS dispatch: unused named import is diagnosed', tsImportsText.includes('resolve'), tsImportsText);

    const tsxAnalyze = await callTool('cc_analyze_code', { path: path.join(fixturesDir, 'analysis_sample.tsx') });
    const tsxAnalyzeText = tsxAnalyze.result?.content?.[0]?.text || '';
    assert('TSX dispatch: cc_analyze_code succeeds', !tsxAnalyze.result?.isError, tsxAnalyzeText);
    assert('TSX dispatch: typed arrow function is reported', tsxAnalyzeText.includes('View'), tsxAnalyzeText);

    for (const extension of ['lua', 'luau']) {
      const unsupported = await callTool('cc_analyze_code', { path: path.join(fixturesDir, `analysis_sample.${extension}`) });
      const unsupportedText = unsupported.result?.content?.[0]?.text || '';
      assert(`${extension}: generic analyzer returns an explicit language error`,
        unsupported.result?.isError && unsupportedText.includes('Unsupported source language') && unsupportedText.includes(`.${extension}`), unsupportedText);
    }

    const luaMethods = await callTool('cc_analyze_methods', { path: path.join(fixturesDir, 'analysis_sample.lua') });
    const luaMethodsText = luaMethods.result?.content?.[0]?.text || '';
    assert('Lua: method analyzer returns an explicit language error',
      luaMethods.result?.isError && luaMethodsText.includes('Unsupported source language'), luaMethodsText);

    const luauImports = await callTool('cc_diagnose_imports', { path: path.join(fixturesDir, 'analysis_sample.luau') });
    const luauImportsText = luauImports.result?.content?.[0]?.text || '';
    assert('Luau: import analyzer returns an explicit language error',
      luauImports.result?.isError && luauImportsText.includes('Unsupported source language'), luauImportsText);

    const pythonOnlyCases = [
      ['cc_extract_classes', 'analysis_sample.js', {}],
      ['cc_organize_imports', 'analysis_sample.ts', { dry_run: true }],
      ['cc_check_indentation', 'analysis_sample.js', { recursive: false }],
      ['cc_runtime_import_diagnose', 'analysis_sample.ts', {}],
      ['cc_python_structural_edit', 'analysis_sample.js', { operation: 'inspect', mode: 'preview' }]
    ];
    for (const [tool, fixture, extraArgs] of pythonOnlyCases) {
      const response = await callTool(tool, { path: path.join(fixturesDir, fixture), ...extraArgs });
      const responseText = response.result?.content?.[0]?.text || '';
      assert(`${tool}: rejects JS/TS before Python processing`,
        response.result?.isError && responseText.includes('Python-only tool requires a .py file'), responseText);
    }

    // ========================================================================
    // Test 1: JSON -> YAML conversion
    // ========================================================================
    console.log('--- Test 1: JSON -> YAML ---');
    const yamlOutPath = path.join(fixturesDir, 'test_out.yaml');
    const resp1 = await callTool('cc_convert_format', {
      input_path: path.join(fixturesDir, 'test.json'),
      output_path: yamlOutPath,
      input_format: 'json',
      output_format: 'yaml'
    });

    const resp1Text = resp1.result?.content?.[0]?.text || '';
    assert('JSON->YAML: Tool returns success', !resp1.result?.isError, resp1Text);

    if (fs.existsSync(yamlOutPath)) {
      const yamlContent = fs.readFileSync(yamlOutPath, 'utf-8');
      assert('JSON->YAML: Output contains "name: test"', yamlContent.includes('name: test'), yamlContent);
      assert('JSON->YAML: Output contains "version: 1"', yamlContent.includes('version: 1'), yamlContent);
      assert('JSON->YAML: Output contains tags', yamlContent.includes('tags:'), yamlContent);
    } else {
      assert('JSON->YAML: Output file exists', false, 'File not created');
    }

    // ========================================================================
    // Test 2: JSON -> TOML
    // ========================================================================
    console.log('\n--- Test 2: JSON -> TOML ---');
    const tomlOutPath = path.join(fixturesDir, 'test_out.toml');
    const resp2 = await callTool('cc_convert_format', {
      input_path: path.join(fixturesDir, 'test.json'),
      output_path: tomlOutPath,
      input_format: 'json',
      output_format: 'toml'
    });

    const resp2Text = resp2.result?.content?.[0]?.text || '';
    assert('JSON->TOML: Tool returns success', !resp2.result?.isError, resp2Text);

    if (fs.existsSync(tomlOutPath)) {
      const tomlContent = fs.readFileSync(tomlOutPath, 'utf-8');
      assert('JSON->TOML: Output contains name', tomlContent.includes('name'), tomlContent);
      assert('JSON->TOML: Output contains version', tomlContent.includes('version'), tomlContent);
    } else {
      assert('JSON->TOML: Output file exists', false, 'File not created');
    }

    // ========================================================================
    // Test 3: JSON -> XML
    // ========================================================================
    console.log('\n--- Test 3: JSON -> XML ---');
    const xmlOutPath = path.join(fixturesDir, 'test_out.xml');
    const resp3 = await callTool('cc_convert_format', {
      input_path: path.join(fixturesDir, 'test.json'),
      output_path: xmlOutPath,
      input_format: 'json',
      output_format: 'xml'
    });

    const resp3Text = resp3.result?.content?.[0]?.text || '';
    assert('JSON->XML: Tool returns success', !resp3.result?.isError, resp3Text);

    if (fs.existsSync(xmlOutPath)) {
      const xmlContent = fs.readFileSync(xmlOutPath, 'utf-8');
      assert('JSON->XML: Output contains XML-like content', xmlContent.includes('<') && xmlContent.includes('>'), xmlContent);
      assert('JSON->XML: Output contains "test"', xmlContent.includes('test'), xmlContent);
    } else {
      assert('JSON->XML: Output file exists', false, 'File not created');
    }

    // ========================================================================
    // Test 4: JSON -> TOON + Roundtrip
    // ========================================================================
    console.log('\n--- Test 4: JSON -> TOON (+ Roundtrip) ---');
    const toonOutPath = path.join(fixturesDir, 'test_out.toon');
    const resp4 = await callTool('cc_convert_format', {
      input_path: path.join(fixturesDir, 'test.json'),
      output_path: toonOutPath,
      input_format: 'json',
      output_format: 'toon'
    });

    const resp4Text = resp4.result?.content?.[0]?.text || '';
    assert('JSON->TOON: Tool returns success', !resp4.result?.isError, resp4Text);

    if (fs.existsSync(toonOutPath)) {
      const toonContent = fs.readFileSync(toonOutPath, 'utf-8');
      assert('JSON->TOON: Output contains "name"', toonContent.includes('name'), toonContent);
      assert('JSON->TOON: Output is non-empty', toonContent.trim().length > 0, toonContent);

      // Roundtrip: TOON -> JSON
      const roundtripJsonPath = path.join(fixturesDir, 'test_roundtrip.json');
      const resp4b = await callTool('cc_convert_format', {
        input_path: toonOutPath,
        output_path: roundtripJsonPath,
        input_format: 'toon',
        output_format: 'json',
        json_indent: 2
      });
      const resp4bText = resp4b.result?.content?.[0]?.text || '';
      assert('TOON->JSON Roundtrip: Tool returns success', !resp4b.result?.isError, resp4bText);

      if (fs.existsSync(roundtripJsonPath)) {
        const roundtripJson = JSON.parse(fs.readFileSync(roundtripJsonPath, 'utf-8'));
        assert('TOON->JSON Roundtrip: name matches', roundtripJson.name === 'test',
          `Expected "test", got "${roundtripJson.name}"`);
        assert('TOON->JSON Roundtrip: version matches', roundtripJson.version === 1 || roundtripJson.version === '1',
          `Expected 1, got "${roundtripJson.version}"`);
      } else {
        assert('TOON->JSON Roundtrip: Output file exists', false, 'File not created');
      }
    } else {
      assert('JSON->TOON: Output file exists', false, 'File not created');
    }

    // ========================================================================
    // Test 5: Diff - Different files
    // ========================================================================
    console.log('\n--- Test 5: Diff (different files) ---');
    const resp5 = await callTool('cc_diff_files', {
      file_a: path.join(fixturesDir, 'diff_a.txt'),
      file_b: path.join(fixturesDir, 'diff_b.txt'),
      context_lines: 3
    });

    const resp5Text = resp5.result?.content?.[0]?.text || '';
    assert('Diff: Tool returns success', !resp5.result?.isError, resp5Text);
    assert('Diff: Output contains "---"', resp5Text.includes('---'), resp5Text.substring(0, 300));
    assert('Diff: Output contains "+++"', resp5Text.includes('+++'), resp5Text.substring(0, 300));
    assert('Diff: Output contains "@@"', resp5Text.includes('@@'), resp5Text.substring(0, 500));
    assert('Diff: Output contains diff markers', resp5Text.includes('+') && resp5Text.includes('-'),
      resp5Text.substring(0, 500));

    // ========================================================================
    // Test 6: Diff - Identical files
    // ========================================================================
    console.log('\n--- Test 6: Diff (identical files) ---');
    const resp6 = await callTool('cc_diff_files', {
      file_a: path.join(fixturesDir, 'diff_a.txt'),
      file_b: path.join(fixturesDir, 'diff_a.txt')
    });

    const resp6Text = resp6.result?.content?.[0]?.text || '';
    assert('Diff identical: Tool returns success', !resp6.result?.isError, resp6Text);
    // Check for "identical" or "identisch" (i18n)
    const isIdentical = resp6Text.toLowerCase().includes('identic') ||
                        resp6Text.toLowerCase().includes('identisch') ||
                        resp6Text.toLowerCase().includes('identical') ||
                        resp6Text.toLowerCase().includes('no diff') ||
                        resp6Text.toLowerCase().includes('keine');
    assert('Diff identical: Reports files as identical', isIdentical, resp6Text);

    // ========================================================================
    // Test 7: Regex - Simple pattern
    // ========================================================================
    console.log('\n--- Test 7: Regex (simple pattern) ---');
    const resp7 = await callTool('cc_regex_test', {
      pattern: '\\d+',
      text: 'abc 123 def 456',
      flags: 'g'
    });

    const resp7Text = resp7.result?.content?.[0]?.text || '';
    assert('Regex simple: Tool returns success', !resp7.result?.isError, resp7Text);
    assert('Regex simple: Reports 2 matches', resp7Text.includes('2'), resp7Text);
    assert('Regex simple: Contains match "123"', resp7Text.includes('123'), resp7Text);
    assert('Regex simple: Contains match "456"', resp7Text.includes('456'), resp7Text);

    // ========================================================================
    // Test 8: Regex - Groups
    // ========================================================================
    console.log('\n--- Test 8: Regex (groups) ---');
    const resp8 = await callTool('cc_regex_test', {
      pattern: '(\\w+)@(\\w+)\\.(\\w+)',
      text: 'user@example.com',
      flags: 'g'
    });

    const resp8Text = resp8.result?.content?.[0]?.text || '';
    assert('Regex groups: Tool returns success', !resp8.result?.isError, resp8Text);
    assert('Regex groups: Reports 1 match', resp8Text.includes('1'), resp8Text);
    assert('Regex groups: Contains Group 1 "user"', resp8Text.includes('user'), resp8Text);
    assert('Regex groups: Contains Group 2 "example"', resp8Text.includes('example'), resp8Text);
    assert('Regex groups: Contains Group 3 "com"', resp8Text.includes('com'), resp8Text);

    // ========================================================================
    // Test 9: Regex - Replace
    // ========================================================================
    console.log('\n--- Test 9: Regex (replace) ---');
    const resp9 = await callTool('cc_regex_test', {
      pattern: 'foo',
      text: 'foo baz foo',
      flags: 'g',
      replace_with: 'bar'
    });

    const resp9Text = resp9.result?.content?.[0]?.text || '';
    assert('Regex replace: Tool returns success', !resp9.result?.isError, resp9Text);
    assert('Regex replace: Contains replacement preview',
      resp9Text.toLowerCase().includes('replacement') || resp9Text.toLowerCase().includes('ersetz'),
      resp9Text);
    assert('Regex replace: Preview shows "bar baz bar"', resp9Text.includes('bar baz bar'), resp9Text);

  } catch (error) {
    console.error(`\nFATAL ERROR: ${error.message}`);
    if (stderrOutput) {
      console.error(`\nServer stderr:\n${stderrOutput}`);
    }
    failed++;
    results.push({ name: 'FATAL', status: 'FAIL', detail: error.message });
  } finally {
    const cleanupErrors = cleanupGeneratedFixtures();
    if (cleanupErrors.length > 0) {
      const detail = cleanupErrors.join('; ');
      console.error(`\nCLEANUP ERROR: ${detail}`);
      failed++;
      results.push({ name: 'Fixture cleanup', status: 'FAIL', detail });
    }
    await stopServer(server);
  }

  // ========================================================================
  // Summary
  // ========================================================================
  console.log('\n' + '='.repeat(60));
  console.log(`ERGEBNIS: ${passed} bestanden, ${failed} fehlgeschlagen (${passed + failed} total)`);
  console.log('='.repeat(60));

  if (failed > 0) {
    console.log('\nFehlgeschlagene Tests:');
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`  - ${r.name}`);
      if (r.detail) console.log(`    Detail: ${r.detail.substring(0, 200)}`);
    }
  }

  process.exitCode = failed > 0 ? 1 : 0;
}

runTests();
