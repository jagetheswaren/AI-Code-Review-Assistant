import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Shield, Search, Zap, FileJson, FileSpreadsheet, FileText, Clock, Hash, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { getScanDetail, exportJSON, exportCSV, exportPDF } from '../api/client';
import { Button, Card, CardHeader, CardTitle, Badge, EmptyState, PageLoader } from '../components/ui';

export default function HistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadDetail() {
    setLoading(true);
    try {
      const res = await getScanDetail(id);
      const data = res.data || res;
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(type) {
    try {
      let res;
      let filename = `report-${String(id).slice(0,8)}`;
      if (type === 'json') {
        res = await exportJSON(id);
        filename += '.json';
      } else if (type === 'csv') {
        res = await exportCSV(id);
        filename += '.csv';
      } else {
        res = await exportPDF(id);
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
    } catch {}
  }

  function severityColor(sev) {
    if (sev === 'high' || sev === 'critical') return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (sev === 'medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }

  if (loading) return <PageLoader />;
  if (!detail) return <EmptyState icon={AlertTriangle} title="Report not found" description="This scan report could not be loaded." />;

  const summary = detail.summary || {};
  const totalIssues = summary.total_issues || 0;
  const securityCount = summary.by_type?.security || 0;
  const codeSmellCount = summary.by_type?.code_smell || 0;
  const performanceCount = summary.by_type?.performance || 0;

  // Group file_analyses into issues_by_file
  const issuesByFile = {};
  if (detail.file_analyses) {
    detail.file_analyses.forEach(fa => {
      issuesByFile[fa.file_path] = fa.issues;
    });
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Analysis Report
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-white/[0.06] text-slate-400 hover:text-white" onClick={() => handleExport('json')}>
            <FileJson className="w-4 h-4 mr-1.5" />
            JSON
          </Button>
          <Button variant="outline" size="sm" className="border-white/[0.06] text-slate-400 hover:text-white" onClick={() => handleExport('csv')}>
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            CSV
          </Button>
          <Button variant="outline" size="sm" className="border-white/[0.06] text-slate-400 hover:text-white" onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4 mr-1.5" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#111827] border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/[0.05]">
              <AlertTriangle className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Issues</p>
              <p className="text-2xl font-bold text-white">{totalIssues}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-[#111827] border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Security</p>
              <p className="text-2xl font-bold text-white">{securityCount}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-[#111827] border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Search className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Code Smells</p>
              <p className="text-2xl font-bold text-white">{codeSmellCount}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-[#111827] border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Performance</p>
              <p className="text-2xl font-bold text-white">{performanceCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        {Object.entries(issuesByFile).map(([filename, fileIssues]) => (
          <Card key={filename} className="bg-[#111827] border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white text-base">{filename}</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6 space-y-4">
              {fileIssues.map((issue, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn('border text-xs', severityColor(issue.severity))}>
                      {issue.severity}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Hash className="w-3 h-3" />
                      Line {issue.line_number}
                    </span>
                    <Badge variant="outline" className="border-white/[0.06] text-xs text-slate-400">
                      {issue.type || issue.category}
                    </Badge>
                    {issue.source && issue.source.length > 0 && (
                      <div className="flex gap-1 ml-auto">
                        {issue.source.map((src, i) => (
                          <Badge key={i} className="text-[10px] uppercase bg-white/5 text-slate-400 border-white/10">
                            {src}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-white">{issue.message}</p>
                  {issue.suggestion && (
                    <p className="text-sm text-slate-400">Suggestion: {issue.suggestion}</p>
                  )}
                  {issue.explanation && (
                    <p className="text-xs text-slate-500">{issue.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {detail.ai_review && (
        <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border-blue-500/20">
          <div className="p-6 flex gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10 h-fit">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-2">AI Review</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{detail.ai_review}</p>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
