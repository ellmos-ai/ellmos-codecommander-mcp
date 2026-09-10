# Third-Party Licenses and Open-Source Transparency Notice

> **Project:** `ellmos-ai/ellmos-codecommander-mcp` (CodeCommander)  
> **Audited:** 2026-09-10  
> **Repository License:** [MIT License](LICENSE)  
> **Architecture & Privacy:** 100% Local-First, Zero-Egress by default, Unprivileged User-Mode (`RunAsInvoker`)

---

## 1. Executive Summary & Compliance Assurance

`ellmos-codecommander-mcp` is an open-source, local-first Model Context Protocol (MCP) server providing developer tools for code analysis, AST transformations, JSON/encoding repair, format conversion, diffing, and regex testing.

All direct runtime, transitive overrides, and development dependencies utilized in this project are distributed under well-established, permissive open-source licenses (**MIT**, **BSD-2-Clause**, **BSD-3-Clause**, **Apache-2.0**).

Furthermore, `ellmos-codecommander-mcp` guarantees:
1. **100% Local-First & Zero-Egress:** All operations execute exclusively over local stdio streams. Zero outbound network calls, zero telemetry beacons, and zero cloud dependencies.
2. **Unprivileged User-Mode (`RunAsInvoker`):** The server runs completely in user space without requiring administrator or root elevation.
3. **Preview-Safe Mutations & Automatic Backups:** Structural Python edits and file modifying utilities default to non-destructive dry-run preview modes (`mode: "preview"`) with unified diffs, and create timestamped `.bak` backups before modifying files on disk.
4. **Subprocess Isolation:** Runtime Python import diagnostics (`cc_runtime_import_diagnose`) execute inside isolated, ephemeral Python subprocesses with strict timeout boundaries.
5. **Permissive Compatibility:** No viral copyleft (GPL, AGPL) dependencies are included in the published runtime artifact or package payload.

---

## 2. Direct Runtime Dependency Matrix

| Package | Version Range | License | Project URL / Source | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) | `^1.0.0` | MIT | [GitHub](https://github.com/modelcontextprotocol/typescript-sdk) | Official Model Context Protocol TypeScript SDK (stdio transport, JSON-RPC protocol handling) |
| [`@toon-format/toon`](https://github.com/toon-format/toon) | `^2.1.0` | MIT | [GitHub](https://github.com/toon-format/toon) | Token-Oriented Object Notation serializer and parser for LLM-optimized data exchange |
| [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser) | `^5.8.0` | MIT | [GitHub](https://github.com/NaturalIntelligence/fast-xml-parser) | High-performance XML parser, validator, and builder for format conversions |
| [`js-yaml`](https://github.com/nodeca/js-yaml) | `^4.3.1` | MIT | [GitHub](https://github.com/nodeca/js-yaml) | JavaScript YAML parser and dumper for `cc_convert_format` operations |
| [`smol-toml`](https://github.com/cyyperia/smol-toml) | `^1.6.0` | BSD-3-Clause | [GitHub](https://github.com/cyyperia/smol-toml) | Fast, specification-compliant TOML parser and serializer |
| [`update-notifier`](https://github.com/yeoman/update-notifier) | `^7.3.1` | BSD-2-Clause | [GitHub](https://github.com/yeoman/update-notifier) | CLI version check utility (suppressed during stdio MCP operations) |
| [`zod`](https://github.com/colinhacks/zod) | `^3.23.8` | MIT | [GitHub](https://github.com/colinhacks/zod) | TypeScript-first schema declaration and input validation with static type inference |

---

## 3. Transitive & Overrides Dependency Matrix

| Package | Version Range | License | Project URL | Purpose / Scope |
| :--- | :--- | :--- | :--- | :--- |
| `hono` | `^4.13.0` | MIT | [GitHub](https://github.com/honojs/hono) | Web standard HTTP router primitives used transitively |
| `@hono/node-server` | `^2.0.5` | MIT | [GitHub](https://github.com/honojs/node-server) | Node.js adapter for Hono HTTP interfaces |
| `nanoid` | `^3.3.17` | MIT | [GitHub](https://github.com/ai/nanoid) | Secure, URL-friendly unique string ID generator |
| `fast-uri` | `^3.1.5` | BSD-3-Clause | [GitHub](https://github.com/fastify/fast-uri) | RFC 3986 URI parsing and formatting |
| `express-rate-limit` | `^8.6.2` | MIT | [GitHub](https://github.com/express-rate-limit/express-rate-limit) | Rate limiting middleware component |
| `ip-address` | `^10.4.0` | MIT | [GitHub](https://github.com/beaugunderson/ip-address) | IPv4 and IPv6 validation and parsing library |
| `fast-xml-builder` | `^1.1.7` | MIT | [GitHub](https://github.com/NaturalIntelligence/fast-xml-parser) | XML serialization companion library |
| `qs` | `^6.15.2` | BSD-3-Clause | [GitHub](https://github.com/ljharb/qs) | Query string parsing and stringification |
| `postcss` | `^8.5.18` | MIT | [GitHub](https://github.com/postcss/postcss) | CSS parsing and transformation pipeline |

---

## 4. Development & Quality Assurance Tooling

The following tools are used exclusively for building, testing, linting, and verifying the codebase during development and CI. They are not bundled into production runtime packages:

| Package | Version Range | License | Project URL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| [`typescript`](https://github.com/microsoft/TypeScript) | `^5.3.3` | Apache-2.0 | [GitHub](https://github.com/microsoft/TypeScript) | TypeScript compiler (`tsc`) for strict static typing and compilation |
| [`vitest`](https://github.com/vitest-dev/vitest) | `^3.2.6` | MIT | [GitHub](https://github.com/vitest-dev/vitest) | Fast unit and contract testing framework |
| [`@types/node`](https://github.com/DefinitelyTyped/DefinitelyTyped) | `^20.11.0` | MIT | [GitHub](https://github.com/DefinitelyTyped/DefinitelyTyped) | Type definitions for Node.js runtime APIs |
| [`@types/js-yaml`](https://github.com/DefinitelyTyped/DefinitelyTyped) | `^4.0.9` | MIT | [GitHub](https://github.com/DefinitelyTyped/DefinitelyTyped) | Type definitions for `js-yaml` library |
| [`@emnapi/core`](https://github.com/toyobayashi/emnapi) | `^1.10.0` | MIT | [GitHub](https://github.com/toyobayashi/emnapi) | Emscripten N-API implementation helper |
| [`@emnapi/runtime`](https://github.com/toyobayashi/emnapi) | `^1.10.0` | MIT | [GitHub](https://github.com/toyobayashi/emnapi) | Emscripten N-API runtime support |

---

## 5. Standard License Excerpts

### MIT License
Used by `@modelcontextprotocol/sdk`, `@toon-format/toon`, `fast-xml-parser`, `js-yaml`, `zod`, `vitest`, `hono`, `nanoid`, `express-rate-limit`, `ip-address`, `fast-xml-builder`, `postcss`, and `@types/*`.

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### BSD-2-Clause & BSD-3-Clause Licenses
Used by `update-notifier`, `smol-toml`, `fast-uri`, and `qs`.

> Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
>
> 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
> 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
> 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
>
> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

### Apache License 2.0
Used by `typescript`.

> Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
>
> http://www.apache.org/licenses/LICENSE-2.0
>
> Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
