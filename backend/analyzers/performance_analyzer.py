import ast
from typing import List
from models.review import Issue, IssueType, Severity


class PerformanceAnalyzer:
    def analyze(self, code: str, filename: str = "code.py") -> List[Issue]:
        issues = []

        try:
            tree = ast.parse(code)
        except SyntaxError:
            return issues

        lines = code.split('\n')
        self._check_nested_loops(tree, lines, filename, issues)
        self._check_large_allocations(tree, lines, filename, issues)
        self._check_string_concatenation(tree, lines, filename, issues)
        self._check_global_variables(tree, lines, filename, issues)
        self._check_repeated_computations(tree, lines, filename, issues)

        return issues

    def _check_nested_loops(self, tree: ast.AST, lines: List[str], filename: str, issues: List[Issue]):
        def _find_nested_loops(node, depth=0, parent_type=None):
            for child in ast.iter_child_nodes(node):
                if isinstance(child, (ast.For, ast.While)):
                    if parent_type in (ast.For, ast.While):
                        issues.append(Issue(
                            type=IssueType.PERFORMANCE,
                            severity=Severity.HIGH if depth >= 2 else Severity.MEDIUM,
                            line_number=child.lineno,
                            message=f"Nested loop detected (depth {depth + 1}) - O(n^{depth + 1}) time complexity",
                            rule_id="NESTED_LOOP",
                            suggestion="Consider using a hash map/dict for O(1) lookups, or flatten the loop structure",
                            code_snippet=self._get_snippet(lines, child.lineno),
                            file_path=filename
                        ))
                    _find_nested_loops(child, depth + 1, type(child))
                else:
                    _find_nested_loops(child, depth, parent_type)

        _find_nested_loops(tree)

    def _check_large_allocations(self, tree: ast.AST, lines: List[str], filename: str, issues: List[Issue]):
        for node in ast.walk(tree):
            if isinstance(node, ast.ListComp):
                issues.append(Issue(
                    type=IssueType.PERFORMANCE,
                    severity=Severity.LOW,
                    line_number=node.lineno,
                    message="List comprehension creates full list in memory - consider using a generator for large datasets",
                    rule_id="LARGE_ALLOCATION",
                    suggestion="Use a generator expression instead: (x for x in iterable) instead of [x for x in iterable]",
                    code_snippet=self._get_snippet(lines, node.lineno),
                    file_path=filename
                ))

            if isinstance(node, ast.Call):
                func_name = self._get_call_name(node)
                if func_name in ('os.walk', 'os.listdir', 'glob.glob', 'pathlib.Path.rglob'):
                    issues.append(Issue(
                        type=IssueType.PERFORMANCE,
                        severity=Severity.LOW,
                        line_number=node.lineno,
                        message=f"File system operation '{func_name}' may be slow on large directories",
                        rule_id="FS_SLOW_OP",
                        suggestion="Consider limiting results or using os.scandir() for better performance",
                        code_snippet=self._get_snippet(lines, node.lineno),
                        file_path=filename
                    ))

    def _check_string_concatenation(self, tree: ast.AST, lines: List[str], filename: str, issues: List[Issue]):
        for node in ast.walk(tree):
            if isinstance(node, ast.For) or isinstance(node, ast.While):
                for child in ast.walk(node):
                    if isinstance(child, ast.AugAssign) and isinstance(child.op, ast.Add):
                        if isinstance(child.target, ast.Name):
                            issues.append(Issue(
                                type=IssueType.PERFORMANCE,
                                severity=Severity.MEDIUM,
                                line_number=child.lineno,
                                message="String concatenation in loop creates O(n^2) time complexity",
                                rule_id="STRING_CONCAT_LOOP",
                                suggestion="Use 'str.join()' or a list and join at the end: parts = []; parts.append(x); result = ''.join(parts)",
                                code_snippet=self._get_snippet(lines, child.lineno),
                                file_path=filename
                            ))

    def _check_global_variables(self, tree: ast.AST, lines: List[str], filename: str, issues: List[Issue]):
        global_names = set()
        for node in ast.iter_child_nodes(tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name) and target.id.isupper():
                        global_names.add(target.id)

        if len(global_names) > 5:
            issues.append(Issue(
                type=IssueType.PERFORMANCE,
                severity=Severity.LOW,
                line_number=1,
                message=f"Too many global variables ({len(global_names)}) - slows attribute lookup",
                rule_id="TOO_MANY_GLOBALS",
                suggestion="Group related constants into classes or config modules",
                file_path=filename
            ))

    def _check_repeated_computations(self, tree: ast.AST, lines: List[str], filename: str, issues: List[Issue]):
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                call_counts = {}
                for child in ast.walk(node):
                    if isinstance(child, ast.Call):
                        call_name = self._get_call_name(child)
                        if call_name:
                            call_counts[call_name] = call_counts.get(call_name, 0) + 1

                for call_name, count in call_counts.items():
                    if count > 3:
                        issues.append(Issue(
                            type=IssueType.PERFORMANCE,
                            severity=Severity.MEDIUM,
                            line_number=node.lineno,
                            message=f"Function '{node.name}' calls '{call_name}' {count} times - consider caching result",
                            rule_id="REPEATED_COMPUTATION",
                            suggestion=f"Cache the result of '{call_name}' in a local variable",
                            file_path=filename
                        ))

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

    def _get_snippet(self, lines: List[str], line_no: int, context: int = 2) -> str:
        start = max(0, line_no - context - 1)
        end = min(len(lines), line_no + context)
        return '\n'.join(f"{i+1}: {lines[i]}" for i in range(start, end))
