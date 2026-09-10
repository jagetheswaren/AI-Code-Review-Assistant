import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os
from pathlib import Path
from typing import List, Dict, Any, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
        self.feature_names = [
            'issue_type_encoded',
            'rule_severity_encoded',
            'line_number_normalized',
            'has_suggestion',
            'has_code_snippet',
            'message_length',
            'rule_id_length',
            'is_security_related',
            'is_complexity_related',
            'has_explanation'
        ]
        
        self.severity_order = ['info', 'low', 'medium', 'high', 'critical']
        self.rule_severity_map = {
            'info': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4
        }
    
    def extract_features(self, issues: List[Dict]) -> np.ndarray:
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
    
    def train(self, issues: List[Dict], labels: List[str] = None) -> Dict[str, float]:
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
        report = classification_report(y_test, y_pred, target_names=self.label_encoder.classes_, output_dict=True)
        
        self.is_trained = True
        
        logger.info(f"Model trained with accuracy: {accuracy:.4f}")
        logger.info(f"Classification report: {report}")
        
        return {
            'accuracy': accuracy,
            'report': report
        }
    
    def predict(self, issues: List[Dict]) -> List[Dict]:
        if not self.is_trained:
            logger.warning("Model not trained, returning rule-based severity")
            for issue in issues:
                issue['ml_severity'] = issue.get('severity', 'low')
                issue['ml_confidence'] = 0.5
            return issues
        
        X = self.extract_features(issues)
        X_scaled = self.scaler.transform(X)
        
        predictions = self.model.predict(X_scaled)
        probabilities = self.model.predict_proba(X_scaled)
        
        predicted_severities = self.label_encoder.inverse_transform(predictions)
        confidences = np.max(probabilities, axis=1)
        
        for i, issue in enumerate(issues):
            issue['ml_severity'] = predicted_severities[i]
            issue['ml_confidence'] = float(confidences[i])
        
        return issues
    
    def save(self, model_path: str = 'models/severity_classifier.joblib'):
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'is_trained': self.is_trained,
            'feature_names': self.feature_names
        }, model_path)
        logger.info(f"Model saved to {model_path}")
    
    def load(self, model_path: str = None):
        if model_path is None:
            model_path = str(Path(__file__).resolve().parents[2] / 'models' / 'severity_classifier.joblib')

        if not os.path.exists(model_path):
            logger.warning(f"Model file not found at {model_path}")
            return False
        
        data = joblib.load(model_path)
        self.model = data['model']
        self.scaler = data['scaler']
        self.label_encoder = data['label_encoder']
        self.is_trained = data['is_trained']
        self.feature_names = data['feature_names']
        logger.info(f"Model loaded from {model_path}")
        return True


def generate_synthetic_training_data(n_samples: int = 1000) -> Tuple[List[Dict], List[str]]:
    np.random.seed(42)
    
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


def train_and_save_model():
    classifier = SeverityClassifier()
    
    issues, labels = generate_synthetic_training_data(2000)
    
    metrics = classifier.train(issues, labels)
    
    classifier.save('models/severity_classifier.joblib')
    
    print(f"Training completed with accuracy: {metrics['accuracy']:.4f}")
    return classifier, metrics


if __name__ == '__main__':
    train_and_save_model()
