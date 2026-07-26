import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Sun, Moon, Bell, BellOff, Key, Shield, Save, Trash2 } from 'lucide-react';
import { cn, GithubIcon } from '../lib/utils';
import { getSettings, updateSettings } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { Button, Card, CardHeader, CardTitle, Input, Select, Modal, EmptyState, PageLoader } from '../components/ui';

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications_enabled: true,
    email_notifications: false,
    default_language: 'python',
    auto_analyze: true,
    github_token: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await getSettings();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast({ title: 'Settings saved', variant: 'success' });
    } catch {
      toast({ title: 'Failed to save settings', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function update(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <PageLoader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/[0.05]">
            <SettingsIcon className="w-5 h-5 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <Card className="bg-[#111827] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sun className="w-4 h-4 text-slate-400" />
            Appearance
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Theme</p>
              <p className="text-xs text-slate-400">Currently using {settings.theme} mode</p>
            </div>
            <button
              onClick={() => update('theme', settings.theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                settings.theme === 'dark' ? 'bg-blue-500' : 'bg-slate-600'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                  settings.theme === 'dark' && 'translate-x-6'
                )}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card className="bg-[#111827] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-400" />
            Notifications
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Scan Notifications</p>
              <p className="text-xs text-slate-400">Get notified when scans complete</p>
            </div>
            <button
              onClick={() => update('notifications_enabled', !settings.notifications_enabled)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                settings.notifications_enabled ? 'bg-blue-500' : 'bg-slate-600'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                  settings.notifications_enabled && 'translate-x-6'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Email Notifications</p>
              <p className="text-xs text-slate-400">Receive reports via email</p>
            </div>
            <button
              onClick={() => update('email_notifications', !settings.email_notifications)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                settings.email_notifications ? 'bg-blue-500' : 'bg-slate-600'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                  settings.email_notifications && 'translate-x-6'
                )}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card className="bg-[#111827] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            Analysis
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div>
            <p className="text-sm text-white mb-2">Default Language</p>
            <Select
              value={settings.default_language}
              onChange={(e) => update('default_language', e.target.value)}
              className="bg-white/[0.05] border-white/[0.06] text-white"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Auto-Analyze</p>
              <p className="text-xs text-slate-400">Automatically analyze on upload</p>
            </div>
            <button
              onClick={() => update('auto_analyze', !settings.auto_analyze)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                settings.auto_analyze ? 'bg-blue-500' : 'bg-slate-600'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                  settings.auto_analyze && 'translate-x-6'
                )}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card className="bg-[#111827] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GithubIcon className="w-4 h-4 text-slate-400" />
            GitHub Integration
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6 space-y-3">
          <div>
            <p className="text-sm text-white mb-2">Personal Access Token</p>
            <Input
              type="password"
              value={settings.github_token}
              onChange={(e) => update('github_token', e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="bg-white/[0.05] border-white/[0.06] text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', settings.github_token ? 'bg-emerald-400' : 'bg-slate-500')} />
            <span className="text-xs text-slate-400">
              {settings.github_token ? 'Connected' : 'Not connected'}
            </span>
          </div>
        </div>
      </Card>

      <Card className="bg-[#111827] border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <p className="text-sm text-slate-400 mb-4">Permanently delete your account and all associated data.</p>
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </Card>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Delete Account</h2>
          <p className="text-sm text-slate-400">This action is irreversible. All your data will be permanently deleted.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" className="border-white/[0.06] text-slate-400" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={() => setShowDeleteModal(false)}>
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
