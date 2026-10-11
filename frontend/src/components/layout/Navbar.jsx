import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Menu,
  Command,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  User,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications, markAllNotificationsRead, getAiStatus } from '../../api/client';
import { StatusMark } from '../reactbits/Bits';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';

export const Navbar = ({ onMenuClick, onOpenCommandPalette }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [aiStatus, setAiStatus] = useState({ online: null, provider: 'Checking status', model: '—' });
  const notifRef = useRef(null);

  // Derive human-readable page title and breadcrumb
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return { section: 'Public', title: 'IntelliReview' };
    if (path === '/dashboard') return { section: 'Workspace', title: 'Dashboard' };
    if (path.startsWith('/review')) return { section: 'Compiler', title: 'AI Review Workspace' };
    if (path.startsWith('/github')) return { section: 'Source Control', title: 'GitHub Integration' };
    if (path.startsWith('/history')) return { section: 'Intelligence', title: 'Scan History' };
    if (path.startsWith('/security')) return { section: 'Audit', title: 'Security Posture' };
    if (path.startsWith('/quality')) return { section: 'Audit', title: 'Code Quality' };
    if (path.startsWith('/performance')) return { section: 'Audit', title: 'Performance Diagnostics' };
    if (path.startsWith('/reports')) return { section: 'Export', title: 'Reports Center' };
    if (path.startsWith('/chat')) return { section: 'Assistant', title: 'AI Code Assistant' };
    if (path.startsWith('/settings')) return { section: 'System', title: 'Settings' };
    if (path.startsWith('/profile')) return { section: 'Account', title: 'User Profile' };
    return { section: 'Workspace', title: 'Overview' };
  };

  const breadcrumb = getBreadcrumb();

  useEffect(() => {
    fetchNotifications();
    fetchAiStatus();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchAiStatus();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await getNotifications({ limit: 5 });
      setUnreadCount(res.data.unread_count || 0);
      setNotifications(res.data.notifications || []);
    } catch {
      // silent
    }
  };

  const fetchAiStatus = async () => {
    try {
      const res = await getAiStatus();
      if (res.data) {
        setAiStatus({
          online: res.data.ai_available === true,
          provider: res.data.ai_available === true ? 'AI available' : 'AI unavailable',
          model: res.data.expected_model || 'Standard',
        });
      }
    } catch {
      setAiStatus({ online: false, provider: 'Static Fallback', model: 'Local AST' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between gap-4 px-4 lg:px-6 glass-command-bar bg-[#070A0F]/90">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg text-content-muted hover:text-content hover:bg-white/[0.06] transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs font-mono text-content-subtle truncate">
          <span className="hidden sm:inline">{breadcrumb.section}</span>
          <ChevronRight className="w-3.5 h-3.5 hidden sm:inline opacity-40" />
          <span className="font-display font-semibold text-sm text-content truncate">
            {breadcrumb.title}
          </span>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="flex-1 max-w-md hidden md:flex items-center mx-4">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#0D131C] border border-white/[0.08] hover:border-white/[0.16] hover:bg-[#121A25] transition-all text-xs font-mono text-content-muted group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-content-subtle group-hover:text-primary transition-colors" />
            <span>Search repositories, PRs, scans...</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[10px] text-content-subtle">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right: Live AI Indicator, Notifications & User */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Live AI Status Badge */}
        <div
          onClick={() => navigate('/settings')}
          className="cursor-pointer hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0D131C] border border-white/[0.08] hover:border-white/[0.14] transition-colors"
          title={`AI Engine: ${aiStatus.provider} (${aiStatus.model})`}
        >
          <Cpu className={cn("w-3.5 h-3.5", aiStatus.online ? "text-primary" : "text-amber-400")} />
          <StatusMark
            status={aiStatus.online === true ? "online" : aiStatus.online === false ? "warning" : "muted"}
            label={aiStatus.online === true ? "AI Online" : aiStatus.online === false ? "AI Unavailable" : "Checking"}
            className="border-0 bg-transparent p-0"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className={cn(
              'relative p-2 rounded-lg transition-colors',
              showNotifs
                ? 'bg-white/[0.08] text-content'
                : 'text-content-muted hover:text-content hover:bg-white/[0.05]'
            )}
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-[#070A0F] animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-[#0D131C] border border-white/[0.1] rounded-xl shadow-elevated z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#121A25]">
                  <h3 className="text-xs font-mono font-semibold text-content uppercase tracking-wider">
                    Notifications ({unreadCount})
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-mono text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-content-muted font-mono">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "px-4 py-3 text-xs transition-colors hover:bg-white/[0.03]",
                          !n.read && "bg-primary/[0.04]"
                        )}
                      >
                        <p className="font-semibold text-content">{n.title}</p>
                        <p className="text-content-muted text-[11px] mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu or Sign In */}
        <div className="hidden sm:block">
          {user ? (
            <Dropdown
              align="right"
              trigger={
                <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/[0.08]">
                  <Avatar size="sm" fallback={user?.username?.[0]?.toUpperCase()} />
                  <span className="text-xs font-mono text-content-muted">{user?.username}</span>
                </button>
              }
              items={[
                { label: 'View Profile', onClick: () => navigate('/profile') },
                { label: 'System Settings', onClick: () => navigate('/settings') },
                { label: 'GitHub Integration', onClick: () => navigate('/github') },
                { separator: true },
                { label: 'Sign Out', danger: true, onClick: logout }
              ]}
            />
          ) : (
            <button
              onClick={() => navigate('/?authRequired=1&destination=/review')}
              data-testid="navbar-signin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
export const Topbar = Navbar;
