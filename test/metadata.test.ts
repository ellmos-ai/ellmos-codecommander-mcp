import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const RUNTIME_VERSION_PATTERN = /^\s*version:\s*"([^"]+)"/m;

const EXPECTED_TOOL_COUNT = 22;

type PackageMetadata = {
  name: string;
  version: string;
  mcpName: string;
  files?: string[];
};

type ServerMetadata = {
  name: string;
  version: string;
  packages: Array<{
    identifier: string;
    version: string;
  }>;
};

async function readText(relativePath: string): Promise<string> {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf-8");
}

async function readJson<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readText(relativePath)) as T;
}

function codeCommanderFamilyRow(readme: string): string {
  const row = readme
    .split(/\r?\n/)
    .find((line) => line.includes("ellmos-codecommander-mcp") && line.includes("CodeCommander") && line.includes("|"));

  expect(row, "CodeCommander family row").toBeDefined();
  return row ?? "";
}

describe("project metadata", () => {
  it("keeps package and MCP Registry metadata versions aligned", async () => {
    const pkg = await readJson<PackageMetadata>("package.json");
    const server = await readJson<ServerMetadata>("server.json");

    expect(server.name).toBe(pkg.mcpName);
    expect(server.version).toBe(pkg.version);
    expect(server.packages[0]?.identifier).toBe(pkg.name);
    expect(server.packages[0]?.version).toBe(pkg.version);
  });

  it("keeps the McpServer runtime version in src/index.ts aligned with package.json", async () => {
    const pkg = await readJson<PackageMetadata>("package.json");
    const source = await readText("src/index.ts");
    const match = source.match(RUNTIME_VERSION_PATTERN);

    expect(match, "src/index.ts should declare a McpServer runtime version").not.toBeNull();
    expect(match?.[1]).toBe(pkg.version);
  });

  it("keeps README family tool counts aligned with the current tool surface", async () => {
    for (const fileName of ["README.md", "README_de.md"]) {
      const row = codeCommanderFamilyRow(await readText(fileName));

      expect(row).toContain(`**${EXPECTED_TOOL_COUNT}**`);
      expect(row).not.toContain("**17**");
    }
  });

  it("ships the LLM discovery index in the npm package payload", async () => {
    const pkg = await readJson<PackageMetadata>("package.json");

    expect(pkg.files).toContain("llms.txt");
  });
});
