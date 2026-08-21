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

  it("keeps the Glama directory manifest version aligned with package.json", async () => {
    const pkg = await readJson<PackageMetadata>("package.json");
    const glama = await readJson<{ name: string; version: string }>("glama.json");

    expect(glama.name).toBe(pkg.name);
    expect(glama.version).toBe(pkg.version);
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

  it("verifies presence of required core documentation and configuration files", async () => {
    const requiredFiles = [
      "README.md",
      "README_de.md",
      "CHANGELOG.md",
      "SECURITY.md",
      "LICENSE",
      "server.json",
      "glama.json",
      "smithery.yaml",
      "llms.txt",
    ];

    for (const file of requiredFiles) {
      const content = await readText(file);
      expect(content.length).toBeGreaterThan(50);
    }
  });

  it("verifies ecosystem badges and links in English and German READMEs", async () => {
    for (const fileName of ["README.md", "README_de.md"]) {
      const content = await readText(fileName);
      expect(content).toContain("badge/ellmos--ai-Ecosystem-blue.svg");
      expect(content).toContain("badge/open--bricks-Umbrella-purple.svg");
      expect(content).toContain("badge/LLM--Ready-llms.txt-blue.svg");
      expect(content).toContain("https://github.com/ellmos-ai");
      expect(content).toContain("https://github.com/open-bricks");
      expect(content).toContain("badge/Vitest-183%20passed-brightgreen.svg");
      expect(content).toContain("badge/Privacy-100%25%20Offline%20%7C%20Zero--Egress-success.svg");
      expect(content).toContain("badge/Security-Local--First%20%7C%20Preview--Safe-blue.svg");
    }
  });

  it("verifies llms.txt contains version, tool count, security invariants and test parity", async () => {
    const pkg = await readJson<PackageMetadata>("package.json");
    const llms = await readText("llms.txt");

    expect(llms).toContain(pkg.version);
    expect(llms).toContain("22 tools");
    expect(llms).toContain("ellmos-filecommander-mcp");
    expect(llms).toContain("open-bricks");
    expect(llms).toContain("Last-checked: 2026-08-21");
    expect(llms).toContain("261 tests passed");
    expect(llms).toContain("Zero-Egress");
  });

  it("verifies security policy is bilingual and declares authorized contact addresses", async () => {
    const sec = await readText("SECURITY.md");
    expect(sec).toContain("Security Policy");
    expect(sec).toContain("Sicherheitsrichtlinie");
    expect(sec).toContain("security@ellmos.ai");
    expect(sec).toContain("support@lukasgeiger.com");
    expect(sec).toContain("Zero-Egress");
    expect(sec).toContain("Subprocess Isolation");
  });

  it("verifies GitHub Actions CI workflow matrices include Node 20, 22, and 24", async () => {
    const ci = await readText(".github/workflows/tests.yml");
    expect(ci).toContain("[20, 22, 24]");
    expect(ci).toContain("npm test");
    expect(ci).toContain("npm run test:integration");
    expect(ci).toContain("npm run test:i18n");
  });

  it("verifies Mermaid diagrams in both English and German READMEs", async () => {
    const readmeEn = await readText("README.md");
    const readmeDe = await readText("README_de.md");

    expect(readmeEn).toContain("```mermaid\ngraph TD");
    expect(readmeEn).toContain("```mermaid\nsequenceDiagram");
    expect(readmeEn).toContain("Code Intelligence & Safe Structural Edit Lifecycle");

    expect(readmeDe).toContain("```mermaid\ngraph TD");
    expect(readmeDe).toContain("```mermaid\nsequenceDiagram");
    expect(readmeDe).toContain("Code-Intelligenz- und sicherer struktureller Edit-Lebenszyklus");
  });

  it("verifies sibling tools matrix across ellmos-ai, dev-bricks, doc-bricks, and open-bricks", async () => {
    for (const fileName of ["README.md", "README_de.md"]) {
      const content = await readText(fileName);
      expect(content).toContain("DevCenter");
      expect(content).toContain("CodeBox");
      expect(content).toContain("MethodenAnalyser");
      expect(content).toContain("PDFtoPDFocr");
      expect(content).toContain("DokuReader");
      expect(content).toContain("ProFiler");
      expect(content).toContain("sqlite-transit-sync");
      expect(content).toContain("policy-registry");
    }
  });
});
