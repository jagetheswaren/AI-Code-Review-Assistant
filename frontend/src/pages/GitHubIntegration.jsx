import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Star,
  GitFork,
  Search,
  RefreshCw,
  GitBranch,
  Key,
  Lock,
  Globe,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { GithubIcon } from '../lib/utils';
import {
  getGitHubStatus,
  getGitHubRepos,
  connectGitHubPAT,
  disconnectGitHub,
  getGitHubAuthUrl,
} from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { Button, Badge, Input, Skeleton } from '../components/ui';
import {
  SpotlightCard,
  StatusMark,
  HoldButton,
  CountUp,
  ElectricBorder,
} from '../components/reactbits/Bits';
import { cn } from '../lib/utils';
import { ErrorState } from '../components/workbench';

export default function GitHubIntegration() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [oauthError, setOauthError] = useState('');
  const [reposError, setReposError] = useState('');
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reposLoading, setReposLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');
  const [showPATModal, setShowPATModal] = useState(false);
  const [patToken, setPatToken] = useState('');
  const [patLoading, setPatLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    setStatusError('');
    try {
      const res = await getGitHubStatus();
      const data = res.data || res;
      setStatus(data);
      if (data.connected) {
        await loadRepos();
      } else {
        setRepos([]);
      }
    } catch (err) {
      setStatus(null);
      setStatusError(err.response?.data?.error || err.message || 'Could not check GitHub connection status.');
    } finally {
      setLoading(false);
    }
  }

  async function loadRepos() {
    setReposLoading(true);
    setReposError('');
    try {
      const res = await getGitHubRepos();
      setRepos(res.data?.repos || res.data?.repositories || []);
    } catch (err) {
      setRepos([]);
      setReposError(err.response?.data?.error || err.message || 'Failed to fetch repositories.');
    } finally {
      setReposLoading(false);
    }
  }

  async function handleConnectPAT(e) {
    e.preventDefault();
    if (!patToken.trim()) return;
    setPatLoading(true);
    try {
      await connectGitHubPAT(patToken.trim());
      success('GitHub Personal Access Token connected successfully!');
      setShowPATModal(false);
      setPatToken('');
      loadStatus();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to validate PAT');
    } finally {
      setPatLoading(false);
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectGitHub();
      success('GitHub account disconnected');
      setStatus({ connected: false });
      setRepos([]);
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to disconnect');
    }
  }

  const handleOAuthConnect = async () => {
    setOauthError('');
    try {
      const data = await getGitHubAuthUrl();
      if (!data?.auth_url) {
        throw new Error('GitHub authorization URL was not returned by the server');
      }
      window.location.assign(data.auth_url);
    } catch (err) {
      const missing = err.response?.data?.missing;
      setOauthError(missing?.length
        ? `GitHub OAuth is not configured. Add ${missing.join(' and ')} in backend .env.`
        : err.response?.data?.error || err.message || 'Failed to start GitHub authorization.');
    }
  };

  const filteredRepos = repos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesLang = selectedLang === 'all' || (r.language || '').toLowerCase() === selectedLang.toLowerCase();
    return matchesSearch && matchesLang;
  });

  const uniqueLanguages = Array.from(new Set(repos.map((r) => r.language).filter(Boolean)));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-content">
              GitHub Integration
            </h1>
            <StatusMark
              status={status?.connected ? 'online' : 'offline'}
              label={status?.connected ? 'Connected' : 'Disconnected'}
            />
          </div>
          <p className="text-xs font-mono text-content-muted mt-1">
            Automate code review workflows, pull request analysis, and webhook comments
          </p>
        </div>

        {status?.connected && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadRepos}
              isLoading={reposLoading}
              className="font-mono text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Repos
            </Button>
            <HoldButton
              onComplete={handleDisconnect}
              className="bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 text-xs font-mono py-1.5 px-3 rounded-lg"
            >
              Hold to Disconnect
            </HoldButton>
          </div>
        )}
      </div>

      {statusError && <ErrorState message={statusError} onRetry={loadStatus} />}
      {oauthError && <ErrorState message={oauthError} onRetry={handleOAuthConnect} />}

      {/* DISCONNECTED STATE */}
      {!status?.connected ? (
        <div className="max-w-3xl mx-auto py-10 space-y-8">
          <ElectricBorder active={true} color="#63E6FF">
            <div className="p-8 sm:p-12 rounded-xl bg-[#090D13] text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto shadow-cyanGlow/20">
                <GithubIcon className="w-8 h-8 text-primary" />
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-content">
                  Connect your GitHub Organization or Account
                </h2>
                <p className="text-xs sm:text-sm font-mono text-content-muted mt-2 max-w-lg mx-auto leading-relaxed">
                  Link GitHub to inspect repositories, analyze pull request diffs, and automatically post inline security review comments.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleOAuthConnect}
                  className="font-mono text-xs px-6 h-11"
                >
                  <GithubIcon className="w-4 h-4 mr-2" />
                  Connect with GitHub OAuth
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setShowPATModal(true)}
                  className="font-mono text-xs px-6 h-11"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Connect with PAT Token
                </Button>
              </div>
            </div>
          </ElectricBorder>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <SpotlightCard className="p-5 space-y-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-content text-sm">Automated PR Gates</h3>
              <p className="text-content-muted text-[11px] leading-relaxed">
                Detect vulnerabilities directly on pull request commits before merge.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-5 space-y-2">
              <GitBranch className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-content text-sm">Branch & Diff Analysis</h3>
              <p className="text-content-muted text-[11px] leading-relaxed">
                Inspect 3-pane split views of modified files and line-level AST diffs.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-5 space-y-2">
              <Lock className="w-5 h-5 text-success" />
              <h3 className="font-semibold text-content text-sm">Zero Token Exposure</h3>
              <p className="text-content-muted text-[11px] leading-relaxed">
                Tokens are stored encrypted server-side in MongoDB and never leaked to browser.
              </p>
            </SpotlightCard>
          </div>
        </div>
      ) : (
        /* CONNECTED STATE */
        <div className="space-y-6">
          {/* Top Status & Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SpotlightCard className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-content-muted uppercase">Connected User</span>
                <p className="font-display font-semibold text-base text-content mt-1">
                  {status.github_username || status.username || 'GitHub user'}
                </p>
              </div>
              <Badge variant="success">AUTHORIZED</Badge>
            </SpotlightCard>

            <SpotlightCard className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-content-muted uppercase">Available Repositories</span>
                <p className="font-display font-semibold text-base text-content mt-1">
                  <CountUp end={repos.length} /> Repos
                </p>
              </div>
              <Badge variant="cyan">SYNCED</Badge>
            </SpotlightCard>

            <SpotlightCard className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-content-muted uppercase">Auth Method</span>
                <p className="font-display font-semibold text-base text-content mt-1 uppercase">
                  {status.method || 'Not reported'}
                </p>
              </div>
              <Badge variant="outline">SECURE</Badge>
            </SpotlightCard>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0D131C] border border-white/[0.08]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-content-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories by name or description..."
                className="w-full bg-[#070A0F] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-content placeholder:text-content-subtle focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Language Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
              <button
                onClick={() => setSelectedLang('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedLang === 'all'
                    ? 'bg-primary/15 text-primary border border-primary/25 font-semibold'
                    : 'text-content-muted hover:text-content'
                }`}
              >
                All
              </button>
              {uniqueLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedLang === lang
                      ? 'bg-primary/15 text-primary border border-primary/25 font-semibold'
                      : 'text-content-muted hover:text-content'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Repository Cards Grid */}
          {reposLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : reposError ? (
            <ErrorState message={reposError} onRetry={loadRepos} />
          ) : filteredRepos.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-content-muted">
              {repos.length === 0 ? 'No repositories were returned for this GitHub account.' : 'No matching repositories found.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRepos.map((repo) => (
                <SpotlightCard
                  key={repo.id}
                  onClick={() => navigate(`/github/${repo.full_name}`)}
                  className="p-5 flex flex-col justify-between cursor-pointer group hover:border-primary/40"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <GitBranch className="w-4 h-4 text-primary shrink-0" />
                        <h3 className="font-mono text-sm font-semibold text-content truncate group-hover:text-primary transition-colors">
                          {repo.name}
                        </h3>
                      </div>
                      <Badge variant={repo.private ? 'outline' : 'cyan'}>
                        {repo.private ? 'PRIVATE' : 'PUBLIC'}
                      </Badge>
                    </div>

                    <p className="text-xs text-content-muted line-clamp-2 leading-relaxed min-h-[32px]">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-content-subtle">
                    <div className="flex items-center gap-3">
                      <span>{repo.language || 'Language not reported'}</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        {repo.stargazers_count || 0}
                      </span>
                    </div>
                    <span className="text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Inspect <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PAT Modal */}
      <AnimatePresence>
        {showPATModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPATModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md p-6 rounded-2xl bg-[#0D131C] border border-white/[0.1] shadow-2xl space-y-4"
            >
              <h3 className="font-display font-semibold text-base text-content">
                Connect GitHub Personal Access Token
              </h3>
              <p className="text-xs font-mono text-content-muted leading-relaxed">
                Provide a GitHub PAT with <code className="text-primary font-bold">repo</code> scope to allow IntelliReview to inspect pull requests and submit comments.
              </p>

              <form onSubmit={handleConnectPAT} className="space-y-4">
                <Input
                  type="password"
                  icon={Key}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={patToken}
                  onChange={(e) => setPatToken(e.target.value)}
                  required
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPATModal(false)}
                    className="font-mono text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={patLoading}
                    className="font-mono text-xs"
                  >
                    Save & Validate Token
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
