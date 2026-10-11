import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Code2,
  GitBranch,
  ShieldAlert,
  Sparkles,
  Zap,
  History,
  FileBarChart,
  MessageSquare,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Terminal,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/review', label: 'AI Review', icon: Code2 },
  { path: '/github', label: 'GitHub', icon: GitBranch },
  { path: '/history', label: 'History', icon: History },
  { type: 'divider', label: 'Intelligence' },
  { path: '/security', label: 'Security', icon: ShieldAlert },
  { path: '/quality', label: 'Quality', icon: Sparkles },
  { path: '/performance', label: 'Performance', icon: Zap },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
  { path: '/chat', label: 'AI Assistant', icon: MessageSquare },
  { type: 'divider', label: 'Preferences' },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'Profile', icon: User },
];

export const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isRail = collapsed;

  const content = (
    <div className="flex flex-col h-full bg-[#070A0F] border-r border-white/[0.08] select-none">
      {/* Brand Header */}
      <div className={cn(
        "h-16 flex items-center border-b border-white/[0.08] shrink-0 transition-all px-4",
        isRail ? "justify-center" : "justify-between"
      )}>
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary p-[1px] shadow-cyanGlow/40">
            <div className="w-full h-full bg-[#070A0F] rounded-[7px] flex items-center justify-center">
              <Terminal className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          {!isRail && (
            <div className="flex flex-col">
              <span className="font-display font-bold text-sm tracking-tight text-content flex items-center gap-1.5">
                IntelliReview
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                  AI
                </span>
              </span>
              <span className="text-[10px] font-mono text-content-subtle tracking-wider uppercase">v2.0 Compiler</span>
            </div>
          )}
        </NavLink>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-md text-content-subtle hover:text-content hover:bg-white/[0.06] transition-colors"
          title={isRail ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isRail ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md text-content-subtle hover:text-content hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item, idx) => {
          if (item.type === 'divider') {
            if (isRail) {
              return <div key={idx} className="my-2 border-t border-white/[0.06]" />;
            }
            return (
              <div key={idx} className="px-3 pt-4 pb-1">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-content-subtle/80">
                  {item.label}
                </span>
              </div>
            );
          }

          const isActive = item.end
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              title={isRail ? item.label : undefined}
              className={cn(
                "relative group flex items-center rounded-lg text-xs font-medium transition-colors duration-150 py-2",
                isRail ? "justify-center px-2" : "gap-3 px-3",
                isActive
                  ? "text-primary font-semibold"
                  : "text-content-muted hover:text-content hover:bg-white/[0.04]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}

              <Icon className={cn(
                "w-4 h-4 shrink-0 transition-transform duration-150 relative z-10",
                isActive ? "text-primary" : "text-content-subtle group-hover:text-content-muted group-hover:scale-105"
              )} />

              {!isRail && (
                <span className="relative z-10 truncate tracking-wide">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className={cn(
        "p-3 border-t border-white/[0.08] shrink-0 bg-[#05070A]",
        isRail && "flex flex-col items-center gap-2"
      )}>
        {!isRail ? (
          user ? (
            <div className="flex items-center justify-between gap-2">
              <NavLink to="/profile" className="flex items-center gap-2.5 min-w-0 group">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-content truncate group-hover:text-primary transition-colors">
                    {user?.username || 'Developer'}
                  </p>
                  <p className="text-[10px] font-mono text-content-subtle truncate">
                    {user?.email || 'Logged in'}
                  </p>
                </div>
              </NavLink>
              <button
                onClick={logout}
                className="p-1.5 rounded text-content-subtle hover:text-danger hover:bg-danger/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-content-muted text-xs font-mono shrink-0">
                  G
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-content truncate">
                    Guest Mode
                  </p>
                  <p className="text-[10px] font-mono text-content-subtle truncate">
                    Instant Review Active
                  </p>
                </div>
              </div>
              <NavLink
                to="/?authRequired=1&destination=/review"
                className="px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors"
              >
                Sign In
              </NavLink>
            </div>
          )
        ) : (
          user ? (
            <>
              <NavLink to="/profile" title={user?.username || 'Profile'}>
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              </NavLink>
              <button
                onClick={logout}
                className="p-1.5 rounded text-content-subtle hover:text-danger hover:bg-danger/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <NavLink
              to="/?authRequired=1&destination=/review"
              title="Sign In"
              className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
            >
              G
            </NavLink>
          )
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col transition-all duration-200 ease-in-out",
          isRail ? "w-[72px]" : "w-[232px]"
        )}
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col lg:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
