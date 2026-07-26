import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GitPullRequest,
  ArrowLeft,
  GitBranch,
  ArrowRight,
  Plus,
  Minus,
  FileCode,
  Shield,
  Search,
  Zap,
  AlertTriangle,
  Loader2,
  Download,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { analyzePullRequest } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Badge,
  EmptyState,
  PageLoader,
  Skeleton,
} from '../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const severityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  info: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const riskColors = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

export default function PullRequest() {
  const { repoFullName, prNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [prInfo, setPrInfo] = useState(null);

  const owner = repoFullName?.split('/')[0] || '';
  const repoName = repoFullName?.split('/')[1] || '';

  async function handleAnalyze() {
    setLoading(true);
    try {
      const res = await analyzePullRequest(repoFullName, parseInt(prNumber, 10));
      setResults(res);
      if (res.pr_info) setPrInfo(res.pr_info);
    } catch (err) {
      toast({
        title: 'Analysis failed',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <PageLoader message={`Analyzing PR #${prNumber}...`} />;
  }

  const summary = results?.summary || {};
  const fileIssues = results?.file_issues || results?.issues_by_file || {};
  const riskLevel = results?.risk_level || results?.overall_risk || null;

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 lg:p-8">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/github/${repoFullName}`)}
            className="text-slate-400 hover:text-white hover:bg-white/[0.05]"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <GitPullRequest className="h-8 w-8 text-indigo-400" />
            PR #{prNumber}
          </h1>
          <p className="mt-2 text-slate-400">
            {owner}/{repoName}
          </p>
        </div>
      </motion.div>

      {prInfo && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <Card className="bg-[#111827] border-white/[0.06] mb-8">
            <div className="px-6 py-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3">
                  {prInfo.author && (
                    <div className="flex items-center gap-2">
                      {prInfo.author_avatar && (
                        <img
                          src={prInfo.author_avatar}
                          alt={prInfo.author}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="text-sm text-slate-300">{prInfo.author}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-1.5">
                      <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-sm text-white font-mono">
                        {prInfo.head_branch || prInfo.head || 'head'}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                    <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-1.5">
                      <GitBranch className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-sm text-white font-mono">
                        {prInfo.base_branch || prInfo.base || 'base'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  {prInfo.files_changed != null && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{prInfo.files_changed}</p>
                      <p className="text-xs text-slate-400">Files</p>
                    </div>
                  )}
                  {prInfo.additions != null && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-400 flex items-center gap-1 justify-center">
                        <Plus className="h-3.5 w-3.5" />
                        {prInfo.additions}
                      </p>
                      <p className="text-xs text-slate-400">Additions</p>
                    </div>
                  )}
                  {prInfo.deletions != null && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-400 flex items-center gap-1 justify-center">
                        <Minus className="h-3.5 w-3.5" />
                        {prInfo.deletions}
                      </p>
                      <p className="text-xs text-slate-400">Deletions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {!results && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
          <div className="flex flex-col items-center mb-8">
            <Button
              onClick={handleAnalyze}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-8 py-3 shadow-lg shadow-indigo-500/25"
            >
              <Search className="h-4 w-4 mr-2" />
              Analyze PR
            </Button>
          </div>
        </motion.div>
      )}

      {results && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="grid grid-cols-3 gap-4 flex-1 max-w-2xl">
              <Card className="bg-[#111827] border-white/[0.06]">
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
                    <FileCode className="h-4.5 w-4.5 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">
                      {summary.files_reviewed || summary.files || Object.keys(fileIssues).length}
                    </p>
                    <p className="text-xs text-slate-400">Files Reviewed</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-[#111827] border-white/[0.06]">
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">
                      {summary.total_issues || summary.issues_count || 0}
                    </p>
                    <p className="text-xs text-slate-400">Total Issues</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-[#111827] border-white/[0.06]">
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
                    <Shield className="h-4.5 w-4.5 text-indigo-400" />
                  </div>
                  <div>
                    <Badge
                      className={cn(
                        'text-xs font-medium border',
                        riskColors[riskLevel] || riskColors.low
                      )}
                    >
                      {riskLevel ? riskLevel.toUpperCase() : 'N/A'}
                    </Badge>
                    <p className="text-xs text-slate-400 mt-1">Overall Risk</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {Object.keys(fileIssues).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(fileIssues).map(([fileName, issues], fileIdx) => (
                <motion.div
                  key={fileName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: fileIdx * 0.05 }}
                >
                  <Card className="bg-[#111827] border-white/[0.06]">
                    <div className="px-5 py-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-mono font-semibold text-white">{fileName}</span>
                        <Badge className="bg-white/[0.06] text-slate-400 border-white/[0.08] text-xs ml-auto">
                          {issues.length} issue{issues.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <div className="divide-y divide-white/[0.06]">
                      {issues.map((issue, issueIdx) => (
                        <div key={issueIdx} className="px-5 py-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Badge
                                  className={cn(
                                    'text-[10px] font-medium border',
                                    severityColors[issue.severity] || severityColors.info
                                  )}
                                >
                                  {issue.severity?.toUpperCase()}
                                </Badge>
                                {issue.line && (
                                  <span className="text-xs text-slate-500 font-mono">
                                    Line {issue.line}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-white">{issue.message}</p>
                              {issue.suggestion && (
                                <p className="text-xs text-slate-400 mt-1.5">{issue.suggestion}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-[#111827] border-white/[0.06]">
              <div className="px-6 py-10 flex items-center justify-center">
                <div className="text-center">
                  <Shield className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-white font-medium">No issues found</p>
                  <p className="text-sm text-slate-400 mt-1">This pull request looks clean!</p>
                </div>
              </div>
            </Card>
          )}

          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleAnalyze}
              variant="outline"
              className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05]"
            >
              <Search className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
          </div>
        </motion.div>
      )}

      {!loading && !results && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <EmptyState
            icon={<GitPullRequest className="h-12 w-12 text-slate-500" />}
            title="Ready to analyze"
            description="Click the Analyze button to review this pull request with AI-powered code analysis."
          />
        </motion.div>
      )}
    </div>
  );
}
