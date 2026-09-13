import React, { useState, useEffect } from 'react';
import { getHistory, getDashboard } from '../api/client';
import { PageLoader, EmptyState, Card, Badge } from '../components/ui';
import { Search } from 'lucide-react';

export default function Quality() {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [hRes, dRes] = await Promise.allSettled([getHistory(1, 100), getDashboard()]);
        const scans = hRes.status === 'fulfilled' ? (hRes.value.data?.scans || []) : [];
        const all = scans.flatMap(s => (s.file_analyses || []).flatMap(fa => (fa.issues || []).map(i => ({ ...i, _file: fa.file_path }))));
        setIssues(all.filter(i => i.type === 'code_smell' || i.type === 'best_practice'));
        if (dRes.status === 'fulfilled') setStats(dRes.value.data?.statistics || null);
      } catch (e) {
        setError(e.response?.data?.error || e.message);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const byRule = {};
  issues.forEach(i => { const r = i.rule_id || 'UNKNOWN'; byRule[r] = (byRule[r] || 0) + 1; });
  const total = issues.length;

  if (loading) return <PageLoader text="Loading quality findings..." />;
  if (error) return <div className="p-6 text-red-400 text-sm">Failed to load: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Code Quality & Maintainability Inspector</h1>
        <p className="text-sm text-slate-400">Real Astroid & Radon Findings from MongoDB</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#121826] border-slate-800 p-4">
          <div className="text-xs text-slate-400 uppercase font-semibold">Code Smells</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{total}</div>
          <div className="text-xs text-slate-500 mt-1">from {stats?.total_scans ?? 0} scans</div>
        </Card>
        <Card className="bg-[#121826] border-slate-800 p-4">
          <div className="text-xs text-slate-400 uppercase font-semibold">Avg Issues / Scan</div>
          <div className="text-2xl font-extrabold text-blue-400 mt-1">{stats?.avg_issues ?? stats?.avg_issues_per_scan ?? '-'}</div>
        </Card>
        <Card className="bg-[#121826] border-slate-800 p-4">
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Scans</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{stats?.total_scans ?? 0}</div>
        </Card>
        <Card className="bg-[#121826] border-slate-800 p-4">
          <div className="text-xs text-slate-400 uppercase font-semibold">Unique Rules</div>
          <div className="text-2xl font-extrabold text-purple-400 mt-1">{Object.keys(byRule).length}</div>
        </Card>
      </div>

      {issues.length === 0 ? (
        <EmptyState icon={Search} title="No quality findings yet" description="Run a code analysis to populate code-smell findings." />
      ) : (
        <div className="bg-[#121826] p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-white">Code Smells & Refactoring Candidates ({issues.length})</h2>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {issues.slice(0, 50).map((iss, idx) => (
              <div key={idx} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 flex justify-between items-center gap-4 text-xs">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-200">[{iss.rule_id || iss.type}]</span>
                  <span className="text-slate-400 ml-2 font-mono truncate">{iss._file || iss.file_path || '-'}:{iss.line_number || '-'}</span>
                  <div className="text-slate-300 mt-1 truncate">{iss.message}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="border text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">{iss.severity}</Badge>
                </div>
              </div>
            ))}
            {issues.length > 50 && <div className="text-xs text-slate-500 text-center">Showing 50 of {issues.length} — see History for full list</div>}
          </div>
        </div>
      )}
    </div>
  );
}
