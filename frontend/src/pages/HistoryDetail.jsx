import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileCode2,
  Clock,
  Download,
  ShieldAlert,
  Sparkles,
  Zap,
  Cpu,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { getScanDetail, exportJSON, exportCSV, exportPDF } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { Button, Badge, Skeleton } from '../components/ui';
import { SpotlightCard, CountUp, StatusMark } from '../components/reactbits/Bits';
import { cn } from '../lib/utils';

export default function HistoryDetail() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (scanId) {
      loadScan();
    }
  }, [scanId]);

  async function loadScan() {
    setLoading(true);
    try {
      const res = await getScanDetail(scanId);
      setScan(res.data || res);
    } catch {
      toastError('Failed to load scan report');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format) {
    setDownloading(true);
    try {
      let res;
      let filename = `intellireview-${String(scanId).slice(0, 8)}`;
      if (format === 'json') {
        res = await exportJSON(scanId);
        filename += '.json';
      } else if (format === 'csv') {
        res = await exportCSV(scanId);
        filename += '.csv';
      } else {
        res = await exportPDF(scanId);
        filename += '.pdf';
      }

      const blob = res.data || res;
      const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      success(`Exported ${format.toUpperCase()} report`);
    } catch {
      toastError(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="p-12 text-center text-xs font-mono text-content-muted space-y-4">
        <p>Report not found or access denied.</p>
        <Link to="/history">
          <Button variant="secondary" size="sm" className="font-mono text-xs">
            Back to History
          </Button>
        </Link>
      </div>
    );
  }

  const summary = scan.summary || {};
  const issues = (scan.file_analyses || []).flatMap((fa) => fa.issues || []);
  const overallRisk = (summary.overall_risk || 'low').toLowerCase();

  return (
    <div className="space-y-6 select-none">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-content-subtle">
        <Link to="/history" className="flex items-center gap-1 hover:text-content text-primary">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to History
        </Link>
        <span>/</span>
        <span>Scan {String(scanId).slice(0, 8)}</span>
      </div>

      {/* Report Summary Card */}
      <SpotlightCard className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display text-xl font-bold text-content tracking-tight">
                {summary.file_path || 'Code Review Report'}
              </h1>
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
                {overallRisk.toUpperCase()} RISK
              </Badge>
              <span className="text-xs font-mono text-content-subtle">
                ID: {String(scanId).slice(0, 10)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-content-subtle">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {scan.timestamp ? new Date(scan.timestamp).toLocaleString() : 'Recent'}
              </span>
              <span>•</span>
              <span>Total Issues: <strong className="text-content">{issues.length}</strong></span>
              {scan.processing_time_ms && (
                <>
                  <span>•</span>
                  <span>Execution: <strong className="text-primary">{scan.processing_time_ms}ms</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              disabled={downloading}
              onClick={() => handleExport('pdf')}
              className="font-mono text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={downloading}
              onClick={() => handleExport('csv')}
              className="font-mono text-xs"
            >
              CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={downloading}
              onClick={() => handleExport('json')}
              className="font-mono text-xs"
            >
              JSON
            </Button>
          </div>
        </div>
      </SpotlightCard>

      {/* AI Review Summary Block */}
      {scan.ai_review && (
        <SpotlightCard className="p-6 space-y-2.5 border-primary/20 bg-primary/[0.02]">
          <div className="flex items-center gap-2 text-primary text-xs font-mono font-semibold">
            <Cpu className="w-4 h-4" />
            <span>AI Reasoning & Executive Synthesis</span>
          </div>
          <p className="text-xs font-mono text-content-muted leading-relaxed whitespace-pre-wrap">
            {scan.ai_review}
          </p>
        </SpotlightCard>
      )}

      {/* Findings Table */}
      <SpotlightCard className="p-6">
        <h2 className="font-display text-base font-semibold text-content mb-4">
          All Detected Findings ({issues.length})
        </h2>

        {issues.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-content-muted">
            Zero findings recorded for this scan.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {issues.map((iss, idx) => {
              const sev = (iss.severity || 'low').toLowerCase();
              return (
                <div key={idx} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          sev === 'critical' ? 'critical' : sev === 'high' ? 'high' : 'medium'
                        }
                      >
                        {sev.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-mono font-bold text-content">
                        Line {iss.line_number || 'N/A'}
                      </span>
                      <span className="text-xs font-mono text-content-subtle">
                        [{iss.rule_id || 'RULE'}]
                      </span>
                    </div>
                    {iss.source && (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.04] text-content-subtle">
                        Source: {iss.source}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-medium text-content leading-relaxed">
                    {iss.message}
                  </p>

                  {iss.explanation && (
                    <p className="text-xs font-mono text-content-muted leading-relaxed">
                      {iss.explanation}
                    </p>
                  )}

                  {iss.suggested_fix && (
                    <div className="p-3 rounded-lg bg-[#070A0F] border border-white/[0.06] font-mono text-xs text-success/90">
                      <code>{iss.suggested_fix}</code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
