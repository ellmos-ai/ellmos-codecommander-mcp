# Mehrsprachigkeits-Analyse — CodeCommander MCP

**Ticket:** T-20260825-441857220 (Ticket-Master ASUS-GEI)
**Datum:** 2026-08-25
**Charakter:** Reine Analyse — keine Implementierung, kein Commit, kein Push, keine Codeänderung.
**Repo:** `C:\_Local_DEV\repos\ellmos-codecommander-mcp` (Node/TypeScript MCP-Server, npm-Paket `ellmos-codecommander-mcp`, v1.3.24, 23 Tools)
**Nutzerfrage (Wortlaut):** „codecommander ist ja auf python ausgerichtet sollten wir dies ergaenzen und funktionen fuer andere programmiersprachen einbinden?"

---

## 1. Ist-Matrix: Sprachbindung je Tool

Grundlage: vollständige Lektüre von `src/index.ts` (3.838 Zeilen, alle 23 `server.registerTool`/`server.tool`-Aufrufe). Der Server hat **keine** Parsing-Abhängigkeit (`package.json`-Dependencies sind ausschließlich Format-Parser: `js-yaml`, `smol-toml`, `fast-xml-parser`, `@toon-format/toon`, `zod`, das MCP-SDK) — die gesamte „Python-Analyse" ist **regex-/zeilenbasiert**, keine echte AST-Bibliothek. Einzige echte Python-Abhängigkeit ist ein Shell-Out zu einem lokal installierten `python`-Interpreter für zwei Zwecke: Syntax-Check via `ast.parse` (in `checkPythonSyntax`) und isolierte Laufzeit-Imports (in `runIsolatedPythonImport`).

**Korrektur der Ausgangsmessung:** Die Ticket-Vorgabe nennt „8 von 23 Tools hart Python-gebunden". Die Nachzählung anhand des Quellcodes ergibt **9 von 23**, da `cc_check_indentation` (Titel im Code: „Check Python Indentation", Kernfunktion `checkPythonIndentationContent` ist zeilenbasiert auf Python-Einrückungsregeln zugeschnitten) in der ursprünglichen Zählung fehlt. Die Messung ist im Zweifel maßgeblich — die neun Tools sind im Folgenden vollständig aufgeführt.

### 1.1 Hart Python-gebundene Tools (9)

| Tool | Sprachbindung | Was bei TS/JS/Luau heute passiert |
|---|---|---|
| `cc_analyze_code` | Regex auf Python-Syntax (`class X:`, `def x():`, `import`/`from`) | Keine Extension-Prüfung im Code. Wird eine `.ts`-Datei übergeben, liefert das Tool **keinen Fehler**, sondern ein irreführendes Ergebnis: TS-Klassen (`class Foo {`) enden nicht auf `:`, TS-Funktionen nicht auf `def`, ES-Module-Imports (`import { Foo } from 'bar'`) matchen den Python-Import-Regex teilweise falsch (`{` würde als „Modulname" erkannt). Ergebnis ist typischerweise „0 Klassen, 0 Funktionen, falsche Import-Liste" — stiller Fehlbefund statt expliziter Ablehnung. |
| `cc_analyze_methods` | Regex + Python-spezifische „BACH-Guardrails" (Sichtbarkeits-/Decorator-Konventionen) | Dieselbe Fehlbefund-Klasse wie oben; zusätzlich sind die Guardrail-Regeln (z. B. `@staticmethod`, `_private`-Konvention) genuin Python-semantisch. |
| `cc_extract_classes` | Extrahiert Python-Klassen/Funktionen via `analyzePythonCode` | Auf Nicht-Python-Dateien: leere/falsche Extraktion, kein Fehlerhinweis. |
| `cc_organize_imports` | PEP-8-Gruppierung (`__future__`/stdlib/third-party/local), Regex `^import `/`^from ` | Erkennt ES-Module-Syntax (`import x from 'y'`) nur zufällig als „Import-Zeile", sortiert sie aber nach Python-Stdlib-Heuristik (`classifyImport`) — semantisch bedeutungslos für TS/JS. |
| `cc_diagnose_imports` | Baut auf `analyzePythonCode` auf | Erbt dieselbe Fehlbefund-Klasse. |
| `cc_check_indentation` | Titel im Code: „Check Python Indentation"; prüft fehlende Doppelpunkte, nicht eingerückte `return`/`yield`, Tab/Space-Mix | Für TS/JS (klammernbasiert, kein signifikanter Whitespace) und Luau (ebenfalls klammern-/keyword-basiert, `end` statt `}`) sachlich unanwendbar. |
| `cc_generate_python_code` | Template-Generator explizit für Python (Funktionen, Klassen, Dataclasses, CLI-Stubs, Tests, Exceptions, Module) | Kein Analogon für andere Sprachen; Tool-Name und Beschreibung sind bereits explizit Python-only. |
| `cc_runtime_import_diagnose` | Startet echten `python`-Subprozess, analysiert `__init__.py`, erkennt zirkuläre Imports zur Laufzeit | Genuin Python-spezifisch (nutzt `sys`, `ast`, Python-Modulauflösung) — für TS/JS bräuchte ein Äquivalent `node --experimental-vm-modules` o. ä., für Luau gibt es kein Analogon (Roblox hat kein Laufzeit-Modulsystem in diesem Sinn). |
| `cc_python_structural_edit` | Preview/Test/Apply-Workflow für strukturelle Python-Edits (insert/delete/replace_line/inspect/create_edit_file/merge_edit_file), Blockgrenzen über **Einrückung**, Sicherheitsnetz über echten `python -c "ast.parse(...)"`-Syntax-Check vor jedem `apply` | Das mit Abstand aufwendigste und wertvollste Tool der Familie — und das am tiefsten Python-verankerte: Blockende-Erkennung (`findPythonBlockEnd`) ist explizit einrückungsbasiert, funktioniert für klammernbasierte Sprachen (TS/JS/Luau) nicht. |

### 1.2 Sprachneutrale Tools (14)

| Tool | Funktion |
|---|---|
| `cc_fix_json` / `cc_validate_json` | JSON-Reparatur/-Validierung — sprachunabhängig |
| `cc_fix_encoding` / `cc_fix_umlauts` / `cc_cleanup_file` / `cc_scan_emoji` | Text-/Encoding-Werkzeuge — sprachunabhängig |
| `cc_convert_format` | JSON/CSV/INI/YAML/TOML/XML/TOON — sprachunabhängig |
| `cc_generate_licenses` | Lizenzdatei-Generator (npm/pip) — bereits Multi-Ökosystem |
| `cc_md_to_html` / `cc_md_to_pdf` | Markdown-Export — sprachunabhängig |
| `cc_diff_files` | Unified Diff (eigene LCS-Implementierung) — sprachunabhängig |
| `cc_regex_test` | Regex-Tester — sprachunabhängig |
| `cc_set_language` / `cc_get_language` | Meta (UI-Ausgabesprache der Tools selbst, 7 Locales: de/en/es/ja/ru/zh + Fallback) — nicht zu verwechseln mit Programmiersprachen |

**Befund:** Die Nutzerfrage trifft zu — 9 von 23 Tools (39 %), darunter die funktional wertvollsten (Structural Edit, Runtime-Diagnose, Code-Generierung), sind hart auf Python zugeschnitten, ohne Sprachprüfung und mit stillem Fehlbefund statt Fehlermeldung bei Fremdsprachen-Input. Das Stillschweigen bei falscher Sprache ist unabhängig von der Erweiterungsfrage bereits ein eigenständiger Korrektheits-Mangel (nicht Gegenstand dieses Tickets, aber erwähnenswert).

---

## 2. Abgrenzung zu den LSP-Plugins (pyright-lsp, typescript-lsp)

Seit 2026-08-25 sind auf diesem System die offiziellen Claude-Code-LSP-Plugins installiert (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/`): **pyright-lsp** (`.py`, `.pyi`, via Microsoft Pyright), **typescript-lsp** (`.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.cts`, `.mjs`, `.cjs`, via `typescript-language-server`), sowie u. a. **lua-lsp** (nur `.lua`, via `lua-language-server` — **deckt Luau nicht ab**, siehe Abschnitt 4.3).

### 2.1 Was die LSP-Plugins bereits leisten (und CodeCommander nicht duplizieren sollte)

- **Go-to-Definition, Find-References, Hover/Typ-Infos, Rename** — echte semantische Analyse mit Typauflösung, projektweit (nutzt `tsconfig.json`/`pyproject.toml`-Kontext).
- **Live-Diagnostik** (Typfehler, unerreichbarer Code, echte Datenfluss-Analyse) — für Python macht Pyright das, was `cc_analyze_methods`' Ambition „Sichtbarkeit/Datenfluss" nur oberflächlich (regex-basiert, ohne echte Typauflösung) nachbildet.
- Läuft als **persistenter, projektgebundener Sprachserver-Prozess**, der in die aktive Claude-Code-Session eingebunden ist.

**Konkrete Konsequenz für die Architektur:** Falls `cc_analyze_methods` künftig sprachübergreifend ausgebaut wird, sollte es bei **strukturellen** Fakten bleiben (Signaturen, Decorators/Attribute, Docstrings, Klassenzugehörigkeit) und **nicht** versuchen, echte Sichtbarkeits-/Datenfluss-Semantik nachzubauen — das ist der Job von pyright-lsp/typescript-lsp und wird von dort besser geleistet. Eine Dopplung würde nur eine schlechtere, unsynchronisierte Zweitquelle für Informationen schaffen, die die LSP-Plugins bereits korrekt liefern.

### 2.2 Was die LSP-Plugins strukturell nicht abdecken (die Nische von CodeCommander)

- **MCP-Tool statt Editor-Feature:** CodeCommander ist über MCP von jedem Client aus aufrufbar (auch n8n, andere Agenten, CI-Skripte) — nicht nur innerhalb einer interaktiven Claude-Code-Session mit laufendem Sprachserver.
- **Zustandslos pro Aufruf, kein Projektsetup nötig:** Kein `tsconfig.json`, kein laufender Server, keine Editor-Integration erforderlich — funktioniert auf einer einzelnen Datei ohne Projektkontext.
- **Preview-sicherer Drei-Stufen-Workflow** (`preview` → `test`-Datei → `apply` mit automatischem Backup + Syntax-Check), wie ihn `cc_python_structural_edit` bietet. LSP-Refactor-Provider (Code Actions) bieten punktuelle Umbauten, aber keinen skriptbaren, editorunabhängigen Drei-Stufen-Sicherheitsworkflow.
- **Batch-/Utility-Band** (JSON-Reparatur, Encoding-Fix, Format-Konvertierung, Lizenzgenerierung, Markdown-Export, Diff, Regex-Test) liegt komplett außerhalb des LSP-Skopus.
- **Kein Installationszwang:** Die LSP-Plugins funktionieren nur, wenn der jeweilige Sprachserver lokal installiert ist (`npm install -g pyright`/`typescript-language-server`); CodeCommander braucht dafür nichts.

**Schlussfolgerung Abschnitt 2:** Die Erweiterung soll **syntaktisch/strukturell/batch-orientiert** bleiben (Klassen/Funktionen finden, Blockgrenzen für Structural Edit, Importe sortieren) und explizit **nicht** in Richtung Typauflösung/Semantik wachsen — dafür sind die LSP-Plugins da, wo sie installiert sind, und CodeCommander bliebe sonst eine schlechtere Zweitlösung für denselben Zweck.

---

## 3. Architekturvorschlag: tree-sitter vs. Sprach-Einzellösungen

### 3.1 Option A — web-tree-sitter als sprachneutrale AST-Basis

**Mechanik:** `web-tree-sitter` (WASM-Bindings zu tree-sitter) lädt pro Sprache eine kompilierte `.wasm`-Grammatikdatei (`Language.load()`), liefert einen echten Syntaxbaum mit Knotenpositionen; sprachspezifische Abfragen (`.scm`-Query-Dateien) extrahieren Klassen/Funktionen/Importe. Offizielle Grammatiken existieren für TypeScript und JavaScript (`tree-sitter-typescript`, `tree-sitter-javascript`, vom tree-sitter-Kernprojekt gepflegt).

**Pro:**
- Eine gemeinsame Architektur für alle Zielsprachen statt N handgeschriebener Parser — neue Sprache = neue Grammatik + Query-Datei, kein neuer Parser-Algorithmus.
- Echte Syntaxbäume statt Regex-Näherung — behebt strukturell genau die Fehlerklasse, die die heutige Python-Regex-Lösung schon hat (z. B. verschachtelte Strukturen, mehrzeilige Konstrukte), und ist für klammernbasierte Sprachen (TS/JS/Luau) der einzige robuste Weg, Blockgrenzen korrekt zu bestimmen (String-/Template-Literal-/Regex-Literal-Inhalte dürfen Klammern enthalten, die ein naiver Klammernzähler fehlinterpretiert — klassisches Problem regexbasierter Brace-Matcher).
- Fehlertolerantes Parsen (Tree-sitter liefert auch bei syntaktisch kaputtem/halb bearbeitetem Code einen Teilbaum) — passt zum „Preview auf möglicherweise unfertigem Code"-Anwendungsfall.
- Reine WASM-Lösung, kein natives Kompilieren (kein `node-gyp`) nötig — plattformunabhängig verteilbar.

**Contra:**
- **Paketgröße/Distribution ist der wunde Punkt** (siehe 3.3) — heute ist `dist/` 547 KB, keine binäre/native Abhängigkeit; jede Grammatik bringt eine WASM-Datei mit (Größenordnung: das kuratierte Bundle `prebuilt-tree-sitter-wasm` liegt bei 3,7 MB für mehrere Sprachen zusammen; das volle `tree-sitter-typescript`-npm-Paket — inkl. nativer Quellen, nicht nur WASM — bei 38,8 MB). Das wäre der größte Einzelzuwachs in der Paketgeschichte.
- **ABI-Kopplung/Wartungslast:** Belegt (GitHub Issue tree-sitter/tree-sitter #5171, 2026): WASM-Dateien, die mit `tree-sitter-cli` 0.20.x gebaut wurden, sind mit `web-tree-sitter` 0.26.x **nicht kompatibel**. Grammatik-WASM und Runtime-Version müssen im Lockstep gepflegt/neu gebaut werden — eine laufende Wartungsverpflichtung, die heute nicht existiert.
- **Async-Umbau:** `Parser.init()` und `Language.load()` sind asynchron (Emscripten-Runtime-Initialisierung) — die heutigen Parsing-Funktionen (`analyzePythonCode` etc.) sind rein synchron; eine tree-sitter-Integration ist ein echter Architektur-Einschnitt, kein Drop-in.
- **Keine Semantik:** Tree-sitter liefert nur Syntax, keine Typauflösung — löst also nur die strukturellen Tools, nicht die Ambition „Sichtbarkeit/Datenfluss" in `cc_analyze_methods` (dafür bleiben ohnehin die LSP-Plugins zuständig, siehe Abschnitt 2).

### 3.2 Option B — Sprach-Einzellösungen (handgeschriebene Parser nach Python-Vorbild)

**Mechanik:** Für TS/JS und später Luau je ein eigenes, regex-/klammernbasiertes Analyse-Modul analog zu `analyzePythonCode`, mit eigener Blockende-Erkennung (Klammernzählung statt Einrückung).

**Pro:**
- Keine neue Abhängigkeit, kein Paketgrößenzuwachs, bleibt reines JS wie heute.
- Entspricht dem bereits etablierten, getesteten Muster (2.912 Testzeilen sichern die Python-Regex-Logik ab) — inkrementell risikoarm einführbar.
- Volle Kontrolle für sprachspezifische Eigenheiten (z. B. Luau-`--!strict`, generalisierte Iteration) ohne Abhängigkeit von externen Grammatik-Maintainern.

**Contra:**
- Korrektheits-Deckel liegt strukturell niedriger als bei einer echten Grammatik — Klammernzählung für JS/TS ist Standard-schwierig (Template-Literals mit eingebetteten Ausdrücken, Regex-Literale, ASI) und fehleranfälliger als das ohnehin schon fragile Python-Einrückungsmodell.
- N parallele Parser mit N eigenen Bug-Klassen, keine geteilte Grundlage — ein in einer Sprache gefundener Bug (z. B. String-Escaping-Fehler) überträgt sich nicht automatisch auf die anderen.
- Wartungsaufwand wächst linear mit jeder neuen Sprache, statt sich (wie bei tree-sitter) auf Query-Dateien zu amortisieren.

### 3.3 Bundling-/Distributionsfrage (der wunde Punkt)

Heute: `npm install -g ellmos-codecommander-mcp` bzw. `npx` — kein Postinstall-Schritt, kein natives Kompilieren, keine Netzwerkabhängigkeit zur Laufzeit. Das ist ein bewusstes Verkaufsargument für ein MCP-Registry-Tool (server.json/glama.json/smithery.yaml-gelistet).

Drei Distributionswege bei tree-sitter-Einsatz, mit Empfehlung:

1. **WASM im npm-Tarball ausliefern** (`files:`-Array erweitern) — Paket wächst von ~550 KB auf mehrere MB (grobe Hausnummer für TS+JS zusammen: einstellig bis niedrig zweistellig MB, je nach gewähltem WASM-Bundle), bleibt aber offline-installierbar — **das bewahrt die „keine Netzwerkabhängigkeit zur Laufzeit"-Eigenschaft, die heute besteht, und ist deshalb die empfohlene Variante.**
2. **Lazy-Download der Grammatik beim ersten Tool-Aufruf** — kleineres Basispaket, aber neue Netzwerkabhängigkeit + Cache-Verzeichnis + Versions-Pinning + Offline-Fehlermodus, den es heute nicht gibt — Bruch mit dem deterministischen, sandboxfähigen Charakter des Tools.
3. **Grammatiken als `optionalDependencies` pro Sprache** — ändert bei typischem `npx`-MCP-Start wenig (Installation bleibt meist monolithisch); sinnvoll höchstens kombiniert mit (1), nicht als Ersatz.

Unabhängig vom gewählten Weg: `Language.load()` pro Tool-Aufruf **lazy** (nur bei tatsächlicher Nutzung der jeweiligen Sprache), damit Nutzer, die nie TS/JS/Luau-Tools aufrufen, keine Laufzeit-/Speicherkosten tragen — nur die Paketgröße auf der Platte wächst.

### 3.4 Aufwand/Risiko je Kern-Tool bei tree-sitter-Umstellung (TS/JS)

| Tool | Aufwand | Risiko | Begründung |
|---|---|---|---|
| `analyze_code` (Äquivalent) | Mittel | Niedrig-Mittel | Query-Datei pro Sprache für Klassen/Funktionen/Importe; Traversal-Code wird geteilt. Hauptrisiko: Reifegrad der gewählten Grammatik-Version. |
| `extract_classes` (Äquivalent) | Mittel | Niedrig | Sobald Knotengrenzen aus `analyze_code` korrekt sind, ist das Slicing des Quelltexts nahezu identisch zur heutigen Python-Logik. |
| `analyze_methods` (Äquivalent) | Mittel-Hoch | Mittel | Mechanischer Teil (Methoden/Parameter/Decorators finden) ist Query-Arbeit; die Python-spezifischen „BACH-Guardrails" (Sichtbarkeit, Decorator-Konventionen) brauchen eine echte Neudefinition pro Sprache (TS hat `public`/`private`/`protected`-Keywords, Luau hat gar kein natives Sichtbarkeitskonzept) — hier lauert der größte Definitionsaufwand, nicht der technische. |
| `structural_edit` (Äquivalent) | Hoch | Hoch | Das wertvollste, aber am tiefsten Python-verankerte Tool. Blockgrenzen über Tree-sitter-Knoten statt Einrückung ist genau die Stärke von tree-sitter — aber das heutige Sicherheitsnetz (`python -c "ast.parse"` vor jedem `apply`) braucht ein Äquivalent: für TS/JS realistisch (`tsc --noEmit`/`node --check`, beide lokal ohnehin meist vorhanden), für **Luau ungelöst** — auf diesem System ist kein `luau-analyze`/Luau-Compiler standardmäßig installiert; ohne ihn hätte der Luau-Zweig des Tools eine schwächere Sicherheitsgarantie als Python/TS/JS, was für ein „preview-safe"-Kernversprechen offen kommuniziert werden müsste. |

---

## 4. Priorisierung nach belegtem Eigenbedarf

Reihenfolge und Zahlen wie in der Ticket-Ausgangsmessung vorgegeben (nicht in diesem Auftrag neu hergeleitet):

### 4.1 TypeScript/JavaScript zuerst
Begründung laut Ticket: 9 eigene MCP-Server sind in TypeScript geschrieben — der größte unmittelbare Eigennutzen. Zusätzlich technisch günstig: TS/JS hat **offizielle, vom tree-sitter-Kernprojekt gepflegte** Grammatiken (kein Fork-/Vertrauensproblem wie bei Luau, siehe 4.3), und LSP-Ergänzung (typescript-lsp) existiert bereits als Nachbar-Fähigkeit, mit klarer Abgrenzung (Abschnitt 2).

### 4.2 Dann Luau
Begründung laut Ticket: 21 Roblox-Spiele, heute vollständig ungedeckt. **Wichtiger Zusatzbefund dieser Analyse:** Selbst das bereits installierte `lua-lsp`-Plugin deckt Luau **nicht** ab — sein README nennt explizit nur die Extension `.lua` (Standard-Lua via `lua-language-server`), nicht `.luau` und nicht Luau-spezifische Syntax (Typ-Annotationen, `--!strict`, generalisierte Iteration, String-Interpolation, `if`-Ausdrücke). Die Lücke ist also doppelt: weder CodeCommander noch die vorhandenen LSP-Plugins decken Luau ab — eine Erweiterung hier wäre keine Dopplung, sondern schließt eine echte, sonst nirgends im System abgedeckte Lücke.

Gegenläufig (Abwägungsfaktor, kein Vetogrund): Luau hat **keine vom tree-sitter-Kernprojekt gepflegte offizielle Grammatik** — recherchiert wurden mindestens vier unabhängige Community-Forks (JohnnyMorganz/tree-sitter-luau, 4teapo/tree-sitter-luau, tree-sitter-grammars/tree-sitter-luau, polychromatist/tree-sitter-luau), aber kein kanonisches, unter dem `tree-sitter-luau`-Namen auf npm veröffentlichtes Paket. Ein CodeCommander-Ausbau für Luau müsste selbst einen Fork auswählen, selbst als WASM bauen (`tree-sitter-cli … build --wasm`) und selbst pinnen/pflegen — ein Wartungsrisiko, das bei TS/JS nicht besteht.

### 4.3 Dann der Rest
Weitere Sprachen (Python-Nachbarsprachen, weitere JVM-/Systemsprachen) sind laut Ticket nicht mit belegtem Eigenbedarf hinterlegt und werden hier nicht priorisiert.

---

## 5. Ausbaustufen

### Stufe 1 — Minimal
**Umfang:** Bestehendes regex-/zeilenbasiertes Muster (Option B aus Abschnitt 3.2) auf TS/JS ausweiten, aber nur für die lesenden Tools ohne Schreib-Sicherheitsnetz (`cc_analyze_code`, `cc_extract_classes`, ggf. `cc_organize_imports`/`cc_diagnose_imports` für ES-Module-Syntax). Spracherkennung über Dateiendung, Routing auf ein zweites, JS/TS-eigenes Parser-Modul nach Vorbild von `analyzePythonCode`. Keine neue Abhängigkeit. `cc_python_structural_edit` und `cc_generate_python_code` bleiben explizit Python-only (kein Versprechen, das nicht sicher eingelöst werden kann).
**Zusatznutzen unabhängig von Mehrsprachigkeit:** Extension-Prüfung mit expliziter Fehlermeldung statt stillem Fehlbefund (behebt den in Abschnitt 1 benannten Mangel).
**Aufwandsklasse: Klein bis Mittel** — ein bis zwei neue Parser-Module, Anpassung von vier bis sechs Tools, keine neue Abhängigkeit, kein Architekturwechsel; Größenordnung Tage, kein Rewrite der Kern-Engine.

### Stufe 2 — Solide
**Umfang:** Umstieg auf `web-tree-sitter` + offizielle `tree-sitter-typescript`/`tree-sitter-javascript`-WASM-Grammatiken (Option A, Abschnitt 3.1) für TS/JS; WASM wird im npm-Paket ausgeliefert (Distributionsweg 1, Abschnitt 3.3), `Language.load()` lazy pro Aufruf. `analyze_code`/`extract_classes`/`analyze_methods` (struktureller Teil)/`organize_imports`/`diagnose_imports` werden auf echte Syntaxbäume umgestellt. `cc_python_structural_edit` bekommt ein TS/JS-Gegenstück mit Tree-sitter-Knotengrenzen statt Einrückung sowie einem `tsc --noEmit`/`node --check`-Sicherheitsnetz analog zum heutigen `ast.parse`-Check. Python bleibt unverändert (hat bereits einen echten Syntax-Check, kein Migrationsdruck).
**Aufwandsklasse: Groß** — neue Kernabhängigkeit, Async-Umbau der Parsing-Pfade, Query-Dateien pro Sprache, Paketgrößen-/Distributionsentscheidung endgültig treffen, volle Testsuite-Erweiterung (heute 2.912 Testzeilen allein für Python — vergleichbarer Umfang für TS/JS realistisch); mehrere Wochen, echter Architektur-Umbau, höchstes Einzelrisiko unter den drei Stufen wegen der belegten WASM-ABI-Kopplung (Abschnitt 3.1).

### Stufe 3 — Voll
**Umfang:** Zusätzlich Luau: eigene Grammatik-Fork-Auswahl, eigener WASM-Build via `tree-sitter-cli`, eigenes Versions-Pinning/Update-Verfahren (da keine offizielle Pflege existiert). Alle vier Kern-Tools (`analyze_code`, `extract_classes`, `analyze_methods`, `structural_edit`) sprachübergreifend über TS/JS/Luau/Python. Für `structural_edit` in Luau: entweder einen Luau-Syntax-Checker als externe Abhängigkeit ergänzen (z. B. `luau-analyze`, auf diesem System nicht standardmäßig installiert) oder eine bewusst schwächere Sicherheitsgarantie für den Luau-Zweig dokumentieren. Vollständige Testabdeckung über vier Sprachen, README/i18n-Nachzug über alle sieben Locales.
**Aufwandsklasse: Sehr groß (XL)** — zusätzliche Fremdgrammatik ohne offiziellen Maintainer, eigene Build-/Pinning-Pipeline, ungelöste Syntax-Check-Lücke für den Apply-Modus in Luau, plus der volle Aufwand aus Stufe 2 als Vorbedingung; mehrwöchig bis monatelang, höchstes Wartungsrisiko der drei Stufen.

---

## 6. Entscheidungsvorlage

**Kontext:** CodeCommander ist zu 39 % (9/23 Tools) hart auf Python zugeschnitten, ohne Sprachprüfung bei Fremdsprachen-Input. Die auf diesem System bereits installierten LSP-Plugins (pyright-lsp, typescript-lsp) decken Typ-/Referenz-Semantik für Python/TS/JS bereits ab, nicht aber batch-fähige, editorunabhängige Struktur-Werkzeuge — und für Luau existiert system­weit **keine** Abdeckung, auch nicht durch das installierte `lua-lsp` (nur Standard-Lua, nicht Luau).

**Option A — Sofort auf tree-sitter umstellen (direkt Stufe 2, TS/JS zuerst)**
- Pro: Ein Architektur-Sprung statt zwei; vermeidet Wegwerf-Arbeit aus Stufe 1; löst die Blockgrenzen-Problematik für klammernbasierte Sprachen von Anfang an strukturell korrekt.
- Contra: Größter Einzeleingriff in ein bisher featherweight-Paket ohne Zwischenschritt zur Risikoabschätzung; belegte WASM-ABI-Wartungslast wird sofort eingegangen; keine schnelle Verbesserung für den heute schon bestehenden „stillen Fehlbefund"-Mangel.

**Option B — Nur Stufe 1 (regexbasiert wie Python), tree-sitter dauerhaft meiden**
- Pro: Kein Abhängigkeits-/Paketgrößenzuwachs; passt zum heutigen featherweight-Charakter; schnell umsetzbar.
- Contra: Korrektheits-Deckel bleibt strukturell niedrig, besonders für `structural_edit`-artige Schreiboperationen bei TS/JS/Luau (Klammernzählung ist für diese Sprachen fehleranfälliger als Einrückung es für Python war); jede weitere Sprache addiert linear Wartungsaufwand statt ihn zu amortisieren.

**Option C — Stufenweise: Stufe 1 jetzt (TS/JS regexbasiert, lesende Tools + Extension-Fehlermeldung), Stufe 2 als separat zu beauftragende Folgeentscheidung (tree-sitter, TS/JS vollständig inkl. structural_edit), Luau (Stufe 3) erst nach Stufe 2 und nach Klärung des Luau-Syntax-Check-Problems**
- Pro: Behebt den akuten stillen-Fehlbefund-Mangel und liefert TS/JS-Grundabdeckung sofort und risikoarm; verschiebt die teure, architektonisch riskante tree-sitter-Entscheidung auf einen Zeitpunkt mit mehr Erfahrungswerten aus Stufe 1; vermeidet, Luau-Aufwand in eine Grammatik-Wartungslast ohne gelöste Sicherheitsnetz-Frage zu stecken, bevor das für TS/JS erprobt ist.
- Contra: Stufe-1-Code (regexbasierte TS/JS-Analyse) wird bei einem späteren Umstieg auf Stufe 2 teilweise verworfen — bewusst in Kauf genommene, aber echte Doppelarbeit.

**Empfehlung:** Option C — jetzt nur Stufe 1 (TS/JS regexbasiert, lesende Tools, explizite Extension-Fehlermeldung) beauftragen, die aufwendigere tree-sitter-Umstellung (Stufe 2) und Luau (Stufe 3) als eigene, spätere Entscheidungen mit eigener Aufwandsfreigabe behandeln.
