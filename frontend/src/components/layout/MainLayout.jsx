import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { CommandPalette } from './CommandPalette';
import { Dock } from '../reactbits/Bits';
import {
  LayoutDashboard,
  Code2,
  GitBranch,
  History,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const mobileDockItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/review', label: 'Review', icon: Code2 },
  { path: '/github', label: 'GitHub', icon: GitBranch },
  { path: '/history', label: 'History', icon: History },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#05070A] text-content">
      {/* Sidebar (Desktop Persistent & Mobile Drawer) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      
      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out",
        collapsed ? "lg:pl-[72px]" : "lg:pl-[232px]"
      )}>
        <Navbar 
          onMenuClick={() => setSidebarOpen(true)} 
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto relative pb-20 lg:pb-8">
          <div key={location.pathname} className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto animate-normal-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Dock Navigation */}
      <div className="lg:hidden">
        <Dock
          items={mobileDockItems}
          activePath={location.pathname}
          onNavigate={(path) => navigate(path)}
        />
      </div>

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </div>
  );
};

export default MainLayout;
