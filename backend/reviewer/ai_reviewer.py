import ollama
from typing import List, Optional
from models.review import Issue, IssueType, Severity
from config import settings
from ml.nlp_explainer import create_explainer


class AIReviewer:
    def __init__(self, model: str = None, base_url: str = None):
        self.model = model or settings.ollama_model
        self.client = ollama.Client(host=base_url or settings.ollama_base_url)
        self.nlp_explainer = create_explainer()

    def enhance_issue_with_nlp(self, issue: Issue, code_context: str = "") -> Issue:
        issue.explanation = self.nlp_explainer.generate_explanation(
            issue.model_dump(), code_context
        )
        issue.fix_suggestion = self.nlp_explainer.generate_fix_suggestion(
            issue.model_dump(), code_context
        )
        return issue

    def review_code(self, code: str, filename: str = "code.py", findings: List[Issue] = None) -> str:
        prompt = self._build_review_prompt(code, filename, findings)
        return self._query_llm(prompt)

    def summarize_findings(self, findings: List[Issue], code: str) -> str:
        if not findings:
            return "No issues found. Code looks good!"

        prompt = self._build_summary_prompt(findings, code)
        return self._query_llm(prompt)

    def _build_review_prompt(self, code: str, filename: str, findings: List[Issue] = None) -> str:
        findings_summary = ""
        if findings:
            by_type = {}
            for f in findings:
                by_type[f.type.value] = by_type.get(f.type.value, 0) + 1
            findings_summary = f"\nStatic Analysis Findings: {by_type}"

        return f"""You are a Senior Software Engineer performing a code review.

File: {filename}

Code to review:
```python
{code}
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

    def _build_summary_prompt(self, findings: List[Issue], code: str) -> str:
        grouped = {}
        for f in findings:
            grouped.setdefault(f.type.value, []).append(f)

        summary = "Static Analysis Results:\n"
        for type_name, issues in grouped.items():
            summary += f"\n{type_name.replace('_', ' ').title()} ({len(issues)}):"
            for issue in issues[:3]:
                summary += f"\n  - Line {issue.line_number}: {issue.message} [{issue.severity.value}]"

        return f"""Summarize these code analysis findings for a developer.

{summary}

Code context (first 100 lines):
```python
{chr(10).join(code.split(chr(10))[:100])}
```

Provide a 2-3 sentence executive summary highlighting the most critical issues and overall risk level."""

    def _query_llm(self, prompt: str) -> str:
        try:
            response = self.client.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.3, "num_predict": 500}
            )
            return response["message"]["content"].strip()
        except Exception as e:
            return f"AI review unavailable: {str(e)}"


def create_ai_reviewer() -> AIReviewer:
    return AIReviewer()