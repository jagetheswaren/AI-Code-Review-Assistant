import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Key, Save, Trash2, Calendar, Camera, 
  Loader2, AlertTriangle, GitBranch, Shield, Activity, 
  CheckCircle2, ExternalLink, Terminal
} from 'lucide-react';
import { GithubIcon } from '../lib/utils';
import { getProfile, updateProfile, changePassword, deleteAccount, getDashboard, getGitHubStatus } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Modal, PageLoader } from '../components/ui';
import { SpotlightCard, FadeContent, CountUp, StatusMark } from '../components/reactbits/Bits';

export default function Profile() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total_reviews: null, critical_issues: null, health_score: null });
  const [githubStatus, setGithubStatus] = useState({ connected: false, username: null });
  const [editForm, setEditForm] = useState({ full_name: '', username: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [profileRes, dashRes, ghRes] = await Promise.allSettled([
        getProfile(),
        getDashboard(),
        getGitHubStatus()
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.data) {
        const p = profileRes.value.data;
        setProfile(p);
        setEditForm({
          full_name: p.full_name || '',
          username: p.username || '',
          email: p.email || '',
        });
      }

      if (dashRes.status === 'fulfilled' && dashRes.value.data) {
        const d = dashRes.value.data;
        setStats({
          total_reviews: d.statistics?.total_scans ?? null,
          critical_issues: d.statistics?.by_severity?.critical ?? null,
          health_score: d.health_score ?? null
        });
      }

      if (ghRes.status === 'fulfilled' && ghRes.value.data) {
        setGithubStatus(ghRes.value.data);
      }
    } catch {
      toast({ title: 'Error loading profile data', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e) {
    e?.preventDefault();
    setSaving(true);
    try {
      await updateProfile(editForm);
      toast({ title: 'Profile updated successfully', variant: 'success' });
      await loadAll();
    } catch {
      toast({ title: 'Failed to update profile', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e?.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({ title: 'New passwords do not match', variant: 'error' });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'warning' });
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(passwordForm.current_password, passwordForm.new_password);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      toast({ title: 'Password changed successfully', variant: 'success' });
    } catch {
      toast({ title: 'Current password verification failed', variant: 'error' });
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteAccount();
      toast({ title: 'Account deleted', variant: 'info' });
      logout();
    } catch {
      toast({ title: 'Failed to delete account', variant: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) return <PageLoader message="Loading developer profile..." />;
  if (!profile) return null;

  const initials = (profile.full_name || profile.username || 'DEV')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <FadeContent className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">
              Developer Profile
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              DEV_ID #{profile.id || profile._id?.slice(-6) || 'ACTIVE'}
            </span>
          </div>
          <p className="text-xs font-mono text-text-muted mt-1">
            Identity credentials, GitHub connectivity, and review activity records.
          </p>
        </div>
      </div>

      {/* Top Identity Card & Developer Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identity Overview */}
        <SpotlightCard className="p-6 rounded-2xl bg-[#0D131C] border border-white/[0.08] flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 via-[#121A25] to-secondary/20 border-2 border-primary/30 flex items-center justify-center shadow-xl">
              <span className="text-3xl font-bold font-display text-primary tracking-wider">{initials}</span>
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-[#0D131C] border border-white/[0.1]">
              <StatusMark status="online" size={10} />
            </div>
          </div>

          <h2 className="text-lg font-bold font-display text-text-primary">
            {profile.full_name || profile.username}
          </h2>
          <p className="text-xs font-mono text-primary mt-0.5">@{profile.username}</p>

          <div className="w-full my-4 border-t border-white/[0.06]" />

          <div className="w-full space-y-2.5 text-left text-xs font-mono">
            <div className="flex items-center justify-between text-text-muted">
              <span className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-text-secondary" /> Email
              </span>
              <span className="text-text-primary truncate max-w-[150px]">{profile.email}</span>
            </div>

            <div className="flex items-center justify-between text-text-muted">
              <span className="flex items-center gap-2">
                <GithubIcon className="w-3.5 h-3.5 text-text-secondary" /> GitHub
              </span>
              {githubStatus.connected || profile.github_username ? (
                <span className="text-success flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  {profile.github_username || githubStatus.username || 'Connected'}
                </span>
              ) : (
                <span className="text-text-muted">Not linked</span>
              )}
            </div>

            <div className="flex items-center justify-between text-text-muted">
              <span className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-text-secondary" /> Registered
              </span>
              <span className="text-text-primary">
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Active Member'}
              </span>
            </div>
          </div>
        </SpotlightCard>

        {/* Developer Review Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SpotlightCard className="p-5 rounded-2xl bg-[#0D131C] border border-white/[0.08] flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-xs font-mono uppercase tracking-wider">Total Scans Run</span>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-3xl font-bold font-display text-text-primary">
                {stats.total_reviews === null ? '—' : <CountUp to={stats.total_reviews} duration={0.8} />}
              </div>
              <p className="text-[11px] font-mono text-text-muted mt-1">Manual & PR reviews</p>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-5 rounded-2xl bg-[#0D131C] border border-white/[0.08] flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-xs font-mono uppercase tracking-wider">Critical Blocked</span>
              <AlertTriangle className="w-4 h-4 text-danger" />
            </div>
            <div>
              <div className="text-3xl font-bold font-display text-danger">
                {stats.critical_issues === null ? '—' : <CountUp to={stats.critical_issues} duration={0.8} />}
              </div>
              <p className="text-[11px] font-mono text-text-muted mt-1">High-risk vulnerabilities</p>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-5 rounded-2xl bg-[#0D131C] border border-white/[0.08] flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-xs font-mono uppercase tracking-wider">Code Health Score</span>
              <Shield className="w-4 h-4 text-success" />
            </div>
            <div>
              <div className="text-3xl font-bold font-display text-success">
                {stats.health_score === null ? '—' : <CountUp to={stats.health_score} duration={0.8} />}
                <span className="text-sm text-text-muted font-normal ml-1">/100</span>
              </div>
              <p className="text-[11px] font-mono text-text-muted mt-1">Repository average</p>
            </div>
          </SpotlightCard>

          {/* GitHub Integration Status Banner */}
          <div className="sm:col-span-3 p-4 rounded-xl bg-[#090D13] border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#121A25] border border-white/[0.06]">
                <GithubIcon className="w-5 h-5 text-text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold font-mono text-text-primary">
                  GitHub OAuth & Pull Request Integration
                </p>
                <p className="text-[11px] text-text-muted">
                  {githubStatus.connected
                    ? `Linked to GitHub account: @${githubStatus.username}`
                    : 'Connect your personal access token to automatically analyze pull requests.'}
                </p>
              </div>
            </div>
            <a
              href="/github"
              className="px-3 py-1.5 rounded-lg bg-[#121A25] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-primary flex items-center gap-1.5 transition-colors"
            >
              <span>Manage</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Forms Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <div className="p-6 rounded-2xl bg-[#0D131C] border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold font-mono text-text-primary uppercase tracking-wider pb-2 border-b border-white/[0.06]">
            <User className="w-4 h-4 text-primary" />
            Developer Identity
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-text-muted mb-1 block">Full Name</label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Ada Lovelace"
                className="bg-[#05070A] border-white/[0.08]"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-text-muted mb-1 block">Username</label>
              <Input
                value={editForm.username}
                onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="developer"
                className="bg-[#05070A] border-white/[0.08]"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-text-muted mb-1 block">Email Address</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="dev@example.com"
                className="bg-[#05070A] border-white/[0.08]"
              />
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-bg-main font-semibold">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="p-6 rounded-2xl bg-[#0D131C] border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold font-mono text-text-primary uppercase tracking-wider pb-2 border-b border-white/[0.06]">
            <Key className="w-4 h-4 text-secondary" />
            Security & Authentication
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-text-muted mb-1 block">Current Password</label>
              <Input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
                placeholder="••••••••••••"
                className="bg-[#05070A] border-white/[0.08]"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-text-muted mb-1 block">New Password</label>
              <Input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                placeholder="••••••••••••"
                className="bg-[#05070A] border-white/[0.08]"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-text-muted mb-1 block">Confirm New Password</label>
              <Input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                placeholder="••••••••••••"
                className="bg-[#05070A] border-white/[0.08]"
              />
            </div>
            <div className="pt-2">
              <Button
                type="submit"
                disabled={changingPassword || !passwordForm.current_password || !passwordForm.new_password}
                className="bg-secondary/80 hover:bg-secondary text-white font-semibold"
              >
                <Key className="w-4 h-4 mr-2" />
                {changingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-2xl bg-danger/5 border border-danger/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold font-mono text-danger uppercase tracking-wider flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Danger Zone: Erase Account
          </h3>
          <p className="text-xs text-text-muted mt-1 max-w-xl">
            Permanently delete your account, linked repositories, and all recorded review history. This action cannot be undone.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowDeleteModal(true)}
          className="border-danger/40 text-danger hover:bg-danger/10 hover:border-danger text-xs font-mono shrink-0"
        >
          Delete Account
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger/10 text-danger">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold font-display text-text-primary">Permanently Delete Account</h2>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            All code analyses, scan metrics, and settings associated with <span className="text-text-primary font-mono font-bold">@{profile.username}</span> will be permanently purged from the database.
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
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Yes, Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </FadeContent>
  );
}
