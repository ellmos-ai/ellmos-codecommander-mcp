import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

describe("Hindi diagnostics over MCP stdio", () => {
  const client = new Client({ name: "hindi-diagnostic-regression", version: "1" });
  let directory: string;
  let invalidJson: string;
  let pythonSource: string;

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), "codecommander-hi-"));
    invalidJson = join(directory, "invalid.json");
    pythonSource = join(directory, "classes.py");
    await writeFile(invalidJson, '{"a": }', "utf8");
    await writeFile(pythonSource, "class Sample:\n    pass\n", "utf8");
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL("../dist/index.js", import.meta.url))],
      env: { CC_LANGUAGE: "hi", PYTHONIOENCODING: "utf-8" },
      stderr: "pipe",
    });
    await client.connect(transport);
  }, 20_000);

  afterAll(async () => {
    try {
      await client.close();
    } finally {
      if (directory) await rm(directory, { recursive: true, force: true });
    }
  });

  it("reports an unrepaired JSON warning in Hindi without modifying the file", async () => {
    const result = await client.callTool({
      name: "cc_fix_json",
      arguments: { path: invalidJson, dry_run: true },
    });
    const content = result.content as Array<{ type: string; text?: string }>;
    const text = content.filter(item => item.type === "text").map(item => item.text).join("\n");
    expect(result.isError).not.toBe(true);
    expect(text).toMatch(/⚠️ अभी भी अमान्य: .+/u);
    expect(text).not.toContain("Sigue siendo inválido");
    expect(await readFile(invalidJson, "utf8")).toBe('{"a": }');
  });

  it("reports class names and line ranges in Hindi during structural preview", async () => {
    const result = await client.callTool({
      name: "cc_python_structural_edit",
      arguments: { path: pythonSource, operation: "inspect", mode: "preview" },
    });
    const content = result.content as Array<{ type: string; text?: string }>;
    const text = content.filter(item => item.type === "text").map(item => item.text).join("\n");
    expect(result.isError).not.toBe(true);
    expect(text).toContain("- क्लास Sample (पं.1-3)");
    expect(text).not.toContain("- classe Sample");
    expect(await readFile(pythonSource, "utf8")).toBe("class Sample:\n    pass\n");
  }, 20_000);
});
