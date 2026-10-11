import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  GitPullRequest,
  ArrowLeft,
  GitBranch,
  FileCode2,
  Plus,
  Minus,
  Play,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import {
  analyzePullRequest,
  getPRDetails,
  getPRFiles,
  postPRComment,
} from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { Button, Badge, Skeleton } from '../components/ui';
import {
  SpotlightCard,
  StatusMark,
  Stepper,
  CountUp,
  LatticeLoader,
} from '../components/reactbits/Bits';
import { cn } from '../lib/utils';
import { EmptyState, ErrorState, LoadingState } from '../components/workbench';

export default function PullRequest() {
  const { owner, repo: repoName, prNumber } = useParams();
  const repoFullName = `${owner}/${repoName}`;
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [pr, setPr] = useState(null);
  const [prLoading, setPrLoading] = useState(true);
  const [prError, setPrError] = useState('');

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [postComment, setPostComment] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (repoFullName && prNumber) {
      loadPR();
      loadFiles();
    }
  }, [repoFullName, prNumber]);

  async function loadPR() {
    setPrLoading(true);
    setPrError('');
    try {
      const res = await getPRDetails(repoFullName, prNumber);
      const data = res.data || res;
      if (!data?.title && !data?.html_url) throw new Error('Pull request details were not returned.');
      setPr(data);
    } catch (err) {
      setPrError(err.response?.data?.error || err.message || 'Failed to load pull request details.');
    } finally {
      setPrLoading(false);
    }
  }

  async function loadFiles() {
    setFilesLoading(true);
    setFilesError('');
    try {
      const res = await getPRFiles(repoFullName, prNumber);
      const data = res.data || res;
      const fileList = data.files || data || [];
      setFiles(fileList);
      if (fileList.length > 0) {
        // default select first file or first python file
        const pyFile = fileList.find((f) => f.filename?.endsWith('.py'));
        setSelectedFile(pyFile || fileList[0]);
      }
    } catch (err) {
      setFiles([]);
      setFilesError(err.response?.data?.error || err.message || 'Failed to load changed files.');
    } finally {
      setFilesLoading(false);
    }
  }

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const data = await analyzePullRequest(repoFullName, parseInt(prNumber, 10), postComment);
      setAnalysisResults(data);
      success('PR Analysis Complete!');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Analysis failed';
      toastError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePostReviewComment = async () => {
    setIsPosting(true);
    try {
      await postPRComment(repoFullName, prNumber);
      success('Review posted directly to GitHub PR!');
    } catch (err) {
      toastError('Failed to post PR comment to GitHub');
    } finally {
      setIsPosting(false);
    }
  };

  if (prLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  if (prError || !pr) {
    return <ErrorState message={prError || 'Pull request details are unavailable.'} onRetry={() => { loadPR(); loadFiles(); }} />;
  }

  const allFindings = analysisResults?.file_analyses?.flatMap((fa) => fa.issues) || [];
  const pythonFiles = files.filter((f) => f.filename?.endsWith('.py'));

  return (
    <div className="space-y-4 select-none">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-content-subtle">
        <Link to={`/github/${owner}/${repoName}`} className="flex items-center gap-1 hover:text-content text-primary">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {repoFullName}
        </Link>
        <span>/</span>
        <span>Pull Request #{prNumber}</span>
      </div>

      {/* PR Header Banner */}
      <div className="p-5 rounded-xl bg-[#0D131C] border border-white/[0.08] shadow-elevated">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-primary font-bold text-base">#{prNumber}</span>
              <h1 className="font-display text-xl font-bold text-content tracking-tight truncate">
                {pr.title}
              </h1>
              <Badge variant={pr?.state === 'open' ? 'success' : 'outline'}>
                {pr.state?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-content-subtle">
              <span>Author: <strong className="text-content">@{pr.user?.login || pr.author || 'Unavailable'}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5 text-primary" />
                <strong className="text-content">{pr.head?.ref || 'Unavailable'}</strong> → {pr.base?.ref || 'Unavailable'}
              </span>
              <span>•</span>
              <span className="text-success font-semibold">+{pr?.additions ?? 0}</span>
              <span className="text-danger font-semibold">-{pr?.deletions ?? 0}</span>
              <span>•</span>
              <span>{files.length} changed files ({pythonFiles.length} Python)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunAnalysis}
              isLoading={isAnalyzing}
              className="font-mono text-xs"
            >
              <Play className="w-3.5 h-3.5 mr-1 fill-current" />
              {isAnalyzing ? 'Auditing PR...' : 'Analyze PR'}
            </Button>

            {analysisResults && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePostReviewComment}
                isLoading={isPosting}
                className="font-mono text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                Post Comment to GitHub
              </Button>
            )}

            {pr?.html_url && (
              <a
                href={pr.html_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-content transition-colors"
                title="Open on GitHub"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Flagship Three-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-16rem)] min-h-[580px]">
        
        {/* PANEL 1 (LEFT, 3 cols): Changed Files Tree */}
        <div className="lg:col-span-3 flex flex-col h-full rounded-xl overflow-hidden border border-white/[0.08] bg-[#0D131C] shadow-elevated">
          <div className="p-3.5 border-b border-white/[0.08] bg-[#090D13] flex items-center justify-between">
            <h3 className="font-mono text-xs font-semibold text-content uppercase tracking-wider">
              Changed Files ({files.length})
            </h3>
            <span className="text-[10px] font-mono text-content-subtle">
              {pythonFiles.length} Auditable
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filesLoading ? (
              <LoadingState label="Loading changed files" />
            ) : filesError ? (
              <ErrorState message={filesError} onRetry={loadFiles} />
            ) : files.length === 0 ? (
              <EmptyState title="No changed files" description="The pull request did not return any changed files." />
            ) : (
              files.map((file, idx) => {
                const isSelected = selectedFile?.filename === file.filename;
                const isPy = file.filename?.endsWith('.py');

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedFile(file)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg transition-colors flex items-center justify-between gap-2 group",
                      isSelected
                        ? "bg-primary/10 border border-primary/30 text-content"
                        : "hover:bg-white/[0.04] text-content-muted hover:text-content border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode2 className={cn("w-4 h-4 shrink-0", isPy ? "text-primary" : "text-content-subtle")} />
                      <span className="text-xs font-mono truncate">{file.filename}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                      {file.additions > 0 && <span className="text-success">+{file.additions}</span>}
                      {file.deletions > 0 && <span className="text-danger">-{file.deletions}</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL 2 (CENTER, 5 cols): Diff / Code Viewer */}
        <div className="lg:col-span-5 flex flex-col h-full rounded-xl overflow-hidden border border-white/[0.08] bg-[#090D13] shadow-elevated">
          <div className="p-3.5 border-b border-white/[0.08] bg-[#0D131C] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-mono font-semibold text-content truncate">
                {selectedFile?.filename || 'Select a file to inspect diff'}
              </span>
            </div>
            {selectedFile && (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.04] text-content-subtle">
                {selectedFile.status || 'modified'}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-5 bg-[#070A0F]">
            {selectedFile?.patch ? (
              <pre className="space-y-0.5 overflow-x-auto text-[11px]">
                {selectedFile.patch.split('\n').map((line, idx) => {
                  const isAdd = line.startsWith('+') && !line.startsWith('+++');
                  const isDel = line.startsWith('-') && !line.startsWith('---');
                  const isHunk = line.startsWith('@@');

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "px-2 py-0.5 rounded",
                        isAdd && "bg-success/15 text-emerald-300",
                        isDel && "bg-danger/15 text-rose-300",
                        isHunk && "bg-primary/10 text-primary font-bold my-1"
                      )}
                    >
                      {line}
                    </div>
                  );
                })}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-content-subtle space-y-2">
                <FileCode2 className="w-8 h-8 opacity-40" />
                <p>Diff is binary or empty for this file.</p>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3 (RIGHT, 4 cols): Findings & Review Intelligence */}
        <div className="lg:col-span-4 flex flex-col h-full rounded-xl overflow-hidden border border-white/[0.08] bg-[#0D131C] shadow-elevated">
          <div className="p-3.5 border-b border-white/[0.08] bg-[#090D13] flex items-center justify-between">
            <h3 className="font-mono text-xs font-semibold text-content uppercase tracking-wider">
              PR Review Findings ({allFindings.length})
            </h3>
            {analysisResults && (
              <Badge variant="cyan">{analysisResults.summary?.overall_risk || 'CLEAN'}</Badge>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {isAnalyzing ? (
              <LatticeLoader label="Running Static Gates & PR Differential Analysis..." />
            ) : !analysisResults ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <ShieldAlert className="w-8 h-8 text-content-subtle" />
                <h4 className="font-display font-semibold text-sm text-content">PR Not Yet Analyzed</h4>
                <p className="text-xs font-mono text-content-muted leading-relaxed max-w-xs">
                  Click <strong className="text-primary">"Analyze PR"</strong> to scan changed Python files against Bandit, AST rules, and ML severity.
                </p>
              </div>
            ) : allFindings.length === 0 ? (
              <div className="py-16 text-center text-xs font-mono text-content-muted space-y-2">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto opacity-75" />
                <p>No issues detected in this Pull Request.</p>
              </div>
            ) : (
              allFindings.map((finding, idx) => {
                const sev = (finding.severity || 'low').toLowerCase();
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#090D13] border border-white/[0.06] hover:border-white/[0.14] transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={sev === 'critical' ? 'critical' : sev === 'high' ? 'high' : 'medium'}>
                          {sev.toUpperCase()}
                        </Badge>
                        <span className="text-[11px] font-mono text-content-subtle">
                          Line {finding.line_number || 'N/A'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono uppercase text-content-subtle">
                        {finding.rule_id || 'AST'}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-content leading-relaxed">
                      {finding.message}
                    </p>

                    {finding.suggested_fix && (
                      <p className="text-[11px] font-mono text-success/90 bg-success/10 p-2 rounded">
                        Fix: {finding.suggested_fix}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
