import uuid
import time
from typing import List, Dict, Any, Tuple
from flask import current_app

from analyzers.security_analyzer import SecurityAnalyzer
from analyzers.smell_analyzer import SmellAnalyzer
from analyzers.complexity_analyzer import ComplexityAnalyzer
from analyzers.performance_analyzer import PerformanceAnalyzer
from reviewer.ai_reviewer import AIReviewer
from reviewer.aggregator import FindingAggregator
from models.review import ReviewResponse, AnalysisSummary, FileAnalysis, Issue, Severity
from ml.severity_classifier import SeverityClassifier

class AnalysisService:
    def __init__(self):
        self.security_analyzer = SecurityAnalyzer()
        self.smell_analyzer = SmellAnalyzer()
        self.complexity_analyzer = ComplexityAnalyzer()
        self.performance_analyzer = PerformanceAnalyzer()
        self.ai_reviewer = AIReviewer()
        self.aggregator = FindingAggregator()
        self.ml_classifier = SeverityClassifier()
        self.ml_classifier.load()

    def analyze_files(self, file_contents: List[Dict[str, str]], context: str = "") -> ReviewResponse:
        """
        Analyzes a list of files and returns a ReviewResponse.
        file_contents should be a list of dicts: {"filename": str, "content": str}
        context can be a PR diff or extra context for the AI.
        """
        start_time = time.time()
        request_id = str(uuid.uuid4())
        
        all_issues = []
        all_file_analyses = []
        
        for file_info in file_contents:
            content = file_info["content"]
            filename = file_info["filename"]
            
            if not content:
                continue

            sec_issues = self.security_analyzer.analyze(content, filename)
            smell_issues = self.smell_analyzer.analyze(content, filename)
            comp_issues = self.complexity_analyzer.analyze(content, filename)
            perf_issues = self.performance_analyzer.analyze(content, filename)

            raw_file_issues = sec_issues.issues + smell_issues + comp_issues + perf_issues
            file_issues = self.aggregator.merge_findings(raw_file_issues)

            # Add LLM source tag if AI reviewer is active
            try:
                if hasattr(self, 'ai_reviewer') and self.ai_reviewer:
                    for issue in file_issues:
                        if "ai" not in issue.source:
                            issue.source.append("ai")
            except Exception:
                pass

            for issue in file_issues:
                try:
                    ml_issue = {
                        "type": issue.type.value,
                        "severity": issue.severity.value,
                        "line_number": issue.line_number,
                        "message": issue.message,
                        "rule_id": issue.rule_id or "",
                        "suggestion": issue.suggestion,
                        "code_snippet": issue.code_snippet,
                        "explanation": issue.explanation,
                    }
                    ml_result = self.ml_classifier.predict([ml_issue])[0]
                    if self.ml_classifier.is_trained:
                        issue.ml_severity = ml_result["ml_severity"]
                        issue.ml_confidence = ml_result["ml_confidence"]
                        issue.ml_model_version = ml_result.get("ml_model_version")
                        if "ml" not in issue.source:
                            issue.source.append("ml")
                except Exception:
                    pass

            all_issues.extend(file_issues)

            fa = FileAnalysis(
                file_path=filename,
                language="python",
                lines_of_code=len(content.split('\n')),
                issues=file_issues
            )
            all_file_analyses.append(fa)

        by_type = {}
        by_severity = {}
        for issue in all_issues:
            by_type[issue.type.value] = by_type.get(issue.type.value, 0) + 1
            by_severity[issue.severity.value] = by_severity.get(issue.severity.value, 0) + 1

        overall_risk = self._calculate_overall_risk(by_severity)
        health_score = max(0, 100 - (by_severity.get('critical', 0) * 10) - (by_severity.get('high', 0) * 5) - (by_severity.get('medium', 0) * 2) - (by_severity.get('low', 0) * 1))

        summary = AnalysisSummary(
            total_issues=len(all_issues),
            by_type=by_type,
            by_severity=by_severity,
            overall_risk=overall_risk,
            health_score=health_score,
            file_path="Multiple Files" if len(file_contents) > 1 else (file_contents[0]["filename"] if file_contents else "unknown")
        )

        # AI Structured Review
        ai_review_context = context
        if not ai_review_context:
            for file_info in file_contents[:3]:
                content = file_info["content"]
                truncated = content[:2500] + ("\n# ... truncated" if len(content) > 2500 else "")
                ai_review_context += f"\n# {file_info['filename']}\n{truncated}\n"

        try:
            ai_res = self.ai_reviewer.review_code_structured(ai_review_context, summary.file_path, all_issues)
            ai_review = ai_res.get("summary") or ai_res.get("raw") or "AI review unavailable; static analysis completed."
            ai_available = ai_res.get("ai_available", False)
            ai_error = ai_res.get("error")
            ai_model = ai_res.get("model")
            ai_structured = {"issues": ai_res.get("issues", []), "recommendations": ai_res.get("recommendations", []), "raw": ai_res.get("raw")}
        except Exception as e:
            if current_app:
                current_app.logger.error(f"AI structured review failed: {e}")
            ai_review = "AI review unavailable; static analysis completed."
            ai_available = False
            ai_error = str(e)
            ai_model = getattr(self.ai_reviewer, "model", None)
            ai_structured = None

        response = ReviewResponse(
            request_id=request_id,
            file_analyses=all_file_analyses,
            summary=summary,
            ai_review=ai_review,
            ai_available=ai_available,
            ai_error=ai_error,
            ai_model=ai_model,
            ai_structured=ai_structured,
            processing_time_ms=int((time.time() - start_time) * 1000)
        )

        return response

    def _calculate_overall_risk(self, by_severity: Dict[str, int]) -> str:
        if by_severity.get('critical', 0) > 0:
            return 'critical'
        elif by_severity.get('high', 0) > 0:
            return 'high'
        elif by_severity.get('medium', 0) > 2:
            return 'high'
        elif by_severity.get('medium', 0) > 0:
            return 'medium'
        elif by_severity.get('low', 0) > 0:
            return 'low'
        return 'none'

# Global instance for app
analysis_service = AnalysisService()
