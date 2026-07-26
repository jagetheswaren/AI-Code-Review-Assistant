import React from 'react';

const severityColors = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#16a34a',
  info: '#2563eb'
};

const severityLabels = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info'
};

const typeLabels = {
  security: 'Security',
  code_smell: 'Code Smell',
  performance: 'Performance',
  best_practice: 'Best Practice'
};

const IssueCard = ({ issue, index }) => {
  const severity = issue.severity || issue.ml_severity || 'info';
  const color = severityColors[severity] || '#6b7280';
  const type = issue.type || 'code_smell';

  return (
    <div 
      className="issue-card"
      style={{ borderLeftColor: color }}
    >
      <div className="issue-header">
        <span className="issue-index">#{index + 1}</span>
        <span 
          className="severity-badge"
          style={{ backgroundColor: color }}
        >
          {severityLabels[severity]}
        </span>
        <span className="type-badge">
          {typeLabels[type]}
        </span>
      </div>

      <div className="issue-details">
        <div className="issue-line">
          <strong>Line:</strong> {issue.line_number}
        </div>
        <div className="issue-rule">
          <strong>Rule:</strong> {issue.rule_id || 'N/A'}
        </div>
      </div>

      <div className="issue-message">
        {issue.message}
      </div>

      {issue.code_snippet && (
        <div className="code-snippet">
          <pre>{issue.code_snippet}</pre>
        </div>
      )}

      {issue.explanation && (
        <div className="issue-explanation">
          <strong>Explanation:</strong>
          <p>{issue.explanation}</p>
        </div>
      )}

      {(issue.suggestion || issue.fix_suggestion) && (
        <div className="issue-suggestion">
          <strong>Suggested Fix:</strong>
          <p>{issue.fix_suggestion || issue.suggestion}</p>
        </div>
      )}

      {issue.ml_severity && issue.ml_severity !== severity && (
        <div className="ml-severity">
          <strong>ML Classified Severity:</strong> 
          <span style={{ color: severityColors[issue.ml_severity] }}>
            {severityLabels[issue.ml_severity]} 
            ({Math.round((issue.ml_confidence || 0) * 100)}% confidence)
          </span>
        </div>
      )}
    </div>
  );
};

export default IssueCard;