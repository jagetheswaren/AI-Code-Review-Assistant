import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, Sun, Bell, Shield, Save, 
  Trash2, Cpu, Key, RefreshCw, AlertTriangle, CheckCircle2, 
  Sliders, Info, Sparkles, Terminal, Database, Lock
} from 'lucide-react';
import { GithubIcon } from '../lib/utils';
import { getSettings, updateSettings, getAiStatus, reloadMlModel, deleteAccount } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Select, Modal, PageLoader } from '../components/ui';
import { SquishSwitch, HoldButton, StatusMark, SpotlightCard, FadeContent } from '../components/reactbits/Bits';

export default function Settings() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications_enabled: true,
    email_notifications: false,
    default_language: 'python',
    auto_analyze: true,
    github_token: '',
    font_family: 'JetBrains Mono',
    reduced_motion: false
  });
  
  const [aiStatus, setAiStatus] = useState({
    ai_available: false,
    available: false,
    provider: 'none',
    model: null,
    fallback: 'static',
    message: 'Checking configured AI providers.',
    reachable: false,
    expected_model: null,
    base_url: null,
    ml_model_info: null,
    loading: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadingMl, setReloadingMl] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [settingsRes, aiRes] = await Promise.allSettled([
        getSettings(),
        getAiStatus()
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
        setSettings((prev) => ({ ...prev, ...settingsRes.value.data }));
      }

      if (aiRes.status === 'fulfilled' && aiRes.value.data) {
        setAiStatus({
          ai_available: aiRes.value.data.available === true || aiRes.value.data.ai_available === true,
          available: aiRes.value.data.available === true,
          provider: aiRes.value.data.provider || 'none',
          model: aiRes.value.data.model || null,
          fallback: aiRes.value.data.fallback || 'static',
          message: aiRes.value.data.message || null,
          next_command: aiRes.value.data.next_command || null,
          groq_status: aiRes.value.data.groq_status || 'unknown',
          ollama_status: aiRes.value.data.ollama_status || 'unknown',
          reachable: aiRes.value.data.reachable === true,
          expected_model: aiRes.value.data.expected_model || null,
          base_url: aiRes.value.data.base_url || null,
          ml_model_info: aiRes.value.data.ml_model_info,
          loading: false,
          error: aiRes.value.data.error
        });
      } else {
        setAiStatus((prev) => ({ ...prev, ai_available: false, loading: false }));
      }
    } catch {
      toast({ title: 'Error loading settings', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast({ title: 'Settings saved successfully', variant: 'success' });
    } catch {
      toast({ title: 'Failed to update settings', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleReloadModel() {
    setReloadingMl(true);
    try {
      await reloadMlModel();
      toast({ title: 'Random Forest ML Model reloaded into memory', variant: 'success' });
    } catch {
      toast({ title: 'Failed to reload ML Model', variant: 'error' });
    } finally {
      setReloadingMl(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteAccount();
      toast({ title: 'Account removed', variant: 'info' });
      logout();
    } catch {
      toast({ title: 'Failed to delete account', variant: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  function update(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <PageLoader message="Loading workspace preferences..." />;

  const tabs = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'ai', label: 'AI Provider', icon: Cpu },
    { id: 'github', label: 'GitHub', icon: GithubIcon },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ];

  return (
    <FadeContent className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">
              Settings & Preferences
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              CONFIG
            </span>
          </div>
          <p className="text-xs font-mono text-text-muted mt-1">
            Configure code review analysis rules, AI provider connections, and GitHub credentials.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-bg-main font-semibold self-start sm:self-auto">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#090D13] border border-white/[0.08] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#121A25] text-primary border border-primary/30 shadow-md font-semibold'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold">Analysis Execution</h3>
              <p className="text-xs text-text-muted mt-1">Rules governing automatic code ingestion and target runtime.</p>
            </div>
            <div className="md:col-span-2 space-y-4">
              <SpotlightCard className="p-5 rounded-2xl bg-[#0D131C] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Auto-Analyze on Ingestion</p>
                    <p className="text-xs text-text-muted">Trigger full Bandit + AST analysis immediately upon file upload</p>
                  </div>
                  <SquishSwitch
                    checked={settings.auto_analyze}
                    onChange={(v) => update('auto_analyze', v)}
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-text-muted mb-2 block">Primary Target Language</label>
                  <Select
                    value={settings.default_language}
                    onChange={(e) => update('default_language', e.target.value)}
                    options={[
                      { value: 'python', label: 'Python 3 (AST + Bandit + Radon + ML)' },
                      { value: 'javascript', label: 'JavaScript (ECMAScript 2024)' },
                      { value: 'typescript', label: 'TypeScript (Strict AST)' },
                    ]}
                    className="w-full bg-[#05070A] border-white/[0.08]"
                  />
                  <p className="text-[11px] font-mono text-primary mt-1.5 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Full multi-vector AST & ML classification currently optimized for Python.
                  </p>
                </div>
              </SpotlightCard>
            </div>
          </div>
        )}

        {/* AI PROVIDER TAB */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold">AI Provider Architecture</h3>
              <p className="text-xs text-text-muted mt-1">
                Configure Ollama local instances, Groq cloud acceleration, and static analysis fallbacks.
              </p>
            </div>
            <div className="md:col-span-2 space-y-4">
              {/* Live Provider Status Card */}
              <SpotlightCard className="p-5 rounded-2xl bg-[#0D131C] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <StatusMark status={aiStatus.ai_available ? 'online' : 'warning'} size={8} />
                    <div>
                      <p className="text-sm font-semibold font-mono text-text-primary">
                        {aiStatus.ai_available ? `${aiStatus.provider.toUpperCase()} connected` : 'Static-analysis fallback mode'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {aiStatus.ai_available ? 'Active model: ' : 'Model: '}
                        <span className="font-mono text-primary">{aiStatus.model || aiStatus.expected_model || 'No AI model connected'}</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAll}
                    className="text-xs font-mono border-white/[0.08]"
                  >
                    <RefreshCw className="w-3 h-3 mr-1.5" /> Re-check
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#05070A] border border-white/[0.06]">
                    <span className="text-text-muted block text-[11px]">Provider</span>
                    <span className="text-text-primary font-semibold truncate block mt-0.5">{aiStatus.provider}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#05070A] border border-white/[0.06]">
                    <span className="text-text-muted block text-[11px]">Fallback</span>
                    <span className="text-success font-semibold block mt-0.5">{aiStatus.fallback || 'static'} · static analysis ready</span>
                  </div>
                </div>

                {!aiStatus.ai_available && (
                  <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-xs text-warning leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{aiStatus.message || 'No AI provider is connected.'}</p>
                      <p className="text-[11px] mt-0.5 text-warning/90">
                        Groq: {aiStatus.groq_status || 'unknown'} · Ollama: {aiStatus.ollama_status || 'unknown'}. Static analysis remains available.
                        {aiStatus.next_command ? ` Next: ${aiStatus.next_command}` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </SpotlightCard>

              {/* Server-Side Credentials Notice */}
              <div className="p-4 rounded-xl bg-[#090D13] border border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold font-mono text-secondary">
                  <Lock className="w-4 h-4" /> Server-Side Environment Configuration
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  For security, API keys (<code className="text-primary font-mono">GROQ_API_KEY</code>, <code className="text-primary font-mono">GITHUB_CLIENT_SECRET</code>) are managed directly on the backend server in <code className="text-primary font-mono">.env</code> and are never transmitted to client browsers.
                </p>
                <div className="p-3 rounded-lg bg-[#05070A] border border-white/[0.04] text-[11px] font-mono text-text-secondary space-y-1">
                  <div>Configure server-side in backend/.env</div>
                  <div>GROQ_MODEL=openai/gpt-oss-120b</div>
                  <div>OLLAMA_MODEL=qwen2.5-coder:7b</div>
                </div>
              </div>

              {/* Machine Learning Model Control */}
              <SpotlightCard className="p-5 rounded-2xl bg-[#0D131C] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" /> Random Forest Classifier
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    Trained scikit-learn severity classification weights
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReloadModel}
                  disabled={reloadingMl}
                  className="text-xs font-mono border-white/[0.08] text-primary"
                >
                  <RefreshCw className={`w-3 h-3 mr-1.5 ${reloadingMl ? 'animate-spin' : ''}`} />
                  Reload Model
                </Button>
              </SpotlightCard>
            </div>
          </div>
        )}

        {/* GITHUB TAB */}
        {activeTab === 'github' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold">GitHub Integration</h3>
              <p className="text-xs text-text-muted mt-1">
                Personal Access Tokens (PAT) for reading repository diffs and posting automated review comments.
              </p>
            </div>
            <div className="md:col-span-2 space-y-4">
              <SpotlightCard className="p-5 rounded-2xl bg-[#0D131C] border border-white/[0.08] space-y-4">
                <div>
                  <label className="text-xs font-mono text-text-muted mb-1 block">GitHub Personal Access Token</label>
                  <Input
                    type="password"
                    value={settings.github_token}
                    onChange={(e) => update('github_token', e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="bg-[#05070A] border-white/[0.08] font-mono text-xs"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <StatusMark status={settings.github_token ? 'online' : 'muted'} size={6} />
                    <span className="text-[11px] font-mono text-text-muted">
                      {settings.github_token ? 'PAT securely stored in profile' : 'No personal token configured'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#05070A] border border-white/[0.04] text-xs text-text-muted space-y-1">
                  <p className="font-semibold text-text-secondary">Required GitHub Scopes:</p>
                  <ul className="list-disc list-inside text-[11px] font-mono space-y-0.5">
                    <li><span className="text-primary">repo</span> (Full repository read/write access)</li>
                    <li><span className="text-primary">read:user</span> (Read user profile data)</li>
                    <li><span className="text-primary">pull_requests</span> (Post review comments on PRs)</li>
                  </ul>
                </div>
              </SpotlightCard>
            </div>
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold">Interface & Typography</h3>
              <p className="text-xs text-text-muted mt-1">Editor font selection, theme contrast, and motion dynamics.</p>
            </div>
            <div className="md:col-span-2 space-y-4">
              <SpotlightCard className="p-5 rounded-2xl bg-[#0D131C] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Theme Palette</p>
                    <p className="text-xs text-text-muted">Graphite Base (#05070A) with Electric Cyan & Violet Accents</p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#121A25] border border-white/[0.1] text-primary">
                    Dark Graphite (Default)
                  </span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Reduced Motion (a11y)</p>
                    <p className="text-xs text-text-muted">Disable scanning beams and spring animations</p>
                  </div>
                  <SquishSwitch
                    checked={settings.reduced_motion}
                    onChange={(v) => update('reduced_motion', v)}
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-text-muted mb-2 block">Code Editor Typography</label>
                  <Select
                    value={settings.font_family}
                    onChange={(e) => update('font_family', e.target.value)}
                    options={[
                      { value: 'JetBrains Mono', label: 'JetBrains Mono (Recommended)' },
                      { value: 'Fira Code', label: 'Fira Code (with ligatures)' },
                      { value: 'Source Code Pro', label: 'Source Code Pro' },
                    ]}
                    className="w-full bg-[#05070A] border-white/[0.08]"
                  />
                </div>
              </SpotlightCard>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold">Alert Rules</h3>
              <p className="text-xs text-text-muted mt-1">Configure in-app and email alert preferences.</p>
            </div>
            <div className="md:col-span-2 space-y-4">
              <SpotlightCard className="p-5 rounded-2xl bg-[#0D131C] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">In-App Scan Notifications</p>
                    <p className="text-xs text-text-muted">Display toast notifications when reviews complete</p>
                  </div>
                  <SquishSwitch
                    checked={settings.notifications_enabled}
                    onChange={(v) => update('notifications_enabled', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Email Digest & Alerts</p>
                    <p className="text-xs text-text-muted">Receive security summaries when critical flaws are found</p>
                  </div>
                  <SquishSwitch
                    checked={settings.email_notifications}
                    onChange={(v) => update('email_notifications', v)}
                  />
                </div>
              </SpotlightCard>
            </div>
          </div>
        )}

        {/* DANGER ZONE TAB */}
        {activeTab === 'danger' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="text-xs font-mono uppercase tracking-wider text-danger font-bold">Irreversible Actions</h3>
              <p className="text-xs text-text-muted mt-1">Reset configurations or delete account data.</p>
            </div>
            <div className="md:col-span-2 space-y-4">
              <SpotlightCard className="p-5 rounded-2xl bg-[#0D131C] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Reset Workspace Defaults</h4>
                  <p className="text-xs text-text-muted mt-0.5">Reset language preferences, theme contrast, and layout settings.</p>
                </div>
                <HoldButton
                  holdTime={1000}
                  onComplete={() => {
                    update('default_language', 'python');
                    update('auto_analyze', true);
                    update('reduced_motion', false);
                    toast({ title: 'Workspace preferences reset', variant: 'info' });
                  }}
                  className="bg-[#121A25] border border-white/[0.08] text-xs font-mono text-text-primary hover:border-white/[0.2]"
                >
                  Hold to Reset
                </HoldButton>
              </SpotlightCard>

              <SpotlightCard className="p-5 rounded-2xl bg-danger/5 border border-danger/20 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-danger">Permanently Delete Account</h4>
                  <p className="text-xs text-text-muted mt-0.5">Delete all scan records, database metrics, and credentials.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(true)}
                  className="border-danger/40 text-danger hover:bg-danger/10 text-xs font-mono"
                >
                  Delete Account
                </Button>
              </SpotlightCard>
            </div>
          </div>
        )}
      </div>

      {/* Account Deletion Modal */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger/10 text-danger">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold font-display text-text-primary">Erase Account & Workspace</h2>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            This action cannot be undone. All your code review history, connected repository links, and custom rules will be permanently erased.
          </p>
          <div>
            <label className="text-xs font-mono text-text-muted mb-1 block">
              Type <span className="font-bold text-danger">DELETE</span> to confirm:
            </label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="border-danger/40 focus:border-danger bg-[#05070A] font-mono text-xs"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }} className="text-xs">
              Cancel
            </Button>
            <Button
              disabled={deleteConfirm !== 'DELETE' || deleting}
              onClick={handleDeleteAccount}
              className="bg-danger hover:bg-danger/90 text-white text-xs font-semibold"
            >
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </FadeContent>
  );
}
