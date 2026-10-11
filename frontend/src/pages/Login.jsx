import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Terminal, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button, Input } from '../components/ui';
import { GridScan } from '../components/reactbits/Bits';
import { GithubIcon } from '../lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      success('Welcome back!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid credentials. Please verify your email and password.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/github/oauth/config`);
      const data = await res.json();
      if (!data?.configured) {
        const msg = 'GitHub OAuth App is not configured. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to backend/.env, or sign in using your email and password.';
        setErrorMessage(msg);
        toastError(msg);
        return;
      }
      window.location.href = `${apiUrl}/github/oauth/authorize`;
    } catch {
      const msg = 'GitHub OAuth App is not configured. Please sign in with email and password, or connect your Personal Access Token in Settings.';
      setErrorMessage(msg);
      toastError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#05070A] text-content relative overflow-hidden select-none">
      {/* Background Grid */}
      <GridScan className="opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary p-[1px] shadow-cyanGlow/30">
              <div className="w-full h-full bg-[#070A0F] rounded-[11px] flex items-center justify-center">
                <Terminal className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-content">IntelliReview AI</span>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-content tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm font-mono text-content-muted mt-1">
            Sign in to access your compiler intelligence workspace
          </p>
        </div>

        {/* Auth Card Container */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0D131C] border border-white/[0.08] shadow-2xl relative">
          
          {/* GitHub OAuth Button */}
          <button
            type="button"
            onClick={handleGithubLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-[#121A25] border border-white/[0.08] hover:border-white/[0.16] hover:bg-[#171E29] text-xs font-mono font-medium text-content transition-all shadow-subtle group"
          >
            <GithubIcon className="w-4 h-4 text-content group-hover:text-primary transition-colors" />
            <span>Continue with GitHub</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0D131C] px-3 text-[11px] font-mono text-content-subtle uppercase tracking-wider">
                or sign in with email
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/25 text-xs text-danger flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div>
              <label className="block text-xs font-mono text-content-muted mb-1.5">Email address</label>
              <Input
                type="email"
                icon={Mail}
                placeholder="developer@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                data-testid="email-input"
              />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono text-content-muted">Password</label>
                <span className="text-[11px] font-mono text-primary/80 hover:text-primary cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  icon={Lock}
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-subtle hover:text-content transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center text-xs font-mono text-content-muted pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-white/20 bg-[#070A0F] text-primary focus:ring-primary/40 focus:ring-offset-0"
                />
                <span>Remember this terminal session</span>
              </label>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full h-10 font-mono text-xs mt-2"
              size="md"
              data-testid="submit-btn"
            >
              Sign In to Workspace <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs font-mono text-content-subtle">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold">
              Create account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
