import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { cn } from '../lib/utils';
import { getHistory, exportJSON, exportCSV, exportPDF } from '../api/client';
import { Button, Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dropdown, EmptyState, PageLoader } from '../components/ui';

export default function Reports() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await getHistory(1, 100);
      const data = res.data || res;
      setScans(data.scans || []);
    } catch {
      setScans([]);
    } finally {
      setLoading(false);
    }
  }

  function riskColor(risk) {
    if (risk === 'high') return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (risk === 'medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }

  async function handleDownload(scanId, type, filename) {
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
      a.download = `${(filename || 'report').replace(/[^a-zA-Z0-9-_]/g,'_')}${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {}
  }

  if (loading) return <PageLoader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/[0.05]">
          <FileText className="w-5 h-5 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
      </div>

      {!scans.length ? (
        <EmptyState icon={FileText} title="No reports" description="Reports from completed scans will appear here." />
      ) : (
        <Card className="bg-[#111827] border-white/[0.06]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06]">
                <TableHead>File</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Export</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.map((scan) => (
                <TableRow key={scan.id || scan._id} className="border-white/[0.06]">
                  <TableCell className="font-medium text-white">{scan.file_path || scan.filename || scan.summary?.file_path || 'Report'}</TableCell>
                  <TableCell className="text-slate-400">{scan.total_issues ?? scan.summary?.total_issues ?? 0}</TableCell>
                  <TableCell>
                    <Badge className={cn('border', riskColor(scan.overall_risk || scan.risk_level || scan.summary?.overall_risk || 'low'))}>
                      {scan.overall_risk || scan.risk_level || scan.summary?.overall_risk || 'low'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {scan.timestamp || scan.created_at ? new Date(scan.timestamp || scan.created_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          <Download className="w-4 h-4 mr-1.5" />
                          Download
                        </Button>
                      }
                      items={[
                        {
                          label: 'Download as JSON',
                          icon: FileJson,
                          onClick: () => handleDownload(scan.id, 'json', scan.filename),
                        },
                        {
                          label: 'Download as CSV',
                          icon: FileSpreadsheet,
                          onClick: () => handleDownload(scan.id, 'csv', scan.filename),
                        },
                        {
                          label: 'Download as PDF',
                          icon: FileText,
                          onClick: () => handleDownload(scan.id, 'pdf', scan.filename),
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </motion.div>
  );
}
