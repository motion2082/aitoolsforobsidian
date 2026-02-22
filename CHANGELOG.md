# Changelog

All notable changes to AI Tools for Obsidian will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.3] - 2026-02-22

### Fixed
- Plugin `onunload()` now disconnects the ACP adapter and kills agent subprocesses when the plugin is disabled or reloaded
- ACP adapter `initialize()` now kills the spawned agent process if initialization fails or times out, preventing orphaned processes
- ACP adapter `initialize()` now clears the 30-second timeout timer on success and nulls the connection reference on failure
- Added error handler on stdout `ReadableStream` to prevent unhandled errors when the agent process crashes
- Terminal manager schedules a 5-minute fallback cleanup timer on process exit in case the agent never calls `releaseTerminal`, preventing memory leaks from stale terminal entries
- `releaseTerminal()` now clears any existing fallback timeout before scheduling its 30-second grace period
- Added spawn error handler in agent installer to report process failures (e.g. npm not found) via the progress callback
- Stabilized `onSessionUpdate` callback registration using refs to prevent mid-stream re-registration that could cause agent response text to vanish

## [0.7.3] - 2026-02-11

### Added
- "Other" option in permission dialogs for custom instructions - allows users to describe what they want the agent to do instead of just accepting/rejecting
- Automated onboarding modal for first-time users

### Fixed
- Plugin no longer disables itself on startup when initialization errors occur
- Added graceful error handling during plugin initialization
- OnboardingModal errors no longer crash the plugin

### Changed
- Updated documentation link in settings to point to GitHub repository

## [0.7.2] - 2025-01-XX

### Added
- Initial release with ACP support
- Claude Code ACP integration
- Gemini CLI ACP integration
- Custom agent support
- Note mention system (@[[note]])
- Slash command support
- Permission request handling
- Auto-mention active note
- Chat export functionality
- Session history

### Fixed
- VitePress version compatibility

[Unreleased]: https://github.com/UltimateAI-org/aitoolsforobsidian/compare/v0.8.3...HEAD
[0.8.3]: https://github.com/UltimateAI-org/aitoolsforobsidian/compare/v0.8.2...v0.8.3
[0.7.3]: https://github.com/UltimateAI-org/aitoolsforobsidian/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/UltimateAI-org/aitoolsforobsidian/releases/tag/v0.7.2
