import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const RUNTIME_VERSION_PATTERN = /^\s*version:\s*"([^"]+)"/m;

/**
 * The tool count is counted in src/index.ts instead of being hand-maintained here.
 * A constant would have to be edited by the same change it is supposed to guard,
 * which turns the test into a rubber stamp.
 */
async function countRegisteredTools(): Promise<number> {
  const source = await readText("src/index.ts");
  const names = new Set(source.match(/"cc_[a-z0-9_]+"/g) ?? []);
  return names.size;
}

/**
 * Documentation surfaces that must agree with each other on every number.
 */
const DOC_SURFACES = ["README.md", "README_de.md", "llms.txt"] as const;

type PackageMetadata = {
  name: string;
  version: string;
  mcpName: string;
  author?: string;
  license?: string;
  type?: string;
  files?: string[];
  repository?: { type: string; url: string };
  bugs?: { url: string };
  homepage?: string;
};

type TsConfigMetadata = {
  compilerOptions?: {
    target?: string;
    module?: string;
    moduleResolution?: string;
    strict?: boolean;
  };
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
  const content = await readFile(new URL(`../${relativePath}`, import.meta.url), "utf-8");
  return content.replace(/\r\n/g, "\n");
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
    const toolCount = await countRegisteredTools();

    for (const fileName of ["README.md", "README_de.md"]) {
      const row = codeCommanderFamilyRow(await readText(fileName));

      expect(row).toContain(`**${toolCount}**`);
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
      expect(content).toMatch(/badge\/Vitest-\d+%20passed-brightgreen\.svg/);
      expect(content).toContain("badge/Privacy-100%25%20Offline%20%7C%20Zero--Egress-success.svg");
      expect(content).toContain("badge/Security-Local--First%20%7C%20Preview--Safe-blue.svg");
    }
  });

  it("states the same Vitest test count on every documentation surface", async () => {
    const counts = new Map<string, string>();

    for (const fileName of ["README.md", "README_de.md"]) {
      const badge = (await readText(fileName)).match(/badge\/Vitest-(\d+)%20passed-brightgreen\.svg/);
      expect(badge, `Vitest badge in ${fileName}`).not.toBeNull();
      counts.set(fileName, badge?.[1] ?? "");
    }

    const llmsCount = (await readText("llms.txt")).match(/runs (\d+) Vitest tests/);
    expect(llmsCount, "Vitest count in llms.txt").not.toBeNull();
    counts.set("llms.txt", llmsCount?.[1] ?? "");

    expect(new Set(counts.values()).size, `diverging Vitest counts: ${JSON.stringify([...counts])}`).toBe(1);
  });

  it("does not advertise AST-based analysis, which the scanner does not do", async () => {
    // The static analysis in src/index.ts is line and pattern based -- the source
    // itself calls it an "AST-like parser". A real ast.parse only runs as a
    // subprocess syntax gate. Claiming AST-based extraction misleads users about
    // how the tool behaves on nested and multi-line constructs.
    for (const fileName of DOC_SURFACES) {
      const content = await readText(fileName);
      expect(content).not.toMatch(/AST[- ]based/i);
      expect(content).not.toMatch(/AST-basiert/i);
    }
  });

  it("verifies llms.txt contains version, tool count, security invariants and test parity", async () => {
    const pkg = await readJson<PackageMetadata>("package.json");
    const llms = await readText("llms.txt");
    const toolCount = await countRegisteredTools();

    expect(llms).toContain(pkg.version);
    expect(llms).toContain(`${toolCount} tools`);
    expect(llms).toContain("ellmos-filecommander-mcp");
    expect(llms).toContain("open-bricks");
    // Format, not a fixed date: pinning the literal made every refresh of the
    // freshness stamp fail the very test that asks for the stamp.
    expect(llms).toMatch(/Last-checked: \d{4}-\d{2}-\d{2}/);
    expect(llms).toContain("Zero-Egress");
    expect(llms).not.toContain("automation-master");
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

  it("verifies GitHub Actions CI workflow matrices include Node 20, 22, and 24 across multi-OS with concurrency", async () => {
    const ci = await readText(".github/workflows/tests.yml");
    expect(ci).toContain("[20, 22, 24]");
    expect(ci).toContain("[ubuntu-latest, windows-latest, macos-latest]");
    // Accept a version tag or a 40-character commit SHA. Pinning the literal
    // "@v4" made this test block the SHA pinning it exists to encourage.
    expect(ci).toMatch(/actions\/checkout@(v\d+(\.\d+)*|[0-9a-f]{40})/);
    expect(ci).toMatch(/actions\/setup-node@(v\d+(\.\d+)*|[0-9a-f]{40})/);
    expect(ci).toContain("cancel-in-progress: true");
    expect(ci).toContain("npm test");
    expect(ci).toContain("npm run test:integration");
    expect(ci).toContain("npm run test:i18n");
  });

  it("verifies package.json repository URLs, bugs tracker, author, and homepage integrity", async () => {
    const pkg = await readJson<PackageMetadata>("package.json");
    expect(pkg.repository?.url).toBe("git+https://github.com/ellmos-ai/ellmos-codecommander-mcp.git");
    expect(pkg.bugs?.url).toBe("https://github.com/ellmos-ai/ellmos-codecommander-mcp/issues");
    expect(pkg.homepage).toBe("https://github.com/ellmos-ai/ellmos-codecommander-mcp#readme");
    expect(pkg.license).toBe("MIT");
    expect(pkg.type).toBe("module");
  });

  it("verifies TypeScript compiler configuration enforces strict mode and ES2022 target", async () => {
    const tsconfig = await readJson<TsConfigMetadata>("tsconfig.json");
    expect(tsconfig.compilerOptions?.strict).toBe(true);
    expect(tsconfig.compilerOptions?.target).toBe("ES2022");
    expect(tsconfig.compilerOptions?.moduleResolution).toBe("Node16");
  });

  it("verifies package payload includes all essential documentation, schemas, and entrypoints", async () => {
    const pkg = await readJson<PackageMetadata>("package.json");
    const essentialFiles = [
      "dist/",
      "LICENSE",
      "README.md",
      "README_de.md",
      "CHANGELOG.md",
      "SECURITY.md",
      "server.json",
      "glama.json",
      "smithery.yaml",
      "llms.txt",
    ];
    for (const f of essentialFiles) {
      expect(pkg.files).toContain(f);
    }
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
      expect(content).not.toContain("automation-master");
    }
  });
});
