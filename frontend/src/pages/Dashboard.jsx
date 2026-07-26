import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, getTrends } from '../api/client';
import { cn } from '../lib/utils';
import { Doughnut, Bar, Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Filler, RadialLinearScale
} from 'chart.js';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, Shield, Eye,
  Clock, Plus, ArrowRight, Zap, Search,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, PageLoader, EmptyState } from '../components/ui';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, RadialLinearScale);

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, trendRes] = await Promise.all([getDashboard(), getTrends(30)]);
        setDashboard({ ...dashRes.data, trends: trendRes.data?.trends || [] });
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <PageLoader text="Loading dashboard..." />;

  const stats = dashboard?.statistics || {};
  const recentScans = dashboard?.recent_activity || [];
  const trends = dashboard?.trends || [];

  const statCards = [
    { label: 'Total Scans', value: stats.total_scans || 0, icon: Eye, color: 'text-[#60A5FA]', bg: 'bg-[#2563EB]/10', change: '+12%' },
    { label: 'Security Issues', value: stats.total_security || 0, icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10', change: '-5%' },
    { label: 'Code Smells', value: stats.total_code_smells || 0, icon: Search, color: 'text-amber-400', bg: 'bg-amber-500/10', change: '+3%' },
    { label: 'Performance', value: stats.total_performance || 0, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10', change: '-8%' },
    { label: 'Total Issues', value: stats.total_issues || 0, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', change: '+7%' },
    { label: 'Health Score', value: stats.health_score || 85, suffix: '%', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', change: '+2%', isScore: true },
  ];

  const severityData = {
    labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
    datasets: [{
      data: [stats.critical || 3, stats.high || 8, stats.medium || 15, stats.low || 22, stats.info || 10],
      backgroundColor: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'],
      borderWidth: 0,
      spacing: 2,
    }],
  };

  const trendData = {
    labels: trends.length > 0 ? trends.map((t) => t.date?.slice(5) || '') : ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Issues Found',
      data: trends.length > 0 ? trends.map((t) => t.count || 0) : [12, 19, 8, 15],
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37,99,235,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#2563EB',
    }],
  };

  const categoryData = {
    labels: ['Security', 'Code Smells', 'Performance', 'Best Practice'],
    datasets: [{
      label: 'Issues by Category',
      data: [stats.total_security || 10, stats.total_code_smells || 25, stats.total_performance || 8, stats.total_best_practice || 12],
      backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(245,158,11,0.7)', 'rgba(168,85,247,0.7)', 'rgba(34,197,94,0.7)'],
      borderRadius: 6,
    }],
  };

  const radarData = {
    labels: ['Security', 'Performance', 'Maintainability', 'Readability', 'Test Coverage'],
    datasets: [{
      label: 'Score',
      data: [85, 72, 90, 78, 65],
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37,99,235,0.15)',
      pointBackgroundColor: '#2563EB',
    }],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Overview of your code review activity</p>
        </div>
        <Link to="/review">
          <Button>
            <Plus className="w-4 h-4" />
            New Analysis
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={i} initial="hidden" animate="visible" variants={fadeUp} custom={i}>
            <Card hover className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.bg)}>
                  <card.icon className={cn('w-5 h-5', card.color)} />
                </div>
                <span className={cn('text-xs font-medium', card.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400')}>
                  {card.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{card.isScore ? `${card.value}` : card.value}{card.suffix || ''}</p>
              <p className="text-xs text-slate-400 mt-1">{card.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Issues Trend</CardTitle>
              <Badge variant="primary">30 days</Badge>
            </CardHeader>
            <div className="h-64"><Line data={trendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748B', font: { size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748B', font: { size: 11 } } } } }} /></div>
          </Card>
        </motion.div>
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">By Category</CardTitle>
            </CardHeader>
            <div className="h-64"><Bar data={categoryData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#64748B', font: { size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748B', font: { size: 11 } } } } }} /></div>
          </Card>
        </motion.div>
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={8}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Severity Distribution</CardTitle>
            </CardHeader>
            <div className="h-64 flex items-center justify-center"><div className="w-48 h-48"><Doughnut data={severityData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#94A3B8', padding: 12, font: { size: 11 }, usePointStyle: true, pointStyleWidth: 8 } } } }} /></div></div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={9} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Link to="/history" className="text-xs text-[#2563EB] hover:text-[#60A5FA] flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            {recentScans.length === 0 ? (
              <EmptyState icon={Clock} title="No recent activity" description="Your recent code analyses will appear here." action={<Link to="/review"><Button size="sm">Run Analysis</Button></Link>} />
            ) : (
              <div className="space-y-2">
                {recentScans.slice(0, 5).map((scan, i) => (
                  <Link key={i} to={`/history/${scan.id}`} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: scan.risk_level === 'critical' ? '#EF4444' : scan.risk_level === 'high' ? '#F97316' : scan.risk_level === 'medium' ? '#EAB308' : '#22C55E' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{scan.filename || 'Code Review'}</p>
                        <p className="text-xs text-slate-500">{scan.created_at ? new Date(scan.created_at).toLocaleString() : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={scan.risk_level === 'critical' ? 'danger' : scan.risk_level === 'high' ? 'warning' : 'success'}>{scan.risk_level || 'low'}</Badge>
                      <span className="text-xs text-slate-400">{scan.total_issues || 0} issues</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={10}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Code Health</CardTitle>
            </CardHeader>
            <div className="h-56"><Radar data={radarData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, angleLines: { color: 'rgba(255,255,255,0.05)' }, pointLabels: { color: '#94A3B8', font: { size: 11 } }, ticks: { display: false } } } }} /></div>
            <div className="mt-4 space-y-2">
              {[{ label: 'Security', score: 85, color: 'bg-emerald-400' }, { label: 'Performance', score: 72, color: 'bg-amber-400' }, { label: 'Maintainability', score: 90, color: 'bg-[#2563EB]' }].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-slate-300 font-medium">{item.score}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', item.color)} style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
