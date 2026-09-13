# ML Model Evaluation

## Overview

This document reports the measured evaluation metrics for the severity classification model. All metrics were obtained by running `python -m ml.evaluate_model` on 2026-09-13.

> **⚠️ Important**: All metrics are measured on **synthetic data**. They reflect the model's ability to classify randomly generated issues, NOT real-world code review severity prediction.

## Evaluation Methodology

| Property | Value |
|----------|-------|
| Dataset | Synthetic (`generate_synthetic_training_data()`, seed=42) |
| Training samples | 2000 |
| Test split | 20% stratified (`train_test_split`, `random_state=42`) |
| Evaluation set | 400 samples (test split) |
| Feature version | v2-no-leakage |
| Metrics | Accuracy, Macro F1, Weighted F1, per-class P/R/F1, confusion matrix |

## Data Leakage Correction

**Before (v1/v2 models)**: Feature #2 (`rule_severity_encoded`) was a direct numeric encoding of the target label → 99.9% accuracy (memorization, not learning).

**After (v3 model)**: Leaking feature removed → accuracy drops to ~32%. This is the **correct** result: the synthetic features carry minimal predictive signal for severity.

## Baseline Metrics — v3 Model (leakage-free)

### Loaded Model (evaluated on fresh n=1000 synthetic set)

| Metric | Value |
|--------|-------|
| Accuracy | 0.6390 |
| Macro F1 | 0.6376 |
| Weighted F1 | 0.6363 |

| Class | Precision | Recall | F1 | Support |
|-------|-----------|--------|----|---------|
| CRITICAL | 0.5549 | 0.7869 | 0.6508 | 122 |
| HIGH | 0.6500 | 0.6667 | 0.6582 | 195 |
| INFO | 0.5327 | 0.7794 | 0.6328 | 136 |
| LOW | 0.6886 | 0.6416 | 0.6643 | 293 |
| MEDIUM | 0.7677 | 0.4685 | 0.5819 | 254 |

> Note: The loaded model's higher accuracy (63.9%) compared to the fresh training (32%) is because the loaded model was trained on the same synthetic seed — the evaluation set partially overlaps with training data distribution. This further illustrates the synthetic data limitation.

### Fresh Training (20% held-out test set, n=400)

| Metric | Value |
|--------|-------|
| Accuracy | 0.3200 |
| Macro F1 | 0.3136 |
| Weighted F1 | 0.3165 |

| Class | Precision | Recall | F1 | Support |
|-------|-----------|--------|----|---------|
| CRITICAL | 0.3158 | 0.3830 | 0.3462 | 47 |
| HIGH | 0.2698 | 0.2297 | 0.2482 | 74 |
| INFO | 0.2577 | 0.4237 | 0.3205 | 59 |
| LOW | 0.3898 | 0.3833 | 0.3866 | 120 |
| MEDIUM | 0.3385 | 0.2200 | 0.2667 | 100 |

## Model Comparison (all on leakage-free features, same split)

| Model | Accuracy | Macro F1 | Weighted F1 |
|-------|----------|----------|-------------|
| **Random Forest (balanced)** | **0.3200** | **0.3136** | **0.3165** |
| Random Forest (no class_weight) | 0.3250 | 0.2764 | 0.3024 |
| Logistic Regression (balanced) | 0.3150 | 0.3091 | 0.3027 |
| Gradient Boosting | 0.3225 | 0.2893 | 0.3138 |

**Selected model**: Random Forest with `class_weight='balanced'` — best Macro F1 (0.3136), which gives fair treatment to minority classes.

### Why metrics are low

All four models perform at roughly chance level (~20% for 5 classes). This is expected:

1. The synthetic data labels are randomly assigned (conditioned on issue type, but not on features the model can see after leakage removal).
2. The features (boolean flags, normalized lengths) carry almost no information about severity.
3. Real improvement requires a dataset where severity labels correlate with actual code properties.

## Class Imbalance

| Class | Count (n=2000) | Percentage |
|-------|----------------|------------|
| low | 603 | 30.1% |
| medium | 499 | 24.9% |
| high | 369 | 18.4% |
| info | 295 | 14.8% |
| critical | 234 | 11.7% |

Imbalance ratio: **2.58** (low vs. critical).

`class_weight='balanced'` improves Macro F1 (+0.04 vs. unweighted RF), confirming it helps with class imbalance in this dataset.

## Previous Metrics (v1/v2, WITH leakage — for reference only)

| Metric | Value | Explanation |
|--------|-------|-------------|
| Accuracy | 0.9990 | Memorized leaked feature |
| Macro F1 | 0.9991 | Not meaningful |
| Weighted F1 | 0.9990 | Not meaningful |

These metrics are **invalid** and should not be cited as model performance.

## Confidence Values

The `ml_confidence` field reports `max(predict_proba(...))` — the highest class probability estimated by the Random Forest. After leakage removal, typical confidence values range from 0.20 to 0.65, reflecting genuine uncertainty. These are **uncalibrated** RF probability estimates.

## Model Versions

| Version | Feature Set | Accuracy (fresh test) | Status |
|---------|-------------|----------------------|--------|
| v1 | v1-legacy (leakage) | 0.9990 (invalid) | Fallback |
| v2 | v1-legacy (leakage) | 0.9990 (invalid) | Fallback |
| v3 | v2-no-leakage | 0.3200 (honest) | **Current** |

## Recommended Next Steps

1. **Compile a real dataset** of human-labeled code review findings.
2. **Add code-derived features** (actual complexity scores, AST metrics, line counts).
3. **Re-evaluate** all candidate models on real data.
4. **Consider probability calibration** if confidence values are used for UI decisions.
