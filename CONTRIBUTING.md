# Contributing to ellmos CodeCommander MCP Server / Mitwirken am ellmos CodeCommander MCP Server

[English](#english-contributing-guidelines) | [Deutsch](#deutsche-mitwirkungs-richtlinien)

---

<a id="english-contributing-guidelines"></a>
## English: Contributing Guidelines

Thank you for your interest in contributing to **ellmos-codecommander-mcp**! CodeCommander is an open-source, developer-focused Model Context Protocol (MCP) server providing 23 precision code intelligence and text repair tools for AI coding assistants.

### 1. Architectural Principles & Core Invariants

All contributions must strictly uphold the 10 core governance and runtime invariants:

| Invariant ID | Classification | Architectural Guarantee & Verification Mechanism |
| :--- | :--- | :--- |
| `INV-LOCAL-01` | Zero-Egress Privacy | Pure local stdio JSON-RPC transport; zero network telemetry, cloud beacons, or remote egress. |
| `INV-SEC-02` | Unprivileged Security | Standard user-space execution (`RunAsInvoker`) requiring zero root or administrative elevation. |
| `INV-PREV-03` | Preview Safety | Structural edits default to non-mutating preview mode (`mode: "preview"`) with unified diff generation. |
| `INV-BAK-04` | Automatic Backups | File modifications automatically generate timestamped `.bak` files before in-place disk writes. |
| `INV-ISOL-05` | Subprocess Isolation | Python runtime import diagnosis executes in isolated, timeout-bounded child processes. |
| `INV-GATE-06` | Explicit Language Gates | Python-specific path tools reject non-`.py` files explicitly; JS/TS analysis is read-only and regex-based. |
| `INV-ENC-07` | Non-Destructive Encoding | Repaired text restores 27+ Mojibake and 70+ German umlaut patterns without loss or binary corruption. |
| `INV-FMT-08` | Format Interchange Parity | Lossless format conversions across JSON, CSV, INI, YAML, TOML, XML, and TOON with schema preservation. |
| `INV-I18N-09` | Runtime Multi-Language | Dynamic runtime language switching across 6 languages (EN, DE, ES, ZH, JA, RU) via `cc_set_language`. |
| `INV-SLA-10` | Security & Governance SLA | Multi-OS CI (Ubuntu, Windows, macOS across Node 20, 22, 24), binding 48h vulnerability response SLA, and 30d remediation SLA. |

### 2. Unprivileged Execution (`RunAsInvoker`)

CodeCommander is designed to run in standard user space. Pull requests introducing features that require administrative permissions, UAC prompts, Windows Service installations, or kernel hooks will be rejected.

### 3. Plan D Local Development Workflow

Code development follows the **Plan D canonical local clone workflow**:
- **Canonical Git Workspace:** Local clones reside in dedicated developer paths (e.g. `C:\_Local_DEV\repos\ellmos-codecommander-mcp`).
- **Cloud-Sync Isolation:** Never run Git operations directly within active cloud-synchronized folders (OneDrive, Dropbox, iCloud) to prevent file-locking contention (`cldflt.sys`) and metadata desynchronization.
- **Lock Protection:** Respect multi-agent lock markers (`LOCK.user.*`, `LOCK.until.*`, `LOCK.condition.*`).

### 4. Getting Started & Quality Gates

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ellmos-ai/ellmos-codecommander-mcp.git
   cd ellmos-codecommander-mcp
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Build TypeScript sources:**
   ```bash
   npm run build
   ```
4. **Run the full test suite (300 assertions):**
   ```bash
   npm run test:all
   ```
   This executes:
   - `npm run build`: Compiles TypeScript to `dist/index.js`
   - `npm test`: Runs Vitest unit & metadata contract test suite (205 tests)
   - `npm run test:integration`: Verifies live stdio MCP JSON-RPC protocol roundtrips (52 tests)
   - `npm run test:i18n`: Tests German/English localization template engines (43 tests)

### 5. Pull Request Guidelines

- **Strict Type Safety:** All code must be written in TypeScript with `strict: true` and zero compiler warnings.
- **Contract Tests:** Every new tool or behavioral modification must include corresponding unit tests in `test/index.test.ts` or `test/test_new_tools.mjs` and contract assertions in `test/metadata.test.ts`.
- **Zero Copyleft:** Only dependencies with permissive open-source licenses (MIT, BSD-2-Clause, BSD-3-Clause, Apache-2.0) are acceptable. No GPL, AGPL, or SSPL libraries.
- **Clean Git State:** Keep commits atomic, well-described, and free of trailing whitespace or temporary artifacts.

### 6. Security & Vulnerability Reporting

Security vulnerabilities must be reported confidentially:
- **Email:** `security@ellmos.ai`, `support@lukasgeiger.com`, or `security@open-bricks.org`
- **Advisory Portal:** [GitHub Security Advisories](https://github.com/ellmos-ai/ellmos-codecommander-mcp/security/advisories/new)
- **SLA Commitment:** Initial response within **48 hours**, triage within **5 calendar days**, and patch remediation within **30 calendar days** (`INV-SLA-10`).

### 7. Statutory Notice & Liability Limitation (§ 521 BGB)

CodeCommander is provided free of charge under the MIT License as an open-source tool. In accordance with the statutory provisions of German gratuitous contract law (§ 521 BGB - *Schenkungsrecht/Gefälligkeitsrecht*), liability for damages is limited to intent (*Vorsatz*) and gross negligence (*grobe Fahrlässigkeit*).

---

<a id="deutsche-mitwirkungs-richtlinien"></a>
## Deutsch: Mitwirkungs-Richtlinien

Vielen Dank für Ihr Interesse an einer Mitwirkung an **ellmos-codecommander-mcp**! CodeCommander ist ein quelloffener, entwicklerorientierter Model Context Protocol (MCP) Server, der KI-Coding-Assistenten 23 hochpräzise Code-Analyse- und Textreparatur-Werkzeuge bereitstellt.

### 1. Architektur-Prinzipien & Kern-Invarianten

Alle Beiträge müssen die 10 Governance- und Laufzeit-Invarianten strikt einhalten:

| Invarianten-ID | Klassifizierung | Architektonische Garantie & Prüfmechanismus |
| :--- | :--- | :--- |
| `INV-LOCAL-01` | Zero-Egress Privatsphäre | Reiner lokaler Stdio JSON-RPC Transport; null Telemetrie, Tracking oder Netzwerkaufrufe. |
| `INV-SEC-02` | Unprivilegierte Sicherheit | Standard-Benutzerkontext (`RunAsInvoker`); keine Administrator- oder Root-Rechte erforderlich. |
| `INV-PREV-03` | Vorschau-Sicherheit | Strukturelle Python-Edits laufen standardmäßig im Vorschau-Modus (`mode: "preview"`) mit Unified Diff. |
| `INV-BAK-04` | Automatische Backups | Dateiänderungen erzeugen vor dem Schreiben deterministische, zeitgestempelte `.bak`-Sicherungen. |
| `INV-ISOL-05` | Subprozess-Isolation | Python-Laufzeit-Importdiagnosen laufen in isolierten Kindprozessen mit harten Timeouts. |
| `INV-GATE-06` | Explizite Sprachschranken | Python-Tools weisen Nicht-`.py`-Dateien explizit ab; JS/TS-Analyse ist rein lesend und regex-basiert. |
| `INV-ENC-07` | Verlustfreie Kodierung | Repariert 27+ Mojibake- und 70+ deutsche Umlaut-Fehler ohne binäre Datenbeschädigung. |
| `INV-FMT-08` | Format-Parität | Verlustfreie Konvertierung zwischen JSON, CSV, INI, YAML, TOML, XML und TOON mit Typtreue. |
| `INV-I18N-09` | Dynamische Mehrsprachigkeit | Umschaltbare Lokalisierung über 6 Sprachen (EN, DE, ES, ZH, JA, RU) via `cc_set_language`. |
| `INV-SLA-10` | Governance & SLA | Multi-OS CI (Ubuntu, Windows, macOS auf Node 20/22/24), 48h Reaktions-SLA und 30d Behebungs-SLA. |

### 2. Unprivilegierte Ausführung (`RunAsInvoker`)

CodeCommander operiert vollständig im unprivilegierten Benutzerraum. Beiträge, die Administratorrechte, UAC-Abfragen, Dienstinstallationen oder Kernel-Treiber erfordern, werden grundsätzlich abgelehnt.

### 3. Plan D Entwicklungs-Workflow

Die Softwareentwicklung folgt dem **Plan D Standard**:
- **Kanonischer Klon:** Lokale Git-Arbeitskopien liegen in dedizierten Entwicklungsordnern (z. B. `C:\_Local_DEV\repos\ellmos-codecommander-mcp`).
- **Cloud-Sync-Trennung:** Keine Git-Operationen in aktiven Cloud-Ordnern (OneDrive, Dropbox), um Dateisperren (`cldflt.sys`) und Metadaten-Konflikte zu vermeiden.
- **Sperrdisziplin:** Bestehende Multi-Agenten-Sperren (`LOCK.user.*`, `LOCK.until.*`) werden strikt respektiert.

### 4. Erste Schritte & Test-Gates

1. **Repository klonen:**
   ```bash
   git clone https://github.com/ellmos-ai/ellmos-codecommander-mcp.git
   cd ellmos-codecommander-mcp
   ```
2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```
3. **TypeScript kompilieren:**
   ```bash
   npm run build
   ```
4. **Vollständige Testsuite ausführen (300 Prüfungen):**
   ```bash
   npm run test:all
   ```

### 5. Pull-Request-Richtlinien

- **Strenge Typisierung:** Aller Code muss in TypeScript mit `strict: true` fehlerfrei kompilieren.
- **Vertragstests:** Jedes neue Tool muss entsprechende Unit-Tests in `test/index.test.ts` bzw. `test/test_new_tools.mjs` und Assertions in `test/metadata.test.ts` enthalten.
- **Lizenz-Kompatibilität:** Ausschließlich permissive Lizenzen (MIT, BSD, Apache-2.0). Kein Copyleft (GPL, AGPL).

### 6. Sicherheitsrichtlinie & 48h SLA

Sicherheitsrelevante Schwachstellen bitte vertraulich melden:
- **E-Mail:** `security@ellmos.ai`, `support@lukasgeiger.com` oder `security@open-bricks.org`
- **GitHub Advisories:** [GitHub Security Advisories](https://github.com/ellmos-ai/ellmos-codecommander-mcp/security/advisories/new)
- **SLA:** Erstprüfung innerhalb von **48 Stunden**, Triage innerhalb von **5 Kalendertagen**, Behebung innerhalb von **30 Kalendertagen** (`INV-SLA-10`).

### 7. Gesetzlicher Hinweis & Haftungsbeschränkung (§ 521 BGB)

Die Bereitstellung dieser Software erfolgt unentgeltlich unter den Bedingungen der MIT-Lizenz. Gemäß den gesetzlichen Bestimmungen des deutschen Schenkungs- und Gefälligkeitsrechts (§ 521 BGB) ist die Haftung des Bereitstellers auf Vorsatz und grobe Fahrlässigkeit beschränkt.
