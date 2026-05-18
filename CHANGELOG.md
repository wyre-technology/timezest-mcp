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