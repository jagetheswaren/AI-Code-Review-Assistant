import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Sparkles, Terminal, Shield, Cpu, 
  FileCode, AlertTriangle, CheckCircle2, Copy, Check,
  ChevronRight, RefreshCw, Zap, Layers, Info
} from 'lucide-react';
import { analyzeCode, getAiStatus } from '../api/client';
import { Button } from '../components/ui';
import { StatusMark, DecryptedText, LatticeLoader, SpotlightCard, FadeContent } from '../components/reactbits/Bits';

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: 'Submit Python source to run the configured code analysis. AI-generated review text appears only when the backend returns it for the analysis.',
      issues: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [aiStatus, setAiStatus] = useState({
    ai_available: false,
    provider: 'none',
    model: null,
    fallback: 'static',
    message: 'Checking AI provider status.',
    reachable: false,
    loading: true
  });
  
  // Context Inspector state
  const [context, setContext] = useState({
    file: '',
    language: 'Python',
    rule: 'All configured rules',
    selectedIssue: null
  });

  const bottomRef = useRef(null);

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function checkStatus() {
    try {
      const res = await getAiStatus();
      if (res.data) {
        setAiStatus({
          ai_available: res.data.ai_available === true,
          provider: res.data.provider || 'none',
          model: res.data.model || null,
          expected_model: res.data.expected_model || null,
          fallback: res.data.fallback || 'static',
          message: res.data.message || null,
          reachable: res.data.reachable !== false,
          loading: false,
          error: res.data.error,
          groq_status: res.data.groq_status,
          ollama_status: res.data.ollama_status,
          next_command: res.data.next_command
        });
      }
    } catch {
      setAiStatus({
        ai_available: false,
        provider: 'none',
        model: null,
        fallback: 'static',
        message: 'AI status could not be reached. Static analysis remains available.',
        expected_model: null,
        reachable: false,
        loading: false,
        error: 'AI service unreachable'
      });
    }
  }

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleSend(customText) {
    const textToSend = typeof customText === 'string' ? customText : input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send code/query to the real analysis API
      const response = await analyzeCode(textToSend, context.file || 'query.py');
      const data = response.data || response;
      const findings = data.file_analyses?.flatMap((file) => file.issues || []) || data.issues || [];

      let formattedContent = '';
      const issueCount = findings.length;

      if (data.ai_available === false) {
        formattedContent += `AI review is unavailable. Static analysis returned **${issueCount} finding${issueCount === 1 ? '' : 's'}**.\n\n`;
      } else if (data.ai_review) {
        formattedContent += `${data.ai_review}\n\n`;
      } else if (issueCount > 0) {
        formattedContent += `Analysis completed. The backend returned **${issueCount} finding${issueCount === 1 ? '' : 's'}**.\n\n`;
      } else {
        formattedContent += 'Static analysis completed and returned no findings for the submitted source.\n\n';
      }

      if (data.risk_score !== undefined) {
        formattedContent += `* **Overall Risk Assessment**: \`${data.risk_score} / 100\`\n`;
      }
      if (data.processing_time_ms) {
        formattedContent += `* **Processing Latency**: \`${data.processing_time_ms} ms\`\n`;
      }

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: formattedContent,
        issues: findings,
        aiReview: data.ai_review,
        rawResults: data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const failureMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `Analysis request failed: ${error.response?.data?.error || error.message || 'The service did not return a response.'}`,
        issues: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, failureMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const promptSuggestions = [
    { label: 'Check for SQL injection & command leaks', prompt: 'def fetch_user(user_id):\n    query = "SELECT * FROM users WHERE id = " + user_id\n    db.execute(query)' },
    { label: 'Analyze time complexity & nested loops', prompt: 'def pair_search(items):\n    for i in range(len(items)):\n        for j in range(len(items)):\n            if items[i] == items[j] and i != j:\n                return True' },
    { label: 'Verify exception handling & broad catch', prompt: 'def parse_payload(data):\n    try:\n        return json.loads(data)\n    except:\n        pass' },
    { label: 'Review secure subprocess usage', prompt: 'import subprocess\ndef run_cmd(user_arg):\n    return subprocess.check_output(f"echo {user_arg}", shell=True)' }
  ];

  return (
    <FadeContent className="h-[calc(100vh-6.5rem)] flex flex-col -m-4 sm:-m-6 lg:-m-8">
      {/* Top Header Command Bar */}
      <div className="h-14 px-6 border-b border-white/[0.08] bg-[#090D13]/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#121A25] border border-white/[0.08] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-text-primary font-display tracking-wide">
                IntelliReview AI Assistant
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-text-muted hidden sm:block">
              Context-aware neural reviewer & static AST reasoning engine
            </p>
          </div>
        </div>

        {/* Live Provider Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0D131C] border border-white/[0.08]">
            <StatusMark 
              status={aiStatus.ai_available ? 'online' : 'warning'} 
              size={7} 
            />
              <span className="text-xs font-mono text-text-secondary">
                {aiStatus.loading ? 'Checking status' : aiStatus.ai_available ? `${aiStatus.provider}: ${aiStatus.model || aiStatus.expected_model || 'available'}` : 'AI unavailable · static ready'}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={checkStatus} 
            className="text-text-muted hover:text-text-primary p-2 h-8 w-8"
            title="Refresh AI Provider Status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Stream (Left 68%) */}
        <div className="flex-1 flex flex-col bg-[#05070A] min-w-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 max-w-4xl ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-[#121A25] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div className={`space-y-3 min-w-0 ${msg.role === 'user' ? 'max-w-2xl' : 'w-full'}`}>
                  <div
                    className={`p-4 rounded-xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-secondary/15 text-text-primary border border-secondary/25 font-mono text-xs whitespace-pre-wrap'
                        : 'bg-[#0D131C] border border-white/[0.08] text-text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/[0.06] text-[11px] text-text-muted">
                      <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                        {msg.role === 'user' ? <User className="w-3 h-3 text-secondary" /> : <Bot className="w-3 h-3 text-primary" />}
                        {msg.role === 'user' ? 'Developer' : 'IntelliReview Neural Core'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{msg.timestamp}</span>
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-text-primary transition-colors p-0.5"
                          title="Copy content"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed font-sans">
                      {msg.content}
                    </div>

                    {/* Surfaced Issues in Card Format */}
                    {msg.issues && msg.issues.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-mono text-text-muted mb-2">
                          <span className="uppercase tracking-wider">Detected Code Findings</span>
                          <span className="text-primary font-semibold">{msg.issues.length} Issues</span>
                        </div>

                        {msg.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-[#070A0F] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                                  issue.severity === 'critical' ? 'bg-danger/20 text-danger border border-danger/30' :
                                  issue.severity === 'high' ? 'bg-warning/20 text-warning border border-warning/30' :
                                  'bg-primary/20 text-primary border border-primary/30'
                                }`}>
                                  {issue.severity?.toUpperCase()}
                                </span>
                                <span className="text-xs font-mono font-semibold text-text-primary truncate">
                                  {issue.rule_id || issue.issue_type || 'RULE_FINDING'}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-text-muted">
                                Line {issue.line_number || 1}
                              </span>
                            </div>

                            <p className="text-xs text-text-secondary mb-2">
                              {issue.message}
                            </p>

                            {issue.suggestion && (
                              <div className="p-2 rounded bg-[#090D13] border border-white/[0.04] text-[11px] font-mono text-primary/90 flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                <span>{issue.suggestion}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-secondary" />
                  </div>
                )}
              </motion.div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-2xl mr-auto">
                <div className="w-8 h-8 rounded-lg bg-[#121A25] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="p-4 rounded-xl bg-[#0D131C] border border-white/[0.08] space-y-3 min-w-[280px]">
                  <div className="flex items-center gap-2 text-xs font-mono text-primary">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <DecryptedText text="RUNNING AST & NEURAL INFERENCE..." speed={35} />
                  </div>
                  <LatticeLoader message="Evaluating security boundaries & AST complexity..." />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Prompt Suggestions */}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-[#070A0F]/90 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" /> Suggest:
            </span>
            {promptSuggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setInput(item.prompt)}
                className="text-xs px-2.5 py-1 rounded-md bg-[#0D131C] border border-white/[0.06] text-text-secondary hover:text-text-primary hover:border-primary/40 whitespace-nowrap transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Input Bar (PromptBar Style) */}
          <div className="p-4 border-t border-white/[0.08] bg-[#090D13]">
            <div className="max-w-4xl mx-auto relative rounded-xl bg-[#05070A] border border-white/[0.12] focus-within:border-primary/60 transition-colors shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste code or ask about vulnerabilities, maintainability, or optimizations... (Shift+Enter for newline)"
                rows={2}
                className="w-full bg-transparent px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none font-mono"
              />
              <div className="px-3 pb-2.5 pt-1 flex items-center justify-between border-t border-white/[0.04]">
                <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
                  <Terminal className="w-3 h-3 text-primary" />
                  <span>Python 3 AST Analysis</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="bg-primary hover:bg-primary/90 text-bg-main font-semibold px-4 py-1.5 h-8 text-xs rounded-lg"
                >
                  <Send className="w-3 h-3 mr-1.5" />
                  Analyze / Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Context Inspector Panel (Right 32% - Hidden on Mobile) */}
        <div className="hidden lg:flex w-80 flex-col border-l border-white/[0.08] bg-[#090D13] overflow-y-auto p-4 space-y-4 shrink-0">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-secondary" /> Active Review Context
            </h3>
            <div className="p-3 rounded-lg bg-[#0D131C] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-mono">Target:</span>
                <span className="text-text-primary font-mono font-medium">{context.file}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-mono">Engine:</span>
                <span className="text-primary font-mono font-medium">{context.language}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-mono">AST Rules:</span>
                <span className="text-text-secondary font-mono">{context.rule}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-primary" /> Provider & Model Architecture
            </h3>
            <div className="p-3 rounded-lg bg-[#0D131C] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Status</span>
                <div className="flex items-center gap-1.5">
                  <StatusMark status={aiStatus.ai_available ? 'online' : 'warning'} size={6} />
                  <span className="text-xs font-mono font-semibold text-text-primary">
                    {aiStatus.ai_available ? aiStatus.provider.toUpperCase() : 'STATIC FALLBACK'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Primary LLM</span>
                <span className="font-mono text-text-primary">{aiStatus.model || aiStatus.expected_model || 'No AI model connected'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Host Endpoint</span>
                <span className="font-mono text-text-muted text-[11px] truncate max-w-[130px]" title={aiStatus.base_url}>
                  {aiStatus.base_url}
                </span>
              </div>
              {!aiStatus.ai_available && (
                <div className="p-2 rounded bg-warning/10 border border-warning/20 text-[11px] text-warning flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{aiStatus.message || 'AI unavailable. Static analysis (Bandit + AST + ML) remains available.'}{aiStatus.next_command ? ` Next: ${aiStatus.next_command}` : ''}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-success" /> Static & Neural Pipeline
            </h3>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 rounded bg-[#0D131C] border border-white/[0.04] flex items-center justify-between text-text-secondary">
                <span>Bandit B-Rules</span>
                <span className="text-success text-[11px]">LOADED</span>
              </div>
              <div className="p-2 rounded bg-[#0D131C] border border-white/[0.04] flex items-center justify-between text-text-secondary">
                <span>AST Complexity</span>
                <span className="text-success text-[11px]">ACTIVE</span>
              </div>
              <div className="p-2 rounded bg-[#0D131C] border border-white/[0.04] flex items-center justify-between text-text-secondary">
                <span>Random Forest ML</span>
                <span className="text-primary text-[11px]">TRAINED</span>
              </div>
              <div className="p-2 rounded bg-[#0D131C] border border-white/[0.04] flex items-center justify-between text-text-secondary">
                <span>Code Smell Heuristics</span>
                <span className="text-success text-[11px]">ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
              Capabilities
            </h3>
            <ul className="text-xs text-text-muted space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Direct line-level vulnerability inspection</li>
              <li>Bandit AST pattern analysis</li>
              <li>Explain production impact of issues</li>
              <li>Automatic safe code rewrite generation</li>
            </ul>
          </div>
        </div>
      </div>
    </FadeContent>
  );
}
