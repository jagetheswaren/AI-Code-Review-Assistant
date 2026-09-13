import React, { useState, useEffect } from 'react';
import { getHistory, getStats } from '../api/client';
import { PageLoader, EmptyState, Card, Badge } from '../components/ui';
import { Shield, AlertTriangle } from 'lucide-react';

export default function Security() {
  const [filter, setFilter] = useState('all');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [historyRes, statsRes] = await Promise.allSettled([getHistory(1, 100), getStats()]);
        const scans = historyRes.status === 'fulfilled' ? (historyRes.value.data?.scans || []) : [];
        const allIssues = scans.flatMap(s => (s.file_analyses || []).flatMap(fa => (fa.issues || []).map(i => ({ ...i, _file: fa.file_path, _scanId: s.id || s._id, _timestamp: s.timestamp }))));
        const sec = allIssues.filter(i => i.type === 'security');
        setIssues(sec);
      } catch (e) {
        setError(e.response?.data?.error || e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  issues.forEach(i => { const s = (i.severity || 'info').toLowerCase(); if (counts[s] !== undefined) counts[s]++; });

  const filtered = filter === 'all' ? issues : issues.filter(i => (i.severity || '').toLowerCase() === filter);

  if (loading) return <PageLoader text="Loading security findings..." />;
  if (error) return <div className="p-6 text-red-400 text-sm">Failed to load security findings: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Vulnerabilities Inspector</h1>
          <p className="text-sm text-slate-400">Real Bandit + AST Security Findings from MongoDB</p>
        </div>
        <Badge variant="outline" className="border-white/10 text-slate-400">{issues.length} findings</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { k: 'critical', label: 'Critical', color: 'text-red-500' },
          { k: 'high', label: 'High', color: 'text-amber-500' },
          { k: 'medium', label: 'Medium', color: 'text-blue-500' },
          { k: 'low', label: 'Low', color: 'text-emerald-500' },
          { k: 'info', label: 'Info', color: 'text-slate-400' },
        ].map(c => (
          <Card key={c.k} className="bg-[#121826] border-slate-800 p-4">
            <div className="text-xs text-slate-400 uppercase font-semibold">{c.label}</div>
            <div className={`text-2xl font-extrabold mt-1 ${c.color}`}>{counts[c.k]}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {['all', 'critical', 'high', 'medium', 'low', 'info'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors ${filter === s ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Shield} title={issues.length === 0 ? "No security findings yet" : "No matching findings"} description={issues.length === 0 ? "Run a code analysis to populate security findings." : `No ${filter} severity findings.`} />
      ) : (
        <div className="bg-[#121826] border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/50 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Severity</th>
                  <th className="p-3">File & Line</th>
                  <th className="p-3">Rule</th>
                  <th className="p-3">Message</th>
                  <th className="p-3">Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-200">
                {filtered.map((iss, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${iss.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : iss.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : iss.severity === 'medium' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : iss.severity === 'low' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>{iss.severity}</span></td>
                    <td className="p-3 font-mono text-slate-300">{iss._file || iss.file_path || '-'}:{iss.line_number || iss.line || '-'}</td>
                    <td className="p-3 font-mono text-[11px]">{iss.rule_id || '-'}</td>
                    <td className="p-3 font-medium">{iss.message}</td>
                    <td className="p-3 text-emerald-400 font-mono text-[11px] bg-emerald-950/20">{iss.suggestion || iss.fix_suggestion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
