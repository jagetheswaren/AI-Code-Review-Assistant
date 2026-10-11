import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  GitPullRequest,
  GitBranch,
  ArrowLeft,
  Plus,
  Minus,
  Calendar,
  ExternalLink,
  Search,
  Lock,
  Globe,
  Star,
  GitFork,
  Activity,
  ShieldAlert,
  ChevronRight,
  FileCode2,
} from 'lucide-react';
import { getRepoBranches, getRepoPullRequests, getRepoInfo } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { Button, Badge, Skeleton } from '../components/ui';
import { SpotlightCard, CountUp } from '../components/reactbits/Bits';
import { EmptyState, ErrorState, LoadingState } from '../components/workbench';
import { cn } from '../lib/utils';

export default function Repository() {
  const { owner, repo: repoName } = useParams();
  const repoFullName = `${owner}/${repoName}`;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [repo, setRepo] = useState(null);
  const [repoLoading, setRepoLoading] = useState(true);
  const [repoError, setRepoError] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [pullRequests, setPullRequests] = useState([]);
  const [prsLoading, setPrsLoading] = useState(true);
  const [prsError, setPrsError] = useState('');
  const [prSearch, setPrSearch] = useState('');
  const [activeTab, setActiveTab] = useState('prs'); // prs, branches, info

  useEffect(() => {
    if (repoFullName) {
      loadRepo();
      loadBranches();
      loadPullRequests();
    }
  }, [repoFullName]);

  async function loadRepo() {
    setRepoLoading(true);
    setRepoError('');
    try {
      const res = await getRepoInfo(repoFullName);
      const data = res.data || res;
      if (!data?.name && !data?.full_name) throw new Error('Repository details were not returned.');
      setRepo(data);
    } catch (err) {
      setRepoError(err.response?.data?.error || err.message || 'Failed to load repository details.');
    } finally {
      setRepoLoading(false);
    }
  }

  async function loadBranches() {
    setBranchesLoading(true);
    setBranchesError('');
    try {
      const res = await getRepoBranches(repoFullName);
      const data = res.data || res;
      const list = data.branches || data || [];
      setBranches(list);
      if (list.length) setSelectedBranch(list[0].name || list[0]);
    } catch (err) {
      setBranches([]);
      setBranchesError(err.response?.data?.error || err.message || 'Failed to load branches.');
    } finally {
      setBranchesLoading(false);
    }
  }

  async function loadPullRequests() {
    setPrsLoading(true);
    setPrsError('');
    try {
      const res = await getRepoPullRequests(repoFullName);
      const data = res.data || res;
      setPullRequests(data.pull_requests || data.prs || data || []);
    } catch (err) {
      setPullRequests([]);
      setPrsError(err.response?.data?.error || err.message || 'Failed to load pull requests.');
    } finally {
      setPrsLoading(false);
    }
  }

  const filteredPRs = pullRequests.filter(
    (pr) =>
      !prSearch ||
      pr.title?.toLowerCase().includes(prSearch.toLowerCase()) ||
      String(pr.number).includes(prSearch)
  );

  if (repoLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (repoError || !repo) {
    return <ErrorState message={repoError || 'Repository details are unavailable.'} onRetry={loadRepo} />;
  }

  return (
    <div className="space-y-6 select-none">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono text-content-subtle">
        <Link to="/github" className="flex items-center gap-1 hover:text-content text-primary">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Repositories
        </Link>
        <span>/</span>
        <span className="text-content font-medium">{repoFullName}</span>
      </div>

      {/* Repository Main Hero Card */}
      <SpotlightCard className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-content tracking-tight">
                {repo?.name || repoFullName}
              </h1>
              <Badge variant={repo?.private ? 'outline' : 'cyan'}>
                {repo?.private ? 'PRIVATE' : 'PUBLIC'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm font-mono text-content-muted max-w-2xl">
              {repo?.description || 'No description provided by GitHub.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {repo?.html_url && (
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-mono text-content flex items-center gap-1.5 transition-colors"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Stats Sub-strip */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-6 text-xs font-mono text-content-subtle">
          <div>
            Language: <strong className="text-content">{repo.language || 'Not reported'}</strong>
          </div>
          <div>
            Default Branch: <strong className="text-primary">{repo.default_branch || 'Not reported'}</strong>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>{repo?.stargazers_count || 0} stars</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5 text-content-muted" />
            <span>{repo?.forks_count || 0} forks</span>
          </div>
        </div>
      </SpotlightCard>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('prs')}
          className={cn(
            "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2",
            activeTab === 'prs'
              ? "bg-primary/15 text-primary border border-primary/25 font-bold"
              : "text-content-muted hover:text-content"
          )}
        >
          <GitPullRequest className="w-4 h-4" />
          <span>Pull Requests ({pullRequests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={cn(
            "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2",
            activeTab === 'branches'
              ? "bg-primary/15 text-primary border border-primary/25 font-bold"
              : "text-content-muted hover:text-content"
          )}
        >
          <GitBranch className="w-4 h-4" />
          <span>Branches ({branches.length})</span>
        </button>
      </div>

      {/* Tab: Pull Requests List */}
      {activeTab === 'prs' && (
        <SpotlightCard className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-content-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={prSearch}
                onChange={(e) => setPrSearch(e.target.value)}
                placeholder="Filter PRs by title or number..."
                className="w-full bg-[#070A0F] border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-content placeholder:text-content-subtle focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {prsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : prsError ? (
            <ErrorState message={prsError} onRetry={loadPullRequests} />
          ) : filteredPRs.length === 0 ? (
            <div className="py-16 text-center text-xs font-mono text-content-muted">
              No pull requests found for this repository.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filteredPRs.map((pr) => (
                <div
                  key={pr.id || pr.number}
                  onClick={() => navigate(`/github/${owner}/${repoName}/pull/${pr.number}`)}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] p-2 rounded-lg transition-colors group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-primary font-bold text-xs">
                        #{pr.number}
                      </span>
                      <h3 className="font-display font-semibold text-sm text-content truncate group-hover:text-primary transition-colors">
                        {pr.title}
                      </h3>
                      <Badge variant={pr.state === 'open' ? 'success' : 'outline'}>
                        {pr.state?.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-content-subtle">
                      <span>by @{pr.user?.login || pr.author || 'Author unavailable'}</span>
                      <span>•</span>
                      <span>{pr.head?.ref || 'Branch unavailable'} → {pr.base?.ref || 'Branch unavailable'}</span>
                      {pr.created_at && (
                        <>
                          <span>•</span>
                          <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Inspect Diff <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SpotlightCard>
      )}

      {/* Tab: Branches List */}
      {activeTab === 'branches' && (
        <SpotlightCard className="p-6">
          <h2 className="font-display text-base font-semibold text-content mb-4">Tracked Branches</h2>
          {branchesLoading ? <LoadingState label="Loading branches" /> : branchesError ? <ErrorState message={branchesError} onRetry={loadBranches} /> : branches.length === 0 ? <EmptyState title="No branches returned" description="The repository did not return any branches." /> : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
            {branches.map((b, idx) => {
              const name = b.name || b;
              return (
                <div key={idx} className="p-3 rounded-lg bg-[#070A0F] border border-white/[0.06] flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-content truncate">{name}</span>
                </div>
              );
            })}
          </div>}
        </SpotlightCard>
      )}
    </div>
  );
}
