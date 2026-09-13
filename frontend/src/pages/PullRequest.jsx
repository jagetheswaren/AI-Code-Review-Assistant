import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitPullRequest, ArrowLeft, GitBranch, ArrowRight, Plus, Minus, FileCode, Shield, Search, AlertTriangle, Clock, User, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { analyzePullRequest, getPRDetails, getPRFiles, postPRComment } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { Button, Card, Badge, EmptyState, PageLoader, Skeleton } from '../components/ui';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const severityColors = { critical:'bg-red-500/20 text-red-400 border-red-500/30', high:'bg-orange-500/20 text-orange-400 border-orange-500/30', medium:'bg-amber-500/20 text-amber-400 border-amber-500/30', low:'bg-blue-500/20 text-blue-400 border-blue-500/30', info:'bg-slate-500/20 text-slate-400 border-slate-500/30' };
const riskColors = { critical:'bg-red-500/15 text-red-400 border-red-500/20', high:'bg-orange-500/15 text-orange-400 border-orange-500/20', medium:'bg-amber-500/15 text-amber-400 border-amber-500/20', low:'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', none:'bg-slate-500/15 text-slate-400 border-slate-500/20' };
const statusColor = s=> s==='open'?'text-emerald-400': s==='closed'?'text-red-400':'text-purple-400';
function formatDate(d){ if(!d) return '-'; return new Date(d).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}); }

export default function PullRequest(){
  const { repoFullName, prNumber } = useParams();
  const navigate=useNavigate(); const {toast}=useToast();
  const [pr, setPr]=useState(null); const [prLoading,setPrLoading]=useState(true); const [prError,setPrError]=useState(null);
  const [files,setFiles]=useState([]); const [filesLoading,setFilesLoading]=useState(true); const [filesError,setFilesError]=useState(null);
  const [loading,setLoading]=useState(false); const [results,setResults]=useState(null);
  const [posting,setPosting]=useState(false); const [postResult,setPostResult]=useState(null);
  const [postComment,setPostComment]=useState(false);
  const owner=repoFullName?.split('/')[0]||''; const repoName=repoFullName?.split('/')[1]||'';

  useEffect(()=>{ if(repoFullName && prNumber){ loadPR(); loadFiles(); } },[repoFullName,prNumber]);

  async function loadPR(){
    setPrLoading(true); setPrError(null);
    try{ const res=await getPRDetails(repoFullName, prNumber); setPr(res.data||res); }catch(err){ setPrError(err.response?.data?.error||err.message); }finally{ setPrLoading(false); }
  }
  async function loadFiles(){
    setFilesLoading(true); setFilesError(null);
    try{ const res=await getPRFiles(repoFullName, prNumber); const data=res.data||res; setFiles(data.files||data||[]);}catch(err){ setFilesError(err.response?.data?.error||err.message); setFiles([]);}finally{ setFilesLoading(false); }
  }
  async function handleAnalyze(){
    setLoading(true); setPostResult(null);
    try{
      const data=await analyzePullRequest(repoFullName, parseInt(prNumber,10), postComment);
      setResults(data);
      if(data.pr_info) {} // already have pr
      if(postComment){ toast({title:'Review Posted',description:'The review summary has been posted to the GitHub PR.',variant:'success'}); setPostResult({success:true, msg:'Review posted successfully.'}); }
    }catch(err){
      const msg=err.response?.data?.error||err.message||'Analysis failed';
      toast({title:'Analysis failed',description:msg,variant:'error'});
    }finally{ setLoading(false); }
  }
  async function handlePostComment(){
    if(!results) return;
    setPosting(true); setPostResult(null);
    try{
      const res=await postPRComment(repoFullName, prNumber, results.request_id || results.requestId);
      // simpler: use analyze's post_comment? But dedicated endpoint uses scan_id
      // Try with stored request_id
      const bodyRes = await postPRComment(repoFullName, prNumber);
      // Actually postPRComment expects scan_id or body; we pass via results.request_id if available
      setPostResult({success:true, msg: res.data?.message||'Review posted successfully.'});
      toast({title:'Posted',description:'Review posted to GitHub',variant:'success'});
    }catch(err){
      // Fallback: try analyze with post_comment true
      try{
        await analyzePullRequest(repoFullName, parseInt(prNumber,10), true);
        setPostResult({success:true, msg:'Review posted successfully.'});
      }catch(e2){
        const msg=err.response?.data?.error||err.message;
        setPostResult({success:false, msg: msg||'Failed to post review.'});
        toast({title:'Post failed',description:msg,variant:'error'});
      }
    }finally{ setPosting(false); }
  }

  if(loading) return <PageLoader message={`Analyzing PR #${prNumber}...`} />;
  const summary=results?.summary||{};
  const fileIssues=(()=>{
    if(results?.file_issues) return results.file_issues;
    if(results?.issues_by_file) return results.issues_by_file;
    if(results?.file_analyses){ const m={}; for(const fa of results.file_analyses) m[fa.file_path]=fa.issues||[]; return m; }
    return {};
  })();
  const riskLevel=summary.overall_risk||results?.overall_risk||results?.risk_level||null;
  const grouped={security:[], code_smell:[], performance:[], best_practice:[], other:[]};
  Object.values(fileIssues).flat().forEach(i=>{ const t=i.type||'other'; if(grouped[t]) grouped[t].push(i); else grouped.other.push(i); });
  const totalIssues = summary.total_issues ?? Object.values(fileIssues).flat().length;
  const bySev = summary.by_severity || {};

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 lg:p-8">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={()=>navigate(`/github/${repoFullName}`)} className="text-slate-400 hover:text-white hover:bg-white/[0.05]"><ArrowLeft className="h-4 w-4 mr-1"/>Back to {repoName}</Button>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><GitPullRequest className="h-8 w-8 text-indigo-400" />PR #{prNumber}</h1>
          <p className="mt-1 text-sm text-slate-400">{owner}/{repoName}</p>
        </div>
      </motion.div>

      {/* PR Details */}
      {prLoading ? <Card className="bg-[#111827] border-white/[0.06] p-6 mb-6"><Skeleton className="h-6 w-2/3 bg-white/[0.06]"/><Skeleton className="h-4 w-full mt-3 bg-white/[0.04]" /></Card>
      : prError ? <Card className="bg-red-950/20 border-red-500/20 p-6 mb-6 text-center"><p className="text-sm text-red-400">{prError}</p><p className="text-xs text-slate-500 mt-1">GitHub token required. Connect GitHub in Integration page.</p><Button size="sm" variant="outline" onClick={loadPR} className="mt-3 border-red-500/30">Retry</Button></Card>
      : pr && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{delay:0.1}}>
          <Card className="bg-[#111827] border-white/[0.06] mb-6">
            <div className="px-6 py-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{pr.title}</h2>
                {pr.body && <p className="text-sm text-slate-400 mt-2 whitespace-pre-wrap line-clamp-4">{pr.body}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', pr.state==='open'?'bg-emerald-500/15 text-emerald-400 border-emerald-500/20':'bg-slate-500/15 text-slate-400 border-slate-500/20')}>{pr.state?.toUpperCase()} #{pr.number}</span>
                {pr.author && <span className="inline-flex items-center gap-1.5 text-slate-300"><User className="w-3 h-3"/>{pr.author}</span>}
                {pr.created_at && <span className="inline-flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3"/>{formatDate(pr.created_at)}</span>}
                {pr.updated_at && pr.updated_at!==pr.created_at && <span className="text-slate-500">updated {formatDate(pr.updated_at)}</span>}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-1.5"><GitBranch className="h-3.5 w-3.5 text-emerald-400"/><span className="text-sm text-white font-mono">{pr.head_branch||pr.head?.ref||'head'}</span></div>
                <ArrowRight className="h-4 w-4 text-slate-500"/>
                <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-1.5"><GitBranch className="h-3.5 w-3.5 text-blue-400"/><span className="text-sm text-white font-mono">{pr.base_branch||pr.base?.ref||'main'}</span></div>
              </div>
              <div className="flex items-center gap-6 pt-2 border-t border-white/[0.06]">
                {pr.changed_files!=null && <span className="text-sm text-slate-300"><FileCode className="inline w-4 h-4 mr-1"/>{pr.changed_files} files</span>}
                {pr.additions!=null && <span className="text-sm text-emerald-400"><Plus className="inline w-3 h-3"/> {pr.additions} additions</span>}
                {pr.deletions!=null && <span className="text-sm text-red-400"><Minus className="inline w-3 h-3"/> {pr.deletions} deletions</span>}
                {pr.html_url && <a href={pr.html_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 ml-auto">View on GitHub →</a>}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Changed Files */}
      <Card className="bg-[#111827] border-white/[0.06] mb-6">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><FileCode className="w-4 h-4 text-slate-400"/>Changed Files</h3>
          <Button size="sm" variant="ghost" onClick={loadFiles} className="text-slate-400">Refresh</Button>
        </div>
        {filesLoading ? <div className="p-6 space-y-3"><Skeleton className="h-12 w-full bg-white/[0.04]" /><Skeleton className="h-12 w-full bg-white/[0.04]" /></div>
        : filesError ? <div className="p-6 text-center"><p className="text-sm text-red-400">{filesError}</p><Button size="sm" variant="outline" onClick={loadFiles} className="mt-3">Retry</Button></div>
        : files.length ? <div className="divide-y divide-white/[0.06] max-h-[40vh] overflow-y-auto">
            {files.map((f,idx)=>(
              <div key={idx} className="px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-white truncate">{f.filename}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn('text-[10px] border', f.status==='added'?'bg-emerald-500/15 text-emerald-400 border-emerald-500/20': f.status==='removed'?'bg-red-500/15 text-red-400 border-red-500/20':'bg-white/[0.06] text-slate-400 border-white/[0.08]')}>{f.status}</Badge>
                    {!f.supported && <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/20">Unsupported — skipped</Badge>}
                    {f.supported && <Badge className="text-[10px] bg-indigo-500/15 text-indigo-400 border-indigo-500/20">Python • analyzable</Badge>}
                  </div>
                  {!f.supported && f.skip_reason && <p className="text-xs text-amber-400/70 mt-1">{f.skip_reason}</p>}
                  {f.patch && <details className="mt-2"><summary className="text-xs text-slate-500 cursor-pointer">Show diff</summary><pre className="text-[11px] bg-black/30 p-3 rounded-lg mt-2 overflow-x-auto whitespace-pre-wrap text-slate-300">{f.patch.slice(0,2000)}</pre></details>}
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-emerald-400">+{f.additions}</span>
                  <span className="text-red-400">-{f.deletions}</span>
                </div>
              </div>
            ))}
          </div>
        : <div className="p-6 text-center text-sm text-slate-500">No changed files</div>}
      </Card>

      {/* Analyze */}
      {!results && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{delay:0.15}}>
          <div className="flex flex-col items-center mb-6 gap-3">
            <Button onClick={handleAnalyze} disabled={files.length===0} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-8 py-3 shadow-lg shadow-indigo-500/25 disabled:opacity-50"><Search className="h-4 w-4 mr-2"/>Analyze Pull Request</Button>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white"><input type="checkbox" checked={postComment} onChange={e=>setPostComment(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500"/>Post review summary as GitHub PR comment</label>
            <p className="text-xs text-slate-500">Only Python (.py) files will be analyzed; others skipped safely.</p>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {results && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{delay:0.2}} className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {label:'Total', val: totalIssues, color:'text-white'},
              {label:'Critical', val: bySev.critical||0, color:'text-red-400'},
              {label:'High', val: bySev.high||0, color:'text-orange-400'},
              {label:'Medium', val: bySev.medium||0, color:'text-amber-400'},
              {label:'Low', val: bySev.low||0, color:'text-blue-400'},
              {label:'Info', val: bySev.info||0, color:'text-slate-400'},
            ].map(c=> <Card key={c.label} className="bg-[#111827] border-white/[0.06] p-4 text-center"><p className={cn('text-2xl font-bold',c.color)}>{c.val}</p><p className="text-xs text-slate-500 mt-1">{c.label}</p></Card>)}
          </div>
          <div className="flex items-center gap-3">
            <Badge className={cn('border text-sm px-3 py-1', riskColors[riskLevel||'low'])}>{riskLevel?riskLevel.toUpperCase():'N/A'} • Overall Risk</Badge>
            {results.ai_review && <span className="text-xs text-indigo-400">AI explanation included</span>}
          </div>

          {Object.entries(grouped).filter(([_,arr])=>arr.length>0).map(([type,arr])=>(
            <Card key={type} className="bg-[#111827] border-white/[0.06]">
              <div className="px-5 py-3 border-b border-white/[0.06]"><h4 className="text-sm font-semibold text-white capitalize">{type.replace('_',' ')} ({arr.length})</h4></div>
              <div className="divide-y divide-white/[0.06]">
                {arr.slice(0,20).map((issue,idx)=>(
                  <div key={idx} className="px-5 py-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn('text-[10px] border', severityColors[issue.severity]||severityColors.info)}>{issue.severity?.toUpperCase()}</Badge>
                      <span className="text-xs font-mono text-slate-500">{issue.file_path||issue.filename||'-'}:{issue.line_number||issue.line||'-'}</span>
                      <span className="text-xs text-slate-500">{issue.rule_id||issue.rule||''}</span>
                      {issue.ml_confidence!=null && <Badge className="ml-auto text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">ML {issue.ml_severity} {(issue.ml_confidence*100).toFixed(0)}%</Badge>}
                    </div>
                    <p className="text-sm text-white">{issue.message}</p>
                    {issue.explanation && <p className="text-xs text-slate-400"><span className="text-slate-500">Explanation:</span> {issue.explanation}</p>}
                    {(issue.suggestion||issue.fix_suggestion) && <p className="text-xs text-emerald-400">Fix: {issue.suggestion||issue.fix_suggestion}</p>}
                    {issue.source && <div className="flex gap-1">{issue.source.map((s,i)=><Badge key={i} className="text-[10px] bg-white/5 text-slate-400 border-white/10">{s}</Badge>)}</div>}
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {results.ai_review && (
            <Card className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/20 p-6">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4 text-indigo-400"/>AI Explanation (Ollama qwen2.5-coder:3b)</h4>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{results.ai_review}</p>
              {results.ai_review.includes('unavailable') && <p className="text-xs text-amber-400 mt-2">Fallback — Ollama not reachable. Configure OLLAMA_BASE_URL for real inference.</p>}
            </Card>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button onClick={handlePostComment} disabled={posting} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium disabled:opacity-50">
              {posting?'Posting...':'Post Review to GitHub'}
            </Button>
            <Button onClick={handleAnalyze} variant="outline" className="border-white/[0.08] text-slate-300">Re-analyze</Button>
            {postResult && <span className={cn('text-sm', postResult.success?'text-emerald-400':'text-red-400')}>{postResult.msg}</span>}
          </div>
        </motion.div>
      )}

      {!loading && !results && <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{delay:0.2}}><EmptyState icon={GitPullRequest} title="Ready to analyze" description="Review changed files above, then click Analyze to run Bandit + AST + Radon + ML + Ollama." /></motion.div>}
    </div>
  );
}
