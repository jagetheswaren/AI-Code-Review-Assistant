import React, { useState } from 'react';

const GitHubIntegration = () => {
  const [token, setToken] = useState(localStorage.getItem('githubToken') || '');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSaveToken = () => {
    if (!token.trim()) {
      setError('Please enter a GitHub token');
      return;
    }
    
    localStorage.setItem('githubToken', token);
    setSaved(true);
    setError('');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleGenerateWebhookUrl = () => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const url = `${baseUrl}/webhook/github`;
    setWebhookUrl(url);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GitHub Integration</h1>
          <p className="mt-2 text-gray-600">Connect your GitHub account to enable automatic code review</p>
        </div>

        {/* Alerts */}
        {saved && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <p className="text-sm text-green-800">✅ GitHub token saved successfully</p>
          </div>
        )}
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Personal Access Token */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Access Token</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>How to create a GitHub Personal Access Token:</strong>
            </p>
            <ol className="list-decimal list-inside text-sm text-blue-800 mt-2 space-y-1">
              <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
              <li>Click "Generate new token"</li>
              <li>Select these scopes: <code className="bg-white px-2 py-1 rounded">repo</code>, <code className="bg-white px-2 py-1 rounded">admin:repo_hook</code></li>
              <li>Copy the generated token</li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-600">
                Your token is stored locally and never transmitted to servers.
              </p>
            </div>

            <button
              onClick={handleSaveToken}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Token
            </button>
          </div>
        </div>

        {/* Webhook Setup */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Webhook Configuration</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Set up a webhook to automatically analyze pull requests in your repositories.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              {!webhookUrl ? (
                <button
                  onClick={handleGenerateWebhookUrl}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Generate Webhook URL
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookUrl)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>To set up the webhook:</strong>
              </p>
              <ol className="list-decimal list-inside text-sm text-yellow-800 mt-2 space-y-1">
                <li>Go to your repository → Settings → Webhooks</li>
                <li>Click "Add webhook"</li>
                <li>Paste the webhook URL in the Payload URL field</li>
                <li>Select "Pull request" as the event to trigger</li>
                <li>Click "Add webhook"</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Repository List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Repositories</h2>
          
          {token ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-600">
                Loading repositories...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Repositories connected to this GitHub token will appear here once you enable webhooks.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-600">
                No token configured yet. Please add your GitHub token above to connect repositories.
              </p>
            </div>
          )}
        </div>

        {/* Best Practices */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Best Practices</h2>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✓</span>
              <span>Keep your GitHub token private and never share it</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✓</span>
              <span>Rotate your tokens regularly for security</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✓</span>
              <span>Only grant minimum required permissions (repo, admin:repo_hook)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✓</span>
              <span>Monitor webhook deliveries in your repository settings</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GitHubIntegration;
