import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Code2,
  GitBranch,
  GitPullRequest,
  Shield,
  Zap,
  BarChart3,
  FileText,
  MessageSquare,
  Bell,
  Settings,
  User,
  LogOut,
  X,
  ScanSearch,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { type: 'divider', label: 'Analysis' },
  { path: '/review', label: 'AI Code Review', icon: Code2 },
  { path: '/github', label: 'Repositories', icon: GitBranch },
  { type: 'divider', label: 'Intelligence' },
  { path: '/history', label: 'Scan History', icon: ScanSearch },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/chat', label: 'AI Assistant', icon: MessageSquare },
  { type: 'divider', label: 'Account' },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'Profile', icon: User },
];

const SidebarContent = ({ onClose, user, logout }) => (
  <div className="flex flex-col h-full">
    <div className="px-5 py-5 border-b border-white/[0.06]">
      <div className="flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-lg shadow-[#2563EB]/20">
            <ScanSearch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[15px] text-white tracking-tight">IntelliReview</h1>
            <p className="text-[11px] text-slate-500 font-medium">AI Code Review</p>
          </div>
        </NavLink>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>

    <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
      {navItems.map((item, i) => {
        if (item.type === 'divider') {
          return (
            <div key={i} className="px-3 pt-4 pb-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{item.label}</p>
            </div>
          );
        }
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onClose}
          >
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer relative',
                  isActive
                    ? 'bg-[#2563EB]/10 text-[#2563EB]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#2563EB]"
                    transition={{ type: 'spring', duration: 0.3, stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    'w-[18px] h-[18px] shrink-0 transition-colors',
                    isActive ? 'text-[#2563EB]' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="min-w-[20px] h-5 px-1.5 bg-[#2563EB]/20 text-[#60A5FA] text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </motion.div>
            )}
          </NavLink>
        );
      })}
    </nav>

    <div className="p-3 border-t border-white/[0.06]">
      <div className="flex items-center gap-3 px-3 py-2 mb-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white/[0.06]">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{user?.username || 'User'}</p>
          <p className="text-[11px] text-slate-500 truncate">{user?.email || ''}</p>
        </div>
      </div>
      <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={logout}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150"
      >
        <LogOut className="w-[18px] h-[18px] shrink-0" />
        Logout
      </motion.button>
    </div>
  </div>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  return (
    <>
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[260px] lg:flex-col bg-[#0F172A] border-r border-white/[0.06]">
        <SidebarContent user={user} logout={logout} />
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-[#0F172A] border-r border-white/[0.06] lg:hidden"
            >
              <SidebarContent onClose={onClose} user={user} logout={logout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
