import pickle
import os
import numpy as np
from typing import Dict, Any, Tuple


def generate_training_data(n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
    np.random.seed(42)

    messages = [
        "Use of eval() allows arbitrary code execution",
        "Hardcoded password detected",
        "Shell command injection vulnerability",
        "Pickle deserialization vulnerability",
        "Bare except catches all exceptions",
        "Function too long, needs refactoring",
        "High cyclomatic complexity detected",
        "Unused import statement",
        "Missing docstring for function",
        "Line too long exceeds 120 characters",
        "Deep nesting detected in function",
        "Magic number used without constant",
        "Duplicate code block detected",
        "Trailing whitespace found",
        "Variable assigned but never used",
        "Complex conditional with multiple operators",
        "SQL injection risk with string concatenation",
        "XXE vulnerability in XML parsing",
        "Insecure random number generation",
        "TLS certificate verification disabled",
    ]

    severities = ["critical", "high", "medium", "low", "info"]

    X = []
    y = []

    for _ in range(n_samples):
        msg_idx = np.random.randint(0, len(messages))
        message = messages[msg_idx]
        sev_idx = min(msg_idx // 4, len(severities) - 1)

        features = [
            len(message),
            message.count(" "),
            sum(1 for c in message if c.isupper()),
            msg_idx,
            np.random.randint(0, 100),
            len(set(message.split())) / max(len(message.split()), 1),
        ]

        X.append(features)
        y.append(sev_idx)

    return np.array(X), np.array(y)


def train_models() -> Dict[str, Any]:
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    from sklearn.preprocessing import StandardScaler, LabelEncoder

    X, y = generate_training_data(2000)

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        "random_forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "gradient_boosting": GradientBoostingClassifier(n_estimators=100, random_state=42),
        "logistic_regression": LogisticRegression(max_iter=1000, random_state=42),
    }

    results = {}
    best_f1 = 0
    best_model_name = None

    for name, model in models.items():
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)

        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

        results[name] = {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "model": model
        }

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name

    best_model = results[best_model_name]["model"]

    output_path = os.path.join(os.path.dirname(__file__), "ml_model.pkl")
    with open(output_path, "wb") as f:
        pickle.dump({
            "model": best_model,
            "vectorizer": scaler,
            "label_encoder": le,
            "best_model_name": best_model_name,
            "results": {k: {mk: mv for mk, mv in v.items() if mk != "model"} for k, v in results.items()}
        }, f)

    return {
        "best_model": best_model_name,
        "results": {k: {mk: mv for mk, mv in v.items() if mk != "model"} for k, v in results.items()},
        "model_path": output_path
    }


if __name__ == "__main__":
    print("Training ML models...")
    result = train_models()
    print(f"Best model: {result['best_model']}")
    for name, metrics in result["results"].items():
        print(f"\n{name}:")
        for metric, value in metrics.items():
            print(f"  {metric}: {value}")
    print(f"\nModel saved to: {result['model_path']}")
