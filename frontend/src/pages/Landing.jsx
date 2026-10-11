import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Zap,
  Cpu,
  GitBranch,
  Terminal,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileCode2,
  Sparkles,
  ChevronRight,
  Database,
  BarChart3,
  Layers,
  Code2,
  AlertTriangle,
  Play,
  Share2,
  Mail,
  Eye,
  EyeOff,
  User,
  Check,
  X,
} from 'lucide-react';
import { GithubIcon } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  TechText,
  SplitText,
  ShinyText,
  DecryptedText,
  ElectricBorder,
  SpotlightCard,
  MagicBento,
  GridScan,
  Stepper,
  StatusMark,
  Magnet,
} from '../components/reactbits/Bits';
import { Button, Badge } from '../components/ui';

export const AuthModal = ({ isOpen, onClose, destination = '/dashboard' }) => {
  const { login, register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const passwordRules = [
    { label: '8+ chars', test: (p) => p.length >= 8 },
    { label: 'A-Z', test: (p) => /[A-Z]/.test(p) },
    { label: '0-9', test: (p) => /[0-9]/.test(p) },
  ];
  const passwordScore = passwordRules.filter((rule) => rule.test(registerForm.password)).length;

  const handleClose = () => {
    setErrorMessage('');
    setLoginForm({ email: '', password: '' });
    setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
    onClose();
  };

  const handleAuthSuccess = () => {
    handleClose();
    navigate(destination);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await login(loginForm.email, loginForm.password);
      success('Welcome back!');
      handleAuthSuccess();
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid credentials. Please verify your email and password.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (registerForm.password !== registerForm.confirmPassword) {
      const msg = 'Passwords do not match';
      setErrorMessage(msg);
      toastError(msg);
      return;
    }

    setLoading(true);

    try {
      await register(registerForm.username, registerForm.email, registerForm.password);
      success('Account created successfully.');
      handleAuthSuccess();
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05070A]/80 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0D131C] shadow-2xl"
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-3 p-2 rounded-lg text-content-subtle hover:text-content hover:bg-white/[0.04]"
              aria-label="Close auth dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 sm:p-8">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary p-[1px] shadow-cyanGlow/40">
                  <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#070A0F]">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h2 className="font-display text-2xl font-bold text-content">Access your workspace</h2>
                <p className="mt-2 text-xs font-mono text-content-muted">Sign in or create an account to unlock review pipelines and GitHub sync.</p>
              </div>

              <div className="mb-5 flex rounded-lg border border-white/[0.08] bg-[#121A25] p-1">
                {['login', 'register'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => { setMode(tab); setErrorMessage(''); }}
                    className={`flex-1 rounded-md px-3 py-2 text-xs font-mono font-medium transition-colors ${
                      mode === tab ? 'bg-primary text-[#05070A]' : 'text-content-muted hover:text-content'
                    }`}
                  >
                    {tab === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGithubLogin}
                className="mb-5 flex w-full items-center justify-center gap-3 rounded-lg border border-white/[0.08] bg-[#121A25] px-4 py-2.5 text-xs font-mono font-medium text-content transition-colors hover:border-white/[0.16] hover:bg-[#171E29]"
              >
                <GithubIcon className="h-4 w-4" />
                Continue with GitHub
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-content-subtle">or</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              {errorMessage && (
                <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{errorMessage}</div>
              )}

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-mono text-content-muted">Email</label>
                    <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#05070A] px-3">
                      <Mail className="h-4 w-4 text-content-subtle" />
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="developer@company.com"
                        className="w-full bg-transparent py-2.5 text-sm text-content placeholder:text-content-subtle focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-mono text-content-muted">Password</label>
                    <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#05070A] px-3">
                      <Lock className="h-4 w-4 text-content-subtle" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                        placeholder="••••••••••••"
                        className="w-full bg-transparent py-2.5 text-sm text-content placeholder:text-content-subtle focus:outline-none"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-content-subtle hover:text-content">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" isLoading={loading} className="h-11 w-full font-mono text-xs" size="md">
                    Sign In to Workspace <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-mono text-content-muted">Username</label>
                    <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#05070A] px-3">
                      <User className="h-4 w-4 text-content-subtle" />
                      <input
                        type="text"
                        value={registerForm.username}
                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, username: event.target.value }))}
                        placeholder="linus"
                        className="w-full bg-transparent py-2.5 text-sm text-content placeholder:text-content-subtle focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-mono text-content-muted">Email</label>
                    <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#05070A] px-3">
                      <Mail className="h-4 w-4 text-content-subtle" />
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="developer@company.com"
                        className="w-full bg-transparent py-2.5 text-sm text-content placeholder:text-content-subtle focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-mono text-content-muted">Password</label>
                    <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#05070A] px-3">
                      <Lock className="h-4 w-4 text-content-subtle" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={registerForm.password}
                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                        placeholder="••••••••••••"
                        className="w-full bg-transparent py-2.5 text-sm text-content placeholder:text-content-subtle focus:outline-none"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-content-subtle hover:text-content">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {registerForm.password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((index) => (
                            <div key={index} className={`h-1.5 flex-1 rounded-full ${index < passwordScore ? 'bg-primary' : 'bg-white/[0.08]'}`} />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-content-subtle">
                          {passwordRules.map((rule, index) => {
                            const passed = rule.test(registerForm.password);
                            return (
                              <div key={index} className="flex items-center gap-1">
                                <Check className={`h-3 w-3 ${passed ? 'text-primary' : 'text-content-subtle'}`} />
                                <span>{rule.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-mono text-content-muted">Confirm password</label>
                    <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#05070A] px-3">
                      <Lock className="h-4 w-4 text-content-subtle" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={registerForm.confirmPassword}
                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                        placeholder="••••••••••••"
                        className="w-full bg-transparent py-2.5 text-sm text-content placeholder:text-content-subtle focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" isLoading={loading} className="h-11 w-full font-mono text-xs" size="md">
                    Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function Landing() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const authDestination = location.state?.destination || new URLSearchParams(window.location.search).get('destination') || '/dashboard';
  const [authModalOpen, setAuthModalOpen] = useState(Boolean(location.state?.authRequired || new URLSearchParams(window.location.search).get('authRequired')));

  useEffect(() => {
    setAuthModalOpen(Boolean(location.state?.authRequired || new URLSearchParams(window.location.search).get('authRequired')));
  }, [location.state]);

  const openAuthModal = (nextPath = '/dashboard') => {
    if (token) {
      navigate(nextPath);
      return;
    }

    navigate('/', { state: { authRequired: true, destination: nextPath }, replace: true });
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-content selection:bg-primary/20 selection:text-primary relative overflow-x-hidden">
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        destination={authDestination}
      />

      {/* Ambient Grid and Light */}
      <GridScan className="opacity-60" />

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 glass-command-bar bg-[#05070A]/80 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary p-[1px] shadow-cyanGlow/40">
              <div className="w-full h-full bg-[#05070A] rounded-[7px] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base tracking-tight text-content">IntelliReview</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                AI v2
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-xs font-mono text-content-muted">
            <a href="#pipeline" className="hover:text-primary transition-colors">Pipeline</a>
            <a href="#features" className="hover:text-primary transition-colors">Architecture</a>
            <a href="#security" className="hover:text-primary transition-colors">Security</a>
            <a href="#ml" className="hover:text-primary transition-colors">ML Engine</a>
            <a href="#github" className="hover:text-primary transition-colors">GitHub PR</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              data-testid="nav-login"
              className="inline-flex items-center justify-center rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-xs font-mono text-content-muted transition-colors hover:text-content hover:border-white/[0.16]"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              data-testid="nav-register"
              className="hidden sm:inline-flex items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-mono text-content-muted transition-colors hover:text-content hover:border-white/[0.16]"
            >
              Register
            </Link>
            <button 
              type="button" 
              onClick={() => navigate('/review')} 
              data-testid="nav-start-review"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-mono text-[#05070A] shadow-cyanGlow/30 transition-opacity hover:opacity-95"
            >
              Start Reviewing <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-content-muted">
              <StatusMark status="online" label="Compiler v2.0 Live" className="border-0 p-0" />
              <span className="text-white/20">|</span>
              <span>Python AST + ML + LLM</span>
            </div>

            <h1 data-testid="hero-title" className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-content leading-[1.05]">
              <SplitText text="Review code before" className="inline-block" delay={25} duration={0.6} /> <br />
              <span className="bg-gradient-to-r from-primary via-cyan-300 to-secondary bg-clip-text text-transparent">
                problems reach production.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-content-muted leading-relaxed max-w-xl">
              Next-generation developer tooling that combines Python AST parsing, Bandit security auditing, Random Forest severity classification, and context-aware AI review into a unified workflow.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Magnet padding={50} magnetStrength={3.5}>
                <button 
                  type="button" 
                  onClick={() => navigate('/review')} 
                  data-testid="hero-start-review"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 h-12 text-sm font-mono text-[#05070A] shadow-cyanGlow/30 transition-opacity hover:opacity-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Live Review
                </button>
              </Magnet>
              <button 
                type="button" 
                onClick={() => openAuthModal('/github')} 
                data-testid="hero-connect-github"
                className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-[#0D131C] px-6 h-12 text-sm font-mono text-content transition-colors hover:border-white/[0.16] hover:bg-[#121A25]"
              >
                <GithubIcon className="w-4 h-4" />
                Connect GitHub
              </button>
            </div>

          </div>

          <div className="lg:col-span-6">
            <ElectricBorder active={false} color="#63E6FF">
              <div className="rounded-xl bg-[#090D13] border border-white/[0.1] shadow-2xl overflow-hidden font-mono text-xs">
                <div className="flex items-center justify-between px-4 py-3 bg-[#0D131C] border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    <span className="ml-2 text-content-muted text-[11px]">example.py</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20">
                      EXAMPLE
                    </span>
                  </div>
                </div>

                <div className="relative p-4 sm:p-5 bg-[#090D13] overflow-hidden leading-6">
                  <div className="space-y-1">
                    <div className="flex gap-4">
                      <span className="text-content-subtle select-none w-6 text-right">01</span>
                      <span className="text-blue-400">import <span className="text-content">os</span></span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-content-subtle select-none w-6 text-right">02</span>
                      <span className="text-blue-400">import <span className="text-content">hashlib</span></span>
                    </div>
                    <div className="flex gap-4 px-1 rounded">
                      <span className="text-content-subtle select-none w-6 text-right">03</span>
                      <span className="text-content">
                        API_SECRET = <span className="text-amber-300">"example-secret"</span>
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-content-subtle select-none w-6 text-right">04</span>
                      <span className="text-purple-400">def <span className="text-yellow-300">execute_task</span><span className="text-content">(cmd):</span></span>
                    </div>
                    <div className="flex gap-4 px-1 rounded">
                      <span className="text-content-subtle select-none w-6 text-right">05</span>
                      <span className="text-content">
                        &nbsp;&nbsp;&nbsp;&nbsp;return os.system(cmd)
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-content-subtle select-none w-6 text-right">06</span>
                      <span className="text-content text-green-400"># Critical: command injection risk</span>
                    </div>
                  </div>
                </div>
              </div>
            </ElectricBorder>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-white/[0.08] bg-[#070A0F]" id="pipeline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-content-subtle">Pipeline overview</p>
              <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-content">Ship safer code, faster.</h2>
            </div>
            <button type="button" onClick={() => openAuthModal('/review')} className="hidden md:inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-[#0D131C] px-4 py-2 text-xs font-mono text-content hover:border-white/[0.16]">
              Run live audit <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <SpotlightCard className="p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-display font-semibold text-content">Security</h3>
              <p className="mt-3 text-sm text-content-muted">Detect hardcoded secrets, unsafe subprocess calls, injection vectors, and risky permissions before merge.</p>
            </SpotlightCard>
            <SpotlightCard className="p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-display font-semibold text-content">Quality</h3>
              <p className="mt-3 text-sm text-content-muted">Prioritize maintainability issues with AI summaries, code smell scoring, and actionable remediation guidance.</p>
            </SpotlightCard>
            <SpotlightCard className="p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-display font-semibold text-content">Performance</h3>
              <p className="mt-3 text-sm text-content-muted">Catch expensive loops, unsafe caching, and algorithmic hotspots before they impact production latency.</p>
            </SpotlightCard>
          </div>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="features">
        <div className="mb-10 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-content-subtle">Architecture</p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-content">One review runtime, three layers of intelligence.</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <MagicBento
            title="Static Analysis Graph"
            description="AST-based scans, linter heuristics, and policy checks transform raw source into structured risk signals in seconds."
            badge="Python"
            icon={Code2}
          />
          <MagicBento
            title="ML Severity Engine"
            description="A trained classifier ranks severity using project context, code smell density, and historical remediation patterns."
            badge="Model"
            icon={Cpu}
          />
          <MagicBento
            title="AI Review Summary"
            description="Large language reasoning explains the impact, root cause, and patch direction in plain developer language."
            badge="LLM"
            icon={Sparkles}
          />
        </div>
      </section>

      <section className="py-20 border-t border-white/[0.08] bg-[#070A0F]" id="security">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-content-subtle">Security posture</p>
              <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-content">From risky code to confidence in the pull request.</h2>
              <div className="mt-6 space-y-4 text-content-muted">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-success shrink-0" />
                  <p>Surface high-confidence risks with exploitability hints and edge-case warnings.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-success shrink-0" />
                  <p>Enforce code-quality gates across security, maintainability, and performance.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-success shrink-0" />
                  <p>Produce export-ready reports for engineering leads and compliance reviews.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#090D13] p-6 shadow-2xl">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-content-subtle">Analysis output</p>
              <div className="mt-5 space-y-3">
                {['Finding severity and source', 'Affected file and line', 'Available remediation guidance'].map((item) => (
                  <div key={item} className="flex items-center gap-3 border-b border-white/[0.06] pb-3 text-sm text-content-muted last:border-0">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />{item}
                  </div>
                ))}
                <p className="pt-2 text-xs text-content-subtle">Results are populated from your submitted code and saved review records.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="ml">
        <div className="mb-10 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-content-subtle">Machine learning</p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-content">Context-aware severity scoring that learns from real review outcomes.</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <SpotlightCard className="p-6"><p className="font-display text-lg font-semibold text-content">Static checks</p><p className="mt-2 text-sm text-content-muted">Review Python source with the configured analyzer rules.</p></SpotlightCard>
          <SpotlightCard className="p-6"><p className="font-display text-lg font-semibold text-content">Severity classification</p><p className="mt-2 text-sm text-content-muted">Inspect issue severity and classifier output returned by each analysis.</p></SpotlightCard>
          <SpotlightCard className="p-6"><p className="font-display text-lg font-semibold text-content">AI availability</p><p className="mt-2 text-sm text-content-muted">The workspace reports whether the configured AI provider is available for a review.</p></SpotlightCard>
        </div>
      </section>

      <section className="py-20 border-t border-white/[0.08] bg-[#070A0F]" id="github">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div className="rounded-2xl border border-white/[0.08] bg-[#090D13] p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#121A25] text-primary">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.2em] text-content-subtle">GitHub sync</p>
                    <h3 className="mt-1 text-xl font-display font-semibold text-content">Pull request review automation</h3>
                  </div>
                </div>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-mono text-content-muted">Integration</span>
              </div>

              <div className="mt-6 space-y-3 text-sm text-content-muted">
                <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0D131C] px-3 py-2"><span>Authorize GitHub</span><span className="text-content-subtle">Required</span></div>
                <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0D131C] px-3 py-2"><span>Select a repository</span><span className="text-content-subtle">Your account</span></div>
                <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0D131C] px-3 py-2"><span>Inspect pull requests</span><span className="text-content-subtle">On demand</span></div>
              </div>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-content-subtle">Developer workflow</p>
              <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-content">Monitor repo health without leaving the PR loop.</h2>
              <p className="mt-5 text-content-muted max-w-xl">
                Connect GitHub once and surface risks, quality concerns, and AI review notes directly on pull requests and repo dashboards.
              </p>
              <button type="button" onClick={() => openAuthModal('/github')} className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-mono text-[#05070A]">
                Connect GitHub <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <ElectricBorder active={true} color="#8B7CFF">
          <div className="p-10 sm:p-14 bg-[#090D13] rounded-xl space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-content">Ready to automate your code reviews?</h2>
            <p className="text-content-muted max-w-xl mx-auto text-sm sm:text-base leading-relaxed">Connect your GitHub repository in 60 seconds or paste any Python file for instant security and quality analysis.</p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button type="button" onClick={() => openAuthModal('/dashboard')} className="inline-flex items-center justify-center rounded-md bg-primary h-12 px-8 text-sm font-mono text-[#05070A]">
                Create Free Account
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/review')} 
                data-testid="cta-try-review"
                className="inline-flex items-center justify-center rounded-md border border-white/[0.08] bg-[#0D131C] h-12 px-8 text-sm font-mono text-content hover:border-white/[0.16]"
              >
                Try Review Workspace
              </button>
            </div>
          </div>
        </ElectricBorder>
      </section>

      <footer className="border-t border-white/[0.08] bg-[#05070A] py-12 text-xs font-mono text-content-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-content font-bold">IntelliReview AI</span>
            <span>© 2026 Developer Edition</span>
          </div>

          <div className="flex items-center gap-6">
            <button type="button" onClick={() => navigate('/review')} className="hover:text-primary transition-colors">Workspace</button>
            <button type="button" onClick={() => openAuthModal('/github')} className="hover:text-primary transition-colors">GitHub</button>
            <button type="button" onClick={() => openAuthModal('/security')} className="hover:text-primary transition-colors">Security</button>
            <button type="button" onClick={() => openAuthModal('/reports')} className="hover:text-primary transition-colors">Reports</button>
            <button type="button" onClick={() => openAuthModal('/settings')} className="hover:text-primary transition-colors">Settings</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
