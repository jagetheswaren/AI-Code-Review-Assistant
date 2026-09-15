import unittest
from unittest.mock import patch, MagicMock
from services.analysis_service import AnalysisService
from models.review import IssueType, Severity, Issue

class TestAnalysisService(unittest.TestCase):
    @patch('services.analysis_service.SecurityAnalyzer')
    @patch('services.analysis_service.SmellAnalyzer')
    @patch('services.analysis_service.ComplexityAnalyzer')
    @patch('services.analysis_service.PerformanceAnalyzer')
    @patch('services.analysis_service.AIReviewer')
    @patch('services.analysis_service.SeverityClassifier')
    def setUp(self, mock_sc, mock_air, mock_pa, mock_ca, mock_sma, mock_seca):
        # We need to create an instance and mock its components to test the main orchestrator logic
        self.mock_security = mock_seca.return_value
        self.mock_smell = mock_sma.return_value
        self.mock_complexity = mock_ca.return_value
        self.mock_performance = mock_pa.return_value
        self.mock_ai = mock_air.return_value
        self.mock_ml = mock_sc.return_value

        self.mock_security.analyze.return_value = MagicMock(issues=[])
        self.mock_smell.analyze.return_value = []
        self.mock_complexity.analyze.return_value = []
        self.mock_performance.analyze.return_value = []
        
        self.mock_ml.is_trained = True
        self.mock_ml.predict.return_value = [{"ml_severity": "low", "ml_confidence": 0.9, "ml_model_version": "test-v1"}]
        
        self.mock_ai.review_code_structured.return_value = {
            "summary": "Test Summary",
            "ai_available": True,
            "error": None,
            "model": "test-model",
            "issues": [],
            "recommendations": [],
            "raw": "Test Raw"
        }

        self.service = AnalysisService()

    def test_health_score_calculation_no_issues(self):
        file_contents = [{"filename": "test.py", "content": "print('hello world')"}]
        
        # Mocks will return empty lists by default
        response = self.service.analyze_files(file_contents)
        
        self.assertEqual(response.summary.health_score, 100)
        self.assertEqual(response.summary.total_issues, 0)

    def test_health_score_calculation_with_critical_issue(self):
        # Mock one critical issue
        critical_issue = Issue(
            type=IssueType.SECURITY,
            severity=Severity.CRITICAL,
            line_number=1,
            message="Test issue",
            rule_id="SEC101"
        )
        self.mock_security.analyze.return_value = MagicMock(issues=[critical_issue])
        
        file_contents = [{"filename": "test.py", "content": "eval('dangerous')"}]
        
        response = self.service.analyze_files(file_contents)
        
        # Critical = -10, Health Score = 90
        self.assertEqual(response.summary.health_score, 90)
        self.assertEqual(response.summary.total_issues, 1)

    def test_health_score_calculation_mixed_issues(self):
        # 1 Critical (-10), 2 High (-10), 1 Medium (-2), 3 Low (-3) => -25 => Score 75
        issues = [
            Issue(type=IssueType.SECURITY, severity=Severity.CRITICAL, line_number=1, message="c"),
            Issue(type=IssueType.CODE_SMELL, severity=Severity.HIGH, line_number=2, message="h1"),
            Issue(type=IssueType.CODE_SMELL, severity=Severity.HIGH, line_number=3, message="h2"),
            Issue(type=IssueType.PERFORMANCE, severity=Severity.MEDIUM, line_number=4, message="m"),
            Issue(type=IssueType.BEST_PRACTICE, severity=Severity.LOW, line_number=5, message="l1"),
            Issue(type=IssueType.BEST_PRACTICE, severity=Severity.LOW, line_number=6, message="l2"),
            Issue(type=IssueType.BEST_PRACTICE, severity=Severity.LOW, line_number=7, message="l3"),
        ]
        self.mock_smell.analyze.return_value = issues
        
        file_contents = [{"filename": "test.py", "content": "pass"}]
        
        response = self.service.analyze_files(file_contents)
        
        self.assertEqual(response.summary.health_score, 75)
        self.assertEqual(response.summary.total_issues, 7)

    def test_health_score_minimum_zero(self):
        # 11 Critical (-110) => Score should not be negative
        issues = [
            Issue(type=IssueType.SECURITY, severity=Severity.CRITICAL, line_number=i, message=f"c{i}")
            for i in range(11)
        ]
        self.mock_security.analyze.return_value = MagicMock(issues=issues)
        
        file_contents = [{"filename": "test.py", "content": "pass"}]
        
        response = self.service.analyze_files(file_contents)
        
        self.assertEqual(response.summary.health_score, 0)
        self.assertEqual(response.summary.total_issues, 11)

if __name__ == '__main__':
    unittest.main()
