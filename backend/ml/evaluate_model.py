#!/usr/bin/env python
"""
Evaluate and compare ML severity classifiers.

This script:
  1. Establishes baseline metrics for the currently loaded model.
  2. Trains and compares Random Forest, Logistic Regression, and Gradient Boosting
     on the leakage-free feature set.
  3. Reports per-class precision/recall/F1, confusion matrices, and summary metrics.

All metrics are measured on a held-out 20% stratified test set.
All training uses random_state=42 for reproducibility.

WARNING: The dataset is synthetic. Metrics reflect synthetic-data performance only.
"""

import sys
from pathlib import Path
import json

sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.severity_classifier import (
    SeverityClassifier,
    generate_synthetic_training_data,
    FEATURE_VERSION,
)
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    confusion_matrix,
    f1_score,
)
import numpy as np


def _print_separator(char="=", width=70):
    print(char * width)


def _print_metrics(name, y_true, y_pred, class_names):
    """Print detailed metrics for a single model."""
    acc = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    weighted_f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)
    report = classification_report(
        y_true, y_pred, target_names=class_names, output_dict=True, zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred)

    print(f"\n{'─' * 70}")
    print(f"  MODEL: {name}")
    print(f"{'─' * 70}")
    print(f"  Accuracy:    {acc:.4f}")
    print(f"  Macro F1:    {macro_f1:.4f}")
    print(f"  Weighted F1: {weighted_f1:.4f}")
    print()
    print("  Per-class metrics:")
    for cls_name in class_names:
        m = report[cls_name]
        print(f"    {cls_name.upper():>10s}  P={m['precision']:.4f}  R={m['recall']:.4f}  F1={m['f1-score']:.4f}  n={int(m['support'])}")
    print()
    print(f"  Confusion matrix (rows=true, cols=pred):")
    print(f"  Labels: {list(class_names)}")
    for row in cm:
        print(f"    {row}")
    print()

    return {
        "accuracy": acc,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "report": report,
        "confusion_matrix": cm.tolist(),
    }


def run_evaluation():
    """Evaluate loaded model and fresh models on the EXACT same test split."""
    _print_separator()
    print("MODEL EVALUATION & COMPARISON")
    _print_separator()
    print(f"  Feature version: {FEATURE_VERSION}")
    print()

    # Generate one definitive dataset for evaluation (using fixed seed)
    issues, labels = generate_synthetic_training_data(2000, seed=42)
    
    classifier = SeverityClassifier()
    # Ensure we use v2 features for comparison
    X = classifier.extract_features(issues)
    
    le = LabelEncoder()
    y = le.fit_transform(labels)
    class_names = le.classes_
    
    # Class distribution
    print("  Class distribution (n=2000):")
    unique, counts = np.unique(y, return_counts=True)
    for idx, count in zip(unique, counts):
        pct = count / len(y) * 100
        print(f"    {class_names[idx]:>10s}: {count:4d} ({pct:5.1f}%)")
    max_count, min_count = counts.max(), counts.min()
    print(f"  Imbalance ratio (max/min): {max_count / min_count:.2f}")
    print()

    # Create the ONE true test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)
    
    results = {}
    
    # 1. Evaluate Loaded Model (if available)
    if classifier.load():
        info = classifier.get_model_info()
        print("PART 1: LOADED MODEL")
        print(f"  Version: {info['model_version']}")
        print(f"  Feature: {info['feature_version']}")
        
        # Scale test data using LOADED scaler
        X_test_loaded_s = classifier.scaler.transform(X_test)
        y_pred_loaded = classifier.model.predict(X_test_loaded_s)
        # Assuming the loaded label encoder matches
        y_pred_loaded_encoded = le.transform(classifier.label_encoder.inverse_transform(y_pred_loaded))
        results[f"Loaded ({info['model_version']})"] = _print_metrics(
            f"Loaded ({info['model_version']})", y_test, y_pred_loaded_encoded, class_names
        )
    
    # 2. Train and Evaluate Fresh Candidates
    print("PART 2: FRESH CANDIDATES")
    candidates = {
        "Random Forest (balanced)": RandomForestClassifier(
            n_estimators=100, max_depth=10, min_samples_split=5, 
            min_samples_leaf=2, random_state=42, class_weight="balanced"
        ),
        "Logistic Regression": LogisticRegression(
            max_iter=1000, class_weight="balanced", random_state=42
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=100, max_depth=5, random_state=42
        )
    }
    
    for name, model in candidates.items():
        model.fit(X_train_s, y_train)
        y_pred = model.predict(X_test_s)
        results[name] = _print_metrics(name, y_test, y_pred, class_names)
        
    # 3. Summary
    _print_separator()
    print("SUMMARY COMPARISON (Test Set n=400)")
    _print_separator()
    print(f"  {'Model':<35s} {'Accuracy':>10s} {'Macro F1':>10s} {'Weighted F1':>12s}")
    print(f"  {'─' * 67}")
    for name, r in results.items():
        print(f"  {name:<35s} {r['accuracy']:>10.4f} {r['macro_f1']:>10.4f} {r['weighted_f1']:>12.4f}")
    print()

if __name__ == "__main__":
    print()
    run_evaluation()
    print()
    _print_separator()
    print("EVALUATION COMPLETE")
    _print_separator()
