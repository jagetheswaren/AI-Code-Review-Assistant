import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Search, Zap, Brain, GitBranch, BarChart3, ArrowRight,
  CheckCircle, Code2, ArrowUpRight, Star, Users, ScanSearch,
  ChevronDown, Sparkles, Target, Lock, Cpu,
} from 'lucide-react';
import { cn, GithubIcon } from '../lib/utils';
import { Button } from '../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

const features = [
  { icon: Shield, title: 'Security Scanning', desc: 'Deep vulnerability detection using Bandit, AST analysis, and custom security rules to catch issues before they reach production.', color: 'from-red-500/20 to-red-500/5', iconColor: 'text-red-400' },
  { icon: Search, title: 'Code Smell Detection', desc: 'Identify anti-patterns, unused imports, complex functions, and naming violations with intelligent pattern matching.', color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400' },
  { icon: Zap, title: 'Performance Analysis', desc: 'Detect nested loops, N+1 queries, string concatenation in loops, and other performance bottlenecks automatically.', color: 'from-purple-500/20 to-purple-500/5', iconColor: 'text-purple-400' },
  { icon: Brain, title: 'AI-Powered Reviews', desc: 'Leverage CodeBERT and LLM models for intelligent code review suggestions and natural language explanations.', color: 'from-[#2563EB]/20 to-[#2563EB]/5', iconColor: 'text-[#60A5FA]' },
  { icon: BarChart3, title: 'ML Severity Prediction', desc: 'Machine learning models predict issue severity with confidence scores using ensemble methods like Random Forest and Gradient Boosting.', color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400' },
  { icon: GitBranch, title: 'GitHub Integration', desc: 'Connect your GitHub account, browse repositories, select PRs, and get automated review comments on pull requests.', color: 'from-[#7C3AED]/20 to-[#7C3AED]/5', iconColor: 'text-purple-400' },
];

const stats = [
  { value: '50K+', label: 'Lines Analyzed', icon: Code2 },
  { value: '2.5K', label: 'Issues Found', icon: Shield },
  { value: '98%', label: 'Accuracy', icon: Target },
  { value: '100+', label: 'Active Users', icon: Users },
];

const techStack = [
  { name: 'Python', desc: 'Backend & ML', icon: '🐍' },
  { name: 'React', desc: 'Frontend UI', icon: '⚛️' },
  { name: 'Flask', desc: 'REST API', icon: '🔧' },
  { name: 'MongoDB', desc: 'Database', icon: '🍃' },
  { name: 'Scikit-learn', desc: 'ML Models', icon: '🤖' },
  { name: 'CodeBERT', desc: 'NLP Engine', icon: '🧠' },
];

const steps = [
  { num: '01', title: 'Connect GitHub', desc: 'Link your GitHub account and select repositories to monitor.' },
  { num: '02', title: 'Analyze Code', desc: 'Our AI engine scans your code with multiple analyzers and ML models.' },
  { num: '03', title: 'Review Results', desc: 'Get detailed reports with severity scores, explanations, and fix suggestions.' },
  { num: '04', title: 'Fix & Ship', desc: 'Apply suggested fixes, track improvements, and ship with confidence.' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Senior Engineer @ TechCorp', text: 'IntelliReview caught a critical security vulnerability that our previous tool missed. The ML severity prediction is incredibly accurate.', rating: 5 },
  { name: 'Marcus Rodriguez', role: 'CTO @ StartupXYZ', text: 'We reduced our code review time by 60%. The AI suggestions are spot-on and the GitHub integration is seamless.', rating: 5 },
  { name: 'Priya Patel', role: 'Tech Lead @ DevCo', text: 'The performance analyzer found N+1 query issues that were causing production slowdowns. Life saver!', rating: 5 },
];

const faqs = [
  { q: 'How does the AI code review work?', a: 'Our system uses a combination of static analysis (Bandit, custom rules), machine learning (Random Forest, Gradient Boosting), and NLP (CodeBERT) to analyze your code. It detects security vulnerabilities, code smells, performance issues, and provides AI-powered explanations and fix suggestions.' },
  { q: 'What programming languages are supported?', a: 'Currently we focus on Python with deep analysis including Bandit for security, AST parsing, and ML models. We plan to expand to JavaScript, TypeScript, Java, and Go in future releases.' },
  { q: 'Is my code stored on your servers?', a: 'Code is analyzed in real-time and only the analysis results are stored. Raw code is not persisted unless you explicitly save a scan. All data is encrypted at rest and in transit.' },
  { q: 'Can I integrate with GitHub Actions?', a: 'Yes! We provide GitHub OAuth integration and webhook support. You can connect your repositories, analyze pull requests, and receive automated review comments directly on your PRs.' },
  { q: 'What is the accuracy of the ML models?', a: 'Our ensemble ML models achieve 85-95% accuracy in predicting issue severity. The models are continuously trained and improved with new data. Each prediction includes a confidence score.' },
];

const pricing = [
  { name: 'Free', price: '$0', period: 'forever', features: ['5 repository scans/month', 'Basic security analysis', 'Community support', 'JSON/CSV exports'], cta: 'Get Started', popular: false },
  { name: 'Pro', price: '$19', period: '/month', features: ['Unlimited scans', 'Full ML analysis', 'GitHub integration', 'PDF reports', 'AI chat assistant', 'Priority support'], cta: 'Start Free Trial', popular: true },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Pro', 'Self-hosted option', 'Custom ML models', 'SSO & RBAC', 'Dedicated support', 'SLA guarantee'], cta: 'Contact Sales', popular: false },
];

const Landing = () => {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
              <ScanSearch className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">IntelliReview</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#2563EB]/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#7C3AED]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2563EB]/5 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#60A5FA] text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Code Analysis Platform
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Ship Better Code<br />
            <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">with AI Reviews</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Automated security scanning, code smell detection, performance analysis, and AI-powered fix suggestions — all in one platform.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="xl" className="min-w-[200px]">
                Start Free <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="xl" className="min-w-[200px]">
                See Features
              </Button>
            </a>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="mt-12 flex items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> No credit card required</div>
            <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> Free tier available</div>
            <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> Open source</div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/[0.06] bg-[#111827]/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon className="w-5 h-5 text-[#2563EB]" />
                  <span className="text-3xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Everything you need to<br /><span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">review code intelligently</span></h2>
            <p className="text-slate-400 max-w-lg mx-auto">A comprehensive suite of AI-powered tools to catch bugs, security issues, and performance problems before they reach production.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} whileHover={{ y: -4 }} className="group rounded-xl bg-[#111827] border border-white/[0.06] p-6 transition-all duration-300 hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/20">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4', f.color)}>
                  <f.icon className={cn('w-6 h-6', f.iconColor)} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-[#111827]/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-slate-400 max-w-lg mx-auto">Get started in minutes with our simple 4-step process.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="relative text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">{step.num}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.desc}</p>
                {i < steps.length - 1 && <div className="hidden lg:block absolute top-7 left-[60%] w-[80%] border-t border-dashed border-white/10" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Built with modern tech</h2>
            <p className="text-slate-400">Powered by industry-leading technologies.</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((t, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="rounded-xl bg-[#111827] border border-white/[0.06] p-4 text-center hover:border-white/[0.12] transition-colors">
                <div className="text-2xl mb-2">{t.icon}</div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-slate-500">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32 bg-[#111827]/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Loved by developers</h2>
            <p className="text-slate-400">See what our users are saying.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="rounded-xl bg-[#111827] border border-white/[0.06] p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold">{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-400 max-w-lg mx-auto">Choose the plan that fits your team. All plans include core features.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((plan, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className={cn('rounded-xl border p-6 relative', plan.popular ? 'bg-[#111827] border-[#2563EB]/50 shadow-lg shadow-[#2563EB]/10' : 'bg-[#111827] border-white/[0.06]')}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-full text-[10px] font-bold text-white uppercase tracking-wider">Most Popular</div>}
                <h3 className="text-lg font-semibold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm text-slate-400">{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block">
                  <Button variant={plan.popular ? 'primary' : 'secondary'} className="w-full">{plan.cta}</Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-32 bg-[#111827]/30">
        <div className="max-w-3xl mx-auto px-4 lg:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Frequently asked questions</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="rounded-xl bg-[#111827] border border-white/[0.06] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="text-sm font-medium text-white">{faq.q}</span>
                  <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-6 pb-4">
                    <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 border border-white/[0.06] p-12 lg:p-16 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#2563EB]/10 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to ship better code?</h2>
              <p className="text-slate-400 max-w-lg mx-auto mb-8">Join thousands of developers who trust IntelliReview to keep their code clean, secure, and performant.</p>
              <Link to="/register">
                <Button size="xl" className="min-w-[240px]">
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#111827]/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
                  <ScanSearch className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm">IntelliReview</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">AI-powered code review assistant for modern development teams.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-xs text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-xs text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">Changelog</a></li>
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.06] mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">&copy; 2026 IntelliReview. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-500 hover:text-white transition-colors"><GithubIcon className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
