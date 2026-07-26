import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ScanSearch } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button, Input } from '../components/ui';
import { GithubIcon } from '../lib/utils';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      success('Welcome back!');
      navigate('/');
    } catch (err) {
      toastError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const githubLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/github/oauth/authorize`;
  };

  return (
    <div className="min-h-screen flex bg-[#0F172A]">
      {/* Left panel - brand */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#2563EB] to-[#7C3AED] items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-white/10 rounded-full blur-[60px]" />
        </div>
        <div className="relative z-10 px-12 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ScanSearch className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">IntelliReview</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">AI-Powered Code Reviews for Modern Teams</h2>
          <p className="text-white/80 text-lg leading-relaxed">Automated security scanning, code smell detection, performance analysis, and intelligent fix suggestions.</p>
          <div className="mt-12 space-y-4">
            {['Deep security analysis with Bandit & AST', 'ML-powered severity prediction', 'Real-time GitHub PR integration'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
              <ScanSearch className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">IntelliReview</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-sm text-slate-400 mb-8">Sign in to your account to continue</p>

          <button onClick={githubLogin} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/[0.06] text-sm font-medium text-white hover:bg-white/10 transition-colors mb-6">
            <GithubIcon className="w-5 h-5" />
            Continue with GitHub
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
            <div className="relative flex justify-center"><span className="bg-[#0F172A] px-3 text-xs text-slate-500">or continue with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-slate-500 hover:text-slate-300 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400">
                <input type="checkbox" className="rounded border-white/20 bg-white/5" />
                Remember me
              </label>
              <button type="button" className="text-[#2563EB] hover:text-[#60A5FA] transition-colors text-sm">Forgot password?</button>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-sm text-slate-400 text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#2563EB] hover:text-[#60A5FA] font-medium transition-colors">Sign up free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
