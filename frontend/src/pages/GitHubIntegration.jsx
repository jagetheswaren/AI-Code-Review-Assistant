import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Star,
  GitFork,
  Search,
  RefreshCw,
  Plug,
  Unplug,
  Key,
} from 'lucide-react';
import { GithubIcon } from '../lib/utils';
import { getGitHubStatus, getGitHubRepos, connectGitHubPAT, disconnectGitHub } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import {
  Button,
  Card,
  Badge,
  Input,
  EmptyState,
  Skeleton,
} from '../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const languageColors = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  'C++': '#f34b7d',
  C: '#555555',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  PHP: '#4F5D95',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  'Jupyter Notebook': '#DA5B0B',
};

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="bg-[#111827] border-white/[0.06]">
          <div className="px-5 py-4 space-y-3">
            <Skeleton className="h-5 w-3/4 bg-white/[0.06]" />
            <Skeleton className="h-4 w-full bg-white/[0.04]" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 bg-white/[0.04]" />
              <Skeleton className="h-4 w-12 bg-white/[0.04]" />
              <Skeleton className="h-4 w-12 bg-white/[0.04]" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function GitHubIntegration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState(null);
  const [search, setSearch] = useState('');
  const [showPATInput, setShowPATInput] = useState(false);
  const [patToken, setPatToken] = useState('');
  const [patLoading, setPatLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await getGitHubStatus();
      const data = res.data || res;
      setStatus(data);
      if (data.connected) {
        loadRepos();
      }
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }

  async function loadRepos() {
    setReposLoading(true);
    setReposError(null);
    try {
      const res = await getGitHubRepos();
      const data = res.data || res;
      setRepos(data.repos || data || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to fetch repositories';
      setReposError(msg);
      setRepos([]);
    } finally {
      setReposLoading(false);
    }
  }

  async function handlePATConnect() {
    if (!patToken.trim()) return;
    setPatLoading(true);
    try {
      await connectGitHubPAT(patToken.trim());
      setShowPATInput(false);
      setPatToken('');
      toast({ title: 'GitHub connected', variant: 'success' });
      loadStatus();
    } catch (err) {
      toast({ title: 'Failed to connect', description: err.response?.data?.error || err.message, variant: 'error' });
    } finally {
      setPatLoading(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await disconnectGitHub();
      toast({ title: 'GitHub disconnected', variant: 'success' });
      setStatus({ connected: false });
      setRepos([]);
    } catch (err) {
      toast({ title: 'Disconnect failed', description: err.response?.data?.error || err.message, variant: 'error' });
    } finally {
      setDisconnecting(false);
    }
  }

  const filteredRepos = repos.filter(
    (repo) =>
      repo.name?.toLowerCase().includes(search.toLowerCase()) ||
      repo.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 lg:p-8">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <GithubIcon className="h-8 w-8 text-slate-300" />
              GitHub Integration
            </h1>
            <p className="mt-2 text-slate-400">Connect your GitHub account to analyze repositories</p>
          </div>
          {status?.connected && (
            <Button
              onClick={loadRepos}
              variant="outline"
              className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
        <Card className="bg-[#111827] border-white/[0.06] mb-8">
          <div className="px-6 py-5">
            {loading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full bg-white/[0.06]" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48 bg-white/[0.06]" />
                  <Skeleton className="h-4 w-32 bg-white/[0.04]" />
                </div>
              </div>
            ) : status?.connected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {status.avatar_url && (
                    <img
                      src={status.avatar_url}
                      alt={status.github_username}
                      className="w-12 h-12 rounded-full border-2 border-white/[0.1]"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{status.github_username}</h3>
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs">
                        Connected
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">GitHub account linked</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Unplug className="h-4 w-4 mr-2" />
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
                  <GithubIcon className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Connect Your GitHub Account</h3>
                <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                  Link your GitHub account to browse repositories, review pull requests, and get AI-powered
                  code analysis on your projects.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    onClick={() => {
                      const token = localStorage.getItem('token');
                      window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/github/oauth/authorize?token=${token}`;
                    }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-8 py-3 shadow-lg shadow-indigo-500/25"
                  >
                    <Plug className="h-4 w-4 mr-2" />
                    Connect with GitHub OAuth
                  </Button>
                  <Button
                    onClick={() => setShowPATInput(!showPATInput)}
                    variant="outline"
                    className="border-white/[0.1] text-slate-300 hover:bg-white/[0.05] px-6 py-3"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Use Personal Access Token
                  </Button>
                </div>
                {showPATInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 max-w-md mx-auto"
                  >
                    <Card className="bg-[#1E293B] border-white/[0.08]">
                      <div className="p-4 space-y-3">
                        <label className="block text-xs font-medium text-slate-400">
                          GitHub Personal Access Token
                        </label>
                        <Input
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          value={patToken}
                          onChange={(e) => setPatToken(e.target.value)}
                          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
                        />
                        <p className="text-xs text-slate-500">
                          Generate at{' '}
                          <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                            github.com/settings/tokens
                          </a>
                          {' '}with <code className="text-slate-400">repo</code> scope.
                        </p>
                        <Button
                          onClick={handlePATConnect}
                          disabled={!patToken.trim()}
                          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium disabled:opacity-50"
                        >
                          {patLoading ? 'Connecting...' : 'Connect with Token'}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {status?.connected && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search repositories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {reposError ? (
            <Card className="bg-red-950/20 border-red-500/20 p-6 text-center">
              <p className="text-sm text-red-400">{reposError}</p>
              <Button onClick={loadRepos} variant="outline" size="sm" className="mt-3 border-red-500/30 text-red-400">Retry</Button>
            </Card>
          ) : reposLoading ? (
            <SkeletonCards />
          ) : filteredRepos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRepos.map((repo) => (
                <motion.div
                  key={repo.id || repo.full_name}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Card
                    className="bg-[#111827] border-white/[0.06] hover:border-white/[0.12] transition-colors cursor-pointer h-full"
                    onClick={() => navigate(`/github/${repo.full_name}`)}
                  >
                    <div className="px-5 py-4 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-semibold text-sm truncate">{repo.name}</h3>
                        <ExternalLink className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                      </div>
                      {repo.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{repo.description}</p>
                      )}
                      <div className="mt-auto flex items-center gap-3 flex-wrap">
                        {repo.language && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: languageColors[repo.language] || '#6b7280',
                              }}
                            />
                            {repo.language}
                          </span>
                        )}
                        {repo.stargazers_count != null && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Star className="h-3.5 w-3.5" />
                            {repo.stargazers_count.toLocaleString()}
                          </span>
                        )}
                        {repo.forks_count != null && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <GitFork className="h-3.5 w-3.5" />
                            {repo.forks_count.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={GithubIcon}
              title="No repositories found"
              description={
                search
                  ? 'No repositories match your search. Try a different term.'
                  : 'No repositories available. Make sure your GitHub account has repositories.'
              }
            />
          )}
        </motion.div>
      )}

      {!loading && !status?.connected && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
          <Card className="bg-amber-950/20 border-amber-500/20 p-6 text-center mb-4">
            <p className="text-sm text-amber-300 font-medium">GitHub not configured</p>
            <p className="text-xs text-amber-400/80 mt-1">Configure GITHUB_TOKEN or OAuth in backend environment. Connect above when ready.</p>
          </Card>
          <EmptyState
            icon={GithubIcon}
            title="Connect to get started"
            description="Connect your GitHub account above to browse and analyze your repositories."
          />
        </motion.div>
      )}
    </div>
  );
}
