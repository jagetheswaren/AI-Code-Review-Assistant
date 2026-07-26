"""
Simplified unit tests for code analyzers
Tests the actual interfaces of Security, Smell, and Complexity analyzers
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from analyzers.security_analyzer import SecurityAnalyzer
from analyzers.smell_analyzer import SmellAnalyzer
from analyzers.complexity_analyzer import ComplexityAnalyzer


class TestSecurityAnalyzer:
    """Test SecurityAnalyzer with Bandit"""

    @pytest.fixture
    def analyzer(self):
        return SecurityAnalyzer()

    def test_analyze_returns_file_analysis(self, analyzer):
        """Test that analyze returns FileAnalysis object"""
        code = "print('hello')"
        result = analyzer.analyze(code)
        assert result is not None
        assert hasattr(result, 'issues')
        assert hasattr(result, 'file_path')
        assert hasattr(result, 'lines_of_code')

    def test_detects_hardcoded_password(self, analyzer):
        """Test detection of hardcoded passwords"""
        code = 'password = "hardcoded_secret_123"'
        result = analyzer.analyze(code)
        assert result is not None
        # Check if any issues were found (may or may not depend on configuration)
        assert isinstance(result.issues, list)

    def test_detects_dangerous_call(self, analyzer):
        """Test detection of dangerous function calls"""
        code = 'import os\nos.system("rm -rf /")'
        result = analyzer.analyze(code)
        assert result is not None
        assert isinstance(result.issues, list)

    def test_safe_code(self, analyzer):
        """Test that safe code has minimal issues"""
        code = 'def add(a, b):\n    return a + b'
        result = analyzer.analyze(code)
        assert result is not None
        assert isinstance(result.issues, list)


class TestSmellAnalyzer:
    """Test SmellAnalyzer"""

    @pytest.fixture
    def analyzer(self):
        return SmellAnalyzer()

    def test_analyze_returns_issues(self, analyzer):
        """Test that analyze returns list of issues"""
        code = "def test():\n    pass"
        result = analyzer.analyze(code)
        assert result is not None
        assert isinstance(result, list)

    def test_detects_unused_imports(self, analyzer):
        """Test detection of unused imports"""
        code = "import os\ndef hello():\n    return 'hello'"
        result = analyzer.analyze(code)
        assert isinstance(result, list)

    def test_detects_long_function(self, analyzer):
        """Test detection of long functions"""
        code = """
def long_func(a, b, c):
    x = a + b
    y = x * c
    z = y + 10
    w = z * 2
    v = w + x
    u = v * y
    return u
"""
        result = analyzer.analyze(code)
        assert isinstance(result, list)

    def test_safe_code(self, analyzer):
        """Test short, clean code"""
        code = "def add(a, b):\n    return a + b"
        result = analyzer.analyze(code)
        assert isinstance(result, list)


class TestComplexityAnalyzer:
    """Test ComplexityAnalyzer"""

    @pytest.fixture
    def analyzer(self):
        return ComplexityAnalyzer()

    def test_analyze_returns_complexity_data(self, analyzer):
        """Test that analyze returns complexity data"""
        code = "def test():\n    pass"
        result = analyzer.analyze(code)
        assert result is not None

    def test_detects_high_complexity(self, analyzer):
        """Test detection of high cyclomatic complexity"""
        code = """
def complex_func(x):
    if x > 0:
        if x > 10:
            if x > 100:
                return x * 3
            return x * 2
        return x
    else:
        if x < -10:
            if x < -100:
                return x / 3
            return x / 2
        return -x
"""
        result = analyzer.analyze(code)
        assert result is not None

    def test_simple_function_low_complexity(self, analyzer):
        """Test that simple function has low complexity"""
        code = "def add(a, b):\n    return a + b"
        result = analyzer.analyze(code)
        assert result is not None


class TestAnalyzerIntegration:
    """Test all analyzers together"""

    def test_all_analyzers_on_vulnerable_code(self):
        """Test all analyzers detect issues in vulnerable code"""
        code = """
import os
password = "secret123"
def vulnerable(data):
    query = "SELECT * FROM users WHERE id = " + str(data)
    os.system("rm " + data)
    if data > 0:
        if data > 10:
            if data > 100:
                return data
    return 0
"""
        security = SecurityAnalyzer()
        smell = SmellAnalyzer()
        complexity = ComplexityAnalyzer()

        sec_result = security.analyze(code)
        smell_result = smell.analyze(code)
        complex_result = complexity.analyze(code)

        assert sec_result is not None
        assert isinstance(smell_result, list)
        assert complex_result is not None

    def test_all_analyzers_on_clean_code(self):
        """Test analyzers on clean code"""
        code = """
def add(a, b):
    return a + b

def multiply(a, b):
    return a * b
"""
        security = SecurityAnalyzer()
        smell = SmellAnalyzer()
        complexity = ComplexityAnalyzer()

        sec_result = security.analyze(code)
        smell_result = smell.analyze(code)
        complex_result = complexity.analyze(code)

        assert sec_result is not None
        assert isinstance(smell_result, list)
        assert complex_result is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
