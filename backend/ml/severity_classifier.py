import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import os
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Feature version history
# ---------------------------------------------------------------------------
# v1: Original 10 features INCLUDING rule_severity_encoded (TARGET LEAKAGE)
# v2: 10 features with leakage removed. rule_severity_encoded replaced with
#     has_fix_suggestion. Feature order changed.
# ---------------------------------------------------------------------------

FEATURE_VERSION = "v2-no-leakage"

FEATURE_NAMES_V2 = [
    'issue_type_encoded',      # security=0, performance=1, code_smell=2, best_practice=3
    'has_suggestion',          # 1 if suggestion present
    'has_code_snippet',        # 1 if code_snippet present
    'message_length',          # len(message) / 500, capped at 1.0
    'rule_id_length',          # len(rule_id) / 50, capped at 1.0
    'is_security_related',     # 1 if type == 'security'
    'is_complexity_related',   # 1 if type == 'performance'
    'has_explanation',         # 1 if explanation present
    'line_number_normalized',  # line_number / 1000, capped at 1.0
    'has_fix_suggestion',      # 1 if fix_suggestion present
]

# Legacy feature names for v1 models (kept for documentation only)
FEATURE_NAMES_V1 = [
    'issue_type_encoded',
    'rule_severity_encoded',   # ← TARGET LEAKAGE
    'line_number_normalized',
    'has_suggestion',
    'has_code_snippet',
    'message_length',
    'rule_id_length',
    'is_security_related',
    'is_complexity_related',
    'has_explanation',
]


class SeverityClassifier:
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced'
        )
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        self.model_version = 'v1'
        self.feature_version = FEATURE_VERSION
        self.feature_names = list(FEATURE_NAMES_V2)

        self.severity_order = ['info', 'low', 'medium', 'high', 'critical']
        self.rule_severity_map = {
            'info': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4
        }

    # ------------------------------------------------------------------
    # Feature extraction — v2 (leakage-free)
    # ------------------------------------------------------------------
    def extract_features(self, issues: List[Dict]) -> np.ndarray:
        """Extract a fixed-length feature vector per issue.

        IMPORTANT: This method must NOT use the severity label as a feature.
        The feature ``rule_severity_encoded`` present in v1 was a direct
        encoding of the target label, causing severe data leakage.
        """
        features = []
        for issue in issues:
            issue_type = issue.get('type', 'code_smell')
            type_map = {'security': 0, 'performance': 1, 'code_smell': 2, 'best_practice': 3}
            type_encoded = type_map.get(issue_type, 2)

            has_suggestion = 1 if issue.get('suggestion') else 0
            has_code_snippet = 1 if issue.get('code_snippet') else 0

            message = issue.get('message', '')
            message_length = min(len(message) / 500.0, 1.0)

            rule_id = issue.get('rule_id', '')
            rule_id_length = min(len(rule_id) / 50.0, 1.0)

            is_security = 1 if issue_type == 'security' else 0
            is_complexity = 1 if issue_type == 'performance' else 0

            has_explanation = 1 if issue.get('explanation') else 0

            line_number = issue.get('line_number', 1)
            line_normalized = min(line_number / 1000.0, 1.0)

            has_fix_suggestion = 1 if issue.get('fix_suggestion') else 0

            features.append([
                type_encoded,
                has_suggestion,
                has_code_snippet,
                message_length,
                rule_id_length,
                is_security,
                is_complexity,
                has_explanation,
                line_normalized,
                has_fix_suggestion,
            ])

        return np.array(features) if features else np.empty((0, len(self.feature_names)))

    # ------------------------------------------------------------------
    # Legacy feature extraction — kept for loading v1/v2 models
    # ------------------------------------------------------------------
    def _extract_features_v1(self, issues: List[Dict]) -> np.ndarray:
        """Feature extraction matching v1/v2 saved models (WITH leakage)."""
        features = []
        for issue in issues:
            issue_type = issue.get('type', 'code_smell')
            type_encoded = 0 if issue_type == 'security' else (1 if issue_type == 'performance' else 2)

            rule_severity = issue.get('severity', 'low')
            severity_encoded = self.rule_severity_map.get(rule_severity, 1)

            line_number = issue.get('line_number', 1)
            line_normalized = min(line_number / 1000.0, 1.0)

            has_suggestion = 1 if issue.get('suggestion') else 0
            has_code_snippet = 1 if issue.get('code_snippet') else 0

            message = issue.get('message', '')
            message_length = min(len(message) / 500.0, 1.0)

            rule_id = issue.get('rule_id', '')
            rule_id_length = min(len(rule_id) / 50.0, 1.0)

            is_security = 1 if issue_type == 'security' else 0
            is_complexity = 1 if issue_type == 'performance' else 0

            has_explanation = 1 if issue.get('explanation') else 0

            features.append([
                type_encoded,
                severity_encoded,
                line_normalized,
                has_suggestion,
                has_code_snippet,
                message_length,
                rule_id_length,
                is_security,
                is_complexity,
                has_explanation
            ])

        return np.array(features)

    def prepare_labels(self, issues: List[Dict]) -> np.ndarray:
        labels = []
        for issue in issues:
            severity = issue.get('ml_severity') or issue.get('severity', 'low')
            labels.append(severity)
        return self.label_encoder.fit_transform(labels)

    def train(self, issues: List[Dict], labels: List[str] = None) -> Dict[str, Any]:
        if labels is None:
            labels = [issue.get('ml_severity') or issue.get('severity', 'low') for issue in issues]

        X = self.extract_features(issues)
        y = self.label_encoder.fit_transform(labels)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        self.model.fit(X_train_scaled, y_train)

        y_pred = self.model.predict(X_test_scaled)

        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(
            y_test, y_pred,
            target_names=self.label_encoder.classes_,
            output_dict=True,
            zero_division=0
        )
        cm = confusion_matrix(y_test, y_pred)

        self.is_trained = True

        logger.info(f"Model trained with accuracy: {accuracy:.4f}")

        return {
            'accuracy': accuracy,
            'report': report,
            'confusion_matrix': cm.tolist(),
        }

    def predict(self, issues: List[Dict]) -> List[Dict]:
        if not self.is_trained:
            logger.warning("Model not trained, returning rule-based severity")
            for issue in issues:
                issue['ml_severity'] = issue.get('severity', 'low')
                issue['ml_confidence'] = 0.5
                issue['ml_model_version'] = 'fallback'
            return issues

        # Choose correct feature extraction based on loaded model's feature version
        loaded_fv = getattr(self, 'feature_version', None)
        if loaded_fv and loaded_fv.startswith('v2'):
            X = self.extract_features(issues)
        else:
            X = self._extract_features_v1(issues)

        X_scaled = self.scaler.transform(X)

        predictions = self.model.predict(X_scaled)
        probabilities = self.model.predict_proba(X_scaled)

        predicted_severities = self.label_encoder.inverse_transform(predictions)
        confidences = np.max(probabilities, axis=1)

        for i, issue in enumerate(issues):
            issue['ml_severity'] = predicted_severities[i]
            issue['ml_confidence'] = float(confidences[i])
            issue['ml_model_version'] = self.model_version

        return issues

    def save(self, model_version: str = 'v3'):
        self.model_version = model_version
        base_dir = Path(__file__).resolve().parent
        model_path = str(base_dir / 'models' / f'severity_classifier_{model_version}.joblib')

        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        bundle = {
            'model': self.model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'is_trained': self.is_trained,
            'feature_names': self.feature_names,
            'model_version': self.model_version,
            # --- enhanced metadata ---
            'model_name': type(self.model).__name__,
            'feature_version': self.feature_version,
            'training_date': datetime.utcnow().isoformat(),
            'supported_classes': list(self.label_encoder.classes_) if self.is_trained else [],
            'training_config': {
                'n_estimators': getattr(self.model, 'n_estimators', None),
                'max_depth': getattr(self.model, 'max_depth', None),
                'random_state': getattr(self.model, 'random_state', None),
                'class_weight': str(getattr(self.model, 'class_weight', None)),
            },
        }
        joblib.dump(bundle, model_path)
        logger.info(f"Model saved to {model_path}")

    def load(self, model_version: str = None) -> bool:
        base_dir = Path(__file__).resolve().parent
        fallback_dir = base_dir.parents[1] / 'models'

        paths_to_try = []
        if model_version:
            paths_to_try.append(base_dir / 'models' / f'severity_classifier_{model_version}.joblib')
            paths_to_try.append(fallback_dir / f'severity_classifier_{model_version}.joblib')
        else:
            # Prefer newest first
            paths_to_try.append(base_dir / 'models' / 'severity_classifier_v3.joblib')
            paths_to_try.append(base_dir / 'models' / 'severity_classifier_v2.joblib')
            paths_to_try.append(base_dir / 'models' / 'severity_classifier_v1.joblib')
            paths_to_try.append(fallback_dir / 'severity_classifier_v1.joblib')
            paths_to_try.append(fallback_dir / 'severity_classifier.joblib')

        model_path = None
        for p in paths_to_try:
            if p.exists():
                model_path = str(p)
                break

        if not model_path:
            logger.warning("No model file found in standard or fallback locations.")
            return False

        try:
            data = joblib.load(model_path)
            self.model = data['model']
            self.scaler = data['scaler']
            self.label_encoder = data['label_encoder']
            self.is_trained = data['is_trained']
            self.feature_names = data['feature_names']
            self.model_version = data.get('model_version', 'v1')
            self.feature_version = data.get('feature_version', 'v1-legacy')
            logger.info(
                f"Model {self.model_version} (features: {self.feature_version}) "
                f"loaded from {model_path}"
            )
            return True
        except Exception as e:
            logger.error(f"Failed to load model from {model_path}: {e}")
            return False

    def get_model_info(self) -> Dict[str, Any]:
        """Return metadata about the currently loaded model."""
        return {
            'model_version': self.model_version,
            'model_name': type(self.model).__name__,
            'feature_version': self.feature_version,
            'feature_names': self.feature_names,
            'is_trained': self.is_trained,
            'supported_classes': (
                list(self.label_encoder.classes_) if self.is_trained else []
            ),
        }


# ======================================================================
# Synthetic data generator
# ======================================================================

def generate_synthetic_training_data(n_samples: int = 1000, seed: int = None) -> Tuple[List[Dict], List[str]]:
    """Generate synthetic training data for the severity classifier.

    WARNING: This data is purely synthetic. The severity label is randomly
    assigned with issue-type-dependent probabilities. Models trained on this
    data will NOT generalise to real-world code review findings.
    """
    if seed is not None:
        np.random.seed(seed)

    issue_types = ['security', 'code_smell', 'performance', 'best_practice']
    severities = ['info', 'low', 'medium', 'high', 'critical']
    rule_prefixes = {
        'security': ['B', 'SEC', 'CWE'],
        'code_smell': ['C', 'R', 'W'],
        'performance': ['PERF', 'CC', 'MI'],
        'best_practice': ['BP', 'PY', 'PEP']
    }

    issues = []
    labels = []

    for _ in range(n_samples):
        issue_type = np.random.choice(issue_types, p=[0.25, 0.4, 0.2, 0.15])

        if issue_type == 'security':
            severity_weights = [0.05, 0.1, 0.2, 0.35, 0.3]
        elif issue_type == 'performance':
            severity_weights = [0.1, 0.25, 0.35, 0.2, 0.1]
        elif issue_type == 'code_smell':
            severity_weights = [0.2, 0.4, 0.25, 0.1, 0.05]
        else:
            severity_weights = [0.3, 0.4, 0.2, 0.07, 0.03]

        severity = np.random.choice(severities, p=severity_weights)

        rule_prefix = np.random.choice(rule_prefixes[issue_type])
        rule_id = f"{rule_prefix}{np.random.randint(100, 999)}"

        issue = {
            'type': issue_type,
            'severity': severity,
            'line_number': np.random.randint(1, 500),
            'message': np.random.choice([
                'Potential security vulnerability detected',
                'Code style issue found',
                'Performance optimization opportunity',
                'Best practice violation',
                'Complexity threshold exceeded',
                'Unused variable detected',
                'Missing documentation',
                'Magic number used',
                'Nested block depth too high',
                'Function too long'
            ]),
            'rule_id': rule_id,
            'suggestion': np.random.choice([None, 'Consider refactoring', 'Use safer alternative', 'Add validation']),
            'code_snippet': np.random.choice([None, 'code example here']),
            'explanation': np.random.choice([None, 'Detailed explanation of the issue']),
            'fix_suggestion': np.random.choice([None, 'Apply suggested fix'])
        }

        issues.append(issue)
        labels.append(severity)

    return issues, labels


def train_and_save_model(model_version: str = 'v3'):
    """Train a severity classifier on synthetic data and save it."""
    classifier = SeverityClassifier()
    issues, labels = generate_synthetic_training_data(2000)
    metrics = classifier.train(issues, labels)
    classifier.save(model_version=model_version)
    print(f"Training completed with accuracy: {metrics['accuracy']:.4f}")
    return classifier, metrics


if __name__ == '__main__':
    train_and_save_model('v3')
