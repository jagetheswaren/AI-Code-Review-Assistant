import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeCode, analyzeFile } from '../api/client';
import CodeInput from '../components/CodeInput';
import IssueCard from '../components/IssueCard';

const Dashboard = ({ user }) => {
  const [code, setCode] = useState('');
  const [filename, setFilename] = useState('code.py');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const navigate = useNavigate();

  const handleAnalyze = async ({ code: submittedCode, filename: submittedFilename } = {}) => {
    const codeToAnalyze = submittedCode ?? code;
    const filenameToAnalyze = submittedFilename ?? filename;
    if (!codeToAnalyze.trim()) {
      setError('Please enter some code to analyze');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await analyzeCode(codeToAnalyze, filenameToAnalyze);
      setResults(response.data);
      setActiveTab('results');
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError('');
    try {
      const response = await analyzeFile(file);
      setResults(response.data);
      setActiveTab('results');
    } catch (err) {
      setError(err.response?.data?.error || 'File analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      none: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[severity] || colors.none;
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

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">AI Code Review Assistant</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.username}</span>
              <button
                onClick={() => navigate('/history')}
                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
              >
                View History
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Analyze Your Python Code</h2>
            <p className="mt-2 text-gray-600">Paste code or upload a file to get security, quality, and performance insights</p>
          </div>
          <CodeInput
            code={code}
            filename={filename}
            onCodeChange={setCode}
            onFilenameChange={setFilename}
            onAnalyze={handleAnalyze}
            onFileUpload={handleFileUpload}
            loading={loading}
            error={error}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">AI Code Review Assistant</h1>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(results.summary.overall_risk)}`}>
                Risk: {results.summary.overall_risk}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user?.username}</span>
            <button
              onClick={() => navigate('/history')}
              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
            >
              View History
            </button>
            <button
              onClick={() => { setResults(null); setCode(''); setActiveTab('editor'); }}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              New Analysis
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('editor')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'editor' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'results' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Results ({results.summary.total_issues})
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Summary
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'editor' && (
          <CodeInput
            code={code}
            filename={filename}
            onCodeChange={setCode}
            onFilenameChange={setFilename}
            onAnalyze={handleAnalyze}
            onFileUpload={handleFileUpload}
            loading={loading}
            error={error}
          />
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues Found</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {Object.entries(results.summary.by_type).map(([type, count]) => (
                  <div key={type} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{type.replace('_', ' ')}</span>
                      <span className="text-2xl font-bold text-blue-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {results.file_analyses[0]?.issues.map((issue, index) => (
                  <IssueCard key={index} issue={issue} />
                ))}
                {results.file_analyses[0]?.issues.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-lg">No issues found!</p>
                  </div>
                )}
              </div>
            </div>

            {results.ai_review && (
              <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">🤖</span> AI Review Summary
                </h3>
                <div className="prose text-blue-800 whitespace-pre-wrap">{results.ai_review}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500">Total Issues</h4>
                <p className="mt-1 text-3xl font-bold text-gray-900">{results.summary.total_issues}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500">Security Issues</h4>
                <p className="mt-1 text-3xl font-bold text-red-600">{results.summary.by_type.security || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500">Code Smells</h4>
                <p className="mt-1 text-3xl font-bold text-yellow-600">{results.summary.by_type.code_smell || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500">Performance</h4>
                <p className="mt-1 text-3xl font-bold text-orange-600">{results.summary.by_type.performance || 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Severity Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(results.summary.by_severity).map(([severity, count]) => (
                  <div key={severity} className={`p-4 rounded-lg ${getSeverityColor(severity)}`}>
                    <p className="text-sm font-medium capitalize">{severity}</p>
                    <p className="text-2xl font-bold mt-1">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Types</h3>
              <div className="space-y-3">
                {Object.entries(results.summary.by_type).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getTypeIcon(type)}</span>
                      <span className="capitalize text-gray-700">{type.replace('_', ' ')}</span>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {results.ai_review && (
              <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">🤖</span> AI Review Summary
                </h3>
                <div className="prose text-blue-800 whitespace-pre-wrap">{results.ai_review}</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
