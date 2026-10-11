# IntelliReview AI V2 — Known Limitations & Scope Boundaries

## 1. Multi-Language Static Analysis Scope
- **Python**: Fully supported with complete static analysis depth:
  - Security: Bandit AST + custom security visitor (eval, exec, pickle, mktemp, hashlib, shell injection, SQL injection).
  - Code Smells: Astroid / Pylint rules (unused imports, unused variables, long functions, naming, dead code).
  - Complexity & Performance: Radon cyclomatic complexity, Halstead metrics, AST loop nesting heuristics.
- **JavaScript & TypeScript**: Syntax parsing and AI-assisted review. Dedicated ESLint/Semgrep daemon integration is slated for future incremental updates.
- **Java, C, C++, C#**: Currently reviewed via context-aware AI explanations and regex patterns. Native compiler static analysis (e.g. Clang-Tidy, SpotBugs) is not bundled.

---

## 2. Security Execution Model
- **No Dynamic Code Execution**: IntelliReview AI does not run, compile, or execute uploaded source files in sandbox runtimes.
- **Static Heuristics Only**: Performance warnings (e.g., nested loop complexity $O(n^2)$) are algorithmic heuristics based on AST depth, not measured runtime benchmark regressions.

---

## 3. AI Service Availability & Degradation
- If a local Ollama instance or remote Groq API key is not configured or goes offline:
  - The platform does **not** fail or fabricate findings.
  - The review workspace falls back cleanly to authoritative static analysis findings and rule-based remediation suggestions.
  - The health endpoint (`/api/ai/status`) reports `reachable: false` and the UI indicates `Rule-based Engine Active`.

---

## 4. GitHub PR Automation Constraints
- Review comments can only be published to public repositories or private repositories for which the authenticated user has explicitly granted OAuth or PAT access.
- IntelliReview never performs destructive operations: no auto-merge, no force-pushes, and no unauthorized modifications to repository branches.
