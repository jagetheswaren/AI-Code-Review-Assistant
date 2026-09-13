import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Shield,
  Search,
  Zap,
  Bot,
  Upload,
  Code2,
  FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { analyzeCode } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Select,
  EmptyState,
  PageLoader,
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

const languages = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'typescript', label: 'TypeScript' },
];

function languageFromFilename(name) {
  if (!name) return 'plaintext';
  const ext = name.split('.').pop()?.toLowerCase();
  const map = {
    py: 'python',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    java: 'java',
  };
  return map[ext] || 'plaintext';
}

export default function Review() {
  const [code, setCode] = useState('');
  const [filename, setFilename] = useState('');
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const detectedLanguage = filename ? languageFromFilename(filename) : language;

  async function handleAnalyze() {
    if (!code.trim()) {
      toast({ title: 'No code to analyze', variant: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await analyzeCode(code, filename || `untitled.${language === 'python' ? 'py' : language === 'typescript' ? 'ts' : language === 'java' ? 'java' : 'js'}`);
      setResults(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Analysis failed';
      toast({ title: 'Analysis failed', description: msg, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCode(ev.target.result);
      setFilename(file.name);
      setLanguage(languageFromFilename(file.name));
    };
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCode(ev.target.result);
      setFilename(file.name);
      setLanguage(languageFromFilename(file.name));
    };
    reader.readAsText(file);
  }

  const allIssues = results?.file_analyses?.flatMap(fa => fa.issues) || [];
  const totalIssues = allIssues.length || 0;
  const securityIssues = allIssues.filter((i) => i.type === 'security').length || 0;
  const codeSmells = allIssues.filter((i) => i.type === 'code_smell').length || 0;
  const perfIssues = allIssues.filter((i) => i.type === 'performance').length || 0;

  if (loading) {
    return <PageLoader message="Analyzing code..." />;
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 lg:p-8">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Code2 className="h-8 w-8 text-indigo-400" />
            AI Code Review
          </h1>
          <p className="mt-2 text-slate-400">Paste your code or upload a file for intelligent analysis</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <Card className="bg-[#111827] border-white/[0.06] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                Code Editor
              </CardTitle>
            </CardHeader>
            <div className="px-4 pb-4">
              <div className="rounded-lg overflow-hidden border border-white/[0.06]">
                <Editor
                  height="500px"
                  language={detectedLanguage}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    padding: { top: 12, bottom: 12 },
                    wordWrap: 'on',
                    renderLineHighlight: 'all',
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                  }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <div className="space-y-6">
            <Card className="bg-[#111827] border-white/[0.06]">
              <CardHeader>
                <CardTitle className="text-white text-lg">Configuration</CardTitle>
              </CardHeader>
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Filename</label>
                  <Input
                    placeholder="e.g. app.py, main.js"
                    value={filename}
                    onChange={(e) => {
                      setFilename(e.target.value);
                      if (e.target.value) setLanguage(languageFromFilename(e.target.value));
                    }}
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Language</label>
                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                  >
                    {languages.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={!code.trim()}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Analyze Code
                </Button>
              </div>
            </Card>

            <Card
              className={cn(
                'bg-[#111827] border-white/[0.06] transition-colors',
                dragOver && 'border-indigo-500/50 bg-indigo-500/5'
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="px-4 py-8 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-3">
                  <Upload className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-300 font-medium">Drop a file here or</p>
                <label className="mt-2">
                  <span className="text-sm text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium transition-colors">
                    Browse files
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".py,.js,.jsx,.ts,.tsx,.java,.go,.rb,.cs,.cpp,.c,.h,.rs,.swift"
                    onChange={handleFileUpload}
                  />
                </label>
                <p className="text-xs text-slate-500 mt-1">Supports Python, JavaScript, TypeScript, Java, and more</p>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>

      {results && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="mt-8 space-y-6"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#111827] border-white/[0.06]">
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-slate-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalIssues}</p>
                  <p className="text-xs text-slate-400">Total Issues</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#111827] border-white/[0.06]">
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{securityIssues}</p>
                  <p className="text-xs text-slate-400">Security</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#111827] border-white/[0.06]">
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Search className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">{codeSmells}</p>
                  <p className="text-xs text-slate-400">Code Smells</p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#111827] border-white/[0.06]">
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">{perfIssues}</p>
                  <p className="text-xs text-slate-400">Performance</p>
                </div>
              </div>
            </Card>
          </div>

          {allIssues.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Issues Found</h3>
              {allIssues.map((issue, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-[#111827] border-white/[0.06]">
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              className={cn(
                                'text-xs font-medium border',
                                severityColors[issue.severity] || severityColors.info
                              )}
                            >
                              {issue.severity?.toUpperCase()}
                            </Badge>
                            {issue.line_number && (
                              <span className="text-xs text-slate-500 font-mono">Line {issue.line_number}</span>
                            )}
                            {issue.rule_id && (
                              <span className="text-xs text-slate-500 font-mono">{issue.rule_id}</span>
                            )}
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
                          <p className="text-sm text-white font-medium mb-1">{issue.message}</p>
                          {issue.suggestion && (
                            <p className="text-sm text-slate-400 mt-1">{issue.suggestion}</p>
                          )}
                          {issue.fix_suggestion && (
                            <div className="mt-3 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                              <p className="text-xs text-indigo-400 font-medium mb-1">Suggested Fix</p>
                              <p className="text-sm text-slate-300">{issue.fix_suggestion}</p>
                            </div>
                          )}
                          {issue.explanation && (
                            <p className="text-xs text-slate-500 mt-2 italic">{issue.explanation}</p>
                          )}
                        </div>
                        {issue.ml_severity && (
                          <div className="text-right flex-shrink-0">
                            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
                              ML: {issue.ml_severity}
                            </Badge>
                            {issue.ml_confidence && (
                              <p className="text-xs text-slate-500 mt-1">
                                {Math.round(issue.ml_confidence * 100)}% conf ({issue.ml_model_version || 'v1'})
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {results.ai_review && (
            <Card className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/20">
              <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">AI Review</h3>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {results.ai_review}
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      )}

      {!loading && !results && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
          <EmptyState
            icon={<Search className="h-12 w-12 text-slate-500" />}
            title="No analysis yet"
            description="Paste code into the editor or upload a file to get started with AI-powered code review."
          />
        </motion.div>
      )}
    </div>
  );
}
