#!/usr/bin/env python
"""
Train and save the ML severity classifier model.

This script generates synthetic training data and trains a Random Forest classifier
to predict issue severity levels. The trained model is saved using the leakage-free
feature set (v2-no-leakage).

Usage:
    python train_model.py
    python train_model.py --version v3
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from ml.severity_classifier import train_and_save_model, FEATURE_VERSION


def main():
    """Train and save the severity classifier model."""
    # Allow passing version via CLI arg
    version = 'v3'
    if len(sys.argv) > 1 and sys.argv[1].startswith('--version'):
        if '=' in sys.argv[1]:
            version = sys.argv[1].split('=')[1]
        elif len(sys.argv) > 2:
            version = sys.argv[2]

    print("=" * 80)
    print("AI Code Review Assistant - ML Model Training")
    print("=" * 80)
    print()
    print(f"Feature version: {FEATURE_VERSION}")
    print(f"Target model version: {version}")
    print()

    print("Generating synthetic data (2000 samples)...")
    issues, labels = generate_synthetic_training_data(2000, seed=42)
    print("Training Random Forest classifier...")
    print()

    try:
        classifier, metrics = train_and_save_model(model_version=version)

        print()
        print("=" * 80)
        print("✅ Training Completed Successfully!")
        print("=" * 80)
        print()
        print(f"Model Accuracy: {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)")
        print()
        print("Classification Report:")
        print("-" * 80)

        if isinstance(metrics['report'], dict):
            for severity, metrics_dict in metrics['report'].items():
                if severity not in ['accuracy', 'macro avg', 'weighted avg']:
                    if isinstance(metrics_dict, dict):
                        print(f"\n{severity.upper()}:")
                        print(f"  Precision: {metrics_dict.get('precision', 0):.4f}")
                        print(f"  Recall:    {metrics_dict.get('recall', 0):.4f}")
                        print(f"  F1-Score:  {metrics_dict.get('f1-score', 0):.4f}")

        print()
        print("=" * 80)

        # Print model info
        info = classifier.get_model_info()
        print(f"Model version:   {info['model_version']}")
        print(f"Feature version: {info['feature_version']}")
        print(f"Model name:      {info['model_name']}")
        print(f"Classes:         {info['supported_classes']}")
        print(f"Saved to:        backend/ml/models/severity_classifier_{version}.joblib")
        print("=" * 80)
        print()

        return 0

    except Exception as e:
        print(f"❌ Training Failed: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
