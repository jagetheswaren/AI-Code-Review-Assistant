import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboard } from '../api/client';

const Profile = () => {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getDashboard();
        setDashboard(response.data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboard();
    }
  }, [user]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.username}</h1>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Statistics */}
        {dashboard?.statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm font-medium">Total Scans</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {dashboard.statistics.total_scans || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm font-medium">Total Issues</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {dashboard.statistics.total_issues || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm font-medium">Avg Issues/Scan</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {dashboard.statistics.avg_issues_per_scan?.toFixed(1) || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm font-medium">Risk Level</div>
              <div className="mt-2 text-2xl font-bold">
                {(() => {
                  const dist = dashboard.statistics.risk_distribution || {};
                  if (dist.critical > 0) return <span className="text-red-600">🔴 Critical</span>;
                  if (dist.high > 0) return <span className="text-orange-600">🟠 High</span>;
                  if (dist.medium > 0) return <span className="text-yellow-600">🟡 Medium</span>;
                  return <span className="text-green-600">🟢 Low</span>;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Recent Scans */}
        {dashboard?.recent_scans && dashboard.recent_scans.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboard.recent_scans.map((scan) => (
                    <tr key={scan.request_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {scan.summary?.file_path || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {scan.summary?.total_issues || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          scan.summary?.overall_risk === 'critical' ? 'bg-red-100 text-red-800' :
                          scan.summary?.overall_risk === 'high' ? 'bg-orange-100 text-orange-800' :
                          scan.summary?.overall_risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {scan.summary?.overall_risk?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(scan.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Account Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Username</span>
              <span className="font-medium text-gray-900">{user?.username}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Account Type</span>
              <span className="font-medium text-gray-900">Free Tier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
