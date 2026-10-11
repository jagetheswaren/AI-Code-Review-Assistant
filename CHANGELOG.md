# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **E2E Testing:** Integrated Playwright for automated browser testing.
- **Error Boundaries:** Added React ErrorBoundary to prevent white screens on rendering failures.
- **Skeletons:** Added loading skeleton states for the Dashboard.
- **Linked UI:** Clicking a file in the Pull Request view now filters the issues list for that file.

### Changed
- **Webhook Reliability:** GitHub Webhooks now properly paginate files over 100 entries.
- **Webhook Protection:** Webhooks safely truncate AI deep-analysis to 20 files to prevent timeouts.
- **Rate Limit Handling:** GitHub HTTP 429 Secondary Rate Limits are explicitly handled.
- **Database:** Added compound indexes to MongoDB (`timestamp`, `github_pr_id`) for faster lookups.

### Fixed
- **Security:** `config.py` explicitly validates the presence of `MONGO_URI` and a secure `JWT_SECRET` on startup.

### Removed
- Removed experimental CodeBERT references from the ML pipeline to strictly use the Random Forest classifier.
- Purged outdated `desktop`, `migration-experiments`, and obsolete backend routes.

## [1.0.0-rc1] - 2026-09-15
### Added
- Initial Release Candidate tag.
