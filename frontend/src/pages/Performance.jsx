import React, { useState, useEffect } from 'react';
import { getDashboard, getHistory, getScanDetail } from '../api/client';
import { Zap, Activity, Clock, CheckCircle2, Copy, FileCode2 } from 'lucide-react';
import { Button, Badge } from '../components/ui';
import { SpotlightCard, CountUp, StatusMark } from '../components/reactbits/Bits';
import { useToast } from '../contexts/ToastContext';
import { EmptyState, ErrorState, LoadingState } from '../components/workbench';

export default function Performance() {
  const { success } = useToast();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scansFound, setScansFound] = useState(false);

  useEffect(() => {
    async function loadPerformanceData() {
      setLoading(true);
      setError(null);
      try {
        const [dashRes, histRes] = await Promise.allSettled([
          getDashboard(),
          getHistory(1, 5),
        ]);

        let allIssues = [];
        const dashboardData = dashRes.status === 'fulfilled' ? dashRes.value.data : {};
        if (dashRes.status === 'rejected' && histRes.status === 'rejected') throw dashRes.reason;
        const recentScans = dashboardData.recent_scans || [];
        let hasScans = recentScans.length > 0;

        if (recentScans.length > 0) {
          recentScans.forEach((scan) => {
            (scan.file_analyses || []).forEach((fa) => {
              (fa.issues || []).forEach((iss) => {
                const type = (iss.issue_type || iss.category || '').toLowerCase();
                if (type.includes('performance') || iss.rule_id?.includes('LOOP') || iss.rule_id?.includes('COMPLEXITY')) {
                  allIssues.push({
                    ...iss,
                    _file: fa.file_path || 'File unavailable',
                    _scanId: scan.id || scan._id,
                    _timestamp: scan.timestamp,
                  });
                }
              });
            });
          });
        }

        if (allIssues.length === 0 && histRes.status === 'fulfilled') {
          const historyScans = histRes.value.data?.scans || [];
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
                    if (type.includes('performance') || iss.rule_id?.includes('LOOP') || iss.rule_id?.includes('COMPLEXITY')) {
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

    loadPerformanceData();
  }, []);

  const totalPerf = issues.length;
  const nestedLoops = issues.filter(
    (i) => (i.rule_id || '').includes('LOOP') || (i.message || '').toLowerCase().includes('nested loop')
  ).length;
  const heavyOps = totalPerf - nestedLoops;

  if (loading) return <LoadingState label="Loading performance findings" />;
  if (error) return <ErrorState message={error} />;
  if (!scansFound) return <EmptyState icon={Zap} title="No performance scan data yet" description="Run a code review to populate this view with findings from your own scans." />;

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-content">
              Performance Bottlenecks
            </h1>
            <Badge variant="cyan">Algorithmic Diagnostics</Badge>
          </div>
          <p className="text-xs font-mono text-content-muted mt-1">
            Execution complexity analysis, nested loops, quadratic operations, and resource hog detection
          </p>
        </div>
        <StatusMark status="online" label="Profiler Ready" />
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SpotlightCard className="p-5 flex flex-col justify-between">
          <span className="text-xs font-mono text-content-muted uppercase">Performance Findings</span>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-content"><CountUp end={totalPerf} /></div>
            <Badge variant={totalPerf === 0 ? 'success' : 'high'}>{totalPerf === 0 ? 'NONE FOUND' : 'REVIEW'}</Badge>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5 flex flex-col justify-between">
          <span className="text-xs font-mono text-content-muted uppercase">Nested Loop Spikes</span>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-warning">
              <CountUp end={nestedLoops} />
            </div>
            <span className="text-xs font-mono text-content-subtle">O(n²) Hazards</span>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5 flex flex-col justify-between">
          <span className="text-xs font-mono text-content-muted uppercase">Heavy Operations</span>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-content">
              <CountUp end={heavyOps} />
            </div>
            <span className="text-xs font-mono text-content-subtle">Repeated Computations</span>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5 flex flex-col justify-between">
          <span className="text-xs font-mono text-content-muted uppercase">Total Optimization Targets</span>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="font-display text-3xl font-bold text-primary">
              <CountUp end={totalPerf} />
            </div>
            <span className="text-xs font-mono text-content-subtle">Detected Flaws</span>
          </div>
        </SpotlightCard>
      </div>

      {/* Row 2: Optimization Recommendations Table */}
      <SpotlightCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-content">Algorithmic Optimization Records</h2>
            <p className="text-xs font-mono text-content-muted">Inefficient computational patterns and memory hotspots</p>
          </div>
          <Badge variant="cyan">{totalPerf} Findings</Badge>
        </div>

        {issues.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-content-muted space-y-2">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto opacity-75" />
            <p>No performance findings were returned for the available scans.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto">
            {issues.map((iss, idx) => (
              <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-warning">
                      [{iss.rule_id || 'PERF'}]
                    </span>
                    <span className="text-[11px] font-mono text-content-subtle">
                      {iss._file || 'File unavailable'}:{iss.line_number ?? 'N/A'}
                    </span>
                    <Badge variant="high">{iss.severity || 'High'}</Badge>
                  </div>
                  <p className="text-xs font-medium text-content">{iss.message}</p>
                  {iss.suggestion && (
                    <p className="text-[11px] font-mono text-primary/90">
                      Recommendation: {iss.suggestion}
                    </p>
                  )}
                </div>

                {iss.suggested_fix && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(iss.suggested_fix);
                      success('Copied performance optimization snippet');
                    }}
                    className="p-1.5 rounded hover:bg-white/[0.06] text-content-subtle hover:text-content self-start sm:self-center"
                    title="Copy Fix"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
