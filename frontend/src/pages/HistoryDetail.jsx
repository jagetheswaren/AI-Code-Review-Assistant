import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const HistoryDetail = () => {
  const { scanId } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScan = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get(`${API_BASE}/history/${scanId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setScan(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load scan details');
      } finally {
        setLoading(false);
      }
    };
    fetchScan();
  }, [scanId, navigate]);

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeIcon = (type) => {
    const icons = {
      security: '🔒',
      code_smell: '🔍',
      performance: '⚡',
      best_practice: '✨'
    };
    return icons[type] || '📋';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link to="/history" className="mt-4 text-blue-600 hover:underline">Back to History</Link>
        </div>
      </div>
    );
  }

  if (!scan) return null;

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link to="/history" className="text-blue-600 hover:underline text-sm mb-2 inline-block">← Back to History</Link>
            <h1 className="text-2xl font-bold text-gray-900">Scan Details</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(scan.overall_risk)}`}>
              Risk: {scan.overall_risk}
            </span>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              New Analysis
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-500">Total Issues</h4>
            <p className="mt-1 text-3xl font-bold text-gray-900">{scan.total_issues}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-500">File</h4>
            <p className="mt-1 text-lg font-medium text-gray-900">{scan.file_path}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-500">Scan Date</h4>
            <p className="mt-1 text-lg font-medium text-gray-900">{formatDate(scan.timestamp)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-sm font-medium text-gray-500">Processing Time</h4>
            <p className="mt-1 text-lg font-medium text-gray-900">{scan.processing_time_ms}ms</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Issues Found</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(scan.by_type || {}).map(([type, count]) => (
              <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="text-2xl mr-2">{getTypeIcon(type)}</span>
                    <span className="text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                  </span>
                  <span className="text-2xl font-bold text-blue-600">{count}</span>
                </div>
              </div>
            ))}
          </div>

          {scan.issues && scan.issues.length > 0 ? (
            <div className="space-y-4">
              {scan.issues.map((issue, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">{getTypeIcon(issue.type)}</span>
                        <span className="text-lg font-semibold text-gray-900 capitalize">
                          {issue.type.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                        <span className="text-sm text-gray-500">Line {issue.line_number}</span>
                        {issue.rule_id && (
                          <span className="text-sm text-gray-400 font-mono">Rule: {issue.rule_id}</span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3">{issue.message}</p>
                      {issue.code_snippet && (
                        <div className="bg-gray-100 rounded-md p-3 overflow-x-auto mb-3">
                          <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">{issue.code_snippet}</pre>
                        </div>
                      )}
                      {issue.suggestion && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                          <p className="text-sm font-medium text-yellow-800">💡 Suggestion:</p>
                          <p className="text-sm text-yellow-700 mt-1">{issue.suggestion}</p>
                        </div>
                      )}
                      {issue.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                          <p className="text-sm font-medium text-blue-800">🤖 Explanation:</p>
                          <p className="text-sm text-blue-700 mt-1">{issue.explanation}</p>
                        </div>
                      )}
                      {issue.fix_suggestion && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <p className="text-sm font-medium text-green-800">🔧 Fix Suggestion:</p>
                          <p className="text-sm text-green-700 mt-1">{issue.fix_suggestion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No issues found!</h3>
              <p className="mt-1 text-gray-500">This code looks clean.</p>
            </div>
          )}

          {scan.ai_review && (
            <div className="mt-8 bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">🤖</span> AI Review Summary
              </h3>
              <div className="prose text-blue-800 whitespace-pre-wrap">{scan.ai_review}</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HistoryDetail;