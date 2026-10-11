# IntelliReview AI V2 — AI & Machine Learning Architecture

## 1. Overview
IntelliReview AI V2 combines deterministic static analysis with two levels of artificial intelligence:
1. **Machine Learning Classifier (Scikit-learn)**: Evaluates finding attributes to predict and prioritize severity levels.
2. **Generative AI Review Engine (Ollama / Groq)**: Provides natural language explanations, code refactoring suggestions, and contextual diff remediation.

---

## 2. Scikit-learn Severity Classifier

### 2.1 Model Specifications
- **Algorithm**: `RandomForestClassifier` (100 estimators, max depth 12)
- **Framework**: Scikit-learn 1.6+ loaded via `joblib`
- **Model Files**:
  - `backend/models/severity_classifier_v3.joblib` (Current Production Model)
  - `backend/models/severity_classifier_v2.joblib` (Fallback Compatibility Model)
  - `backend/models/feature_names_v2.json`
- **Output Labels**: `informational`, `low`, `medium`, `high`, `critical`

### 2.2 Feature Vector (V2 Specification)
To prevent target leakage (identified and resolved in V2), the feature extractor does **not** encode rule severity directly. Features include:
- `type_*`: One-hot encoded issue types (`security`, `code_smell`, `complexity`, `performance`, `bug_risk`)
- `line_number_norm`: Normalized line index within file (`min(line / 500, 1.0)`)
- `message_length_norm`: Normalized issue description length (`min(len(msg) / 200, 1.0)`)
- `has_suggestion`: Boolean flag indicating if analyzer generated remediation advice
- `has_code_snippet`: Boolean flag indicating snippet presence
- `is_security`: Binary indicator for security category
- `is_complexity`: Binary indicator for complexity metric

### 2.3 Deterministic Rule Authority
The ML model serves as a prioritization assistant, **never** a downgrading mechanism for authoritative security rules.
- If Bandit or custom AST identifies a high-confidence security flaw (e.g. `eval`, `exec`, shell injection), the deterministic severity is preserved as the authoritative signal.
- The model outputs `ml_severity`, `ml_confidence`, and `ml_model_version` attached to the issue metadata.

---

## 3. Generative AI Review Engine

### 3.1 Supported Providers
1. **Local Ollama**:
   - Primary self-hosted coder model: `qwen2.5-coder:7b` or `codellama:7b`
   - Configured via `OLLAMA_BASE_URL` (default: `http://localhost:11434`) and `OLLAMA_MODEL`
   - Completely offline; source code never leaves the host.
2. **Groq Cloud (Optional Remote Provider)**:
   - Configured via `GROQ_API_KEY` and `GROQ_MODEL` (e.g., `llama-3.3-70b-versatile`)
   - High-speed cloud inference with generous free-tier limits.

### 3.2 Output Validation & Prompt Engineering
- Requests use system instructions enforcing structured JSON output.
- Responses are verified with regex and Pydantic models.
- If the model returns markdown code fences, JSON is extracted cleanly.
- If parsing fails, the raw text is preserved rather than throwing unhandled exceptions.

### 3.3 Zero-Hallucination Fallback
When no AI provider is configured or reachable:
- `AIReviewer.check_health()` reports `reachable: false`.
- The system automatically serves static, rule-based explanations derived from AST and Bandit suggestion dictionaries.
- The frontend clearly displays `Compiler Live (Rule-based)` rather than fabricating an AI completion.
