import ast
import bandit
from bandit.core import config
from bandit.core import manager
from bandit.core import constants
from typing import List
from models.review import Issue, IssueType, Severity, FileAnalysis
import tempfile
import os


class SecurityAnalyzer:
    SEVERITY_MAP = {
        'CRITICAL': Severity.CRITICAL,
        'HIGH': Severity.HIGH,
        'MEDIUM': Severity.MEDIUM,
        'LOW': Severity.LOW,
    }

    def __init__(self):
        self.bandit_config = config.BanditConfig()

    def analyze(self, code: str, file_path: str = "code.py") -> FileAnalysis:
        issues = []

        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            issues.append(Issue(
                type=IssueType.CODE_SMELL,
                severity=Severity.MEDIUM,
                line_number=e.lineno or 1,
                message=f"Syntax error: {e.msg}",
                rule_id="SYNTAX_ERROR",
                suggestion="Fix syntax error before analysis",
                code_snippet=code.splitlines()[e.lineno - 1] if e.lineno and 0 < e.lineno <= len(code.splitlines()) else "",
                file_path=file_path,
                source=["ast"],
            ))
            return FileAnalysis(
                file_path=file_path,
                language="python",
                lines_of_code=len(code.splitlines()),
                issues=issues,
            )
        issues.extend(self._analyze_ast(tree, code, file_path))
        issues.extend(self._run_bandit(code, file_path))

        return FileAnalysis(
            file_path=file_path,
            language="python",
            lines_of_code=len(code.splitlines()),
            issues=issues
        )

    def _analyze_ast(self, tree: ast.AST, code: str, file_path: str) -> List[Issue]:
        issues = []
        lines = code.splitlines()

        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                issues.extend(self._check_dangerous_calls(node, lines, file_path))
            elif isinstance(node, ast.Assign):
                issues.extend(self._check_hardcoded_secrets(node, lines, file_path))
            elif isinstance(node, ast.Import):
                issues.extend(self._check_dangerous_imports(node, lines, file_path))
            elif isinstance(node, ast.ImportFrom):
                issues.extend(self._check_dangerous_imports(node, lines, file_path))

        return issues

    def _check_dangerous_calls(self, node: ast.Call, lines: List[str], file_path: str) -> List[Issue]:
        issues = []
        dangerous_functions = {
            'eval': ('CRITICAL', 'Use of eval() allows arbitrary code execution'),
            'exec': ('CRITICAL', 'Use of exec() allows arbitrary code execution'),
            'compile': ('HIGH', 'Use of compile() with untrusted input is dangerous'),
            'subprocess.call': ('HIGH', 'Shell injection risk with shell=True'),
            'subprocess.Popen': ('HIGH', 'Shell injection risk with shell=True'),
            'os.system': ('CRITICAL', 'Shell command injection vulnerability'),
            'os.popen': ('CRITICAL', 'Shell command injection vulnerability'),
            'pickle.loads': ('CRITICAL', 'Pickle deserialization allows arbitrary code execution'),
            'pickle.load': ('CRITICAL', 'Pickle deserialization allows arbitrary code execution'),
            'yaml.load': ('HIGH', 'YAML deserialization can execute arbitrary code'),
        }

        func_name = self._get_call_name(node)
        if func_name in dangerous_functions:
            severity_str, message = dangerous_functions[func_name]
            issues.append(Issue(
                type=IssueType.SECURITY,
                severity=self.SEVERITY_MAP.get(severity_str, Severity.HIGH),
                line_number=node.lineno,
                message=message,
                rule_id=f"SECURITY_{func_name.upper().replace('.', '_')}",
                suggestion=self._get_suggestion(func_name),
                code_snippet=self._get_code_snippet(lines, node.lineno),
                file_path=file_path,
                source=["ast"]
            ))

        if func_name in ['subprocess.call', 'subprocess.Popen', 'subprocess.run']:
            for kw in node.keywords:
                if kw.arg == 'shell' and isinstance(kw.value, ast.Constant) and kw.value.value is True:
                    issues.append(Issue(
                        type=IssueType.SECURITY,
                        severity=Severity.CRITICAL,
                        line_number=node.lineno,
                        message='Shell=True with subprocess allows command injection',
                        rule_id='SECURITY_SHELL_INJECTION',
                        suggestion='Use shell=False and pass arguments as a list',
                        code_snippet=self._get_code_snippet(lines, node.lineno),
                        file_path=file_path,
                        source=["ast"]
                    ))

        return issues

    def _check_hardcoded_secrets(self, node: ast.Assign, lines: List[str], file_path: str) -> List[Issue]:
        issues = []
        secret_patterns = [
            ('password', 'Hardcoded password detected'),
            ('api_key', 'Hardcoded API key detected'),
            ('secret', 'Hardcoded secret detected'),
            ('token', 'Hardcoded token detected'),
            ('private_key', 'Hardcoded private key detected'),
        ]

        for target in node.targets:
            if isinstance(target, ast.Name):
                var_name = target.id.lower()
                for pattern, message in secret_patterns:
                    if pattern in var_name:
                        if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                            if len(node.value.value) > 8:
                                issues.append(Issue(
                                    type=IssueType.SECURITY,
                                    severity=Severity.CRITICAL,
                                    line_number=node.lineno,
                                    message=message,
                                    rule_id=f'SECURITY_HARDCODED_{pattern.upper()}',
                                    suggestion='Use environment variables or secret management system',
                                    code_snippet=self._get_code_snippet(lines, node.lineno),
                                    file_path=file_path,
                                    source=["ast"]
                                ))

        return issues

    def _check_dangerous_imports(self, node: ast.Import | ast.ImportFrom, lines: List[str], file_path: str) -> List[Issue]:
        issues = []
        dangerous_modules = {
            'pickle': ('HIGH', 'Pickle module can execute arbitrary code during deserialization'),
            'subprocess': ('MEDIUM', 'Subprocess module can execute shell commands'),
            'os': ('LOW', 'OS module provides system-level access'),
            'sys': ('LOW', 'Sys module provides system-level access'),
            'eval': ('CRITICAL', 'Eval function allows arbitrary code execution'),
        }

        names = []
        if isinstance(node, ast.Import):
            names = [alias.name for alias in node.names]
        elif isinstance(node, ast.ImportFrom) and node.module:
            names = [node.module] + [alias.name for alias in node.names]

        for name in names:
            for module, (severity_str, message) in dangerous_modules.items():
                if name.startswith(module):
                    issues.append(Issue(
                        type=IssueType.SECURITY,
                        severity=self.SEVERITY_MAP.get(severity_str, Severity.MEDIUM),
                        line_number=node.lineno,
                        message=f'{message}: {name}',
                        rule_id=f'SECURITY_IMPORT_{module.upper()}',
                        suggestion=f'Avoid importing {module} unless necessary; validate all inputs',
                        code_snippet=self._get_code_snippet(lines, node.lineno),
                        file_path=file_path,
                        source=["ast"]
                    ))

        return issues

    def _run_bandit(self, code: str, file_path: str) -> List[Issue]:
        issues = []
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_path = f.name

            b_mgr = manager.BanditManager(self.bandit_config, 'file', quiet=True)
            b_mgr.discover_files([temp_path])
            b_mgr.run_tests()

            for result in b_mgr.get_issues():
                severity_map = {
                    constants.HIGH: Severity.HIGH,
                    constants.MEDIUM: Severity.MEDIUM,
                    constants.LOW: Severity.LOW,
                }
                issues.append(Issue(
                    type=IssueType.SECURITY,
                    severity=severity_map.get(result.severity, Severity.MEDIUM),
                    line_number=result.lineno,
                    message=result.text,
                    rule_id=f"BANDIT_{result.test_id}",
                    suggestion=self._get_bandit_suggestion(result.test_id),
                    code_snippet=self._get_code_snippet(code.splitlines(), result.lineno),
                    file_path=file_path,
                    source=["bandit"]
                ))

            os.unlink(temp_path)
        except Exception as e:
            pass

        return issues

    def _get_call_name(self, node: ast.Call) -> str:
        if isinstance(node.func, ast.Name):
            return node.func.id
        elif isinstance(node.func, ast.Attribute):
            parts = []
            curr = node.func
            while isinstance(curr, ast.Attribute):
                parts.append(curr.attr)
                curr = curr.value
            if isinstance(curr, ast.Name):
                parts.append(curr.id)
            return '.'.join(reversed(parts))
        return ''

    def _get_code_snippet(self, lines: List[str], line_no: int, context: int = 2) -> str:
        start = max(0, line_no - context - 1)
        end = min(len(lines), line_no + context)
        return '\n'.join(f"{i+1}: {lines[i]}" for i in range(start, end))

    def _get_suggestion(self, func_name: str) -> str:
        suggestions = {
            'eval': 'Avoid eval(); use ast.literal_eval() for safe evaluation',
            'exec': 'Avoid exec(); refactor to use safer alternatives',
            'os.system': 'Use subprocess.run() with shell=False and arguments as list',
            'os.popen': 'Use subprocess.run() with shell=False and arguments as list',
            'pickle.loads': 'Use json.loads() or other safe serialization formats',
            'pickle.load': 'Use json.load() or other safe serialization formats',
            'yaml.load': 'Use yaml.safe_load() instead of yaml.load()',
        }
        return suggestions.get(func_name, 'Review usage for security implications')

    def _get_bandit_suggestion(self, test_id: str) -> str:
        suggestions = {
            'B101': 'Use assert statements only for debugging, not for runtime checks',
            'B102': 'Avoid using exec(); refactor to safer alternatives',
            'B103': 'Set secure file permissions; avoid world-writable files',
            'B104': 'Use subprocess with shell=False and validate inputs',
            'B105': 'Avoid hardcoded passwords; use environment variables',
            'B106': 'Avoid hardcoded passwords in function arguments',
            'B107': 'Avoid hardcoded passwords in default values',
            'B108': 'Use subprocess with shell=False; validate/sanitize inputs',
            'B110': 'Use subprocess with shell=False; validate/sanitize inputs',
            'B201': 'Use flask.run(debug=False) in production',
            'B301': 'Use safe random number generators like secrets module',
            'B302': 'Use secrets module for cryptographic operations',
            'B303': 'Use secrets module for generating secure tokens',
            'B304': 'Use secrets module for cryptographic operations',
            'B305': 'Use secrets module for cryptographic operations',
            'B306': 'Use secrets module for cryptographic operations',
            'B307': 'Use secrets module for cryptographic operations',
            'B311': 'Use secrets.randbelow() or secrets.choice() instead',
            'B312': 'Use subprocess with shell=False and validate inputs',
            'B313': 'Use XML parsers with entity expansion limits',
            'B314': 'Use XML parsers with entity expansion limits',
            'B315': 'Use XML parsers with entity expansion limits',
            'B316': 'Use XML parsers with entity expansion limits',
            'B317': 'Use XML parsers with entity expansion limits',
            'B318': 'Use XML parsers with entity expansion limits',
            'B319': 'Use XML parsers with entity expansion limits',
            'B320': 'Use XML parsers with entity expansion limits',
            'B321': 'Use safe FTP alternatives like SFTP/SCP',
            'B322': 'Use subprocess with shell=False; validate inputs',
            'B323': 'Verify SSL certificates; do not disable verification',
            'B324': 'Use hashlib.sha256() or stronger hashing algorithms',
            'B325': 'Use hashlib.sha256() or stronger hashing algorithms',
            'B401': 'Use importlib.import_module() instead of __import__',
            'B403': 'Use safe YAML loading with yaml.safe_load()',
            'B404': 'Use subprocess with shell=False; validate inputs',
            'B405': 'Use xml.etree.ElementTree with secure parser',
            'B406': 'Use xml.etree.ElementTree with secure parser',
            'B407': 'Use xml.etree.ElementTree with secure parser',
            'B408': 'Use xml.etree.ElementTree with secure parser',
            'B409': 'Use xml.etree.ElementTree with secure parser',
            'B410': 'Use lxml with secure parser settings',
            'B411': 'Use lxml with secure parser settings',
            'B412': 'Use lxml with secure parser settings',
            'B413': 'Use lxml with secure parser settings',
            'B501': 'Use https:// or verify SSL certificates',
            'B502': 'Use https:// or verify SSL certificates',
            'B503': 'Use https:// or verify SSL certificates',
            'B504': 'Use https:// or verify SSL certificates',
            'B505': 'Use https:// or verify SSL certificates',
            'B506': 'Use https:// or verify SSL certificates',
            'B507': 'Use https:// or verify SSL certificates',
            'B601': 'Use paramiko or other SSH libraries with proper host key verification',
            'B602': 'Use subprocess with shell=False and validate inputs',
            'B603': 'Use subprocess with shell=False and validate inputs',
            'B604': 'Use subprocess with shell=False and validate inputs',
            'B605': 'Use shell=False and validate all inputs',
            'B606': 'Use shell=False and validate all inputs',
            'B607': 'Use shell=False and validate all inputs',
            'B608': 'Use shell=False and validate all inputs',
            'B609': 'Use shell=False and validate all inputs',
            'B610': 'Use django.conf.settings.SECRET_KEY in production',
            'B611': 'Use secure random number generation',
            'B701': 'Use jinja2 with autoescape=True',
            'B702': 'Use safe template rendering',
            'B703': 'Use safe template rendering',
        }
        return suggestions.get(test_id, 'Review the flagged code for security implications')