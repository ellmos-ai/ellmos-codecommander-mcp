# Security Policy

## Overview

ellmos CodeCommander MCP Server is a developer tool that analyzes and modifies source code files. It operates with the running user's filesystem permissions.

## Risk Assessment

### Medium Risk Tools
| Tool | Risk | Description |
|------|------|-------------|
| `cc_organize_imports` | Modifies source files | Changes Python import order |
| `cc_fix_json` | Modifies files | Repairs JSON content |
| `cc_fix_encoding` | Modifies files | Changes file encoding |
| `cc_cleanup_file` | Modifies files | Removes whitespace/BOM/NUL |
| `cc_fix_umlauts` | Modifies files | Replaces character sequences |
| `cc_convert_format` | Creates files | Converts between formats |
| `cc_md_to_html` | Creates files | Generates HTML output |
| `cc_md_to_pdf` | Creates files | Generates PDF output |
| `cc_python_structural_edit` | Modifies Python source when `mode=apply` | Defaults to preview; supports syntax checks, test-file output and backups |

### Runtime Diagnostic Tools
| Tool | Risk | Description |
|------|------|-------------|
| `cc_runtime_import_diagnose` | Executes target-project imports in isolated Python subprocesses | CodeCommander writes no files, but imported Python modules may run top-level side effects; use explicit `modules`, short timeouts and trusted project paths |

### Low Risk Tools (Read-Only)
| Tool | Description |
|------|-------------|
| `cc_analyze_code` | Reads and analyzes code |
| `cc_analyze_methods` | Reads and analyzes methods, callbacks and self-attribute order |
| `cc_extract_classes` | Reads and extracts class info; creates files only when `output_dir` is set |
| `cc_diagnose_imports` | Reads and diagnoses imports |
| `cc_check_indentation` | Reads and checks Python indentation |
| `cc_generate_python_code` | Generates text output only |
| `cc_validate_json` | Reads and validates JSON |
| `cc_scan_emoji` | Reads and scans for emojis |
| `cc_generate_licenses` | Reads installed packages |
| `cc_diff_files` | Compares two files (read-only) |
| `cc_regex_test` | Tests regex patterns |
| `cc_set_language` | Switches output language |

## Recommendations

- File-modifying tools support `dry_run`, `mode=preview` and/or `create_backup` options
- Preview changes before applying (`dry_run=true` or `mode=preview`)
- Treat runtime import diagnostics as code execution of the inspected project
- Review changes before deploying to production
- This server is designed for local development use via stdio transport

## Reporting

Report security issues at https://github.com/ellmos-ai/ellmos-codecommander-mcp/issues
