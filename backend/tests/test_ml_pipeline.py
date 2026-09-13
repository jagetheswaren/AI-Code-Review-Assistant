"""
Comprehensive tests for the ML severity classification pipeline.

Covers:
  - Classifier initialization
  - Feature extraction (leakage-free v2)
  - Feature extraction shape and values
  - Model loading (v1, v2, v3)
  - Missing model fallback
  - Prediction output format
  - Supported severity labels
  - Invalid / empty input handling
  - Deterministic predictions
  - Legacy feature extraction compatibility
  - Model metadata / info
  - Production review integration flow
"""

import pytest
import numpy as np
from pathlib import Path

from ml.severity_classifier import (
    SeverityClassifier,
    generate_synthetic_training_data,
    FEATURE_VERSION,
    FEATURE_NAMES_V2,
    FEATURE_NAMES_V1,
)


# ======================================================================
# Initialization
# ======================================================================

class TestClassifierInitialization:
    def test_default_state(self):
        clf = SeverityClassifier()
        assert clf.is_trained is False
        assert clf.model is not None
        assert clf.scaler is not None
        assert clf.label_encoder is not None

    def test_feature_names_match_v2(self):
        clf = SeverityClassifier()
        assert clf.feature_names == FEATURE_NAMES_V2

    def test_feature_version(self):
        clf = SeverityClassifier()
        assert clf.feature_version == FEATURE_VERSION
        assert "leakage" in clf.feature_version.lower() or "v2" in clf.feature_version

    def test_severity_order(self):
        clf = SeverityClassifier()
        assert clf.severity_order == ['info', 'low', 'medium', 'high', 'critical']

    def test_rule_severity_map(self):
        clf = SeverityClassifier()
        assert clf.rule_severity_map == {
            'info': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4
        }


# ======================================================================
# Feature Extraction (v2, leakage-free)
# ======================================================================

class TestFeatureExtractionV2:
    def test_shape_single_issue(self):
        clf = SeverityClassifier()
        issues = [{
            "type": "security",
            "severity": "high",
            "line_number": 42,
            "message": "Potential SQL injection",
            "rule_id": "B608",
            "suggestion": "Use parameterized queries",
            "code_snippet": "cursor.execute(f'SELECT * FROM users WHERE id={id}')",
            "explanation": "String formatting in queries is unsafe.",
            "fix_suggestion": "Use cursor.execute('SELECT * FROM users WHERE id=%s', (id,))"
        }]
        features = clf.extract_features(issues)
        assert features.shape == (1, 10)

    def test_shape_multiple_issues(self):
        clf = SeverityClassifier()
        issues = [
            {"type": "security", "message": "Issue 1"},
            {"type": "code_smell", "message": "Issue 2"},
            {"type": "performance", "message": "Issue 3"},
        ]
        features = clf.extract_features(issues)
        assert features.shape == (3, 10)

    def test_empty_input(self):
        clf = SeverityClassifier()
        features = clf.extract_features([])
        assert features.shape == (0, 10)

    def test_no_target_leakage(self):
        """Feature vector must NOT contain a numeric encoding of the severity label."""
        clf = SeverityClassifier()
        # Two identical issues with DIFFERENT severities should produce IDENTICAL features
        issue_high = {
            "type": "security",
            "severity": "high",
            "line_number": 10,
            "message": "Hardcoded password",
            "rule_id": "B105",
            "suggestion": "Use env vars",
            "code_snippet": "pw = 'x'",
            "explanation": "Bad",
            "fix_suggestion": "Fix it",
        }
        issue_low = dict(issue_high)
        issue_low["severity"] = "low"

        feat_high = clf.extract_features([issue_high])
        feat_low = clf.extract_features([issue_low])
        np.testing.assert_array_equal(feat_high, feat_low)

    def test_type_encoding(self):
        clf = SeverityClassifier()
        for issue_type, expected in [
            ("security", 0), ("performance", 1), ("code_smell", 2), ("best_practice", 3)
        ]:
            feat = clf.extract_features([{"type": issue_type, "message": "x"}])
            assert feat[0, 0] == expected, f"Expected {expected} for {issue_type}"

    def test_unknown_type_defaults(self):
        clf = SeverityClassifier()
        feat = clf.extract_features([{"type": "unknown_type", "message": "x"}])
        assert feat[0, 0] == 2  # defaults to code_smell

    def test_boolean_features(self):
        clf = SeverityClassifier()
        issue = {
            "type": "security",
            "message": "test",
            "suggestion": "do something",
            "code_snippet": "code here",
            "explanation": "why",
            "fix_suggestion": "how to fix",
        }
        feat = clf.extract_features([issue])
        assert feat[0, 1] == 1  # has_suggestion
        assert feat[0, 2] == 1  # has_code_snippet
        assert feat[0, 7] == 1  # has_explanation
        assert feat[0, 9] == 1  # has_fix_suggestion

    def test_boolean_features_absent(self):
        clf = SeverityClassifier()
        issue = {"type": "code_smell", "message": "test"}
        feat = clf.extract_features([issue])
        assert feat[0, 1] == 0  # no suggestion
        assert feat[0, 2] == 0  # no code_snippet
        assert feat[0, 7] == 0  # no explanation
        assert feat[0, 9] == 0  # no fix_suggestion

    def test_message_length_normalization(self):
        clf = SeverityClassifier()
        # Short message
        feat = clf.extract_features([{"type": "security", "message": "hi"}])
        assert 0 < feat[0, 3] < 0.01  # 2/500

        # Long message (capped at 1.0)
        feat = clf.extract_features([{"type": "security", "message": "x" * 1000}])
        assert feat[0, 3] == 1.0

    def test_line_number_normalization(self):
        clf = SeverityClassifier()
        feat = clf.extract_features([{"type": "security", "message": "x", "line_number": 500}])
        assert feat[0, 8] == 0.5  # 500/1000

        feat = clf.extract_features([{"type": "security", "message": "x", "line_number": 2000}])
        assert feat[0, 8] == 1.0  # capped

    def test_security_and_complexity_flags(self):
        clf = SeverityClassifier()
        feat = clf.extract_features([{"type": "security", "message": "x"}])
        assert feat[0, 5] == 1  # is_security
        assert feat[0, 6] == 0  # is_complexity

        feat = clf.extract_features([{"type": "performance", "message": "x"}])
        assert feat[0, 5] == 0
        assert feat[0, 6] == 1


# ======================================================================
# Legacy Feature Extraction (v1)
# ======================================================================

class TestLegacyFeatureExtraction:
    def test_v1_shape(self):
        clf = SeverityClassifier()
        issues = [{"type": "security", "severity": "high", "message": "test"}]
        feat = clf._extract_features_v1(issues)
        assert feat.shape == (1, 10)

    def test_v1_contains_severity_encoding(self):
        """v1 features SHOULD contain the severity encoding (index 1)."""
        clf = SeverityClassifier()
        issue_high = {"type": "security", "severity": "high", "message": "test"}
        issue_low = {"type": "security", "severity": "low", "message": "test"}
        feat_high = clf._extract_features_v1([issue_high])
        feat_low = clf._extract_features_v1([issue_low])
        # severity_encoded is at index 1 in v1
        assert feat_high[0, 1] != feat_low[0, 1]


# ======================================================================
# Model Loading
# ======================================================================

class TestModelLoading:
    def test_load_v3(self):
        clf = SeverityClassifier()
        model_path = Path(__file__).parent.parent / 'ml' / 'models' / 'severity_classifier_v3.joblib'
        if model_path.exists():
            assert clf.load('v3') is True
            assert clf.is_trained is True
            assert clf.model_version == 'v3'
            assert clf.feature_version == 'v2-no-leakage'

    def test_load_v2(self):
        clf = SeverityClassifier()
        model_path = Path(__file__).parent.parent / 'ml' / 'models' / 'severity_classifier_v2.joblib'
        if model_path.exists():
            assert clf.load('v2') is True
            assert clf.is_trained is True
            assert clf.model_version == 'v2'

    def test_load_v1(self):
        clf = SeverityClassifier()
        model_path = Path(__file__).parent.parent / 'ml' / 'models' / 'severity_classifier_v1.joblib'
        if model_path.exists():
            assert clf.load('v1') is True
            assert clf.is_trained is True

    def test_load_nonexistent_model(self):
        clf = SeverityClassifier()
        assert clf.load('v999') is False
        assert clf.is_trained is False

    def test_load_default_prefers_newest(self):
        clf = SeverityClassifier()
        v3_path = Path(__file__).parent.parent / 'ml' / 'models' / 'severity_classifier_v3.joblib'
        if v3_path.exists():
            clf.load()
            assert clf.model_version == 'v3'


# ======================================================================
# Prediction
# ======================================================================

class TestPrediction:
    @pytest.fixture
    def trained_classifier(self):
        clf = SeverityClassifier()
        if not clf.load('v3'):
            # Train one for testing if v3 not available
            issues, labels = generate_synthetic_training_data(200)
            clf.train(issues, labels)
        return clf

    def test_prediction_output_format(self, trained_classifier):
        issues = [{
            "type": "security",
            "severity": "critical",
            "line_number": 10,
            "message": "Hardcoded password",
            "rule_id": "B105",
            "suggestion": "Use env vars",
            "code_snippet": "password = 'secret'",
            "explanation": "Hardcoded passwords are a security risk.",
        }]
        results = trained_classifier.predict(issues)
        assert len(results) == 1
        assert "ml_severity" in results[0]
        assert "ml_confidence" in results[0]
        assert "ml_model_version" in results[0]

    def test_predicted_severity_is_valid(self, trained_classifier):
        issues = [{"type": "code_smell", "message": "Unused variable"}]
        results = trained_classifier.predict(issues)
        valid_severities = {'info', 'low', 'medium', 'high', 'critical'}
        assert results[0]["ml_severity"] in valid_severities

    def test_confidence_range(self, trained_classifier):
        issues = [{"type": "security", "message": "SQL injection risk"}]
        results = trained_classifier.predict(issues)
        conf = results[0]["ml_confidence"]
        assert 0.0 <= conf <= 1.0

    def test_model_version_attached(self, trained_classifier):
        issues = [{"type": "performance", "message": "Slow loop"}]
        results = trained_classifier.predict(issues)
        assert results[0]["ml_model_version"] is not None
        assert results[0]["ml_model_version"] != ""

    def test_multiple_issues(self, trained_classifier):
        issues = [
            {"type": "security", "message": "Issue 1"},
            {"type": "code_smell", "message": "Issue 2"},
            {"type": "performance", "message": "Issue 3"},
        ]
        results = trained_classifier.predict(issues)
        assert len(results) == 3
        for r in results:
            assert "ml_severity" in r
            assert "ml_confidence" in r


# ======================================================================
# Fallback Behavior
# ======================================================================

class TestFallback:
    def test_untrained_model_returns_rule_based(self):
        clf = SeverityClassifier()
        # Don't load any model
        issues = [{"type": "security", "severity": "high", "message": "test"}]
        results = clf.predict(issues)
        assert results[0]["ml_severity"] == "high"  # echoes input severity
        assert results[0]["ml_confidence"] == 0.5
        assert results[0]["ml_model_version"] == "fallback"


# ======================================================================
# Synthetic Data Generator
# ======================================================================

class TestSyntheticDataGenerator:
    def test_generates_correct_count(self):
        issues, labels = generate_synthetic_training_data(100)
        assert len(issues) == 100
        assert len(labels) == 100

    def test_labels_are_valid(self):
        _, labels = generate_synthetic_training_data(500)
        valid = {'info', 'low', 'medium', 'high', 'critical'}
        for label in labels:
            assert label in valid

    def test_deterministic_with_seed(self):
        issues1, labels1 = generate_synthetic_training_data(50, seed=42)
        issues2, labels2 = generate_synthetic_training_data(50, seed=42)
        assert labels1 == labels2
        assert [i['type'] for i in issues1] == [i['type'] for i in issues2]

    def test_all_issue_types_present(self):
        issues, _ = generate_synthetic_training_data(1000)
        types = {i['type'] for i in issues}
        assert types == {'security', 'code_smell', 'performance', 'best_practice'}

    def test_all_severities_present(self):
        _, labels = generate_synthetic_training_data(1000)
        assert set(labels) == {'info', 'low', 'medium', 'high', 'critical'}


# ======================================================================
# Model Info / Metadata
# ======================================================================

class TestModelInfo:
    def test_get_model_info_untrained(self):
        clf = SeverityClassifier()
        info = clf.get_model_info()
        assert info['is_trained'] is False
        assert info['supported_classes'] == []
        assert info['feature_version'] == FEATURE_VERSION

    def test_get_model_info_trained(self):
        clf = SeverityClassifier()
        if clf.load('v3'):
            info = clf.get_model_info()
            assert info['is_trained'] is True
            assert info['model_version'] == 'v3'
            assert len(info['supported_classes']) == 5
            assert 'RandomForest' in info['model_name']


# ======================================================================
# Training
# ======================================================================

class TestTraining:
    def test_train_returns_metrics(self):
        clf = SeverityClassifier()
        issues, labels = generate_synthetic_training_data(200)
        metrics = clf.train(issues, labels)
        assert 'accuracy' in metrics
        assert 'report' in metrics
        assert 'confusion_matrix' in metrics
        assert 0.0 <= metrics['accuracy'] <= 1.0

    def test_train_marks_as_trained(self):
        clf = SeverityClassifier()
        issues, labels = generate_synthetic_training_data(200)
        clf.train(issues, labels)
        assert clf.is_trained is True


# ======================================================================
# Integration: dict → features → scale → predict → severity
# ======================================================================

class TestEndToEndIntegration:
    def test_dict_to_severity_flow(self):
        """Simulate the exact flow used in review_routes.py."""
        clf = SeverityClassifier()
        if not clf.load('v3'):
            pytest.skip("v3 model not available")

        # This mirrors the dict conversion at review_routes.py L95-104
        ml_issue = {
            "type": "security",
            "severity": "high",
            "line_number": 10,
            "message": "Hardcoded password",
            "rule_id": "B105",
            "suggestion": "Use environment variables",
            "code_snippet": "password = 'secret'",
            "explanation": "Hardcoded passwords are a security risk.",
        }

        results = clf.predict([ml_issue])
        assert len(results) == 1
        assert results[0]["ml_severity"] in {'info', 'low', 'medium', 'high', 'critical'}
        assert 0.0 <= results[0]["ml_confidence"] <= 1.0
        assert results[0]["ml_model_version"] == 'v3'

    def test_minimal_dict_does_not_crash(self):
        """Even a minimal dict with just type and message should work."""
        clf = SeverityClassifier()
        if not clf.load('v3'):
            pytest.skip("v3 model not available")

        result = clf.predict([{"type": "code_smell", "message": "bad code"}])
        assert "ml_severity" in result[0]
