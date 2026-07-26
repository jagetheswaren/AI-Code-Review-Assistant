import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ScanSearch, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button, Input } from '../components/ui';
import { cn, GithubIcon } from '../lib/utils';

const passwordChecks = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains number', test: (p) => /[0-9]/.test(p) },
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = passwordChecks.filter((c) => c.test(form.password)).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toastError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      success('Account created! Welcome aboard.');
      navigate('/');
    } catch (err) {
      toastError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0F172A]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#7C3AED] to-[#2563EB] items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-32 right-20 w-72 h-72 bg-white/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-32 left-20 w-60 h-60 bg-white/10 rounded-full blur-[60px]" />
        </div>
        <div className="relative z-10 px-12 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ScanSearch className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">IntelliReview</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Start shipping cleaner code today</h2>
          <p className="text-white/80 text-lg leading-relaxed">Join thousands of developers who trust IntelliReview to keep their code clean, secure, and performant.</p>
          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              { value: '50K+', label: 'Lines analyzed' },
              { value: '2.5K', label: 'Issues found' },
              { value: '98%', label: 'Accuracy' },
              { value: '100+', label: 'Active users' },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
              <ScanSearch className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">IntelliReview</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-sm text-slate-400 mb-8">Get started with IntelliReview in seconds</p>

          <button onClick={() => window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/github/oauth/authorize`} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/[0.06] text-sm font-medium text-white hover:bg-white/10 transition-colors mb-6">
            <GithubIcon className="w-5 h-5" />
            Continue with GitHub
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
            <div className="relative flex justify-center"><span className="bg-[#0F172A] px-3 text-xs text-slate-500">or sign up with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Username" icon={User} placeholder="johndoe" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            <Input label="Email" type="email" icon={Mail} placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'} icon={Lock} placeholder="Create a strong password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-slate-500 hover:text-slate-300 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {form.password && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i < passwordStrength ? 'bg-emerald-400' : 'bg-white/10')} />
                  ))}
                </div>
                <div className="space-y-1">
                  {passwordChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Check className={cn('w-3 h-3', check.test(form.password) ? 'text-emerald-400' : 'text-slate-600')} />
                      <span className={check.test(form.password) ? 'text-slate-300' : 'text-slate-500'}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Input label="Confirm Password" type="password" icon={Lock} placeholder="Confirm your password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />

            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}

            <Button type="submit" loading={loading} disabled={form.password !== form.confirmPassword} className="w-full" size="lg">
              Create Account <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-sm text-slate-400 text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2563EB] hover:text-[#60A5FA] font-medium transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
