import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Key, Save, Trash2, Calendar, Camera, Loader2, AlertTriangle } from 'lucide-react';
import { cn, GithubIcon } from '../lib/utils';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, CardHeader, CardTitle, Input, Modal, EmptyState, PageLoader } from '../components/ui';

export default function Profile() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', username: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
      setEditForm({
        full_name: data.full_name || '',
        username: data.username || '',
        email: data.email || '',
      });
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await updateProfile(editForm);
      await loadProfile();
      toast({ title: 'Profile updated', variant: 'success' });
    } catch {
      toast({ title: 'Failed to update profile', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({ title: 'Passwords do not match', variant: 'error' });
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(passwordForm.current_password, passwordForm.new_password);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      toast({ title: 'Password changed', variant: 'success' });
    } catch {
      toast({ title: 'Failed to change password', variant: 'error' });
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      logout();
    } catch {
      toast({ title: 'Failed to delete account', variant: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  function updateEdit(key, value) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePassword(key, value) {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <PageLoader />;
  if (!profile) return <EmptyState icon={User} title="Profile not found" />;

  const initial = (profile.full_name || profile.username || 'U')[0].toUpperCase();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/[0.05]">
          <User className="w-5 h-5 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
      </div>

      <Card className="bg-[#111827] border-white/[0.06]">
        <div className="p-6 flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{initial}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#111827] border border-white/[0.06]">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">{profile.full_name || profile.username}</h2>
            <p className="text-sm text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {profile.email}
            </p>
            {profile.github_username && (
              <p className="text-sm text-slate-400 flex items-center gap-1.5">
                <GithubIcon className="w-3.5 h-3.5" />
                {profile.github_username}
              </p>
            )}
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      <Card className="bg-[#111827] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white">Edit Profile</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Full Name</label>
            <Input
              value={editForm.full_name}
              onChange={(e) => updateEdit('full_name', e.target.value)}
              className="bg-white/[0.05] border-white/[0.06] text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Username</label>
            <Input
              value={editForm.username}
              onChange={(e) => updateEdit('username', e.target.value)}
              className="bg-white/[0.05] border-white/[0.06] text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Email</label>
            <Input
              type="email"
              value={editForm.email}
              onChange={(e) => updateEdit('email', e.target.value)}
              className="bg-white/[0.05] border-white/[0.06] text-white"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Card>

      <Card className="bg-[#111827] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-400" />
            Change Password
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Current Password</label>
            <Input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => updatePassword('current_password', e.target.value)}
              className="bg-white/[0.05] border-white/[0.06] text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">New Password</label>
            <Input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => updatePassword('new_password', e.target.value)}
              className="bg-white/[0.05] border-white/[0.06] text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Confirm Password</label>
            <Input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => updatePassword('confirm_password', e.target.value)}
              className="bg-white/[0.05] border-white/[0.06] text-white"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
            <Key className="w-4 h-4 mr-2" />
            {changingPassword ? 'Changing...' : 'Change Password'}
          </Button>
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

      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Delete Account</h2>
          </div>
          <p className="text-sm text-slate-400">
            This action is irreversible. Type <span className="font-mono text-red-400">DELETE</span> to confirm.
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="bg-white/[0.05] border-white/[0.06] text-white"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" className="border-white/[0.06] text-slate-400" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleteConfirm !== 'DELETE' || deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
