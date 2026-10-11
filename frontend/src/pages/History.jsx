import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  History as HistoryIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  FileCode2,
  Clock,
  ArrowRight,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { getHistory } from '../api/client';
import { Button, Badge, Skeleton } from '../components/ui';
import { SpotlightCard, StatusMark, CountUp } from '../components/reactbits/Bits';
import { cn } from '../lib/utils';
import { ErrorState } from '../components/workbench';

export default function History() {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [page]);

  async function loadHistory() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getHistory(page, 15);
      const data = res.data || res;
      setScans(data.scans || []);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setLoadError(err.response?.data?.error || err.message || 'Scan history could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      (scan.file_path || '').toLowerCase().includes(search.toLowerCase()) ||
      (scan.request_id || '').toLowerCase().includes(search.toLowerCase());
    const matchesRisk =
      riskFilter === 'all' || (scan.overall_risk || '').toLowerCase() === riskFilter.toLowerCase();
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-content">
              Scan History
            </h1>
            <Badge variant="cyan">{scans.length} Scans</Badge>
          </div>
          <p className="text-xs font-mono text-content-muted mt-1">
            Historical audit logs, scan metrics, and regression records from MongoDB
          </p>
        </div>
        <StatusMark status="online" label="History DB Sync" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0D131C] border border-white/[0.08]">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-content-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by file or request ID..."
            className="w-full bg-[#070A0F] border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-content placeholder:text-content-subtle focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          {['all', 'critical', 'high', 'medium', 'low'].map((rf) => (
            <button
              key={rf}
              onClick={() => setRiskFilter(rf)}
              className={cn(
                "px-2.5 py-1 rounded-md uppercase text-[11px] transition-colors shrink-0",
                riskFilter === rf
                  ? "bg-primary/15 text-primary border border-primary/25 font-bold"
                  : "text-content-muted hover:text-content hover:bg-white/[0.04]"
              )}
            >
              {rf}
            </button>
          ))}
        </div>
      </div>

      {/* History Items List */}
      {loadError ? (
        <ErrorState message={loadError} onRetry={loadHistory} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filteredScans.length === 0 ? (
        <SpotlightCard className="p-12 text-center text-xs font-mono text-content-muted space-y-2">
          <HistoryIcon className="w-8 h-8 mx-auto opacity-40 text-content-subtle" />
          <p>No scan history recorded yet.</p>
        </SpotlightCard>
      ) : (
        <div className="space-y-3">
          {filteredScans.map((scan) => {
            const risk = (scan.overall_risk || 'low').toLowerCase();
            const totalIssues = scan.total_issues || 0;
            const scanId = scan.id || scan._id;

            return (
              <SpotlightCard
                key={scanId}
                data-testid="history-row"
                onClick={() => navigate(`/history/${scanId}`)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-primary/40 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-primary shrink-0">
                    <FileCode2 className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-mono text-sm font-semibold text-content truncate group-hover:text-primary transition-colors">
                        {scan.file_path || 'Direct Code Snippet'}
                      </h3>
                      <Badge
                        variant={
                          risk === 'critical'
                            ? 'critical'
                            : risk === 'high'
                            ? 'high'
                            : risk === 'medium'
                            ? 'medium'
                            : 'low'
                        }
                      >
                        {risk.toUpperCase()} RISK
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-content-subtle">
                      <span>{totalIssues} findings detected</span>
                      <span>•</span>
                      <span>{scan.timestamp ? new Date(scan.timestamp).toLocaleString() : 'Recent'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-xs font-mono text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Inspect Report <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D131C] border border-white/[0.08] text-xs font-mono text-content-muted">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="font-mono text-xs"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="font-mono text-xs"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
