import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Code2,
  GitBranch,
  Settings,
  LayoutDashboard,
  History,
  ShieldAlert,
  Sparkles,
  Zap,
  FileBarChart,
  MessageSquare,
  User,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const commands = [
    { id: 'dashboard', category: 'Navigation', label: 'Go to Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'review', category: 'Analysis', label: 'Start AI Code Review', icon: Code2, path: '/review' },
    { id: 'github', category: 'Repositories', label: 'GitHub Repositories & PRs', icon: GitBranch, path: '/github' },
    { id: 'history', category: 'Intelligence', label: 'View Scan History', icon: History, path: '/history' },
    { id: 'security', category: 'Audit', label: 'Security Vulnerability Matrix', icon: ShieldAlert, path: '/security' },
    { id: 'quality', category: 'Audit', label: 'Code Quality & Maintainability', icon: Sparkles, path: '/quality' },
    { id: 'performance', category: 'Audit', label: 'Performance Diagnostics', icon: Zap, path: '/performance' },
    { id: 'reports', category: 'Export', label: 'Generate PDF/CSV/JSON Reports', icon: FileBarChart, path: '/reports' },
    { id: 'chat', category: 'AI Assistant', label: 'Open AI Code Assistant', icon: MessageSquare, path: '/chat' },
    { id: 'profile', category: 'Preferences', label: 'User Profile & API Stats', icon: User, path: '/profile' },
    { id: 'settings', category: 'Preferences', label: 'System Settings & AI Model', icon: Settings, path: '/settings' },
  ];

  const filtered = query === ''
    ? commands
    : commands.filter(c => 
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        navigate(filtered[selectedIndex].path);
        onClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#0D131C] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden animate-micro-in">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] bg-[#090D13]">
          <Search className="w-4 h-4 text-primary mr-3 shrink-0" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-0 text-sm font-mono text-content placeholder:text-content-subtle outline-none"
            placeholder="Type a command or jump to page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.1] rounded text-[10px] text-content-subtle font-mono">
            ESC
          </kbd>
        </div>
        
        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/[0.02]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-content-muted">
              No matching commands or destinations found.
            </div>
          ) : (
            filtered.map((command, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = command.icon;
              return (
                <button
                  key={command.id}
                  onClick={() => {
                    navigate(command.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left",
                    isSelected
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-content-muted hover:bg-white/[0.04] hover:text-content border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4", isSelected ? "text-primary" : "text-content-subtle")} />
                    <span>{command.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-content-subtle uppercase px-1.5 py-0.5 rounded bg-white/[0.04]">
                      {command.category}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#070A0F] border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-content-subtle">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>IntelliReview AI v2.0</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
