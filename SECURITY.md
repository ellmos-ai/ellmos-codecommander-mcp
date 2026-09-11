# Security Policy / Sicherheitsrichtlinie

[English](#english) • [Deutsch](#deutsch)

---

<a name="english"></a>
## English

### Overview

`ellmos-codecommander-mcp` is a developer-focused Model Context Protocol (MCP) server providing 23 specialized tools for code analysis, AST inspection, structural Python editing, JSON repair, encoding fix, import organization, format conversion, file diff, regex testing, and language inspection. It operates locally with the running user's filesystem permissions via standard input/output (stdio JSON-RPC transport).

### Security Architecture & Invariants

1. **Local-First & Zero-Egress Guarantee**:
   - Standard operation runs 100% locally via stdio JSON-RPC without external network calls or telemetry.
   - Markdown-to-PDF conversion (`cc_md_to_pdf`) utilizes locally installed headless browsers (Edge/Chrome) strictly for on-device PDF rendering, without transmitting document content externally.
   - Markdown exports HTML-escape document content, reject active URL schemes, block remote image loads, and emit a deny-by-default Content Security Policy.
2. **Non-Elevation (User-Mode Execution)**:
   - CodeCommander executes strictly with standard user privileges. It requires no administrative/root elevation or special kernel capabilities.
3. **Subprocess Isolation (`cc_runtime_import_diagnose`)**:
   - Project imports are executed in isolated, short-lived Python subprocesses bounded by strict timeouts to mitigate hanging processes and unintended side effects.
4. **Preview-First & Backup Safety**:
   - File-modifying operations (such as `cc_python_structural_edit`, `cc_fix_json`, `cc_fix_encoding`, `cc_organize_imports`) provide preview/dry-run capabilities and automatic `.bak` backup creation before applying destructive modifications.
5. **Path Traversal Protection**:
   - File paths are normalized and resolved within the caller's working directory context to prevent unauthorized directory traversal.

### Tool Risk Classification

| Tool | Risk Level | Safety Mechanisms |
|---|---|---|
| `cc_python_structural_edit` | Medium | Defaults to `mode=preview`; syntax verification before applying; automatic backup creation |
| `cc_organize_imports` | Medium | In-memory AST/regex parsing; dry-run preview mode supported |
| `cc_fix_json` | Medium | Non-destructive backup option; parser verification before saving |
| `cc_fix_encoding` | Medium | Heuristic encoding validation; automatic backup creation |
| `cc_cleanup_file` | Medium | Whitespace/BOM/NUL normalization with backup support |
| `cc_fix_umlauts` | Medium | Deterministic mapping; dry-run preview mode |
| `cc_convert_format` | Medium | Pure data serialization/deserialization into target output files |
| `cc_md_to_html` / `cc_md_to_pdf` | Medium | HTML escaping; remote-image blocking; deny-by-default CSP; headless browser process timeout |
| `cc_runtime_import_diagnose` | Caution | Isolated subprocess execution; strict timeouts; inspects untrusted target code |
| All Read-Only Tools (14 tools) | Low | Pure in-memory analysis; zero filesystem writes |

### Vulnerability Reporting

If you discover a security vulnerability in `ellmos-codecommander-mcp`:

1. **Direct Security Contact**: Send details via email to **security@ellmos.ai**, cc **support@lukasgeiger.com** and **security@open-bricks.org**.
2. **GitHub Advisory**: Alternatively, open a confidential report via [GitHub Security Advisories](https://github.com/ellmos-ai/ellmos-codecommander-mcp/security/advisories/new).
3. **Disclosure Timeline**: We acknowledge receipt within 24-48 hours (INV-SLA-10), provide structured triage within 5 business days, and provide a patch release within 7 days.

---

<a name="deutsch"></a>
## Deutsch

### Übersicht

`ellmos-codecommander-mcp` ist ein entwicklerfokussierter Model Context Protocol (MCP) Server mit 23 spezialisierten Werkzeugen für Code-Analyse, AST-Inspektion, strukturelle Python-Bearbeitung, JSON-Reparatur, Encoding-Korrektur, Import-Organisation, Formatkonvertierung, Datei-Diffs, Regex-Tests und Sprachinspektion. Er arbeitet lokal mit den Dateisystemrechten des ausführenden Benutzers über Standard-Input/Output (stdio JSON-RPC Transport).

### Sicherheitsarchitektur & Invarianten

1. **Local-First- & Zero-Egress-Garantie**:
   - Der reguläre Betrieb erfolgt zu 100 % lokal über stdio JSON-RPC ohne externe Netzwerkaufrufe oder Telemetrie.
   - Markdown-zu-PDF-Konvertierung (`cc_md_to_pdf`) nutzt lokal installierte Headless-Browser (Edge/Chrome) ausschließlich zur geräteinternen PDF-Erzeugung ohne Datenübertragung an Dritte.
   - Markdown-Exporte maskieren HTML-Inhalte, lehnen aktive URL-Schemata ab, blockieren entfernte Bildabrufe und setzen eine standardmäßig restriktive Content Security Policy.
2. **Non-Elevation (User-Mode-Betrieb)**:
   - CodeCommander läuft strikt mit normalen Benutzerberechtigungen und erfordert zu keinem Zeitpunkt administrative Rechte (keine Elevation/Root).
3. **Subprozess-Isolation (`cc_runtime_import_diagnose`)**:
   - Modul-Imports werden in isolierten, kurzlebigen Python-Subprozessen mit definierten Timeouts ausgeführt, um Hänger und unkontrollierte Nebeneffekte abzufangen.
4. **Preview-First- & Backup-Sicherheit**:
   - Dateiändernde Werkzeuge (`cc_python_structural_edit`, `cc_fix_json`, `cc_fix_encoding`, `cc_organize_imports`) bieten Vorschau-Modi (`dry_run` / `mode=preview`) und automatische `.bak`-Backups vor destruktiven Schreibvorgängen.
5. **Schutz vor Pfad-Traversal**:
   - Pfade werden normalisiert und im Kontext des Arbeitsverzeichnisses validiert, um unberechtigte Verzeichniszugriffe zu verhindern.

### Risikoklassifizierung der Werkzeuge

| Werkzeug | Risikostufe | Sicherheitsmechanismen |
|---|---|---|
| `cc_python_structural_edit` | Mittel | Standardmäßig `mode=preview`; Syntaxprüfung vor Schreibzugriff; automatische Backups |
| `cc_organize_imports` | Mittel | In-Memory AST/Regex-Verarbeitung; Dry-Run-Vorschau |
| `cc_fix_json` | Mittel | Nicht-destruktive Backups; Parser-Validierung |
| `cc_fix_encoding` | Mittel | Heuristische Encoding-Prüfung; automatisches Backup |
| `cc_cleanup_file` | Mittel | Normalisierung von Whitespace/BOM/NUL mit Backup-Unterstützung |
| `cc_fix_umlauts` | Mittel | Deterministisches Mapping; Dry-Run-Vorschau |
| `cc_convert_format` | Mittel | Reine Daten-Serialisierung in Zieldateien |
| `cc_md_to_html` / `cc_md_to_pdf` | Mittel | HTML-Maskierung; Blockierung entfernter Bilder; restriktive CSP; Timeout für Browser-Subprozesse |
| `cc_runtime_import_diagnose` | Erhöht | Isolierter Subprozess; strikte Timeouts; Analyse von Fremdcode |
| Alle lesenden Werkzeuge (14 Tools) | Niedrig | Reine In-Memory-Analyse; keine Dateisystemschreibzugriffe |

### Melden von Sicherheitslücken

Wenn Sie eine Sicherheitslücke in `ellmos-codecommander-mcp` entdecken:

1. **Direkter Sicherheitskontakt**: Senden Sie Details per E-Mail an **security@ellmos.ai**, in Kopie an **support@lukasgeiger.com** und **security@open-bricks.org**.
2. **GitHub Security Advisory**: Eröffnen Sie vertraulich eine Meldung unter [GitHub Security Advisories](https://github.com/ellmos-ai/ellmos-codecommander-mcp/security/advisories/new).
3. **Reaktionszeit**: Bestätigung innerhalb von 24-48 Stunden (INV-SLA-10), strukturierte Ersteinschätzung (Triage) innerhalb von 5 Werktagen und koordinierte Bereitstellung eines Sicherheitsupdates innerhalb von 7 Tagen.
