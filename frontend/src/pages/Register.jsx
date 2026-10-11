import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Terminal, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button, Input } from '../components/ui';
import { GridScan } from '../components/reactbits/Bits';
import { GithubIcon } from '../lib/utils';

const passwordRules = [
  { label: 'Minimum 8 characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Numerical digit', test: (p) => /[0-9]/.test(p) },
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const passwordScore = passwordRules.filter((r) => r.test(form.password)).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match');
      toastError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      success('Account created! Welcome to IntelliReview.');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try a different email or username.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/github/oauth/authorize`;
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
            Create your account
          </h1>
          <p className="text-xs sm:text-sm font-mono text-content-muted mt-1">
            Get instant static analysis, ML severity classification, and automated PR reviews
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
            <span>Sign up with GitHub</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0D131C] px-3 text-[11px] font-mono text-content-subtle uppercase tracking-wider">
                or register with email
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
            <div>
              <label className="block text-xs font-mono text-content-muted mb-1.5">Developer Username</label>
              <Input
                type="text"
                icon={User}
                placeholder="linus"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                data-testid="username-input"
              />
            </div>

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
              <label className="block text-xs font-mono text-content-muted mb-1.5">Password</label>
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

              {/* Password Strength Indicator */}
              {form.password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((idx) => (
                      <div
                        key={idx}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          idx < passwordScore ? 'bg-primary' : 'bg-white/[0.08]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-content-subtle">
                    {passwordRules.map((rule, idx) => {
                      const passed = rule.test(form.password);
                      return (
                        <div key={idx} className="flex items-center gap-1">
                          <Check className={`w-3 h-3 ${passed ? 'text-primary' : 'text-content-subtle'}`} />
                          <span className={passed ? 'text-content-muted' : ''}>{rule.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-content-muted mb-1.5">Confirm Password</label>
              <Input
                type="password"
                icon={Lock}
                placeholder="••••••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                data-testid="confirm-password-input"
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full h-10 font-mono text-xs mt-3"
              size="md"
              data-testid="submit-btn"
            >
              Initialize Developer Account <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs font-mono text-content-subtle">
            Already registered?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
