import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Play,
  Upload,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  Zap,
  Cpu,
  Layers,
  ChevronRight,
  ExternalLink,
  Sliders,
  FileCode2,
  X,
  AlertTriangle,
  GitBranch,
  FileText,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import { analyzeCode, analyzeFile, claimScan } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button, Badge, Card, Input } from '../components/ui';
import {
  Stepper,
  DecryptedText,
  ElectricBorder,
  CountUp,
  SpotlightCard,
  StatusMark,
  LatticeLoader,
} from '../components/reactbits/Bits';
import { cn } from '../lib/utils';

export default function Review() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const editorRef = useRef(null);

  // Editor and Input states
  const [code, setCode] = useState('');
  const [filename, setFilename] = useState('code.py');
  const [activeTab, setActiveTab] = useState('all'); // all, security, quality, complexity, performance, ai
  const [mobileView, setMobileView] = useState('code'); // code, findings, summary

  // Analysis Lifecycle states
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [activeIssue, setActiveIssue] = useState(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [copiedFix, setCopiedFix] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [scanClaimed, setScanClaimed] = useState(false);

  // Monaco line highlighting decoration cleanup
  const decorationRef = useRef([]);

  const handleAnalyze = async () => {
    if (!code.trim() || isScanning) return;
    setIsScanning(true);
    setInspectorOpen(false);

    try {
      const res = await analyzeCode(code, filename || 'code.py');
      setResults(res.data);
      success('Analysis complete. Findings synchronized.');
      if (window.innerWidth < 1024) {
        setMobileView('findings');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Analysis failed. Please check backend connection.';
      toastError(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.py')) {
      toastError('Only Python (.py) files are currently analyzed.');
      return;
    }

    setFilename(file.name);
    const text = await file.text();
    setCode(text);
    success(`Loaded ${file.name}`);
  };

  // Jump to and highlight line in Monaco
  const jumpToLine = (issue) => {
    setActiveIssue(issue);
    setInspectorOpen(true);

    if (editorRef.current && issue?.line_number) {
      const line = Number(issue.line_number);
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });

      decorationRef.current = editorRef.current.deltaDecorations(decorationRef.current, [
        {
          range: {
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'bg-primary/20 border-l-2 border-primary',
          },
        },
      ]);
    }
  };

  const copyFixToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedFix(true);
    success('Suggested fix copied to clipboard');
    setTimeout(() => setCopiedFix(false), 2000);
  };

  const handleClaimScan = async () => {
    if (!results?.request_id) return;
    if (!user) {
      window.location.href = `/?authRequired=1&destination=/review`;
      return;
    }
    setClaiming(true);
    try {
      await claimScan(results.request_id);
      setScanClaimed(true);
      success('Scan successfully saved to your review history!');
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to link scan to account.');
    } finally {
      setClaiming(false);
    }
  };

  const applyFixToEditor = (fixText) => {
    if (!editorRef.current || !activeIssue?.line_number || !fixText) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    const lineNum = Number(activeIssue.line_number);
    const lineContent = model.getLineContent(lineNum) || '';
    const range = {
      startLineNumber: lineNum,
      startColumn: 1,
      endLineNumber: lineNum,
      endColumn: lineContent.length + 1
    };
    editorRef.current.executeEdits('ai-fix', [{ range, text: fixText }]);
    setCode(model.getValue());
    success(`Applied suggested fix to line ${lineNum}`);
  };

  // Extract all findings
  const allIssues = results?.file_analyses?.flatMap((fa) => fa.issues) || [];
  const summary = results?.summary || {};

  // Filter issues based on active tab
  const filteredIssues = allIssues.filter((issue) => {
    if (activeTab === 'all') return true;
    const cat = (issue.issue_type || issue.category || '').toLowerCase();
    if (activeTab === 'security') return cat.includes('security');
    if (activeTab === 'quality') return cat.includes('smell') || cat.includes('style') || cat.includes('quality');
    if (activeTab === 'complexity') return cat.includes('complexity');
    if (activeTab === 'performance') return cat.includes('performance');
    if (activeTab === 'ai') return issue.source === 'ai' || issue.source === 'LLM';
    return true;
  });

  const criticalCount = allIssues.filter((i) => i.severity?.toLowerCase() === 'critical').length;
  const highCount = allIssues.filter((i) => i.severity?.toLowerCase() === 'high').length;
  const mediumCount = allIssues.filter((i) => i.severity?.toLowerCase() === 'medium').length;

  const healthScore = results
    ? Math.max(15, Math.min(100, Math.round(100 - (criticalCount * 18 + highCount * 8 + mediumCount * 3))))
    : 100;

  return (
    <div className="space-y-4 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-content flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              New Analysis
            </h1>
            <Badge variant="cyan" size="sm" className="font-mono text-[10px]">
              V2 Compiler
            </Badge>
          </div>
          <p className="text-xs font-mono text-content-muted mt-0.5">
            Real-time Python AST, Bandit security audit, Radon complexity & ML severity prioritization
          </p>
        </div>

        {results?.request_id && (
          <div className="flex items-center gap-2 shrink-0">
            {!user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClaimScan}
                className="font-mono text-xs border-primary/40 text-primary hover:bg-primary/10"
              >
                <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                Save to Account
              </Button>
            ) : scanClaimed ? (
              <Badge variant="success" size="sm" className="font-mono text-[11px]">
                <Check className="w-3 h-3 mr-1" /> Saved to History
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                isLoading={claiming}
                onClick={handleClaimScan}
                className="font-mono text-xs border-primary/40 text-primary hover:bg-primary/10"
              >
                <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                Save to History
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Tab Selector */}
      <div className="lg:hidden flex items-center gap-1 p-1 rounded-xl bg-[#0D131C] border border-white/[0.08]">
        <button
          onClick={() => setMobileView('code')}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors",
            mobileView === 'code' ? "bg-primary/15 text-primary" : "text-content-muted"
          )}
        >
          Code Editor
        </button>
        <button
          onClick={() => setMobileView('findings')}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors",
            mobileView === 'findings' ? "bg-primary/15 text-primary" : "text-content-muted"
          )}
        >
          Findings ({allIssues.length})
        </button>
        <button
          onClick={() => setMobileView('summary')}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors",
            mobileView === 'summary' ? "bg-primary/15 text-primary" : "text-content-muted"
          )}
        >
          AI Summary
        </button>
      </div>

      {/* Editor & Intelligence Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0D131C] border border-white/[0.08]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-primary shrink-0" />
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="bg-[#070A0F] border border-white/[0.08] rounded-md px-2.5 py-1 text-xs font-mono text-content focus:outline-none focus:border-primary/50 w-32 sm:w-40"
              placeholder="filename.py"
            />
          </div>

        </div>

        <div className="flex items-center gap-2">
          {/* Upload Button */}
          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-mono text-content flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5 text-content-muted" />
            <span className="hidden sm:inline">Upload .py</span>
            <input type="file" accept=".py" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Reset Button */}
          <button
            onClick={() => { setCode(''); setResults(null); }}
            className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-content-muted hover:text-content transition-colors"
            title="Clear Editor"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Main Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!code.trim() || isScanning}
            isLoading={isScanning}
            variant="primary"
            size="sm"
            className="font-mono text-xs px-4"
            data-testid="run-review"
          >
            <Play className="w-3.5 h-3.5 mr-1 fill-current" />
            {isScanning ? 'Auditing...' : 'Analyze Code'}
          </Button>
        </div>
      </div>

      {/* Main Flagship Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-14rem)] min-h-[580px]">
        
        {/* LEFT PANE: Monaco Code Editor (64%) */}
        <div className={cn(
          "lg:col-span-8 flex flex-col h-full rounded-xl overflow-hidden border border-white/[0.08] bg-[#090D13] relative shadow-elevated",
          mobileView !== 'code' && "hidden lg:flex"
        )}>
          {/* Editor Status Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#0D131C] border-b border-white/[0.06] text-xs font-mono text-content-subtle shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-content font-medium">{filename}</span>
              <span>• Python 3.12 AST</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>UTF-8</span>
              <span>Spaces: 4</span>
              {isScanning && (
                <span className="text-primary animate-pulse flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  SCANNING
                </span>
              )}
            </div>
          </div>

          {/* Scanning Beam Visual Overlay */}
          {isScanning && (
            <motion.div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 shadow-cyanGlow pointer-events-none z-30"
              initial={{ top: '35px' }}
              animate={{ top: '95%' }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Monaco Editor Mount */}
          <div className="flex-1 w-full relative" data-testid="code-editor">
            <Editor
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
                cursorBlinking: 'smooth',
                readOnly: isScanning,
              }}
            />
          </div>
        </div>

        {/* RIGHT PANE: Review Intelligence Panel (36%) */}
        <div className={cn(
          "lg:col-span-4 flex flex-col h-full rounded-xl overflow-hidden border border-white/[0.08] bg-[#0D131C] shadow-elevated relative",
          mobileView === 'code' && "hidden lg:flex"
        )}>
          
          {/* Header Summary / Scanning Status */}
          <div className="p-4 border-b border-white/[0.08] bg-[#090D13] shrink-0">
            {isScanning ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                    Analysis In Progress
                  </span>
                  <StatusMark status="busy" label="Scanning" />
                </div>
                <Stepper
                  steps={['AST', 'Bandit', 'Smell', 'ML', 'AI']}
                  activeStep={2}
                />
                <p className="text-xs font-mono text-content-muted">
                  <DecryptedText text="RUNNING DETERMINISTIC STATIC SECURITY AUDIT..." />
                </p>
              </div>
            ) : results ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-xl text-content">
                      <CountUp end={healthScore} />
                      <span className="text-xs font-mono text-content-subtle">/100</span>
                    </span>
                    <Badge variant={healthScore >= 75 ? 'success' : 'critical'}>
                      {summary.overall_risk?.toUpperCase() || 'AUDITED'}
                    </Badge>
                  </div>
                  <span className="text-xs font-mono text-content-subtle">
                    {results.processing_time_ms ? `${results.processing_time_ms}ms` : 'Instant'}
                  </span>
                </div>
                <p className="text-xs font-mono text-content-muted">
                  {allIssues.length} issues detected • {criticalCount} Critical • {highCount} High
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-semibold text-sm text-content">Review Intelligence</h2>
                  <p className="text-xs font-mono text-content-subtle">Ready to evaluate code</p>
                </div>
                <Badge variant="cyan">IDLE</Badge>
              </div>
            )}
          </div>

          {/* Findings Filter Tabs */}
          {results && (
            <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] bg-[#070A0F] overflow-x-auto text-xs font-mono shrink-0">
              {['all', 'security', 'quality', 'complexity', 'performance'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-2.5 py-1 rounded-md capitalize transition-colors shrink-0",
                    activeTab === tab
                      ? "bg-primary/15 text-primary border border-primary/25 font-semibold"
                      : "text-content-muted hover:text-content hover:bg-white/[0.04]"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Findings List Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5" data-testid="findings-panel">
            {isScanning ? (
              <LatticeLoader label="Auditing Python AST & Security Rules..." />
            ) : !results ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <Code2 className="w-8 h-8 text-content-subtle" />
                <h3 className="font-display font-semibold text-sm text-content">No Active Findings</h3>
                <p className="text-xs font-mono text-content-muted max-w-xs leading-relaxed">
                  Click <strong className="text-primary">"Analyze Code"</strong> above to trigger static rules, Random Forest severity classification, and AI reasoning.
                </p>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-content-muted space-y-2">
                <Check className="w-6 h-6 text-success mx-auto" />
                <p>No issues found matching "{activeTab}" filter.</p>
              </div>
            ) : (
              filteredIssues.map((issue, idx) => {
                const sev = (issue.severity || 'low').toLowerCase();
                const isSelected = activeIssue?.line_number === issue.line_number && activeIssue?.rule_id === issue.rule_id;

                return (
                  <div
                    key={idx}
                    data-testid="finding-card"
                    onClick={() => jumpToLine(issue)}
                    className={cn(
                      "p-3 rounded-lg border text-left cursor-pointer transition-all duration-150 group",
                      isSelected
                        ? "bg-primary/10 border-primary/40 shadow-cyanGlow/20"
                        : "bg-[#090D13] border-white/[0.06] hover:border-white/[0.14] hover:bg-[#121A25]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={sev === 'critical' ? 'critical' : sev === 'high' ? 'high' : sev === 'medium' ? 'medium' : 'low'}>
                          {sev.toUpperCase()}
                        </Badge>
                        <span className="text-[11px] font-mono text-content-subtle">
                          Line {issue.line_number || 'N/A'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/[0.04] text-content-subtle">
                        {issue.source || issue.rule_id || 'AST'}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-content line-clamp-2 leading-relaxed">
                      {issue.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-content-subtle">
                      <span className="text-primary hover:underline flex items-center gap-1">
                        View Solution <ChevronRight className="w-3 h-3" />
                      </span>
                      {issue.ml_confidence && (
                        <span>Confidence: {Math.round(issue.ml_confidence * 100)}%</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Slide-over Detailed Issue Inspector */}
      <AnimatePresence>
        {inspectorOpen && activeIssue && (() => {
          const suggestedFix = activeIssue.suggested_fix || activeIssue.suggestion || activeIssue.fix_suggestion;
          return (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0D131C] border-l border-white/[0.1] shadow-2xl flex flex-col"
            >
              {/* Inspector Header */}
              <div className="p-4 border-b border-white/[0.08] bg-[#090D13] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={activeIssue.severity?.toLowerCase() === 'critical' ? 'critical' : 'warning'}>
                    {activeIssue.severity?.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-mono text-content-muted">
                    Line {activeIssue.line_number} • {activeIssue.rule_id || 'Rule'}
                  </span>
                </div>
                <button
                  onClick={() => setInspectorOpen(false)}
                  className="p-1 rounded text-content-subtle hover:text-content hover:bg-white/[0.08]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs font-mono">
                <div>
                  <h3 className="text-sm font-semibold text-content mb-1">{activeIssue.message}</h3>
                  <p className="text-content-muted text-xs leading-relaxed">
                    {activeIssue.explanation || 'Direct AST violation detected by the security parser.'}
                  </p>
                </div>

                {/* What Happened / Why it matters */}
                <div className="p-3.5 rounded-lg bg-[#070A0F] border border-white/[0.06] space-y-2">
                  <p className="text-primary font-semibold text-[11px] uppercase tracking-wider">
                    Impact Assessment
                  </p>
                  <p className="text-content-muted text-xs leading-relaxed">
                    {activeIssue.production_impact || 'Potential vulnerability that allows unintended code execution or resource compromise in production.'}
                  </p>
                </div>

                {/* Suggested Fix Code */}
                {suggestedFix && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-success font-semibold text-[11px] uppercase tracking-wider">
                        Suggested Fix
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => applyFixToEditor(suggestedFix)}
                          className="px-2 py-0.5 rounded bg-success/15 border border-success/30 text-success text-[10px] font-mono hover:bg-success/25 transition-colors"
                        >
                          Apply to Code
                        </button>
                        <button
                          onClick={() => copyFixToClipboard(suggestedFix)}
                          className="flex items-center gap-1 text-[11px] text-content-subtle hover:text-content"
                        >
                          {copiedFix ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedFix ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                    <pre className="p-3 rounded-lg bg-[#070A0F] border border-white/[0.08] text-content overflow-x-auto text-[11px] leading-5">
                      <code>{suggestedFix}</code>
                    </pre>
                  </div>
                )}

                {/* AI Reasoning / Model Details */}
                {results?.ai_review && (
                  <div className="p-3.5 rounded-lg bg-primary/[0.04] border border-primary/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-primary text-[11px] font-semibold">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>AI Reasoning</span>
                    </div>
                    <p className="text-content-muted text-[11px] leading-relaxed">
                      {results.ai_review}
                    </p>
                  </div>
                )}
              </div>

              {/* Inspector Footer Actions */}
              <div className="p-4 border-t border-white/[0.08] bg-[#090D13] flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setInspectorOpen(false)}
                  className="w-full font-mono text-xs"
                >
                  Close Inspector
                </Button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
