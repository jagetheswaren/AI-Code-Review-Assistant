#!/usr/bin/env python
"""
Train and save the ML severity classifier model.

This script generates synthetic training data and trains a Random Forest classifier
to predict issue severity levels. The trained model is saved to models/severity_classifier.joblib.

Usage:
    python train_model.py
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from ml.severity_classifier import train_and_save_model


def main():
    """Train and save the severity classifier model."""
    print("=" * 80)
    print("AI Code Review Assistant - ML Model Training")
    print("=" * 80)
    print()
    
    print("Generating synthetic training data...")
    print("Training Random Forest classifier...")
    print()
    
    try:
        classifier, metrics = train_and_save_model()
        
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
        print("Model saved to: models/severity_classifier.joblib")
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
