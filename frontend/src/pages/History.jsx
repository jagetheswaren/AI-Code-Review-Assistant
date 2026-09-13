import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { getHistory } from '../api/client';
import { Button, Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState, PageLoader } from '../components/ui';

export default function History() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await getHistory(page);
      const data = res.data || res;
      setScans(data.scans || []);
      setTotalPages(data.total_pages || data.totalPages || 1);
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

  if (loading) return <PageLoader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/[0.05]">
          <Clock className="w-5 h-5 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Scan History</h1>
      </div>

      {!scans.length ? (
        <EmptyState icon={Clock} title="No scan history" description="Your completed scans will appear here." />
      ) : (
        <Card className="bg-[#111827] border-white/[0.06]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06]">
                <TableHead>File</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.map((scan) => (
                <TableRow key={scan.id} className="border-white/[0.06]">
                  <TableCell className="font-medium text-white">{scan.file_path}</TableCell>
                  <TableCell className="text-slate-400">{scan.total_issues}</TableCell>
                  <TableCell>
                    <Badge className={cn('border', riskColor(scan.overall_risk))}>
                      {scan.overall_risk}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {new Date(scan.timestamp).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                      onClick={() => window.location.href = `/history/${scan.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="border-white/[0.06] text-slate-400 hover:text-white"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-white/[0.06] text-slate-400 hover:text-white"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
