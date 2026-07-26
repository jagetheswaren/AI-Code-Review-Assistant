import os
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logger.warning("Transformers not available. NLP explanations will use fallback.")


class NLPExplainer:
    def __init__(self, model_name: str = "microsoft/CodeGPT-small-py", use_fallback: bool = True):
        self.model_name = model_name
        self.use_fallback = use_fallback or not TRANSFORMERS_AVAILABLE
        self.generator = None
        self.tokenizer = None
        
        if not self.use_fallback:
            self._load_model()
    
    def _load_model(self):
        try:
            logger.info(f"Loading NLP model: {self.model_name}")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None
            )
            self.generator = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if torch.cuda.is_available() else -1
            )
            logger.info("NLP model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load NLP model: {e}")
            self.use_fallback = True
    
    def generate_explanation(self, issue: Dict[str, Any], code_context: str = "") -> str:
        if self.use_fallback or self.generator is None:
            return self._fallback_explanation(issue, code_context)
        
        try:
            prompt = self._build_explanation_prompt(issue, code_context)
            
            outputs = self.generator(
                prompt,
                max_new_tokens=150,
                temperature=0.3,
                top_p=0.9,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
            
            generated = outputs[0]['generated_text']
            explanation = generated[len(prompt):].strip()
            
            if len(explanation) < 20:
                return self._fallback_explanation(issue, code_context)
            
            return explanation
            
        except Exception as e:
            logger.error(f"NLP generation failed: {e}")
            return self._fallback_explanation(issue, code_context)
    
    def generate_fix_suggestion(self, issue: Dict[str, Any], code_context: str = "") -> str:
        if self.use_fallback or self.generator is None:
            return self._fallback_fix(issue, code_context)
        
        try:
            prompt = self._build_fix_prompt(issue, code_context)
            
            outputs = self.generator(
                prompt,
                max_new_tokens=100,
                temperature=0.2,
                top_p=0.9,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
            
            generated = outputs[0]['generated_text']
            fix = generated[len(prompt):].strip()
            
            if len(fix) < 10:
                return self._fallback_fix(issue, code_context)
            
            return fix
            
        except Exception as e:
            logger.error(f"NLP fix generation failed: {e}")
            return self._fallback_fix(issue, code_context)
    
    def _build_explanation_prompt(self, issue: Dict[str, Any], code_context: str) -> str:
        issue_type = issue.get('type', 'code_smell')
        severity = issue.get('severity', 'low')
        line = issue.get('line_number', 'unknown')
        message = issue.get('message', 'No message')
        rule_id = issue.get('rule_id', 'unknown')
        
        prompt = f"""You are a senior software engineer explaining a code issue to a junior developer.

Issue Details:
- Type: {issue_type}
- Severity: {severity}
- Line: {line}
- Rule: {rule_id}
- Message: {message}

Code Context:
```python
{code_context or 'Not available'}
```

Explain in plain English:
1. What the issue is
2. Why it's a {severity} severity problem
3. What could go wrong in production

Keep it concise (3-5 sentences). Use simple language.

Explanation:"""
        return prompt
    
    def _build_fix_prompt(self, issue: Dict[str, Any], code_context: str) -> str:
        issue_type = issue.get('type', 'code_smell')
        severity = issue.get('severity', 'low')
        message = issue.get('message', 'No message')
        
        prompt = f"""Fix this {issue_type} issue:

Problem: {message}
Severity: {severity}

Code:
```python
{code_context or 'Not available'}
```

Provide the corrected code only:

```python"""
        return prompt
    
    def _fallback_explanation(self, issue: Dict[str, Any], code_context: str) -> str:
        issue_type = issue.get('type', 'code_smell')
        severity = issue.get('severity', 'low')
        message = issue.get('message', 'Issue detected')
        rule_id = issue.get('rule_id', 'unknown')
        line = issue.get('line_number', 'unknown')
        
        explanations = {
            'security': f"Security vulnerability at line {line}: {message}. This is a {severity} severity issue because it could allow attackers to compromise the system. Rule: {rule_id}.",
            'code_smell': f"Code quality issue at line {line}: {message}. This {severity} severity smell makes code harder to maintain and understand. Rule: {rule_id}.",
            'performance': f"Performance concern at line {line}: {message}. This {severity} severity issue may cause slowdowns or resource waste. Rule: {rule_id}.",
            'best_practice': f"Best practice violation at line {line}: {message}. Following this {severity} severity guideline improves code quality. Rule: {rule_id}."
        }
        
        return explanations.get(issue_type, f"Issue at line {line}: {message} (Rule: {rule_id})")
    
    def _fallback_fix(self, issue: Dict[str, Any], code_context: str) -> str:
        issue_type = issue.get('type', 'code_smell')
        message = issue.get('message', '')
        suggestion = issue.get('suggestion', '')
        
        if suggestion:
            return f"Suggested fix: {suggestion}"
        
        fixes = {
            'security': "Review the code for security vulnerabilities. Use parameterized queries, validate inputs, and avoid dangerous functions.",
            'code_smell': "Refactor the code to improve readability. Consider extracting methods, removing unused code, or following naming conventions.",
            'performance': "Optimize the algorithm or data structure. Consider caching, reducing complexity, or using more efficient libraries.",
            'best_practice': "Follow the recommended coding standards and patterns for this language/framework."
        }
        
        return fixes.get(issue_type, "Review and address the issue according to best practices.")


def create_explainer(model_name: str = None, use_fallback: bool = True) -> NLPExplainer:
    return NLPExplainer(model_name=model_name, use_fallback=use_fallback)