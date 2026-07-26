import ast
import astroid
from typing import List, Dict, Set
from models.review import Issue, IssueType, Severity


class SmellAnalyzer:
    def __init__(self):
        self.issues: List[Issue] = []

    def analyze(self, code: str, filename: str = "code.py") -> List[Issue]:
        self.issues = []

        try:
            tree = ast.parse(code)
            astroid_tree = astroid.parse(code)
            lines = code.split('\n')
        except SyntaxError as e:
            self.issues.append(Issue(
                type=IssueType.CODE_SMELL,
                severity=Severity.MEDIUM,
                line_number=e.lineno or 1,
                message=f"Syntax error: {e.msg}",
                rule_id="SYNTAX_ERROR",
                suggestion="Fix syntax error before analysis"
            ))
            return self.issues

        self._check_unused_imports(astroid_tree, code)
        self._check_unused_variables(astroid_tree)
        self._check_long_functions(tree, lines)
        self._check_long_lines(lines)
        self._check_complex_conditionals(tree)
        self._check_magic_numbers(tree)
        self._check_naming_conventions(astroid_tree)
        self._check_dead_code(tree)
        self._check_too_many_arguments(tree)
        self._check_duplicate_code(tree, lines)
        self._check_trailing_whitespace(lines)
        self._check_missing_docstrings(tree)
        self._check_nested_blocks(tree)
        self._check_bare_except(tree)
        self._check_redundant_returns(tree)

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

    def _check_unused_imports(self, tree: astroid.Module, code: str):
        try:
            imports = [node for node in tree.body if isinstance(node, (astroid.Import, astroid.ImportFrom))]
            for imp in imports:
                if isinstance(imp, astroid.Import):
                    for name, _ in imp.names:
                        if not name.startswith('_') and name not in code.replace(f"import {name}", ""):
                            self._add_issue(
                                IssueType.CODE_SMELL, Severity.LOW, imp.lineno,
                                f"Unused import: {name}", "UNUSED_IMPORT",
                                f"Remove unused import '{name}'"
                            )
                elif isinstance(imp, astroid.ImportFrom):
                    for name, _ in imp.names:
                        full_name = f"{imp.modname}.{name}" if imp.modname else name
                        if name not in code and not name.startswith('_'):
                            self._add_issue(
                                IssueType.CODE_SMELL, Severity.LOW, imp.lineno,
                                f"Unused import: {full_name}", "UNUSED_IMPORT_FROM",
                                f"Remove unused import '{name}' from '{imp.modname}'"
                            )
        except Exception:
            pass

    def _check_unused_variables(self, tree: astroid.Module):
        try:
            assigned_vars: Set[str] = set()
            used_vars: Set[str] = set()

            for node in tree.nodes_of_class(astroid.Assign):
                for target in node.targets:
                    if isinstance(target, astroid.AssignName) and not target.name.startswith('_'):
                        assigned_vars.add(target.name)

            for node in tree.nodes_of_class(astroid.Name):
                if isinstance(node.ctx, astroid.Load):
                    used_vars.add(node.name)

            unused = assigned_vars - used_vars
            for var in unused:
                if var not in ('_', '__', '___'):
                    for node in tree.nodes_of_class(astroid.Assign):
                        for target in node.targets:
                            if isinstance(target, astroid.AssignName) and target.name == var:
                                self._add_issue(
                                    IssueType.CODE_SMELL, Severity.LOW, node.lineno,
                                    f"Unused variable: {var}", "UNUSED_VARIABLE",
                                    f"Remove unused variable '{var}' or prefix with '_'"
                                )
        except Exception:
            pass

    def _check_long_functions(self, tree: ast.AST, lines: List[str]):
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                func_lines = node.end_lineno - node.lineno + 1 if node.end_lineno else 0
                if func_lines > 50:
                    self._add_issue(
                        IssueType.CODE_SMELL, Severity.MEDIUM, node.lineno,
                        f"Function '{node.name}' is too long ({func_lines} lines)",
                        "LONG_FUNCTION",
                        f"Refactor '{node.name}' into smaller functions (target < 50 lines)"
                    )
                elif func_lines > 30:
                    self._add_issue(
                        IssueType.CODE_SMELL, Severity.LOW, node.lineno,
                        f"Function '{node.name}' is long ({func_lines} lines)",
                        "LONG_FUNCTION_WARNING",
                        f"Consider splitting '{node.name}' into smaller functions"
                    )

    def _check_long_lines(self, lines: List[str]):
        for i, line in enumerate(lines, 1):
            if len(line) > 120:
                self._add_issue(
                    IssueType.CODE_SMELL, Severity.LOW, i,
                    f"Line too long ({len(line)} chars > 120)",
                    "LINE_TOO_LONG",
                    "Break line into multiple lines or use implicit line continuation"
                )
            elif len(line) > 100:
                self._add_issue(
                    IssueType.CODE_SMELL, Severity.INFO, i,
                    f"Line length ({len(line)} chars) exceeds 100",
                    "LINE_LENGTH_WARNING",
                    "Consider breaking long lines for readability"
                )

    def _check_complex_conditionals(self, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, ast.If):
                complexity = self._count_boolean_ops(node.test)
                if complexity > 4:
                    self._add_issue(
                        IssueType.CODE_SMELL, Severity.MEDIUM, node.lineno,
                        f"Complex conditional with {complexity} boolean operations",
                        "COMPLEX_CONDITIONAL",
                        "Extract condition into a well-named variable or function"
                    )
                elif complexity > 2:
                    self._add_issue(
                        IssueType.CODE_SMELL, Severity.LOW, node.lineno,
                        f"Conditional with {complexity} boolean operations",
                        "COMPLEX_CONDITIONAL_WARNING",
                        "Consider simplifying the condition"
                    )

    def _count_boolean_ops(self, node: ast.AST) -> int:
        count = 0
        for n in ast.walk(node):
            if isinstance(n, ast.BoolOp):
                count += len(n.values) - 1
        return count + 1

    def _check_magic_numbers(self, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
                if node.value not in (0, 1, -1, 2, 10, 100, 1000, 1024, 2048):
                    parent = getattr(node, 'parent', None)
                    if parent and not isinstance(parent, (ast.Call, ast.Subscript, ast.Attribute, ast.Compare)):
                        self._add_issue(
                            IssueType.CODE_SMELL, Severity.INFO, node.lineno,
                            f"Magic number: {node.value}",
                            "MAGIC_NUMBER",
                            "Replace magic number with a named constant"
                        )

    def _check_naming_conventions(self, tree: astroid.Module):
        for node in tree.nodes_of_class(astroid.FunctionDef):
            if not node.name.islower() and '_' not in node.name and not node.name.startswith('_'):
                self._add_issue(
                    IssueType.CODE_SMELL, Severity.INFO, node.lineno,
                    f"Function name '{node.name}' should be snake_case",
                    "NAMING_CONVENTION_FUNCTION",
                    f"Rename '{node.name}' to use snake_case"
                )

        for node in tree.nodes_of_class(astroid.ClassDef):
            if not node.name[0].isupper() or '_' in node.name:
                self._add_issue(
                    IssueType.CODE_SMELL, Severity.INFO, node.lineno,
                    f"Class name '{node.name}' should be PascalCase",
                    "NAMING_CONVENTION_CLASS",
                    f"Rename '{node.name}' to use PascalCase"
                )

        for node in tree.nodes_of_class(astroid.Assign):
            for target in node.targets:
                if isinstance(target, astroid.AssignName):
                    if target.name.isupper() and not target.name.startswith('_'):
                        pass
                    elif not target.name.islower() and '_' not in target.name and not target.name.startswith('_'):
                        if target.name not in ('self', 'cls'):
                            self._add_issue(
                                IssueType.CODE_SMELL, Severity.INFO, node.lineno,
                                f"Variable name '{target.name}' should be snake_case",
                                "NAMING_CONVENTION_VARIABLE",
                                f"Rename '{target.name}' to use snake_case"
                            )

    def _check_dead_code(self, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, ast.If):
                if isinstance(node.test, ast.Constant) and node.test.value is False:
                    self._add_issue(
                        IssueType.CODE_SMELL, Severity.LOW, node.lineno,
                        "Dead code: 'if False:' block will never execute",
                        "DEAD_CODE_IF_FALSE",
                        "Remove unreachable code block"
                    )

    def _check_too_many_arguments(self, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                arg_count = len(node.args.args) + len(node.args.kwonlyargs)
                if node.args.vararg:
                    arg_count += 1
                if node.args.kwarg:
                    arg_count += 1

                if arg_count > 7:
                    self._add_issue(
                        IssueType.CODE_SMELL, Severity.MEDIUM, node.lineno,
                        f"Function '{node.name}' has too many arguments ({arg_count})",
                        "TOO_MANY_ARGUMENTS",
                        f"Refactor '{node.name}' to use a dataclass, dict, or builder pattern"
                    )
                elif arg_count > 5:
                    self._add_issue(
                        IssueType.CODE_SMELL, Severity.LOW, node.lineno,
                        f"Function '{node.name}' has many arguments ({arg_count})",
                        "MANY_ARGUMENTS_WARNING",
                        f"Consider grouping arguments for '{node.name}'"
                    )

    def _check_duplicate_code(self, tree: ast.AST, lines: List[str]):
        try:
            funcs = [node for node in ast.walk(tree)
                     if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
            func_sources: Dict[str, str] = {}
            for func in funcs:
                if func.end_lineno and func.lineno:
                    source = '\n'.join(lines[func.lineno-1:func.end_lineno])
                    normalized = self._normalize_code(source)
                    if normalized in func_sources and normalized.strip():
                        self._add_issue(
                            IssueType.CODE_SMELL, Severity.MEDIUM, func.lineno,
                            f"Duplicate function implementation (similar to '{func_sources[normalized]}')",
                            "DUPLICATE_CODE",
                            "Extract common functionality into a shared utility function"
                        )
                    else:
                        func_sources[normalized] = func.name
        except Exception:
            pass

    def _normalize_code(self, code: str) -> str:
        return '\n'.join(line.strip() for line in code.split('\n') if line.strip())

    def _check_trailing_whitespace(self, lines: List[str]):
        for i, line in enumerate(lines, 1):
            if line.rstrip() != line:
                self._add_issue(
                    IssueType.CODE_SMELL, Severity.INFO, i,
                    "Trailing whitespace",
                    "TRAILING_WHITESPACE",
                    "Remove trailing whitespace"
                )

    def _check_missing_docstrings(self, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Module)):
                if not ast.get_docstring(node):
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        if not node.name.startswith('_') or node.name == '__init__':
                            self._add_issue(
                                IssueType.CODE_SMELL, Severity.INFO, node.lineno,
                                f"Missing docstring for '{node.name}'",
                                "MISSING_DOCSTRING",
                                f"Add docstring to '{node.name}' describing purpose, args, and returns"
                            )
                    elif isinstance(node, ast.ClassDef):
                        self._add_issue(
                            IssueType.CODE_SMELL, Severity.INFO, node.lineno,
                            f"Missing docstring for class '{node.name}'",
                            "MISSING_CLASS_DOCSTRING",
                            f"Add docstring to class '{node.name}'"
                        )

    def _check_nested_blocks(self, tree: ast.AST):
        def get_nesting_depth(node, depth=0):
            max_depth = depth
            for child in ast.iter_child_nodes(node):
                if isinstance(child, (ast.If, ast.For, ast.While, ast.Try, ast.With, ast.FunctionDef)):
                    child_depth = get_nesting_depth(child, depth + 1)
                    max_depth = max(max_depth, child_depth)
            return max_depth

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                depth = get_nesting_depth(node)
                if depth > 4:
                    self._add_issue(
                        IssueType.CODE_SMELL, Severity.MEDIUM, node.lineno,
                        f"Function '{node.name}' has deep nesting (level {depth})",
                        "DEEP_NESTING",
                        f"Reduce nesting in '{node.name}' by extracting functions or using early returns"
                    )
                elif depth > 3:
                    self._add_issue(
                        IssueType.CODE_SMELL, Severity.LOW, node.lineno,
                        f"Function '{node.name}' has nested blocks (level {depth})",
                        "NESTING_WARNING",
                        f"Consider flattening '{node.name}' for readability"
                    )

    def _check_bare_except(self, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, ast.ExceptHandler):
                if node.type is None:
                    self._add_issue(
                        IssueType.CODE_SMELL, Severity.HIGH, node.lineno,
                        "Bare 'except:' catches all exceptions including SystemExit and KeyboardInterrupt",
                        "BARE_EXCEPT",
                        "Use 'except Exception:' or specify the exception type"
                    )

    def _check_redundant_returns(self, tree: ast.AST):
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if node.body and isinstance(node.body[-1], ast.Return):
                    last_return = node.body[-1]
                    if last_return.value is None:
                        self._add_issue(
                            IssueType.CODE_SMELL, Severity.INFO, last_return.lineno,
                            "Redundant 'return' at end of function",
                            "REDUNDANT_RETURN",
                            "Remove unnecessary 'return' statement at end of function"
                        )