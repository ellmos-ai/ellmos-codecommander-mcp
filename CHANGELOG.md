# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Add a metadata regression test for package/server version alignment and the README family tool count.

### Fixed
- Correct the CodeCommander tool count in the README and README_de MCP family tables from the stale 17-tool value to 21.

## [1.3.13] - 2026-06-22

### Added
- Add BACH-derived `cc_check_indentation` for Python indentation diagnostics.
- Add BACH-derived `cc_generate_python_code` for template-based Python code snippets.
- Extend `cc_extract_classes` with optional pycutter-style inline class/helper content for LLM context packaging.
- Extend `cc_analyze_methods` with BACH-derived guardrails for missing signal callbacks, self-attributes used before definition, and underscore method mismatches.
- Add BACH-derived `cc_runtime_import_diagnose` for isolated Python runtime import checks, `__init__.py` analysis, and circular-import hints.
- Add BACH-derived `cc_python_structural_edit` for structural Python edits with preview, test-file, syntax-check and backup safety modes.
- Replace Spanish, Simplified Chinese, Japanese, and Russian i18n fallbacks with maintained CodeCommander translations.
- Update README, README_de, llms.txt, server metadata, i18n and security notes for 21 developer tools.
- Extend the local Vitest suite to 167 tests.

## [1.3.12] - 2026-06-17

### Added
- Add a dedicated GitHub Actions test workflow for Node.js 20, 22, and 24 with `npm ci`, TypeScript build, Vitest, and npm package dry-run checks.
- Add a TTY-guarded `update-notifier` check for interactive CLI starts while keeping MCP stdio output unchanged.

### Changed
- Replace non-historical `BACH CodeCommander` branding in source headers, i18n startup text, test labels, Glama metadata, and license metadata with current ellmos CodeCommander naming.
- Use real German umlauts in German runtime output strings instead of `ae`/`oe`/`ue` transliterations.
- Align README, README_de, llms.txt, package metadata, and server.json with ellmos CodeCommander naming, npm packaging, and MCP Registry metadata.
- Update README test-count references to the current 139-test Vitest suite.
- Include `server.json` explicitly in the npm package file list for MCP Registry ingestion.
- Update community workflows to `actions/stale@v10` and `actions/first-interaction@v3`.
- Lock Vitest/Rolldown WASM peer dependencies explicitly so Linux `npm ci` stays deterministic in GitHub Actions.
- Re-verify the npm package dry-run contents after the deterministic lockfile refresh.

### Fixed
- `cc_analyze_code` and `cc_organize_imports` tool-reference tables had a duplicate first data row rendered as the column header — replaced with proper `Metric` / `Category` header labels.
- `@version` annotation in `src/index.ts` corrected from `1.3.0` to `1.3.10`.
- Align `package.json`, lockfile, MCP runtime version, and `server.json` metadata after the update-notifier release.
- Refresh npm dependency locks so production audit findings for `hono` and `js-yaml` are resolved.

## [1.3.10] - 2026-05-23

### Fixed
- Refresh npm lockfile and overrides to resolve Dependabot alerts for `fast-xml-builder`, `fast-uri`, `hono`, and `ip-address`.
- Update stale security/reporting links to the `ellmos-ai` repository.

## [1.3.9] - 2026-05-17

### Added
- Comprehensive test suite with 137 tests covering all 17 tools (vitest)
- Cross-platform compatibility verified on Windows, macOS, and Linux
- Development/Testing section in README.md and README_de.md

## [1.3.2] - 2026-02-20

### Fixed
- Update CHANGELOG with 5 missing version entries (v1.1.0-v1.3.1)
- Fix server.json version mismatch
- Update SECURITY.md with missing tools

## [1.3.1] - 2026-02-17

### Changed
- Replace custom TOON parser/serializer with official `@toon-format/toon` package
- Proper TOON format: `key: value` syntax instead of custom `key = value`

## [1.3.0] - 2026-02-17

### Added
- `cc_diff_files` - Compare two files with unified diff output (LCS algorithm, configurable context lines)
- `cc_regex_test` - Test regex patterns against text/files with match details, groups, and replace preview
- Expand `cc_convert_format`: add YAML, TOML, XML, and TOON support (was JSON/CSV/INI only)
- Full i18n (DE/EN) for all new tools
- Total tools: 17

## [1.2.1] - 2026-02-17

### Added
- `mcpName` field in package.json for MCP Registry verification
- `server.json` for official MCP Registry publishing

## [1.2.0] - 2026-02-17

### Changed
- Rename `cc_md_to_pdf` to `cc_md_to_html` (was generating HTML, not PDF)

### Added
- `cc_md_to_pdf` - Real PDF generation via headless Edge/Chrome browser
- Cross-platform browser detection (Windows, macOS, Linux)
- Fallback to HTML output if no browser is available
- Total tools: 15

## [1.1.0] - 2026-02-15

### Added
- Complete internationalization (i18n) infrastructure with German (default) and English support
- New `cc_set_language` tool for runtime language switching
- `CC_LANGUAGE` environment variable for startup configuration
- ~170 translated strings (tool titles, descriptions, error messages)
- i18n test suite (43 tests)
- Language priority: `cc_set_language` > `CC_LANGUAGE` env > `"de"` default

## [1.0.1] - 2026-02-14

### Fixed
- `cc_md_to_pdf` completely rewritten: line-by-line parser instead of regex chain
- Added: nested lists, ordered lists, blockquotes, checkboxes, badge images, standalone images
- Added: bold+italic combo (`***text***`), proper `<thead>/<tbody>` tables
- Professional CSS: dark code blocks, colored headers, print-ready layout

## [1.0.0] - 2026-02-14

### Added
- Initial release with 14 developer-focused tools
- Code Analysis: `cc_analyze_code`, `cc_analyze_methods`, `cc_extract_classes`
- Import Management: `cc_organize_imports`, `cc_diagnose_imports`
- JSON Tools: `cc_fix_json`, `cc_validate_json`
- Encoding & Text: `cc_fix_encoding`, `cc_cleanup_file`, `cc_fix_umlauts`, `cc_scan_emoji`
- Format Conversion: `cc_convert_format`
- Documentation: `cc_generate_licenses`, `cc_md_to_pdf`
