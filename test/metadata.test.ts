import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const RUNTIME_VERSION_PATTERN = /^\s*version:\s*"([^"]+)"/m;

const EXPECTED_TOOL_COUNT = 23;

type PackageMetadata = {
  name: string;
  version: string;
  mcpName: string;
  dependencies?: Record<string, string>;
  author?: string;
  license?: string;
  type?: string;
  files?: string[];
  repository?: { type: string; url: string };
  bugs?: { url: string };
  homepage?: string;
};

type PackageLockMetadata = {
  version: string;
  packages: Record<string, {
    version?: string;
    dependencies?: Record<string, string>;
  }>;
};

function semverAtLeast(version: string, minimum: string): boolean {
  const current = version.replace(/^[^0-9]*/, "").split(".").map(Number);
  const floor = minimum.split(".").map(Number);
  return floor.every((part, index) => (current[index] ?? 0) === part)
    || current.some((part, index) => part !== (floor[index] ?? 0)
      && part > (floor[index] ?? 0)
      && current.slice(0, index).every((value, prefix) => value === (floor[prefix] ?? 0)));
}

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
  it("keeps the TOON decoder on the prototype-pollution fix", async () => {
    const pkg = await readJson<PackageMetadata>("package.json");
    const lock = await readJson<PackageLockMetadata>("package-lock.json");
    const declaredVersion = pkg.dependencies?.["@toon-format/toon"];
    const lockedVersion = lock.packages["node_modules/@toon-format/toon"]?.version;

    expect(declaredVersion).toBeDefined();
    expect(lockedVersion).toBeDefined();
    expect(semverAtLeast(declaredVersion ?? "0.0.0", "2.3.1")).toBe(true);
    expect(semverAtLeast(lockedVersion ?? "0.0.0", "2.3.1")).toBe(true);
    expect(lock.packages[""]?.version).toBe(pkg.version);
  });

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
    expect(pkg.files).toContain("THIRD_PARTY_LICENSES.md");
    expect(pkg.files).toContain("MARKETING-LOG.txt");
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
      "THIRD_PARTY_LICENSES.md",
      "MARKETING-LOG.txt",
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
      expect(content).toContain("badge/tests-292%20passed%20%7C%20100%25-brightgreen.svg");
      expect(content).toContain("badge/Privacy-100%25%20Offline%20%7C%20Zero--Egress-success.svg");
      expect(content).toContain("badge/Security-Local--First%20%7C%20Preview--Safe-blue.svg");
      expect(content).toContain("badge/security-48h%20Response%20%7C%205d%20Triage-blue.svg");
      expect(content).toContain("badge/third--party-audited-success.svg");
      expect(content).toContain("badge/marketing-audited-blueviolet.svg");
    }
  });

  it("verifies llms.txt contains version, tool count, security invariants and test parity", async () => {
    const pkg = await readJson<PackageMetadata>("package.json");
    const llms = await readText("llms.txt");

    expect(llms).toContain(pkg.version);
    expect(llms).toContain(`${EXPECTED_TOOL_COUNT} tools`);
    expect(llms).toContain("ellmos-filecommander-mcp");
    expect(llms).toContain("open-bricks");
    expect(llms).toContain("Last-checked: 2026-09-13");
    expect(llms).toContain("292 tests passed");
    expect(llms).toContain("Zero-Egress");
    expect(llms).toContain("INV-LOCAL-01");
    expect(llms).toContain("THIRD_PARTY_LICENSES.md");
    expect(llms).toContain("MARKETING-LOG.txt");
    expect(llms).not.toContain("automation-master");
  });

  it("verifies security policy is bilingual and declares authorized contact addresses", async () => {
    const sec = await readText("SECURITY.md");
    expect(sec).toContain("Security Policy");
    expect(sec).toContain("Sicherheitsrichtlinie");
    expect(sec).toContain("security@ellmos.ai");
    expect(sec).toContain("support@lukasgeiger.com");
    expect(sec).toContain("security@open-bricks.org");
    expect(sec).toContain("23 specialized tools");
    expect(sec).toContain("23 spezialisierten Werkzeugen");
    expect(sec).toContain("Zero-Egress");
    expect(sec).toContain("Subprocess Isolation");
  });

  it("verifies GitHub Actions CI workflow matrices include Node 20, 22, and 24 across multi-OS with concurrency", async () => {
    const ci = await readText(".github/workflows/tests.yml");
    expect(ci).toContain("[20, 22, 24]");
    expect(ci).toContain("[ubuntu-latest, windows-latest, macos-latest]");
    expect(ci).toContain("timeout-minutes: 15");
    expect(ci).toContain("actions/checkout@v4");
    expect(ci).toContain("actions/setup-node@v4");
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
      "THIRD_PARTY_LICENSES.md",
      "MARKETING-LOG.txt",
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

    expect(readmeDe).toContain("```mermaid\ngraph TD");
    expect(readmeDe).toContain("```mermaid\nsequenceDiagram");
  });

  it("verifies sibling tools matrix across ellmos-ai, dev-bricks, doc-bricks, and open-bricks", async () => {
    for (const fileName of ["README.md", "README_de.md"]) {
      const content = await readText(fileName);
      expect(content).toContain("DevCenter");
      expect(content).toContain("CodeBox");
      expect(content).toContain("MethodenAnalyser");
      expect(content).toContain("PDFtoPDFocr");
      expect(content).toContain("ProFiler");
      expect(content).toContain("sqlite-transit-sync");
      expect(content).toContain("policy-registry");
      expect(content).not.toContain("automation-master");
    }
  });

  it("verifies 17-point quick navigation parity across English and German READMEs", async () => {
    const readmeEn = await readText("README.md");
    const readmeDe = await readText("README_de.md");

    expect(readmeEn).toContain("## Quick Navigation");
    expect(readmeDe).toContain("## Schnellnavigation");

    for (let i = 1; i <= 17; i++) {
      const enItem = `${i}. [`;
      const deItem = `${i}. [`;
      const enHeading = `## ${i}. `;
      const deHeading = `## ${i}. `;

      expect(readmeEn).toContain(enItem);
      expect(readmeDe).toContain(deItem);
      expect(readmeEn).toContain(enHeading);
      expect(readmeDe).toContain(deHeading);
    }

    expect(readmeEn).toContain('id="target-personas--discoverability"');
    expect(readmeDe).toContain('id="zielgruppen--auffindbarkeit"');
    expect(readmeEn).toContain('id="comparative-matrix-vs-alternatives"');
    expect(readmeDe).toContain('id="vergleichsmatrix-gegenueber-alternativen"');
    expect(readmeEn).toContain('id="third-party-licenses--transparency"');
    expect(readmeDe).toContain('id="drittanbieter-lizenzen--transparenz"');
  });

  it("verifies target personas and comparative matrix in English and German READMEs", async () => {
    for (const fileName of ["README.md", "README_de.md"]) {
      const content = await readText(fileName);
      expect(content).toContain("[PERSONA-1]");
      expect(content).toContain("[PERSONA-2]");
      expect(content).toContain("[PERSONA-3]");
      expect(content).toContain("[PERSONA-4]");
      expect(content).toContain("INV-LOCAL-01");
      expect(content).toContain("INV-SLA-10");
    }
  });

  it("verifies 10 governance and runtime invariants table in English and German READMEs", async () => {
    const expectedInvariants = [
      "INV-LOCAL-01",
      "INV-SEC-02",
      "INV-PREV-03",
      "INV-BAK-04",
      "INV-ISOL-05",
      "INV-GATE-06",
      "INV-ENC-07",
      "INV-FMT-08",
      "INV-I18N-09",
      "INV-SLA-10",
    ];

    for (const fileName of ["README.md", "README_de.md"]) {
      const content = await readText(fileName);
      for (const inv of expectedInvariants) {
        expect(content).toContain(inv);
      }
    }
  });

  it("verifies THIRD_PARTY_LICENSES.md inventory, permissive licenses, and security guarantees", async () => {
    const content = await readText("THIRD_PARTY_LICENSES.md");

    expect(content).toContain("@modelcontextprotocol/sdk");
    expect(content).toContain("@toon-format/toon");
    expect(content).toContain("fast-xml-parser");
    expect(content).toContain("js-yaml");
    expect(content).toContain("smol-toml");
    expect(content).toContain("update-notifier");
    expect(content).toContain("zod");
    expect(content).toContain("typescript");
    expect(content).toContain("vitest");

    expect(content).toContain("MIT");
    expect(content).toContain("BSD-2-Clause");
    expect(content).toContain("BSD-3-Clause");
    expect(content).toContain("Apache-2.0");

    expect(content).toContain("Zero-Egress");
    expect(content).toContain("RunAsInvoker");
    expect(content).toContain(".bak");
    expect(content).toContain("Subprocess Isolation");
  });

  it("verifies MARKETING-LOG.txt personas, search queries, competitive matrix, and invariants", async () => {
    const content = await readText("MARKETING-LOG.txt");

    expect(content).toContain("PRODUCT POSITIONING & VALUE PROPOSITION");
    expect(content).toContain("TARGET AUDIENCE & STAKEHOLDER PERSONAS");
    expect(content).toContain("[PERSONA-1]");
    expect(content).toContain("[PERSONA-2]");
    expect(content).toContain("[PERSONA-3]");
    expect(content).toContain("[PERSONA-4]");
    expect(content).toContain("HIGH-INTENT SEARCH QUERIES");
    expect(content).toContain("COMPETITIVE POSITIONING & COMPARISON MATRIX");
    expect(content).toContain("GOVERNANCE & RUNTIME INVARIANTS");
    expect(content).toContain("INV-LOCAL-01");
    expect(content).toContain("INV-SLA-10");
    expect(content).toContain("SIBLING ECOSYSTEM PARTNER MATRIX");
    expect(content).toContain("THREE-PHASE DISCOVERABILITY ROADMAP");
  });

  it("verifies .gitignore hardens against multi-host cloud-sync conflicts and lock contention", async () => {
    const gitignore = await readText(".gitignore");
    expect(gitignore).toContain("*.sync-conflict-*");
    expect(gitignore).toContain("*.conflict");
    expect(gitignore).toContain("*-CONFLIT-*");
    expect(gitignore).toContain("LOCK.*");
    expect(gitignore).toContain("LOCK");
    expect(gitignore).toContain("!package-lock.json");
    expect(gitignore).toContain(".coverage*");
    expect(gitignore).toContain(".pytest_cache/");
  });

  it("verifies CHANGELOG.md contains recent Pfad A and Pfad B release entries", async () => {
    const content = await readText("CHANGELOG.md");

    expect(content).toContain("## [1.3.26] - 2026-09-13");
    expect(content).toContain("Discoverability, Personas & Comparison Parity (Pfad B)");
    expect(content).toContain("## [1.3.25] - 2026-09-11");
    expect(content).toContain("Repository Hygiene, CI Hardening & Multi-Host Defense (Pfad A)");
    expect(content).toContain("## [1.3.24] - 2026-09-10");
    expect(content).toContain("INV-LOCAL-01");
    expect(content).toContain("THIRD_PARTY_LICENSES.md");
    expect(content).toContain("MARKETING-LOG.txt");
    expect(content).toContain("Quick Navigation");
  });
});
