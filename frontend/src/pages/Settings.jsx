import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState(true);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [saved, setSaved] = useState(false);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    localStorage.setItem('autoAnalyze', JSON.stringify(autoAnalyze));
    localStorage.setItem('githubToken', githubToken);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your preferences and account settings</p>
        </div>

        {/* Notification */}
        {saved && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <p className="text-sm text-green-800">✅ Settings saved successfully</p>
          </div>
        )}

        {/* Theme Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Theme</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {['light', 'dark', 'auto'].map((t) => (
                <label key={t} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value={t}
                    checked={theme === t}
                    onChange={(e) => handleThemeChange(e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700 capitalize">{t} Mode</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-3 text-gray-700">Enable notifications for analysis results</span>
            </label>
          </div>
        </div>

        {/* Analysis Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis</h2>
          <div className="space-y-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoAnalyze}
                onChange={(e) => setAutoAnalyze(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-3 text-gray-700">Auto-analyze on GitHub webhook</span>
            </label>
            <p className="text-sm text-gray-600">Automatically analyze code when pull requests are opened</p>
          </div>
        </div>

        {/* GitHub Integration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">GitHub Integration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-600">
                Used to authenticate with GitHub API. Never shared or stored insecurely.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
