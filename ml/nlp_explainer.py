from typing import Dict, Any, Optional


class NLPExplainer:
    def __init__(self, model_name: str = "microsoft/codebert-base"):
        self.model_name = model_name
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        try:
            from transformers import AutoTokenizer, AutoModel
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(self.model_name)
            self.is_loaded = True
        except Exception:
            self.is_loaded = False

    def generate_explanation(self, issue: Dict[str, Any], code_context: str = "") -> str:
        issue_type = issue.get("type", "unknown")
        severity = issue.get("severity", "unknown")
        message = issue.get("message", "No description")
        rule_id = issue.get("rule_id", "")

        explanation = self._rule_based_explanation(issue_type, severity, message, rule_id)
        return explanation

    def generate_fix_suggestion(self, issue: Dict[str, Any], code_context: str = "") -> str:
        rule_id = issue.get("rule_id", "")
        message = issue.get("message", "")
        suggestion = issue.get("suggestion", "")

        if suggestion:
            return suggestion

        fix = self._rule_based_fix(rule_id, message)
        return fix

    def _rule_based_explanation(self, issue_type: str, severity: str, message: str, rule_id: str) -> str:
        explanations = {
            "SECURITY": {
                "CRITICAL": f"This is a critical security vulnerability: {message}. It allows attackers to execute arbitrary code or access sensitive data.",
                "HIGH": f"This security issue poses significant risk: {message}. It should be addressed before deployment.",
                "MEDIUM": f"This is a moderate security concern: {message}. It could be exploited under certain conditions.",
                "LOW": f"This is a minor security consideration: {message}. While not immediately dangerous, it should be reviewed.",
            },
            "CODE_SMELL": {
                "MEDIUM": f"This code smell indicates maintainability issues: {message}. The code could be cleaner and more readable.",
                "LOW": f"Minor code quality issue: {message}. Consider refactoring for better code hygiene.",
                "INFO": f"Code style note: {message}. This is a suggestion for improvement.",
            },
            "PERFORMANCE": {
                "HIGH": f"Performance bottleneck detected: {message}. This could significantly impact application speed.",
                "MEDIUM": f"Performance concern: {message}. Consider optimizing for better efficiency.",
                "LOW": f"Minor performance note: {message}. Optimization could improve performance.",
            },
        }

        type_explanations = explanations.get(issue_type.upper().replace("-", "_"), {})
        sev_key = severity.upper() if severity.upper() in type_explanations else "MEDIUM"
        return type_explanations.get(sev_key, f"{issue_type} issue: {message}")

    def _rule_based_fix(self, rule_id: str, message: str) -> str:
        fixes = {
            "SECURITY_EVAL": "Replace eval() with ast.literal_eval() for safe evaluation of literal expressions.",
            "SECURITY_EXEC": "Replace exec() with specific function calls. Never use exec() with untrusted input.",
            "SECURITY_OS_SYSTEM": "Use subprocess.run(['cmd', 'arg1', 'arg2'], shell=False) instead of os.system().",
            "SECURITY_PICKLE_LOADS": "Use json.loads() or other safe deserialization instead of pickle.",
            "SECURITY_YAML_LOAD": "Use yaml.safe_load() instead of yaml.load() to prevent code execution.",
            "SECURITY_SHELL_INJECTION": "Use subprocess with shell=False and pass arguments as a list.",
            "SECURITY_HARDCODED_PASSWORD": "Move secrets to environment variables or use a secrets manager.",
            "SECURITY_HARDCODED_API_KEY": "Store API keys in environment variables, not in source code.",
            "BARE_EXCEPT": "Specify the exception type: use 'except Exception:' instead of bare 'except:'.",
            "LONG_FUNCTION": "Break this function into smaller, single-responsibility functions.",
            "HIGH_CYCLOMATIC_COMPLEXITY": "Reduce complexity by extracting conditions into helper functions or using lookup tables.",
            "LOW_MAINTAINABILITY": "This code needs significant refactoring to improve maintainability.",
            "UNUSED_IMPORT": "Remove unused imports to keep the code clean.",
            "UNUSED_VARIABLE": "Remove or use the variable. Prefix with '_' if intentionally unused.",
            "DEEP_NESTING": "Reduce nesting by using early returns or extracting inner logic into functions.",
            "TOO_MANY_ARGUMENTS": "Group related parameters into a dataclass or dictionary.",
        }

        if rule_id in fixes:
            return fixes[rule_id]

        for key, fix in fixes.items():
            if key.lower() in rule_id.lower():
                return fix

        if "eval" in message.lower():
            return "Avoid using eval(). Use ast.literal_eval() for safe evaluation."
        if "exec" in message.lower():
            return "Avoid using exec(). Refactor to use direct function calls."
        if "password" in message.lower() or "secret" in message.lower():
            return "Move sensitive data to environment variables or a secrets manager."
        if "import" in message.lower():
            return "Remove unused imports or verify the import is needed."
        if "function" in message.lower() and "long" in message.lower():
            return "Break this function into smaller, focused functions (target < 50 lines)."

        return f"Review this code and apply the suggested fix: {message}"


def create_explainer(model_name: str = "microsoft/codebert-base") -> NLPExplainer:
    return NLPExplainer(model_name)
