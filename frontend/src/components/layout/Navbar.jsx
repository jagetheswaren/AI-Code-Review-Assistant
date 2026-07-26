import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sun,
  Moon,
  Bell,
  Menu,
  LogOut,
  Settings,
  User,
  CheckCheck,
  Command,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications, markAllNotificationsRead } from '../../api/client';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui';

const Navbar = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const isDark = theme === 'dark';

  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications({ limit: 10 });
      setUnreadCount(res.data.unread_count || 0);
      setNotifications(res.data.notifications || []);
    } catch (err) { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) { /* silent */ }
  };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-4 px-4 lg:px-6 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative max-w-md w-full">
          <Search
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none',
              searchFocused ? 'text-[#2563EB]' : 'text-slate-500'
            )}
          />
          <input
            type="text"
            placeholder="Search code, repos, scans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              'w-full pl-10 pr-20 py-2 rounded-lg text-sm font-medium placeholder-slate-500 outline-none transition-all duration-200 border',
              searchFocused
                ? 'bg-white/10 text-white border-[#2563EB]/50 ring-1 ring-[#2563EB]/20'
                : 'bg-white/5 text-slate-300 border-transparent hover:bg-white/10'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 border border-white/[0.06] rounded text-[10px] text-slate-500 font-mono">
            <Command className="w-3 h-3" />K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isDark ? 'text-amber-400 hover:bg-amber-400/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
          )}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </motion.button>

        <div className="relative" ref={notifRef}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
            className={cn(
              'relative p-2 rounded-lg transition-colors',
              showNotifs ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#0F172A]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-[#1E293B] backdrop-blur-xl rounded-xl shadow-2xl shadow-black/40 border border-white/[0.06] z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-[#60A5FA] transition-colors">
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'px-4 py-3 border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] cursor-pointer',
                            !n.read && 'bg-[#2563EB]/5'
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">{n.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                              {n.created_at && (
                                <p className="text-[10px] text-slate-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="relative hidden lg:block" ref={userMenuRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
            className={cn(
              'flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg transition-colors',
              showUserMenu ? 'bg-white/10' : 'hover:bg-white/5'
            )}
          >
            <Avatar
              size="sm"
              fallback={user?.username?.[0]?.toUpperCase()}
            />
            <span className="text-sm font-medium text-slate-300">{user?.username || 'User'}</span>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-[#1E293B] backdrop-blur-xl rounded-xl shadow-2xl shadow-black/40 border border-white/[0.06] z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-white">{user?.username || 'User'}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                  </div>
                  <div className="py-1">
                    <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <User className="w-4 h-4 text-slate-500" />
                      Profile
                    </Link>
                    <Link to="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <Settings className="w-4 h-4 text-slate-500" />
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-white/[0.06] py-1">
                    <button onClick={() => { setShowUserMenu(false); logout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:hidden">
          <Avatar size="sm" fallback={user?.username?.[0]?.toUpperCase()} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
