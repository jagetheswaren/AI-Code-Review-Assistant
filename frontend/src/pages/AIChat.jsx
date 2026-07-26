import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { analyzeCode } from '../api/client';
import { Button } from '../components/ui';

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function formatAIResponse(data) {
    const issueCount = data.issues?.length || 0;
    let text = `I found **${issueCount} issue(s)** in your code.\n\n`;
    if (data.issues?.length) {
      text += '**Top issues:**\n';
      data.issues.slice(0, 5).forEach((issue, i) => {
        text += `${i + 1}. **[${issue.severity}]** ${issue.message} (Line ${issue.line_number})\n`;
        if (issue.suggestion) text += `   Suggestion: ${issue.suggestion}\n`;
      });
    }
    if (data.ai_review) {
      text += `\n**AI Review:**\n${data.ai_review}`;
    }
    return text;
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);
    try {
      const data = await analyzeCode(currentInput, 'chat.py');
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: formatAIResponse(data),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: 'Sorry, I encountered an error analyzing your code. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
        <div className="p-2 rounded-lg bg-white/[0.05]">
          <Sparkles className="w-5 h-5 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!messages.length && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="p-4 rounded-2xl bg-white/[0.05]">
              <Bot className="w-12 h-12 text-slate-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Ask me about your code</h2>
              <p className="text-sm text-slate-400">Paste code or describe a problem and I'll analyze it for you.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {['Review my Python code', 'Find security issues', 'Optimize this function', 'Explain this error'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 rounded-full text-xs text-slate-400 bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 p-2 rounded-lg bg-white/[0.05]">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[70%] px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-[#2563EB] text-white rounded-2xl rounded-br-md'
                    : 'bg-[#111827] border border-white/[0.06] text-slate-200 rounded-2xl rounded-bl-md'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 p-2 rounded-lg bg-[#2563EB]">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 p-2 rounded-lg bg-white/[0.05]">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/[0.06] bg-[#111827] p-4">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code..."
            rows={1}
            className="flex-1 bg-white/[0.05] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl px-4 py-3 h-auto"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
