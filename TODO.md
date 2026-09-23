# TASKPLAN-Aufgabenregister — ellmos-codecommander-mcp

Stand: 2026-09-20  |  Rolle: TASKSOLVER  |  Projekt: `ellmos-codecommander-mcp`

Dieses Register ist der kanonische Projektüberblick für die formalisierte
Aufgabenliste. Die vollständigen Quellen, Soll-/Ist-Ableitungen, Definition of
Done, Prüfwege, Blocker und Nichtziele liegen in TASKPLAN; die stabilen IDs
unten sind maßgeblich. Historische Changelog-Einträge werden nicht als aktuelle
Aufgabenliste dupliziert.

## Projektfunktion und Ist-Stand

`ellmos-codecommander-mcp` ist ein lokaler, stdio-basierter TypeScript-MCP-
Server mit 23 Entwicklerwerkzeugen für Codeanalyse, JSON-/Encoding-Reparatur,
Importorganisation, Formatkonvertierung, Diff/Regex und isolierte Python-
Importdiagnostik.

- Der Arbeitsbaum ist sauber; `master` entspricht `origin/master` auf
  `d9ddcfc`.
- Es gab vor diesem Lauf kein `TODO.md`, `ROADMAP.md` oder TASKPLAN-Register
  im Projekt.
- `npm run test:all` ist vollständig grün: Build, 201 Vitest-Tests, 52
  MCP-Stdio-Integrationstests und 43 i18n-Assertions, insgesamt 296.
- `npm pack --dry-run --json` ist grün: `ellmos-codecommander-mcp@1.3.27`,
  49 Dateien, einschließlich `NOTICE`, Manifeste, Lizenz- und Discovery-
  Dokumentation.
- `npm audit --omit=dev --json` meldet aktuell 5 Produktionsbefunde: 3
  `high`, 2 `moderate`; alle fünf Knoten haben einen verfügbaren Fix.
- `npm view ellmos-codecommander-mcp version dist-tags --json` meldet
  `latest=1.3.26`, während der kanonische Quell- und Manifeststand `1.3.27`
  ist.
- Gegenwärtige Dokumentation ist jetzt auf den belegten Teststand 201/52/43/296
  synchronisiert. Der aktuelle Produktions-Audit meldet 5 verwundbare
  Paketknoten (3 hoch, 2 mittel); die gegenwärtigen README-, Marketing- und
  Lizenzhinweise behaupten keinen sauberen Audit. `llms.txt` war bereits aktuell.

## Offene TASKPLAN-Aufgaben

| ID | Aufgabe | Priorität | Aufwand | Scope | Abhängigkeit / Quelle |
| --- | --- | --- | --- | --- | --- |
| `CODECOMMANDER-SECURITY-001` (TASKPLAN #2198) | Produktionsabhängigkeiten gegen den aktuellen npm-Audit-Befund härten | hoch | large | local | `npm audit --omit=dev --json`, package-/Lockfile, Sicherheitsinventar |
| `CODECOMMANDER-RELEASE-002` (TASKPLAN #2199) | CodeCommander 1.3.27 mit npm- und Registry-Stand abgleichen | mittel | special | local | Git-/npm-/Manifest-Readback; Owner-/Credential-Gate |

## TASKWRITER-Grenze

Die drei Aufgaben wurden mit Quelle, Soll/Ist, Definition of Done, Prüfweg,
Blockern, Aufwand, Scope und Prioritätsbegründung über die TASKPLAN-API
registriert. Dieser Lauf hat keine Aufgabe ausgeführt, keine Abhängigkeit
geändert, keinen Audit-Fix vorgenommen und nichts veröffentlicht oder gepusht.

## Im TASKSOLVER-Schritt abgeschlossen

- `CODECOMMANDER-DOCS-003` (TASKPLAN #2200) wurde am 2026-09-20 umgesetzt:
  README.md, README_de.md, MARKETING-LOG.txt und THIRD_PARTY_LICENSES.md
  spiegeln 201 Vitest-Tests, 52 MCP-Stdio-Assertions, 43 i18n-Assertions,
  insgesamt 296, sowie den aktuellen nicht sauberen Produktions-Audit wider.
- Historische Changelog- und Meilensteinabschnitte blieben unverändert; `llms.txt`
  war bereits synchron. Verifiziert mit `npm run test:all`, metadata tests,
  `npm audit --omit=dev --json`, `git diff --check` und gezieltem
  stale-count-Readback.
