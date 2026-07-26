from typing import List, Dict, Any, Optional
from collections import defaultdict
from datetime import datetime
import uuid
from models.review import Issue, IssueType, Severity, ReviewResponse, AnalysisSummary, FileAnalysis


class FindingAggregator:
    def __init__(self):
        self.severity_order = {
            Severity.CRITICAL: 5,
            Severity.HIGH: 4,
            Severity.MEDIUM: 3,
            Severity.LOW: 2,
            Severity.INFO: 1
        }

    def merge_findings(self, *finding_lists: List[Issue]) -> List[Issue]:
        all_findings = []
        for findings in finding_lists:
            if findings:
                all_findings.extend(findings)

        deduplicated = self._deduplicate(all_findings)
        sorted_findings = self._sort_by_severity(deduplicated)
        return sorted_findings

    def _deduplicate(self, findings: List[Issue]) -> List[Issue]:
        seen = set()
        unique = []

        for finding in findings:
            key = (finding.rule_id, finding.line_number, finding.type.value)
            if key not in seen:
                seen.add(key)
                unique.append(finding)
            else:
                existing_idx = next(i for i, f in enumerate(unique) if (f.rule_id, f.line_number, f.type.value) == key)
                if self.severity_order.get(finding.severity, 0) > self.severity_order.get(unique[existing_idx].severity, 0):
                    unique[existing_idx] = finding

        return unique

    def _sort_by_severity(self, findings: List[Issue]) -> List[Issue]:
        return sorted(findings, key=lambda f: (-self.severity_order.get(f.severity, 0), f.line_number))

    def create_summary(self, findings: List[Issue], file_path: str, ai_review: str = "") -> ReviewResponse:
        by_type = defaultdict(int)
        by_severity = defaultdict(int)

        for finding in findings:
            by_type[finding.type.value] += 1
            by_severity[finding.severity.value] += 1

        overall_risk = self._calculate_overall_risk(by_severity)

        summary = AnalysisSummary(
            total_issues=len(findings),
            by_type=dict(by_type),
            by_severity=dict(by_severity),
            overall_risk=overall_risk,
            file_path=file_path
        )

        file_analysis = FileAnalysis(
            file_path=file_path,
            language="python",
            lines_of_code=0,
            issues=findings
        )

        return ReviewResponse(
            request_id=str(uuid.uuid4()),
            file_analyses=[file_analysis],
            summary=summary,
            ai_review=ai_review
        )

    def _calculate_overall_risk(self, by_severity: Dict[str, int]) -> str:
        if by_severity.get("critical", 0) > 0:
            return "critical"
        elif by_severity.get("high", 0) > 0:
            return "high"
        elif by_severity.get("medium", 0) > 2:
            return "high"
        elif by_severity.get("medium", 0) > 0:
            return "medium"
        elif by_severity.get("low", 0) > 0:
            return "low"
        return "none"

    def group_by_category(self, findings: List[Issue]) -> Dict[str, List[Issue]]:
        grouped = defaultdict(list)
        for finding in findings:
            grouped[finding.type.value].append(finding)
        return dict(grouped)

    def get_top_issues(self, findings: List[Issue], n: int = 5) -> List[Issue]:
        return self._sort_by_severity(findings)[:n]

    def filter_by_severity(self, findings: List[Issue], min_severity: Severity) -> List[Issue]:
        min_level = self.severity_order[min_severity]
        return [f for f in findings if self.severity_order.get(f.severity, 0) >= min_level]

    def filter_by_type(self, findings: List[Issue], issue_type: IssueType) -> List[Issue]:
        return [f for f in findings if f.type == issue_type]