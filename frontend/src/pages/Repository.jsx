import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitPullRequest, GitBranch, ArrowLeft, Plus, Minus, Calendar, ExternalLink, Search, Lock, Globe, Star, GitFork } from 'lucide-react';
import { cn } from '../lib/utils';
import { getRepoBranches, getRepoPullRequests, getRepoInfo } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { Button, Card, Badge, Select, EmptyState, Skeleton, Input } from '../components/ui';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const statusStyles = { open: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', closed: 'bg-red-500/15 text-red-400 border-red-500/20', merged: 'bg-purple-500/15 text-purple-400 border-purple-500/20' };

function PRSkeleton(){ return <div className="space-y-4">{Array.from({length:4}).map((_,i)=><Card key={i} className="bg-[#111827] border-white/[0.06]"><div className="px-5 py-4 space-y-3"><div className="flex items-center gap-3"><Skeleton className="h-5 w-16 bg-white/[0.06]" /><Skeleton className="h-5 w-2/3 bg-white/[0.06]" /></div><div className="flex items-center gap-4"><Skeleton className="h-4 w-24 bg-white/[0.04]" /><Skeleton className="h-4 w-16 bg-white/[0.04]" /></div></div></Card>)}</div>;}

export default function Repository(){
  const { repoFullName } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [repo, setRepo] = useState(null);
  const [repoLoading, setRepoLoading] = useState(true);
  const [repoError, setRepoError] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [pullRequests, setPullRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prsLoading, setPrsLoading] = useState(true);
  const [prError, setPrError] = useState(null);
  const [prSearch, setPrSearch] = useState('');

  useEffect(()=>{ if(repoFullName){ loadRepo(); loadBranches(); loadPullRequests(); } },[repoFullName]);

  async function loadRepo(){
    setRepoLoading(true); setRepoError(null);
    try{ const res=await getRepoInfo(repoFullName); setRepo(res.data||res); }catch(err){ setRepoError(err.response?.data?.error||err.message); }finally{ setRepoLoading(false); }
  }
  async function loadBranches(){
    try{ const res=await getRepoBranches(repoFullName); const data=res.data||res; const list=data.branches||data||[]; setBranches(list); if(list.length) setSelectedBranch(list[0].name||list[0]); }catch{ setBranches([]);}finally{ setLoading(false); }
  }
  async function loadPullRequests(){
    setPrsLoading(true); setPrError(null);
    try{ const res=await getRepoPullRequests(repoFullName); const data=res.data||res; setPullRequests(data.pull_requests||data.prs||data||[]);}catch(err){ setPrError(err.response?.data?.error||err.message); setPullRequests([]);}finally{ setPrsLoading(false); }
  }
  function formatDate(d){ if(!d) return ''; return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
  const filteredPRs = pullRequests.filter(pr=> !prSearch || pr.title?.toLowerCase().includes(prSearch.toLowerCase()) || String(pr.number).includes(prSearch));

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 lg:p-8">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={()=>navigate('/github')} className="text-slate-400 hover:text-white hover:bg-white/[0.05]"><ArrowLeft className="h-4 w-4 mr-1"/>Back</Button>
        </div>
        {repoLoading ? <Card className="bg-[#111827] border-white/[0.06] p-5"><Skeleton className="h-6 w-48 bg-white/[0.06]" /><Skeleton className="h-4 w-full mt-3 bg-white/[0.04]" /></Card>
        : repoError ? <Card className="bg-red-950/20 border-red-500/20 p-5 text-center"><p className="text-sm text-red-400">{repoError}</p><Button onClick={loadRepo} size="sm" variant="outline" className="mt-3 border-red-500/30">Retry</Button></Card>
        : repo && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3"><GitPullRequest className="h-8 w-8 text-indigo-400" />{repo.full_name||repoFullName}</h1>
                {repo.description && <p className="mt-2 text-sm text-slate-400 max-w-2xl">{repo.description}</p>}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <Badge className={repo.private ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'}>{repo.private ? <><Lock className="w-3 h-3 mr-1"/>Private</> : <><Globe className="w-3 h-3 mr-1"/>Public</>}</Badge>
                  {repo.language && <span className="text-xs text-slate-400">{repo.language}</span>}
                  {repo.default_branch && <span className="text-xs text-slate-500">Default: <span className="text-slate-300">{repo.default_branch}</span></span>}
                  {repo.stargazers_count!=null && <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Star className="w-3 h-3"/>{repo.stargazers_count}</span>}
                  {repo.forks_count!=null && <span className="inline-flex items-center gap-1 text-xs text-slate-400"><GitFork className="w-3 h-3"/>{repo.forks_count}</span>}
                </div>
              </div>
              <a href={repo.html_url||`https://github.com/${repoFullName}`} target="_blank" rel="noreferrer"><Button variant="outline" className="border-white/[0.08] text-slate-300 hover:bg-white/[0.05]"><ExternalLink className="h-4 w-4 mr-2"/>View on GitHub</Button></a>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{delay:0.1}}>
        <Card className="bg-[#111827] border-white/[0.06] mb-8">
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400"><GitBranch className="h-4 w-4"/><span className="text-sm font-medium">Branch:</span></div>
            {loading ? <Skeleton className="h-9 w-48 bg-white/[0.06]"/> : branches.length? <Select value={selectedBranch} onChange={e=>setSelectedBranch(e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white w-auto min-w-[200px]">{branches.map(b=>{const n=typeof b==='string'?b:b.name; return <option key={n} value={n}>{n}</option>})}</Select> : <span className="text-xs text-slate-500">No branches found</span>}
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={()=>{loadBranches();loadPullRequests();loadRepo();}} className="border-white/[0.08] text-slate-300">Refresh</Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{delay:0.2}}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-white">Pull Requests</h2>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
            <Input placeholder="Search PRs..." value={prSearch} onChange={e=>setPrSearch(e.target.value)} className="pl-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"/>
          </div>
        </div>
        {prError ? <Card className="bg-red-950/20 border-red-500/20 p-6 text-center"><p className="text-sm text-red-400">{prError}</p><Button onClick={loadPullRequests} size="sm" variant="outline" className="mt-3 border-red-500/30">Retry</Button></Card>
        : prsLoading ? <PRSkeleton/>
        : filteredPRs.length ? <div className="space-y-4">{filteredPRs.map((pr,idx)=><motion.div key={pr.number} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:idx*0.03}}><Card className="bg-[#111827] border-white/[0.06] hover:border-white/[0.12] transition-colors"><div className="px-5 py-4"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-2"><span className="text-sm font-mono text-slate-400">#{pr.number}</span><h3 className="text-sm font-semibold text-white truncate">{pr.title}</h3></div><div className="flex items-center gap-4 flex-wrap">{pr.author && <span className="text-xs text-slate-400">{pr.author}</span>}<Badge className={cn('text-xs font-medium border',statusStyles[pr.state]||statusStyles.open)}>{pr.state}</Badge>{pr.changed_files!=null && <span className="text-xs text-slate-400">{pr.changed_files} files</span>}{pr.additions!=null && <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><Plus className="h-3 w-3"/>{pr.additions}</span>}{pr.deletions!=null && <span className="inline-flex items-center gap-1 text-xs text-red-400"><Minus className="h-3 w-3"/>{pr.deletions}</span>}{pr.created_at && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Calendar className="h-3 w-3"/>{formatDate(pr.created_at)}</span>}</div></div><Button size="sm" onClick={()=>navigate(`/github/${repoFullName}/pr/${pr.number}`)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 flex-shrink-0">Analyze</Button></div></div></Card></motion.div>)}</div>
        : <EmptyState icon={<GitPullRequest className="h-12 w-12 text-slate-500"/>} title={prSearch?"No matching PRs":"No pull requests found"} description={prSearch?"Try different search term":"This repository has no pull requests or they could not be loaded."} />}
      </motion.div>
    </div>
  );
}
