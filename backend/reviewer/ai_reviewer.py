import json
import logging
import re
import requests
from typing import List, Dict, Any, Optional, Tuple

import ollama

from models.review import Issue
from config import settings

logger = logging.getLogger(__name__)

AI_UNAVAILABLE_MSG = "AI review unavailable; static analysis completed."
MAX_CODE_CHARS = getattr(settings, "ollama_max_code_chars", 12000)


class AIReviewer:
    """Ollama-backed reviewer with structured JSON support and robust fallback."""

    def __init__(self, model: str = None, base_url: str = None, timeout: int = None):
        self.ollama_model = model or settings.ollama_model
        self.groq_model = settings.groq_model
        self.model = self.groq_model if settings.groq_api_key else self.ollama_model
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self.timeout = timeout or getattr(settings, "ollama_timeout", 30)
        # ollama.Client expects host without trailing slash
        self.client = ollama.Client(host=self.base_url)
        self.groq_api_key = settings.groq_api_key
        self.groq_client = None
        self.groq_setup_error = None
        if self.groq_api_key:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=self.groq_api_key, timeout=self.timeout)
            except ImportError:
                self.groq_setup_error = "Groq SDK is not installed."
                self.groq_setup_status = "sdk_unavailable"
                logger.warning("Groq SDK not installed. Fallback unavailable.")
        else:
            self.groq_setup_status = "not_configured"

    # ------------------------------------------------------------------
    # Connectivity helpers
    # ------------------------------------------------------------------
    def check_health(self) -> Dict[str, Any]:
        """Check configured Groq first, then Ollama as its fallback."""
        groq_status = getattr(self, "groq_setup_status", "unavailable")
        groq_error = self.groq_setup_error
        if self.groq_client:
            try:
                response = self.groq_client.models.list()
                models = [getattr(item, "id", None) for item in getattr(response, "data", [])]
                if self.groq_model in models:
                    ollama_health = self._check_ollama_health()
                    return {
                        "reachable": True,
                        "models": models,
                        "error": None,
                        "provider": "groq",
                        "model": self.groq_model,
                        "groq_status": "available",
                        "ollama_status": ollama_health["ollama_status"],
                        "ollama_models": ollama_health["ollama_models"],
                        "ollama_error": ollama_health.get("error"),
                    }
                groq_status = "model_missing"
                groq_error = f"Configured Groq model '{self.groq_model}' was not returned by the provider."
            except Exception as error:
                status_code = getattr(error, "status_code", None)
                groq_status = "unreachable"
                groq_error = f"Groq request failed ({status_code})." if status_code else f"Groq request failed ({type(error).__name__})."

        health = self._check_ollama_health()
        health.update({"groq_status": groq_status, "groq_error": groq_error})
        health.setdefault("ollama_error", health.get("error"))
        return health

    def _check_ollama_health(self) -> Dict[str, Any]:
        if not self.base_url or not self.base_url.strip():
            return {"reachable": False, "models": [], "error": "OLLAMA_BASE_URL is not configured.", "provider": "none", "model": None, "ollama_status": "unreachable", "ollama_models": []}
        if settings.flask_env.lower() == "production" and ("localhost" in self.base_url or "127.0.0.1" in self.base_url):
            error = f"Ollama at {self.base_url} is localhost and cannot be reached from production."
            return {"reachable": False, "models": [], "error": error, "provider": "none", "model": None, "ollama_status": "unreachable", "ollama_models": []}
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if resp.status_code != 200:
                error = f"Ollama returned HTTP {resp.status_code}."
                return {"reachable": False, "models": [], "error": error, "provider": "none", "model": None, "ollama_status": "unreachable", "ollama_models": []}
            data = resp.json()
            models = [m.get("name") for m in data.get("models", [])]
            available = self.ollama_model in models
            return {
                "reachable": available,
                "models": models,
                "error": None if available else f"Ollama model '{self.ollama_model}' was not found.",
                "provider": "ollama" if available else "none",
                "model": self.ollama_model if available else None,
                "ollama_status": "available" if available else "model_missing",
                "ollama_models": models,
            }
        except Exception as error:
            reason = "timed out" if isinstance(error, requests.Timeout) else "unreachable"
            safe_error = f"Ollama at {self.base_url} is {reason}."
            return {"reachable": False, "models": [], "error": safe_error, "provider": "none", "model": None, "ollama_status": "unreachable", "ollama_models": []}

    def is_model_available(self) -> Tuple[bool, str]:
        health = self.check_health()
        if not health["reachable"]:
            return False, f"Ollama unreachable: {health['error']}" if health.get("provider") != "groq" else (health["error"] or "No AI provider is available.")
        if health.get("provider") == "groq":
            return True, ""
        if self.ollama_model not in health.get("models", []):
            return False, f"Model '{self.ollama_model}' not found. Available: {health.get('models', [])}"
        return True, ""

    def is_available(self) -> bool:
        ok, _ = self.is_model_available()
        return ok

    # ------------------------------------------------------------------
    # Issue enrichment (CodeBERT fallback)
    # ------------------------------------------------------------------
    def enhance_issue_with_nlp(self, issue: Issue, code_context: str = "") -> Issue:
        # NLP Explainer has been removed in favor of pure LLM explanations 
        # (which are handled at the review level, not per-issue static analysis injection).
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
        groq_error = None

        if self.groq_client:
            try:
                kwargs = {
                    "messages": [{"role": "user", "content": prompt}],
                    "model": self.groq_model,
                    "temperature": 0.3,
                }
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}
                response = self.groq_client.chat.completions.create(
                    **kwargs
                )
                content = response.choices[0].message.content
                if content:
                    return content.strip()
            except Exception as e:
                status_code = getattr(e, "status_code", None)
                groq_error = f"Groq request failed ({status_code})." if status_code else f"Groq request failed ({type(e).__name__})."

        if not self.base_url or not self.base_url.strip():
            detail = f" {groq_error}" if groq_error else ""
            return f"AI review unavailable: OLLAMA_BASE_URL not configured.{detail}"
        if settings.flask_env.lower() == "production" and ("localhost" in self.base_url or "127.0.0.1" in self.base_url):
            detail = f" {groq_error}" if groq_error else ""
            return f"AI review unavailable: Ollama at {self.base_url} is not reachable from production.{detail}"

        ollama_error = None
        try:
            payload = {
                "model": self.ollama_model,
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
            ollama_error = f"Ollama returned HTTP {resp.status_code}."
        except Exception as e:
            reason = "timed out" if isinstance(e, requests.Timeout) else "unreachable"
            ollama_error = f"Ollama at {self.base_url} is {reason}."

        try:
            response = self.client.chat(
                model=self.ollama_model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.3, "num_predict": 600},
            )
            content = response.get("message", {}).get("content", "") or response.get("response", "")
            if content:
                return content.strip()
            ollama_error = "Ollama returned an empty response."
        except Exception as e:
            reason = "timed out" if isinstance(e, requests.Timeout) else "unreachable"
            ollama_error = f"Ollama at {self.base_url} is {reason}."

        details = " ".join(item for item in (groq_error, ollama_error) if item)
        return f"AI review unavailable: {details or 'No AI provider responded.'}"

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
