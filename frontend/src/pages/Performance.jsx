import React, { useState, useEffect } from 'react';
import { getHistory } from '../api/client';
import { PageLoader, EmptyState, Card, Badge } from '../components/ui';
import { Zap } from 'lucide-react';

export default function Performance() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const hRes = await getHistory(1, 100);
        const scans = hRes.data?.scans || [];
        const all = scans.flatMap(s => (s.file_analyses || []).flatMap(fa => (fa.issues || []).map(i => ({ ...i, _file: fa.file_path }))));
        setIssues(all.filter(i => i.type === 'performance'));
      } catch (e) {
        setError(e.response?.data?.error || e.message);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const nested = issues.filter(i => (i.rule_id || '').includes('NESTED_LOOP') || (i.message || '').toLowerCase().includes('nested loop')).length;
  const other = issues.length - nested;

  if (loading) return <PageLoader text="Loading performance findings..." />;
  if (error) return <div className="p-6 text-red-400 text-sm">Failed to load: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Performance Bottleneck Inspector</h1>
        <p className="text-sm text-slate-400">Real Performance Findings from MongoDB (nested loops, allocation, complexity)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#121826] border-slate-800 p-4">
          <div className="text-xs text-slate-400 uppercase font-semibold">Performance Issues</div>
          <div className="text-2xl font-extrabold text-purple-400 mt-1">{issues.length}</div>
        </Card>
        <Card className="bg-[#121826] border-slate-800 p-4">
          <div className="text-xs text-slate-400 uppercase font-semibold">Nested Loop Alerts</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{nested}</div>
        </Card>
        <Card className="bg-[#121826] border-slate-800 p-4">
          <div className="text-xs text-slate-400 uppercase font-semibold">Other Perf Findings</div>
          <div className="text-2xl font-extrabold text-blue-400 mt-1">{other}</div>
        </Card>
      </div>

      {issues.length === 0 ? (
        <EmptyState icon={Zap} title="No performance findings yet" description="Run a code analysis to populate performance findings. Clean code will show empty here." />
      ) : (
        <div className="bg-[#121826] p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-white">Algorithmic Optimization Recommendations ({issues.length})</h2>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {issues.slice(0, 50).map((iss, idx) => (
              <div key={idx} className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="font-semibold text-amber-400">[{iss.rule_id || iss.type}] {iss.severity?.toUpperCase()}</span>
                  <span className="font-mono text-slate-400 shrink-0">{iss._file || iss.file_path || '-'}:{iss.line_number || '-'}</span>
                </div>
                <p className="text-slate-300">{iss.message}</p>
                {(iss.suggestion || iss.fix_suggestion) && <p className="text-emerald-400 font-mono">Fix: {iss.suggestion || iss.fix_suggestion}</p>}
                <div className="flex gap-1">
                  <Badge className="text-[10px] border bg-purple-500/10 text-purple-400 border-purple-500/20">{iss.type}</Badge>
                  <Badge className="text-[10px] border bg-white/5 text-slate-400 border-white/10">{iss.severity}</Badge>
                </div>
              </div>
            ))}
            {issues.length > 50 && <div className="text-xs text-slate-500 text-center">Showing 50 of {issues.length}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
