import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GitPullRequest,
  GitBranch,
  ArrowLeft,
  Plus,
  Minus,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getRepoBranches, getRepoPullRequests } from '../api/client';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  EmptyState,
  PageLoader,
  Skeleton,
} from '../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const statusStyles = {
  open: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  closed: 'bg-red-500/15 text-red-400 border-red-500/20',
  merged: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
};

function PRSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-[#111827] border-white/[0.06]">
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 bg-white/[0.06]" />
              <Skeleton className="h-5 w-2/3 bg-white/[0.06]" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24 bg-white/[0.04]" />
              <Skeleton className="h-4 w-16 bg-white/[0.04]" />
              <Skeleton className="h-4 w-16 bg-white/[0.04]" />
              <Skeleton className="h-4 w-24 bg-white/[0.04]" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Repository() {
  const { repoFullName } = useParams();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [pullRequests, setPullRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prsLoading, setPrsLoading] = useState(true);

  useEffect(() => {
    if (repoFullName) {
      loadBranches();
      loadPullRequests();
    }
  }, [repoFullName]);

  async function loadBranches() {
    try {
      const res = await getRepoBranches(repoFullName);
      const branchList = res.branches || res || [];
      setBranches(branchList);
      if (branchList.length > 0) {
        setSelectedBranch(branchList[0].name || branchList[0]);
      }
    } catch {
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPullRequests() {
    setPrsLoading(true);
    try {
      const res = await getRepoPullRequests(repoFullName);
      setPullRequests(res.pull_requests || res.prs || res || []);
    } catch {
      setPullRequests([]);
    } finally {
      setPrsLoading(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 lg:p-8">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/github')}
            className="text-slate-400 hover:text-white hover:bg-white/[0.05]"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <GitPullRequest className="h-8 w-8 text-indigo-400" />
              {repoFullName}
            </h1>
            <p className="mt-2 text-slate-400">Pull requests and repository overview</p>
          </div>
          <a
            href={`https://github.com/${repoFullName}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05]"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on GitHub
            </Button>
          </a>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
        <Card className="bg-[#111827] border-white/[0.06] mb-8">
          <div className="px-5 py-4 flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <GitBranch className="h-4 w-4" />
              <span className="text-sm font-medium">Branch:</span>
            </div>
            {loading ? (
              <Skeleton className="h-9 w-48 bg-white/[0.06]" />
            ) : (
              <Select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white w-auto min-w-[200px]"
              >
                {branches.map((branch) => {
                  const name = typeof branch === 'string' ? branch : branch.name;
                  return (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  );
                })}
              </Select>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Pull Requests</h2>
        </div>

        {prsLoading ? (
          <PRSkeleton />
        ) : pullRequests.length > 0 ? (
          <div className="space-y-4">
            {pullRequests.map((pr, idx) => (
              <motion.div
                key={pr.id || pr.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="bg-[#111827] border-white/[0.06] hover:border-white/[0.12] transition-colors">
                  <div className="px-5 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-mono text-slate-400">#{pr.number}</span>
                          <h3 className="text-sm font-semibold text-white truncate">{pr.title}</h3>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          {pr.user && (
                            <div className="flex items-center gap-2">
                              {pr.user.avatar_url && (
                                <img
                                  src={pr.user.avatar_url}
                                  alt={pr.user.login}
                                  className="w-5 h-5 rounded-full"
                                />
                              )}
                              <span className="text-xs text-slate-400">{pr.user.login || pr.user}</span>
                            </div>
                          )}
                          <Badge
                            className={cn(
                              'text-xs font-medium border',
                              statusStyles[pr.state] || statusStyles.open
                            )}
                          >
                            {pr.state}
                          </Badge>
                          {pr.changed_files != null && (
                            <span className="text-xs text-slate-400">
                              {pr.changed_files} file{pr.changed_files !== 1 ? 's' : ''}
                            </span>
                          )}
                          {pr.additions != null && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                              <Plus className="h-3 w-3" />
                              {pr.additions}
                            </span>
                          )}
                          {pr.deletions != null && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-400">
                              <Minus className="h-3 w-3" />
                              {pr.deletions}
                            </span>
                          )}
                          {pr.created_at && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="h-3 w-3" />
                              {formatDate(pr.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/github/${repoFullName}/pr/${pr.number}`)}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 flex-shrink-0"
                      >
                        Analyze
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<GitPullRequest className="h-12 w-12 text-slate-500" />}
            title="No pull requests found"
            description="This repository has no pull requests or they could not be loaded."
          />
        )}
      </motion.div>
    </div>
  );
}
