import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { getHistory, exportJSON, exportCSV, exportPDF } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { Button, Badge, Skeleton } from '../components/ui';
import { SpotlightCard, StatusMark, CountUp } from '../components/reactbits/Bits';
import { cn } from '../lib/utils';
import { EmptyState, ErrorState } from '../components/workbench';

export default function Reports() {
  const { success, error: toastError } = useToast();
  const [scans, setScans] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getHistory(1, 50);
      const data = res.data || res;
      const list = data.scans || [];
      setScans(list);
      if (list.length > 0) {
        setSelectedScanId(list[0].id || list[0]._id);
      }
    } catch (err) {
      setLoadError(err.response?.data?.error || err.message || 'Available reports could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(scanId, type, filename) {
    if (!scanId) return;
    setDownloadingFormat(type);
    try {
      let res;
      let ext;
      if (type === 'json') {
        res = await exportJSON(scanId);
        ext = '.json';
      } else if (type === 'csv') {
        res = await exportCSV(scanId);
        ext = '.csv';
      } else {
        res = await exportPDF(scanId);
        ext = '.pdf';
      }

      const blob = res.data || res;
      const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(filename || 'intellireview_audit').replace(/[^a-zA-Z0-9-_]/g, '_')}${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      success(`Generated and downloaded ${type.toUpperCase()} report`);
    } catch (err) {
      toastError(`Failed to download ${type.toUpperCase()} report`);
    } finally {
      setDownloadingFormat(null);
    }
  }

  const selectedScan = scans.find((s) => (s.id || s._id) === selectedScanId);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-content">
              Export Center
            </h1>
            <Badge variant="cyan">Multi-Format Compliance</Badge>
          </div>
          <p className="text-xs font-mono text-content-muted mt-1">
            Export real audit certificates, raw security telemetry, and structured JSON results
          </p>
        </div>
        <StatusMark status="online" label="Export Routes Active" />
      </div>

      {/* Row 1: Three Main Report Format Cards */}
      {loadError && <ErrorState message={loadError} onRetry={loadReports} />}
      {!loading && !loadError && scans.length === 0 && <EmptyState icon={FileText} title="No reports available" description="Complete a code review first. Reports are generated from saved scan results." />}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* PDF Card */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger w-fit">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-base text-content">PDF Executive Audit</h3>
            <p className="text-xs font-mono text-content-muted leading-relaxed">
              Complete formatted security certificate with risk graphs, AST rules, and line-level recommendations.
            </p>
          </div>

          <div className="pt-6 border-t border-white/[0.06] mt-4">
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedScanId || downloadingFormat === 'pdf'}
              isLoading={downloadingFormat === 'pdf'}
              onClick={() => handleDownload(selectedScanId, 'pdf', selectedScan?.file_path)}
              className="w-full font-mono text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download PDF Report
            </Button>
          </div>
        </SpotlightCard>

        {/* CSV Card */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-success/10 border border-success/25 text-success w-fit">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-base text-content">CSV Raw Telemetry</h3>
            <p className="text-xs font-mono text-content-muted leading-relaxed">
              Tabular format suitable for importing into Jira, spreadsheet tools, or SIEM security pipelines.
            </p>
          </div>

          <div className="pt-6 border-t border-white/[0.06] mt-4">
            <Button
              variant="secondary"
              size="sm"
              disabled={!selectedScanId || downloadingFormat === 'csv'}
              isLoading={downloadingFormat === 'csv'}
              onClick={() => handleDownload(selectedScanId, 'csv', selectedScan?.file_path)}
              className="w-full font-mono text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download CSV Data
            </Button>
          </div>
        </SpotlightCard>

        {/* JSON Card */}
        <SpotlightCard className="p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/25 text-secondary w-fit">
              <FileJson className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-base text-content">Structured JSON</h3>
            <p className="text-xs font-mono text-content-muted leading-relaxed">
              Full API response schema containing parsed AST nodes, ML confidence scores, and raw findings.
            </p>
          </div>

          <div className="pt-6 border-t border-white/[0.06] mt-4">
            <Button
              variant="secondary"
              size="sm"
              disabled={!selectedScanId || downloadingFormat === 'json'}
              isLoading={downloadingFormat === 'json'}
              onClick={() => handleDownload(selectedScanId, 'json', selectedScan?.file_path)}
              className="w-full font-mono text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download JSON Payload
            </Button>
          </div>
        </SpotlightCard>
      </div>

      {/* Row 2: Scan Selector & Report Preview */}
      {scans.length > 0 && <SpotlightCard className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-content">Select Target Scan</h2>
            <p className="text-xs font-mono text-content-muted">Choose which analysis run to compile into export</p>
          </div>

          <div className="w-full sm:w-72">
            <select
              value={selectedScanId}
              onChange={(e) => setSelectedScanId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-[#070A0F] border border-white/[0.08] text-xs font-mono text-content focus:outline-none focus:border-primary/50"
            >
              {scans.map((s) => {
                const id = s.id || s._id;
                return (
                  <option key={id} value={id}>
                    {s.file_path || 'Direct Code'} • {s.total_issues || 0} issues
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Selected Scan Preview Card */}
        {selectedScan && (
          <div className="p-4 rounded-xl bg-[#070A0F] border border-white/[0.06] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-content font-bold text-sm">{selectedScan.file_path || 'Direct Code'}</span>
              <Badge variant={selectedScan.overall_risk === 'critical' ? 'critical' : 'warning'}>
                {(selectedScan.overall_risk || 'AUDITED').toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-content-subtle pt-2 border-t border-white/[0.04]">
              <div>
                <span>Total Findings:</span>
                <p className="text-content font-bold mt-0.5">{selectedScan.total_issues || 0}</p>
              </div>
              <div>
                <span>Timestamp:</span>
                <p className="text-content mt-0.5">
                  {selectedScan.timestamp ? new Date(selectedScan.timestamp).toLocaleDateString() : 'Recent'}
                </p>
              </div>
              <div>
                <span>Request ID:</span>
                <p className="text-content mt-0.5 truncate">{String(selectedScan.request_id || selectedScanId).slice(0, 12)}</p>
              </div>
              <div>
                <span>Security Engine:</span>
                <p className="text-primary mt-0.5">Bandit + AST</p>
              </div>
            </div>
          </div>
        )}
      </SpotlightCard>}
    </div>
  );
}
