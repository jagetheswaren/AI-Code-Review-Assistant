from radon.complexity import cc_visit, cc_rank
from radon.metrics import mi_visit, mi_rank, h_visit
from radon.raw import analyze
from radon.visitors import ComplexityVisitor
from typing import List, Dict, Any
from models.review import Issue, IssueType, Severity


class ComplexityAnalyzer:
    def __init__(self):
        self.issues: List[Issue] = []

    def analyze(self, code: str, filename: str = "code.py") -> List[Issue]:
        self.issues = []

        try:
            cc_results = cc_visit(code)
            mi_result = mi_visit(code, multi=True)
            raw_metrics = analyze(code)
        except Exception as e:
            self.issues.append(Issue(
                type=IssueType.PERFORMANCE,
                severity=Severity.LOW,
                line_number=1,
                message=f"Complexity analysis failed: {str(e)}",
                rule_id="COMPLEXITY_ANALYSIS_ERROR",
                suggestion="Ensure code is syntactically valid Python"
            ))
            return self.issues

        self._analyze_cyclomatic_complexity(cc_results)
        self._analyze_maintainability_index(mi_result)
        self._analyze_raw_metrics(raw_metrics)
        self._analyze_halstead_metrics(code)

        return self.issues

    def _add_issue(self, issue_type: IssueType, severity: Severity, line: int,
                   message: str, rule_id: str, suggestion: str):
        self.issues.append(Issue(
            type=issue_type,
            severity=severity,
            line_number=line,
            message=message,
            rule_id=rule_id,
            suggestion=suggestion
        ))

    def _analyze_cyclomatic_complexity(self, cc_results):
        for result in cc_results:
            complexity = result.complexity
            rank = cc_rank(complexity)
            line = result.lineno

            if rank in ('F', 'E'):
                severity = Severity.HIGH if rank == 'F' else Severity.MEDIUM
                self._add_issue(
                    IssueType.PERFORMANCE, severity, line,
                    f"High cyclomatic complexity ({complexity}) in '{result.name}' - rank {rank}",
                    "HIGH_CYCLOMATIC_COMPLEXITY",
                    f"Refactor '{result.name}' into smaller functions. Target complexity < 10"
                )
            elif rank == 'D':
                self._add_issue(
                    IssueType.PERFORMANCE, Severity.MEDIUM, line,
                    f"Moderate cyclomatic complexity ({complexity}) in '{result.name}' - rank D",
                    "MODERATE_CYCLOMATIC_COMPLEXITY",
                    f"Consider simplifying '{result.name}' or extracting logic into helper functions"
                )
            elif rank == 'C':
                self._add_issue(
                    IssueType.PERFORMANCE, Severity.LOW, line,
                    f"Cyclomatic complexity ({complexity}) in '{result.name}' - rank C",
                    "CYCLOMATIC_COMPLEXITY_WARNING",
                    f"Monitor complexity of '{result.name}' as it grows"
                )

    def _analyze_maintainability_index(self, mi_result):
        if isinstance(mi_result, list):
            for item in mi_result:
                mi = item.mi
                rank = mi_rank(mi)
                line = item.lineno

                if rank == 'F':
                    self._add_issue(
                        IssueType.PERFORMANCE, Severity.HIGH, line,
                        f"Very low maintainability index ({mi:.1f}) - rank F",
                        "LOW_MAINTAINABILITY",
                        "Significant refactoring needed. Break into smaller, focused modules"
                    )
                elif rank == 'E':
                    self._add_issue(
                        IssueType.PERFORMANCE, Severity.MEDIUM, line,
                        f"Low maintainability index ({mi:.1f}) - rank E",
                        "LOW_MAINTAINABILITY_WARNING",
                        "Consider refactoring to improve maintainability"
                    )
                elif rank == 'D':
                    self._add_issue(
                        IssueType.PERFORMANCE, Severity.LOW, line,
                        f"Below average maintainability index ({mi:.1f}) - rank D",
                        "MAINTAINABILITY_NOTICE",
                        "Monitor and consider improvements as code evolves"
                    )
        else:
            mi = mi_result
            rank = mi_rank(mi)
            if rank in ('E', 'F'):
                severity = Severity.HIGH if rank == 'F' else Severity.MEDIUM
                self._add_issue(
                    IssueType.PERFORMANCE, severity, 1,
                    f"Overall maintainability index is low ({mi:.1f}) - rank {rank}",
                    "OVERALL_LOW_MAINTAINABILITY",
                    "Consider architectural refactoring to improve maintainability"
                )

    def _analyze_raw_metrics(self, raw_metrics):
        if raw_metrics.loc > 500:
            self._add_issue(
                IssueType.PERFORMANCE, Severity.MEDIUM, 1,
                f"Large file: {raw_metrics.loc} lines of code",
                "LARGE_FILE",
                "Split into multiple modules/files for better maintainability"
            )
        elif raw_metrics.loc > 300:
            self._add_issue(
                IssueType.PERFORMANCE, Severity.LOW, 1,
                f"File is getting large: {raw_metrics.loc} lines",
                "LARGE_FILE_WARNING",
                "Consider splitting into smaller modules"
            )

        if raw_metrics.lloc > 200:
            self._add_issue(
                IssueType.PERFORMANCE, Severity.MEDIUM, 1,
                f"High logical lines of code: {raw_metrics.lloc}",
                "HIGH_LLOC",
                "Reduce logical complexity by extracting functions"
            )

        if raw_metrics.comments / max(raw_metrics.lloc, 1) < 0.1:
            self._add_issue(
                IssueType.CODE_SMELL, Severity.INFO, 1,
                f"Low comment density: {raw_metrics.comments / max(raw_metrics.lloc, 1):.1%}",
                "LOW_COMMENT_DENSITY",
                "Add docstrings and comments for complex logic"
            )

    def _analyze_halstead_metrics(self, code: str):
        try:
            halstead = h_visit(code)
            if halstead.total and halstead.total.effort > 100000:
                self._add_issue(
                    IssueType.PERFORMANCE, Severity.MEDIUM, 1,
                    f"High Halstead effort ({halstead.total.effort:.0f}) - code is difficult to understand",
                    "HIGH_HALSTEAD_EFFORT",
                    "Simplify code structure, reduce unique operators/operands"
                )
            elif halstead.total and halstead.total.effort > 50000:
                self._add_issue(
                    IssueType.PERFORMANCE, Severity.LOW, 1,
                    f"Moderate Halstead effort ({halstead.total.effort:.0f})",
                    "MODERATE_HALSTEAD_EFFORT",
                    "Consider simplifying complex expressions"
                )

            if halstead.total and halstead.total.volume > 10000:
                self._add_issue(
                    IssueType.PERFORMANCE, Severity.LOW, 1,
                    f"High Halstead volume ({halstead.total.volume:.0f}) - large vocabulary",
                    "HIGH_HALSTEAD_VOLUME",
                    "Reduce unique operators and operands where possible"
                )
        except Exception:
            pass