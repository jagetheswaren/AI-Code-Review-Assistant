import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboard, getTrends, getGitHubRepos, getGitHubStatus } from '../api/client';
import { cn } from '../lib/utils';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
} from 'chart.js';
import { motion } from 'framer-motion';
import {
  Activity,
  ShieldAlert,
  Zap,
  Eye,
  Plus,
  ArrowRight,
  GitBranch,
  Cpu,
  Clock,
  Sparkles,
  Layers,
  FileCode2,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Button, Badge, Skeleton } from '../components/ui';
import { SpotlightCard, CountUp, StatusMark, AnimatedContent } from '../components/reactbits/Bits';
import { ErrorState } from '../components/workbench';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler
);

const chartPalette = {
  cyan: '#63E6FF',
  violet: '#8B7CFF',
  danger: '#FF5D67',
  warning: '#FFB84D',
  success: '#38D996',
  muted: '#5F6B78',
  border: 'rgba(255, 255, 255, 0.08)',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [repos, setRepos] = useState([]);
  const [reposError, setReposError] = useState('');
  const [githubConnected, setGithubConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoadError(null);
        const [dashRes, trendRes, ghStatus] = await Promise.allSettled([
          getDashboard(),
          getTrends(30),
          getGitHubStatus(),
        ]);

        if (dashRes.status === 'rejected') throw dashRes.reason;
        const dashboardData = dashRes.value.data;
        const trendsData = trendRes.status === 'fulfilled' ? trendRes.value.data?.trends || [] : [];
        const isConnected = ghStatus.status === 'fulfilled' ? !!ghStatus.value.data?.connected : false;

        setGithubConnected(isConnected);

        if (isConnected) {
          try {
            const repoRes = await getGitHubRepos();
            setReposError('');
            setRepos((repoRes.data?.repos || repoRes.data?.repositories || []).slice(0, 4));
          } catch (err) {
            setRepos([]);
            setReposError(err.response?.data?.error || err.message || 'Repositories could not be loaded.');
          }
        }

        setData({
          ...dashboardData,
          trends: trendsData,
        });
      } catch (err) {
        setLoadError(err.response?.data?.error || err.message || 'Dashboard data could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={() => { setLoading(true); setReloadKey((value) => value + 1); }} />;
  }

  const stats = data?.statistics || {};
  const recentScans = data?.recent_scans || [];
  const trends = data?.trends || [];

  const totalScans = stats.total_scans || 0;
  const totalIssues = stats.total_issues || 0;
  const byType = stats.by_type || {};
  const bySev = stats.by_severity || stats.risk_distribution || {};

  const criticalIssues = bySev.critical || 0;
  const highIssues = bySev.high || 0;
  const mediumIssues = bySev.medium || 0;
  const lowIssues = bySev.low || 0;

  // Real formula-based health score: 100 base, deduction per issue severity
  const calculatedHealth = totalScans > 0
    ? Math.max(12, Math.min(100, Math.round(100 - (criticalIssues * 15 + highIssues * 6 + mediumIssues * 2))))
    : null;

  // Real risk score (0-100)
  const securityRisk = totalScans > 0
    ? Math.min(100, Math.round((criticalIssues * 25 + highIssues * 10 + mediumIssues * 3) / Math.max(1, totalScans)))
    : null;

  // Trend Chart (Real data from /api/trends)
  const hasTrends = trends.length > 0;
  const trendChartData = {
    labels: hasTrends ? trends.map((t) => (t.date || t._id || '').slice(5)) : ['No activity yet'],
    datasets: [
      {
        label: 'Issues Found',
        data: hasTrends ? trends.map((t) => t.total_issues ?? t.count ?? 0) : [0],
        borderColor: chartPalette.cyan,
        backgroundColor: 'rgba(99, 230, 255, 0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: chartPalette.cyan,
        borderWidth: 2,
      },
    ],
  };

  // Severity Distribution Donut
  const hasSeverityIssues = totalIssues > 0;
  const severityDonutData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: hasSeverityIssues
          ? [criticalIssues, highIssues, mediumIssues, lowIssues]
          : [0, 0, 0, 1],
        backgroundColor: hasSeverityIssues
          ? [chartPalette.danger, '#FF944D', chartPalette.warning, chartPalette.cyan]
          : [chartPalette.border, chartPalette.border, chartPalette.border, chartPalette.border],
        borderWidth: 0,
        spacing: 3,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-content">
              Dashboard <span className="text-content-muted text-lg font-normal">| Engineering Workspace</span>
            </h1>
            <StatusMark status="online" label="Compiler Live" />
          </div>
          <p className="text-xs font-mono text-content-muted mt-1">
            Real-time static code analysis, vulnerability audit, and ML severity metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/review">
            <Button variant="primary" size="md" className="font-mono text-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              New Analysis
            </Button>
          </Link>
          <Link to="/github">
            <Button variant="secondary" size="md" className="font-mono text-xs">
              <GitBranch className="w-4 h-4 mr-1.5" />
              GitHub
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1: Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Repository Health Score */}
        <SpotlightCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-content-muted uppercase tracking-wider">Repository Health</span>
            <div className="p-2 rounded-lg bg-success/10 text-success border border-success/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-content flex items-baseline gap-1">
              {calculatedHealth === null ? '—' : <CountUp end={calculatedHealth} />}
              <span className="text-xs font-mono text-content-subtle">/ 100</span>
            </div>
            <span className={cn(
              "text-xs font-mono font-semibold px-2 py-0.5 rounded",
              calculatedHealth >= 80 ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
            )}>
              {calculatedHealth === null ? 'NO SCANS' : calculatedHealth >= 80 ? 'STABLE*' : 'ACTION REQ*'}
            </span>
          </div>
        </SpotlightCard>

        {/* Metric 2: Total Scans Performed */}
        <SpotlightCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-content-muted uppercase tracking-wider">Total Scans</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <FileCode2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-content">
              <CountUp end={totalScans} />
            </div>
            <span className="text-xs font-mono text-content-subtle">Real DB Audits</span>
          </div>
        </SpotlightCard>

        {/* Metric 3: Critical Security Flaws */}
        <SpotlightCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-content-muted uppercase tracking-wider">Critical Issues</span>
            <div className="p-2 rounded-lg bg-danger/10 text-danger border border-danger/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-danger">
              <CountUp end={criticalIssues} />
            </div>
            <span className="text-xs font-mono text-danger/80 font-bold">
              {criticalIssues > 0 ? 'HIGH PRIORITY' : 'ZERO DETECTED'}
            </span>
          </div>
        </SpotlightCard>

        {/* Metric 4: Security Risk Index */}
        <SpotlightCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-content-muted uppercase tracking-wider">Security Risk</span>
            <div className="p-2 rounded-lg bg-secondary/10 text-secondary border border-secondary/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-content flex items-baseline gap-1">
              {securityRisk === null ? '—' : <CountUp end={securityRisk} />}
              <span className="text-xs font-mono text-content-subtle">%</span>
            </div>
            <span className={cn(
              "text-xs font-mono font-semibold px-2 py-0.5 rounded",
              securityRisk === null ? "bg-white/[0.05] text-content-subtle" : securityRisk > 40 ? "bg-danger/15 text-danger" : "bg-primary/15 text-primary"
            )}>
              {securityRisk === null ? 'NO SCANS' : securityRisk > 40 ? 'ELEVATED*' : 'LOW*'}
            </span>
          </div>
        </SpotlightCard>
      </div>

      {/* Row 2: Risk Over Time Chart + Severity Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Large Risk Over Time Chart (2 Cols) */}
        <SpotlightCard className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-content">Risk Over Time</h2>
              <p className="text-xs font-mono text-content-muted">Issues discovered across all 30-day reviews</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-content-subtle">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span>Issues Trend</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: chartPalette.muted, font: { family: 'JetBrains Mono', size: 10 } },
                  },
                  y: {
                    grid: { color: chartPalette.border },
                    ticks: { color: chartPalette.muted, font: { family: 'JetBrains Mono', size: 10 } },
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </SpotlightCard>

        {/* Severity Donut Breakdown (1 Col) */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-content">Severity Distribution</h2>
            <p className="text-xs font-mono text-content-muted">Breakdown by threat level</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center relative">
            <Doughnut
              data={severityDonutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: { legend: { display: false } },
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display text-2xl font-bold text-content">{totalIssues}</span>
              <span className="text-[10px] font-mono text-content-subtle uppercase">Issues</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/[0.06] text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
              <span className="flex items-center gap-1.5 text-danger font-medium">
                <span className="w-2 h-2 rounded-full bg-danger" /> Critical
              </span>
              <span className="text-content font-bold">{criticalIssues}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
              <span className="flex items-center gap-1.5 text-[#FF944D] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#FF944D]" /> High
              </span>
              <span className="text-content font-bold">{highIssues}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
              <span className="flex items-center gap-1.5 text-warning font-medium">
                <span className="w-2 h-2 rounded-full bg-warning" /> Medium
              </span>
              <span className="text-content font-bold">{mediumIssues}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
              <span className="flex items-center gap-1.5 text-primary font-medium">
                <span className="w-2 h-2 rounded-full bg-primary" /> Low
              </span>
              <span className="text-content font-bold">{lowIssues}</span>
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* Row 3: Recent Scans & Connected GitHub Repositories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Scans Table (2 Cols) */}
        <SpotlightCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-content">Recent Scans</h2>
              <p className="text-xs font-mono text-content-muted">Latest code audits completed by the compiler</p>
            </div>
            <Link to="/history" className="text-xs font-mono text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentScans.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-content-muted">
              No recent scans recorded. Start your first analysis in the review workspace.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06] text-content-subtle uppercase text-[10px]">
                    <th className="py-2.5 px-3">File / Target</th>
                    <th className="py-2.5 px-3">Risk</th>
                    <th className="py-2.5 px-3">Issues</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {recentScans.slice(0, 6).map((scan, idx) => {
                    const scanId = scan.id || scan._id;
                    const filePath = scan.summary?.file_path || scan.file_path || 'Direct Code';
                    const issuesCount = scan.summary?.total_issues ?? scan.total_issues ?? 0;
                    const overallRisk = (scan.summary?.overall_risk || scan.overall_risk || 'none').toLowerCase();

                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 px-3 font-medium text-content flex items-center gap-2">
                          <FileCode2 className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate max-w-[180px]">{filePath}</span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              overallRisk === 'critical'
                                ? 'critical'
                                : overallRisk === 'high'
                                ? 'high'
                                : overallRisk === 'medium'
                                ? 'medium'
                                : 'low'
                            }
                          >
                            {overallRisk.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-content-muted">{issuesCount} findings</td>
                        <td className="py-3 px-3 text-content-subtle text-[11px]">
                          {scan.timestamp ? new Date(scan.timestamp).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/history/${scanId}`}
                            className="p-1.5 rounded hover:bg-white/[0.08] text-primary inline-flex items-center"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SpotlightCard>

        {/* Connected Repositories / GitHub Widget (1 Col) */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-content">GitHub Sync</h2>
              <Link to="/github" className="text-xs font-mono text-primary hover:underline">
                Manage
              </Link>
            </div>

            {!githubConnected ? (
              <div className="p-4 rounded-xl bg-[#090D13] border border-white/[0.06] text-center space-y-3">
                <GitBranch className="w-8 h-8 text-content-subtle mx-auto" />
                <p className="text-xs font-mono text-content-muted">
                  Connect GitHub to enable automated pull request scanning & webhook review comments.
                </p>
                <Link to="/github">
                  <Button variant="secondary" size="sm" className="w-full font-mono text-xs">
                    Connect GitHub OAuth / PAT
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {reposError ? (
                  <ErrorState message={reposError} onRetry={() => { setLoading(true); setReloadKey((value) => value + 1); }} />
                ) : repos.length === 0 ? (
                  <p className="text-xs font-mono text-content-muted py-6 text-center">
                    No repositories imported yet.
                  </p>
                ) : (
                  repos.map((repo, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(`/github/${repo.full_name}`)}
                      className="p-3 rounded-lg bg-[#090D13] border border-white/[0.06] hover:border-white/[0.14] cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-semibold text-content truncate">
                          {repo.name}
                        </p>
                        <p className="text-[10px] font-mono text-content-subtle mt-0.5">
                          {repo.language || 'Language not reported'} • {repo.default_branch || 'Default branch unavailable'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-content-subtle" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-content-subtle">
            <span>Compiler Engine</span>
            <span className="text-primary">AST + Bandit + RF</span>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
