## Unreleased

### Fixed

- Add missing `GET /health` liveness route to the HTTP transport. The server previously returned 404 for any request other than `POST /mcp`, so the Azure Container Apps liveness probe (`GET /health`) failed and the platform recycled the container in a crash-loop. The route now returns `200 {"status":"ok"}` before the catch-all 404.

## [1.1.1](https://github.com/wyre-technology/timezest-mcp/compare/v1.1.0...v1.1.1) (2026-05-29)


### Bug Fixes

* **ci:** bump version so registry gate fires and add required OCI label ([#16](https://github.com/wyre-technology/timezest-mcp/issues/16)) ([c352852](https://github.com/wyre-technology/timezest-mcp/commit/c352852894cc3404fc56dbf5f02bee5de1d43fd2))

# [1.1.0](https://github.com/wyre-technology/timezest-mcp/compare/v1.0.0...v1.1.0) (2026-05-29)


### Features

* **ci:** publish to MCP Registry on release ([#15](https://github.com/wyre-technology/timezest-mcp/issues/15)) ([cc569f7](https://github.com/wyre-technology/timezest-mcp/commit/cc569f76c0c3900cbc343d1f21facc4ed4942fbe))

# 1.0.0 (2026-05-22)


### Bug Fixes

* add --passWithNoTests to vitest to allow builds with no test files ([ccbe423](https://github.com/wyre-technology/timezest-mcp/commit/ccbe4236c0a33ec338afe2e79f64af9591f59abc))
* add explicit type annotation to map callback parameter ([385c7a0](https://github.com/wyre-technology/timezest-mcp/commit/385c7a091d885e7e597a8a794cfb27be88d3e909))
* annotate CallToolRequestSchema handler return type as Promise<any> for SDK 1.29.0 compat ([9e08bb4](https://github.com/wyre-technology/timezest-mcp/commit/9e08bb401afa9113dc01b5cebb8fcccb5a299e54))
* remove exactOptionalPropertyTypes for MCP SDK compatibility ([8849a1d](https://github.com/wyre-technology/timezest-mcp/commit/8849a1da25ab4802747ae666d35a2aa3f368cbd2))
* remove explicit undefined for optional sessionIdGenerator property ([f583bbc](https://github.com/wyre-technology/timezest-mcp/commit/f583bbc0c3f4b419aa375a92c28ee8ffdefe7e3e))
* replace local file: dependency with published npm version for CI ([3af3178](https://github.com/wyre-technology/timezest-mcp/commit/3af3178dcb827eb98700dffdbc2450db03e57229))
* use ListToolsRequestSchema and add extra param for TS compatibility ([ff1aa10](https://github.com/wyre-technology/timezest-mcp/commit/ff1aa105c65b85c19fda57f08cd570dc4064505d))


### Features

* add server.json for MCP Registry publication ([#2](https://github.com/wyre-technology/timezest-mcp/issues/2)) ([0c3ac2d](https://github.com/wyre-technology/timezest-mcp/commit/0c3ac2dc674b2ef96c13d1f238926bd5fbfd0107))
* initial TimeZest MCP server ([1d3f7d9](https://github.com/wyre-technology/timezest-mcp/commit/1d3f7d9021e0ed393dd6bc4a971c3aee0e700a29))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial TimeZest MCP server implementation
- Decision-tree navigation for organized tool discovery
- Complete scheduling request lifecycle (create, view, cancel)
- Support for all 5 TimeZest API resource families:
  - Agents (individual technicians)
  - Teams (round-robin scheduling)
  - Appointment Types (service definitions)
  - Resources (mixed agents + teams)
  - Scheduling Requests (core functionality)
- PSA integration support (ConnectWise, Autotask, Halo)
- TQL (TimeZest Query Language) filtering on all list operations
- IANA timezone preservation and explicit handling
- Dual trigger modes (pod = PSA workflow, generate_url = booking link)
- Gateway-ready architecture with per-request server instances
- Elicitation infrastructure for interactive prompts
- HTTP and stdio transport support
- Docker container with multi-stage builds
- Comprehensive error handling and logging
- Structured logging (stderr only, respects MCP protocol)
- GitHub Packages integration for SDK dependency
- Semantic release automation
