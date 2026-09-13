import json
import logging
import re
import requests
from typing import List, Dict, Any, Optional, Tuple

import ollama

from models.review import Issue
from config import settings
from ml.nlp_explainer import create_explainer

logger = logging.getLogger(__name__)

AI_UNAVAILABLE_MSG = "AI review unavailable; static analysis completed."
MAX_CODE_CHARS = getattr(settings, "ollama_max_code_chars", 12000)


class AIReviewer:
    """Ollama-backed reviewer with structured JSON support and robust fallback."""

    def __init__(self, model: str = None, base_url: str = None, timeout: int = None):
        self.model = model or settings.ollama_model
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self.timeout = timeout or getattr(settings, "ollama_timeout", 30)
        # ollama.Client expects host without trailing slash
        self.client = ollama.Client(host=self.base_url)
        self.nlp_explainer = create_explainer()

    # ------------------------------------------------------------------
    # Connectivity helpers
    # ------------------------------------------------------------------
    def check_health(self) -> Dict[str, Any]:
        """Probe Ollama /api/tags. Returns {reachable, models, error}."""
        if not self.base_url or not self.base_url.strip():
            return {"reachable": False, "models": [], "error": "OLLAMA_BASE_URL not configured (empty). Production AI BLOCKED."}
        # Production localhost guard: Render cannot reach laptop localhost
        if settings.flask_env.lower() == "production" and ("localhost" in self.base_url or "127.0.0.1" in self.base_url):
            return {"reachable": False, "models": [], "error": f"Production AI BLOCKED: OLLAMA_BASE_URL {self.base_url} is localhost and not reachable from cloud. Configure a reachable AI endpoint."}
        url = f"{self.base_url}/api/tags"
        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code != 200:
                return {"reachable": False, "models": [], "error": f"HTTP {resp.status_code}"}
            data = resp.json()
            models = [m.get("name") for m in data.get("models", [])]
            return {"reachable": True, "models": models, "error": None}
        except Exception as e:
            msg = str(e)
            if "timed out" in msg.lower() or "timeout" in msg.lower():
                return {"reachable": False, "models": [], "error": f"Timeout after 5s: {msg}"}
            return {"reachable": False, "models": [], "error": msg}

    def is_model_available(self) -> Tuple[bool, str]:
        health = self.check_health()
        if not health["reachable"]:
            return False, f"Ollama unreachable: {health['error']}"
        if self.model not in health["models"]:
            return False, f"Model '{self.model}' not found. Available: {health['models']}"
        return True, ""

    def is_available(self) -> bool:
        ok, _ = self.is_model_available()
        return ok

    # ------------------------------------------------------------------
    # Issue enrichment (CodeBERT fallback)
    # ------------------------------------------------------------------
    def enhance_issue_with_nlp(self, issue: Issue, code_context: str = "") -> Issue:
        try:
            issue.explanation = self.nlp_explainer.generate_explanation(
                issue.model_dump(), code_context
            )
            issue.fix_suggestion = self.nlp_explainer.generate_fix_suggestion(
                issue.model_dump(), code_context
            )
        except Exception as e:
            logger.warning("NLP enhancement failed: %s", e)
            issue.explanation = issue.message
            issue.fix_suggestion = issue.suggestion or "Review this issue and apply appropriate fixes."
        return issue

    # ------------------------------------------------------------------
    # Prompt builders
    # ------------------------------------------------------------------
    def _truncate_code(self, code: str) -> str:
        if len(code) > MAX_CODE_CHARS:
            return code[:MAX_CODE_CHARS] + "\n\n# ... truncated (code too large) ..."
        return code

    def _build_review_prompt(self, code: str, filename: str, findings: List[Issue] = None) -> str:
        findings_summary = ""
        if findings:
            by_type: Dict[str, int] = {}
            for f in findings:
                by_type[f.type.value] = by_type.get(f.type.value, 0) + 1
            findings_summary = f"\nStatic Analysis Findings: {by_type}"

        truncated = self._truncate_code(code)
        return f"""You are a Senior Software Engineer performing a code review.

File: {filename}

Code to review:
```python
{truncated}
```
{findings_summary}

Provide a concise code review covering:
1. Overall code quality assessment
2. Security concerns
3. Performance considerations
4. Maintainability issues
5. Best practices violations
6. Top 3 priority fixes

Keep response under 300 words. Be specific and actionable."""

    def _build_structured_prompt(self, code: str, filename: str, findings: List[Issue] = None) -> str:
        """Prompt that requests STRICT JSON."""
        truncated = self._truncate_code(code)
        findings_block = ""
        if findings:
            findings_block = "Static analysis already found:\n"
            for f in findings[:15]:
                findings_block += f"- [{f.severity.value}] {f.type.value} Line {f.line_number}: {f.message} (rule {f.rule_id})\n"

        return f"""You are an expert code reviewer. Analyze the following Python code and the static analysis findings.

FILE: {filename}
CODE:
```python
{truncated}
```

{findings_block}

Analyze for:
1. Bugs
2. Security problems
3. Code quality
4. Performance
5. Maintainability
6. Complexity
7. Best-practice violations
8. Potential edge cases
9. Improvement suggestions

CRITICAL: Respond ONLY with valid JSON. Do NOT add markdown, explanations, or text outside JSON.
Do NOT invent issues unrelated to the supplied code.

Required JSON structure:
{{
  "summary": "2-3 sentence overall assessment",
  "issues": [
    {{
      "severity": "critical|high|medium|low|info",
      "category": "security|bug|quality|performance|maintainability",
      "title": "Short title",
      "description": "Detailed description",
      "file": "{filename}",
      "line": null,
      "suggestion": "How to fix"
    }}
  ],
  "recommendations": ["Top recommendation 1", "Top recommendation 2", "Top recommendation 3"]
}}

If code is clean, return empty issues array.
Severity must be one of: critical, high, medium, low, info
Category must be one of: security, bug, quality, performance, maintainability
Line can be integer or null if not applicable.
Ensure JSON is valid and parseable."""

    def _build_summary_prompt(self, findings: List[Issue], code: str) -> str:
        grouped: Dict[str, List[Issue]] = {}
        for f in findings:
            grouped.setdefault(f.type.value, []).append(f)

        summary = "Static Analysis Results:\n"
        for type_name, issues in grouped.items():
            summary += f"\n{type_name.replace('_', ' ').title()} ({len(issues)}):"
            for issue in issues[:3]:
                summary += f"\n  - Line {issue.line_number}: {issue.message} [{issue.severity.value}]"

        truncated = self._truncate_code(code)
        return f"""Summarize these code analysis findings for a developer.

{summary}

Code context (first 100 lines):
```python
{chr(10).join(truncated.split(chr(10))[:100])}
```

Provide a 2-3 sentence executive summary highlighting the most critical issues and overall risk level."""

    # ------------------------------------------------------------------
    # LLM query with timeout and error handling
    # ------------------------------------------------------------------
    def _query_llm(self, prompt: str, json_mode: bool = False, timeout: Optional[int] = None) -> str:
        """Low-level chat call with timeout. Never raises; returns string or error message."""
        effective_timeout = timeout or self.timeout
        if not self.base_url or not self.base_url.strip():
            return "AI review unavailable: OLLAMA_BASE_URL not configured"
        # Production localhost guard
        if settings.flask_env.lower() == "production" and ("localhost" in self.base_url or "127.0.0.1" in self.base_url):
            return f"AI review unavailable: Ollama at {self.base_url} not reachable from production (configure OLLAMA_BASE_URL)"

        # Try via requests with timeout (preferred, respects timeout)
        try:
            payload = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "options": {"temperature": 0.3, "num_predict": 600},
            }
            if json_mode:
                payload["format"] = "json"
            resp = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=effective_timeout)
            if resp.status_code == 200:
                j = resp.json()
                content = j.get("message", {}).get("content", "") or j.get("response", "")
                if content:
                    return content.strip()
            # Fallback to ollama client if requests returns non-200 or empty
        except Exception as e:
            # If requests fails due to connection, map to unavailable
            msg = str(e)
            if "timed out" in msg.lower() or "timeout" in msg.lower():
                return f"AI review unavailable: Ollama timeout after {effective_timeout}s ({msg})"
            if "connection" in msg.lower() or "refused" in msg.lower():
                # Try client fallback before giving up, but if both fail, report
                pass
            # Continue to client fallback below
            logger.debug("Requests chat failed, trying client fallback: %s", e)

        try:
            response = self.client.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.3, "num_predict": 600},
            )
            content = response.get("message", {}).get("content", "") or response.get("response", "")
            return content.strip()
        except Exception as e:
            msg = str(e)
            if "timed out" in msg.lower() or "timeout" in msg.lower():
                return f"AI review unavailable: Ollama timeout after {effective_timeout}s ({msg})"
            if "connection" in msg.lower() or "refused" in msg.lower():
                return f"AI review unavailable: Ollama not reachable at {self.base_url} ({msg})"
            if "model" in msg.lower() and "not found" in msg.lower():
                return f"AI review unavailable: model '{self.model}' not found ({msg})"
            return f"AI review unavailable: {msg}"

    def _safe_json_parse(self, text: str) -> Optional[Dict[str, Any]]:
        """Try to extract and parse JSON from model output. Repairs common malformations."""
        if not text or not text.strip():
            return None
        # Strip markdown fences
        cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
        # Try direct parse
        try:
            return json.loads(cleaned)
        except Exception:
            pass
        # Try to find first JSON object via regex
        try:
            match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception:
            pass
        # Attempt simple repair: single quotes to double quotes (risky but fallback)
        try:
            repaired = cleaned.replace("'", '"')
            repaired = re.sub(r",\s*}", "}", repaired)
            repaired = re.sub(r",\s*]", "]", repaired)
            return json.loads(repaired)
        except Exception:
            return None

    def _validate_structured(self, data: Dict[str, Any], filename: str) -> Dict[str, Any]:
        """Ensure required keys and normalize."""
        if not isinstance(data, dict):
            raise ValueError("Top-level must be object")
        summary = str(data.get("summary", ""))[:2000]
        issues = data.get("issues", [])
        recommendations = data.get("recommendations", [])
        # Normalize issues
        valid_sev = {"critical", "high", "medium", "low", "info"}
        valid_cat = {"security", "bug", "quality", "performance", "maintainability"}
        norm_issues = []
        for raw in issues if isinstance(issues, list) else []:
            if not isinstance(raw, dict):
                continue
            sev = str(raw.get("severity", "medium")).lower()
            cat = str(raw.get("category", "quality")).lower()
            norm_issues.append({
                "severity": sev if sev in valid_sev else "medium",
                "category": cat if cat in valid_cat else "quality",
                "title": str(raw.get("title", raw.get("description", "")))[:200],
                "description": str(raw.get("description", ""))[:2000],
                "file": str(raw.get("file", filename)),
                "line": raw.get("line") if isinstance(raw.get("line"), int) else None,
                "suggestion": str(raw.get("suggestion", ""))[:2000],
            })
        # Cap counts
        norm_issues = norm_issues[:25]
        recos = [str(r)[:500] for r in recommendations if isinstance(recommendations, list)][:10]
        return {"summary": summary, "issues": norm_issues, "recommendations": recos}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def review_code(self, code: str, filename: str = "code.py", findings: List[Issue] = None) -> str:
        """Legacy string interface — kept for backward compat. Uses structured prompt with fallback to plain text."""
        result = self.review_code_structured(code, filename, findings)
        if result.get("ai_available"):
            return result.get("summary") or result.get("raw") or AI_UNAVAILABLE_MSG
        return result.get("summary") or result.get("error") or AI_UNAVAILABLE_MSG

    def review_code_structured(self, code: str, filename: str = "code.py", findings: List[Issue] = None) -> Dict[str, Any]:
        """
        Main structured review. Returns:
        {
          ai_available: bool,
          summary: str,
          issues: [...],
          recommendations: [...],
          raw: str,
          error: str|None,
          model: str,
          fallback: bool
        }
        Never raises.
        """
        if not code or not code.strip():
            return {
                "ai_available": True,
                "summary": "No code provided.",
                "issues": [],
                "recommendations": [],
                "raw": "",
                "error": None,
                "model": self.model,
                "fallback": False,
            }

        # Check Ollama reachable first (quick)
        health = self.check_health()
        if not health["reachable"]:
            return {
                "ai_available": False,
                "summary": AI_UNAVAILABLE_MSG,
                "issues": [],
                "recommendations": [],
                "raw": "",
                "error": f"Ollama unavailable: {health['error']}",
                "model": self.model,
                "fallback": True,
            }

        # If model not available, also fallback
        available, msg = self.is_model_available()
        if not available:
            return {
                "ai_available": False,
                "summary": AI_UNAVAILABLE_MSG,
                "issues": [],
                "recommendations": [],
                "raw": "",
                "error": msg,
                "model": self.model,
                "fallback": True,
            }

        # Try structured JSON first
        prompt = self._build_structured_prompt(code, filename, findings)
        raw = self._query_llm(prompt, json_mode=True)
        if raw.startswith("AI review unavailable:"):
            return {
                "ai_available": False,
                "summary": AI_UNAVAILABLE_MSG,
                "issues": [],
                "recommendations": [],
                "raw": raw,
                "error": raw,
                "model": self.model,
                "fallback": True,
            }
        if not raw:
            return {
                "ai_available": False,
                "summary": AI_UNAVAILABLE_MSG,
                "issues": [],
                "recommendations": [],
                "raw": raw,
                "error": "Empty response from AI",
                "model": self.model,
                "fallback": True,
            }

        parsed = self._safe_json_parse(raw)
        if parsed is not None:
            try:
                validated = self._validate_structured(parsed, filename)
                return {
                    "ai_available": True,
                    "summary": validated["summary"] or raw[:500],
                    "issues": validated["issues"],
                    "recommendations": validated["recommendations"],
                    "raw": raw,
                    "error": None,
                    "model": self.model,
                    "fallback": False,
                }
            except Exception as e:
                logger.warning("Structured validation failed: %s, falling back to text", e)

        # Fallback: treat raw as plain text summary (not JSON)
        # Attempt to not crash, return controlled text result
        return {
            "ai_available": True,
            "summary": raw[:3000],
            "issues": [],
            "recommendations": [],
            "raw": raw,
            "error": None,
            "model": self.model,
            "fallback": False,
        }

    def summarize_findings(self, findings: List[Issue], code: str) -> str:
        if not findings:
            return "No issues found. Code looks good!"
        prompt = self._build_summary_prompt(findings, code)
        raw = self._query_llm(prompt)
        if raw.startswith("AI review unavailable:"):
            return AI_UNAVAILABLE_MSG
        return raw


def create_ai_reviewer() -> AIReviewer:
    return AIReviewer()
