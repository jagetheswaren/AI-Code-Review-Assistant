import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TrendChart from '../components/TrendChart';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const History = () => {
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState({});
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [days, setDays] = useState(30);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const [scansRes, statsRes, trendsRes] = await Promise.all([
        axios.get(`${API_BASE}/history`, { params: { page, per_page: 20 }, headers }),
        axios.get(`${API_BASE}/stats`, { headers }),
        axios.get(`${API_BASE}/trends`, { params: { days }, headers })
      ]);

      setScans(scansRes.data.scans || []);
      setStats(statsRes.data);
      setTrends(trendsRes.data.trends || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [days, navigate, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getSeverityColor = (risk) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
      none: 'bg-gray-100 text-gray-800'
    };
    return colors[risk] || colors.none;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
          <div className="flex items-center space-x-4">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              New Analysis
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4 bg-red-50 text-red-600">
          {error}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="text-sm font-medium text-gray-500">Total Scans</h4>
              <p className="mt-1 text-3xl font-bold text-gray-900">{stats.total_scans || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="text-sm font-medium text-gray-500">Total Issues Found</h4>
              <p className="mt-1 text-3xl font-bold text-red-600">{stats.total_issues || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="text-sm font-medium text-gray-500">Avg Issues per Scan</h4>
              <p className="mt-1 text-3xl font-bold text-blue-600">{stats.avg_issues || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="text-sm font-medium text-gray-500">Risk Distribution</h4>
              <div className="mt-2 space-y-1">
                {Object.entries(stats.risk_distribution || {}).map(([risk, count]) => (
                  <div key={risk} className="flex justify-between text-sm">
                    <span className="capitalize">{risk}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Trends (Last {days} Days)</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <TrendChart data={trends} type="line" title="Issues Over Time" />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Scans</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakdown</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(scan.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scan.file_path}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {scan.total_issues}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(scan.overall_risk)}`}>
                        {scan.overall_risk}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Object.entries(scan.by_type || {}).filter(([, v]) => v > 0).map(([type, count]) => (
                        <span key={type} className="mr-2">{type}: {count}</span>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/history/${scan.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {scans.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No scans yet. <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">Create your first scan</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-600">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={scans.length < 20}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default History;
