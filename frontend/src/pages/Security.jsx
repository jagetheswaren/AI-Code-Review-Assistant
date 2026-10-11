import React, { useState, useEffect } from 'react';
import { getDashboard, getHistory, getScanDetail } from '../api/client';
import { ShieldAlert, AlertTriangle, Lock, FileCode2, Terminal, CheckCircle2, ChevronRight, Copy } from 'lucide-react';
import { Button, Badge } from '../components/ui';
import { SpotlightCard, CountUp, StatusMark } from '../components/reactbits/Bits';
import { useToast } from '../contexts/ToastContext';
import { EmptyState, ErrorState, LoadingState } from '../components/workbench';

export default function Security() {
  const { success } = useToast();
  const [filter, setFilter] = useState('all');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scansFound, setScansFound] = useState(false);

  useEffect(() => {
    async function loadSecurityData() {
      setLoading(true);
      setError(null);
      try {
        const dashRes = await getDashboard();
        const recentScans = dashRes.data?.recent_scans || [];
        let hasScans = recentScans.length > 0;

        let allIssues = [];

        // If recent_scans has full file_analyses
        if (recentScans.length > 0) {
          recentScans.forEach((scan) => {
            const files = scan.file_analyses || [];
            files.forEach((fa) => {
              (fa.issues || []).forEach((iss) => {
                const type = (iss.issue_type || iss.category || '').toLowerCase();
                if (type.includes('security') || iss.rule_id?.startsWith('B') || iss.severity === 'critical') {
                  allIssues.push({
                    ...iss,
                    _file: fa.file_path || scan.summary?.file_path || 'File unavailable',
                    _scanId: scan.id || scan._id,
                    _timestamp: scan.timestamp,
                  });
                }
              });
            });
          });
        }

        // If no issues extracted from recent scans, fetch the top scan details
        if (allIssues.length === 0) {
          const histRes = await getHistory(1, 5);
          const historyScans = histRes.data?.scans || [];
          hasScans = hasScans || historyScans.length > 0;
          if (historyScans.length > 0) {
            const details = await Promise.allSettled(
              historyScans.slice(0, 3).map((s) => getScanDetail(s.id))
            );
            details.forEach((res) => {
              if (res.status === 'fulfilled' && res.value.data) {
                const sData = res.value.data;
                (sData.file_analyses || []).forEach((fa) => {
                  (fa.issues || []).forEach((iss) => {
                    const type = (iss.issue_type || iss.category || '').toLowerCase();
                    if (type.includes('security') || iss.rule_id?.startsWith('B') || iss.severity === 'critical') {
                      allIssues.push({
                        ...iss,
                        _file: fa.file_path || 'File unavailable',
                        _scanId: sData.id,
                        _timestamp: sData.timestamp,
                      });
                    }
                  });
                });
              }
            });
          }
        }

        setIssues(allIssues);
        setScansFound(hasScans);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSecurityData();
  }, []);

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  issues.forEach((i) => {
    const s = (i.severity || 'low').toLowerCase();
    if (counts[s] !== undefined) counts[s]++;
  });

  if (loading) return <LoadingState label="Loading security findings" />;
  if (error) return <ErrorState message={error} />;
  if (!scansFound) return <EmptyState icon={ShieldAlert} title="No security scan data yet" description="Run a code review to populate this view with findings from your own scans." />;

  const filtered = filter === 'all'
    ? issues
    : issues.filter((i) => (i.severity || '').toLowerCase() === filter);

  // Group by affected file
  const affectedFiles = {};
  issues.forEach((i) => {
    const file = i._file || 'File unavailable';
    affectedFiles[file] = (affectedFiles[file] || 0) + 1;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-content">
              Security Vulnerability Matrix
            </h1>
            <Badge variant="critical">Bandit + AST Engine</Badge>
          </div>
          <p className="text-xs font-mono text-content-muted mt-1">
            Deterministic static flaw detection, CWE classification, and exploit prevention
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusMark status="online" label="Audit Rules Loaded" />
        </div>
      </div>

      {/* Row 1: Security Posture Index & Severity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Finding Count Card */}
        <SpotlightCard className="p-5 flex flex-col justify-between">
          <span className="text-xs font-mono text-content-muted uppercase">Security Findings</span>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-content"><CountUp end={issues.length} /></div>
            <Badge variant={issues.length === 0 ? 'success' : 'critical'}>{issues.length === 0 ? 'NONE FOUND' : 'REVIEW'}</Badge>
          </div>
        </SpotlightCard>

        {/* Critical Card */}
        <SpotlightCard className="p-5 flex flex-col justify-between">
          <span className="text-xs font-mono text-content-muted uppercase">Critical Flaws</span>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-danger">
              <CountUp end={counts.critical} />
            </div>
            <span className="text-[10px] font-mono text-danger uppercase font-semibold">Immediate Action</span>
          </div>
        </SpotlightCard>

        {/* High Card */}
        <SpotlightCard className="p-5 flex flex-col justify-between">
          <span className="text-xs font-mono text-content-muted uppercase">High Severity</span>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-[#FF944D]">
              <CountUp end={counts.high} />
            </div>
            <span className="text-[10px] font-mono text-[#FF944D] uppercase font-semibold">Elevated Risk</span>
          </div>
        </SpotlightCard>

        {/* Medium Card */}
        <SpotlightCard className="p-5 flex flex-col justify-between">
          <span className="text-xs font-mono text-content-muted uppercase">Medium Severity</span>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-warning">
              <CountUp end={counts.medium} />
            </div>
            <span className="text-[10px] font-mono text-content-subtle">Audit Pending</span>
          </div>
        </SpotlightCard>

        {/* Low Card */}
        <SpotlightCard className="p-5 flex flex-col justify-between">
          <span className="text-xs font-mono text-content-muted uppercase">Low / Info</span>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-primary">
              <CountUp end={counts.low} />
            </div>
            <span className="text-[10px] font-mono text-content-subtle">Hardening</span>
          </div>
        </SpotlightCard>
      </div>

      {/* Row 2: Top Vulnerability Classes & Affected Files */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SpotlightCard className="p-6 lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-content mb-1">Top Vulnerability Classes</h2>
          <p className="text-xs font-mono text-content-muted mb-4">Audited security violation patterns</p>

          <div className="space-y-3 font-mono text-xs">
            {Object.entries(issues.reduce((groups, issue) => {
              const label = issue.issue_type || issue.category || issue.rule_id || 'Other security finding';
              groups[label] = (groups[label] || 0) + 1;
              return groups;
            }, {})).sort((a, b) => b[1] - a[1]).map(([name, count], idx, groups) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-content-muted text-[11px]">
                  <span>{name}</span>
                  <span className="font-semibold text-content">{count} occurrences</span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-danger to-warning rounded-full transition-all"
                    style={{ width: `${Math.max(5, (count / Math.max(1, groups[0][1])) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {issues.length === 0 && <p className="py-5 text-sm text-content-muted">No security findings were returned for the available scans.</p>}
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-content mb-1">Affected Files</h2>
            <p className="text-xs font-mono text-content-muted mb-4">Files with highest concentration</p>

            <div className="space-y-2 font-mono text-xs">
              {Object.keys(affectedFiles).length === 0 ? (
                <p className="text-xs text-content-subtle py-6 text-center">No vulnerabilities detected</p>
              ) : (
                Object.entries(affectedFiles).slice(0, 5).map(([file, count], idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
                    <div className="flex items-center gap-2 truncate">
                      <FileCode2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-content truncate">{file}</span>
                    </div>
                    <Badge variant="critical">{count}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-content-subtle">
            Bandit Engine v1.7.9 Integrated
          </div>
        </SpotlightCard>
      </div>

      {/* Row 3: Security Findings Table */}
      <SpotlightCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-content">Active Security Findings</h2>
            <p className="text-xs font-mono text-content-muted">Direct AST and Bandit vulnerability records</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {['all', 'critical', 'high', 'medium', 'low'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-2.5 py-1 rounded-md uppercase text-[11px] font-medium transition-colors ${
                  filter === s
                    ? 'bg-primary/15 text-primary border border-primary/30 font-bold'
                    : 'text-content-muted hover:text-content hover:bg-white/[0.04]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-content-muted space-y-2">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto opacity-75" />
            <p>Zero matching security issues found for "{filter}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] text-content-subtle uppercase text-[10px]">
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Target File & Line</th>
                  <th className="py-3 px-3">Rule ID</th>
                  <th className="py-3 px-3">Vulnerability Message</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((iss, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          iss.severity === 'critical'
                            ? 'critical'
                            : iss.severity === 'high'
                            ? 'high'
                            : iss.severity === 'medium'
                            ? 'medium'
                            : 'low'
                        }
                      >
                        {iss.severity?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-medium text-content">
                      {iss._file || 'File unavailable'}:{iss.line_number ?? iss.line ?? 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-content-subtle text-[11px]">
                      {iss.rule_id || 'SEC-AST'}
                    </td>
                    <td className="py-3 px-3 text-content-muted max-w-md">
                      <p className="line-clamp-1">{iss.message}</p>
                      {iss.suggestion && (
                        <p className="text-[11px] text-primary/80 mt-0.5 line-clamp-1">
                          Fix: {iss.suggestion}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {iss.suggested_fix && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(iss.suggested_fix);
                            success('Copied fix snippet');
                          }}
                          className="p-1.5 rounded hover:bg-white/[0.06] text-content-subtle hover:text-content"
                          title="Copy Fix"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
