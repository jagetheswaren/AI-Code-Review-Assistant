import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, LoaderCircle, LockKeyhole } from 'lucide-react';
import { SpotlightCard, FadeContent, Stepper } from '../reactbits/Bits';
import { Badge, Button, EmptyState as BaseEmptyState } from '../ui';
import { getErrorMessage } from '../../utils/errorUtils';

export function MetricCard({ label, value, detail, icon: Icon, tone = 'primary' }) {
  const toneClass = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
  }[tone] || 'text-primary bg-primary/10';

  return (
    <SpotlightCard className="p-5 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-wide text-content-muted">{label}</p>
          <p className="mt-3 truncate font-display text-2xl font-bold text-content">{value ?? '—'}</p>
          {detail && <p className="mt-1 text-xs text-content-subtle">{detail}</p>}
        </div>
        {Icon && <span className={`rounded-lg p-2 ${toneClass}`}><Icon className="h-4 w-4" /></span>}
      </div>
    </SpotlightCard>
  );
}

export function FindingCard({ finding, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect?.(finding)} className="w-full rounded-lg border border-white/[0.08] bg-[#090D13] p-4 text-left transition-colors hover:border-primary/30">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={(finding.severity || 'low').toLowerCase()}>{finding.severity || 'Unspecified'}</Badge>
        {finding.rule_id && <span className="text-[11px] font-mono text-primary">{finding.rule_id}</span>}
        {finding.line_number && <span className="text-[11px] font-mono text-content-subtle">Line {finding.line_number}</span>}
      </div>
      <p className="mt-2 text-sm font-medium text-content">{finding.message || finding.title || 'Finding'}</p>
      {finding.suggestion && <p className="mt-1 text-xs text-content-muted">{finding.suggestion}</p>}
    </button>
  );
}

export function FindingInspector({ finding, onClose }) {
  if (!finding) return null;
  return (
    <aside className="rounded-lg border border-white/[0.08] bg-[#0D131C] p-5" aria-label="Finding details">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant={(finding.severity || 'low').toLowerCase()}>{finding.severity || 'Unspecified'}</Badge>
          <h3 className="mt-3 font-display text-lg font-semibold text-content">{finding.message || finding.title || 'Finding details'}</h3>
        </div>
        {onClose && <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close finding details">Close</Button>}
      </div>
      {finding.description && <p className="mt-3 text-sm text-content-muted">{finding.description}</p>}
      {finding.suggestion && <div className="mt-4 border-t border-white/[0.08] pt-4"><p className="text-[11px] font-mono uppercase text-content-subtle">Suggested action</p><p className="mt-1 text-sm text-content-muted">{finding.suggestion}</p></div>}
    </aside>
  );
}

export function ReviewPipeline({ steps = [], activeStep = 0 }) {
  return <Stepper steps={steps} activeStep={activeStep} className="w-full" />;
}

export function RepositoryCard({ repository, onClick }) {
  return (
    <button type="button" onClick={onClick} className="w-full rounded-lg border border-white/[0.08] bg-[#090D13] p-4 text-left transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="truncate font-mono text-sm font-semibold text-content">{repository.full_name || repository.name}</p><p className="mt-1 line-clamp-2 text-xs text-content-muted">{repository.description || 'No description provided.'}</p></div>
        <Badge variant={repository.private ? 'outline' : 'cyan'}>{repository.private ? 'Private' : 'Public'}</Badge>
      </div>
      <p className="mt-4 text-[11px] font-mono text-content-subtle">{repository.language || 'Language not reported'} · {repository.default_branch || 'Default branch unavailable'}</p>
    </button>
  );
}

export function PRCard({ pullRequest, to }) {
  return (
    <Link to={to} className="block rounded-lg border border-white/[0.08] bg-[#090D13] p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3"><span className="font-mono text-xs text-primary">#{pullRequest.number}</span><Badge variant={pullRequest.state === 'open' ? 'success' : 'outline'}>{pullRequest.state || 'Unknown'}</Badge></div>
      <p className="mt-2 text-sm font-medium text-content">{pullRequest.title || 'Untitled pull request'}</p>
      <p className="mt-2 text-xs text-content-muted">{pullRequest.user?.login || pullRequest.author || 'Author unavailable'}</p>
    </Link>
  );
}

export function DiffViewer({ files = [], selectedFile, onSelectFile }) {
  if (!files.length) return <EmptyState title="No changed files" description="The pull request did not return any changed files." />;
  const active = selectedFile || files[0];
  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.08]">
      <div className="flex gap-1 overflow-x-auto border-b border-white/[0.08] bg-[#0D131C] p-2">
        {files.map((file) => <button key={file.filename} type="button" onClick={() => onSelectFile?.(file)} className={`shrink-0 rounded px-2 py-1 text-xs font-mono ${active.filename === file.filename ? 'bg-primary/10 text-primary' : 'text-content-muted'}`}>{file.filename}</button>)}
      </div>
      <pre className="max-h-[60vh] overflow-auto bg-[#070A0F] p-4 text-xs leading-6 text-content"><code>{active.patch || 'Diff content is unavailable for this file.'}</code></pre>
    </div>
  );
}

export function AIStatusCard({ status }) {
  return <SpotlightCard className="p-4"><p className="text-[11px] font-mono uppercase text-content-subtle">AI service</p><p className="mt-2 text-sm font-semibold text-content">{status?.ai_available ? status.expected_model || 'Available' : 'Unavailable'}</p><p className="mt-1 text-xs text-content-muted">{status?.error || status?.provider || (status?.ai_available ? 'Service responded successfully' : 'Status has not been confirmed')}</p></SpotlightCard>;
}

export function ReportFormatCard({ format, description, onDownload, loading = false, disabled = false }) {
  return <SpotlightCard className="flex flex-col p-5"><h3 className="font-display text-base font-semibold text-content">{format}</h3><p className="mt-2 flex-1 text-sm text-content-muted">{description}</p><Button className="mt-5 w-full" onClick={onDownload} disabled={disabled} isLoading={loading}>Export {format}</Button></SpotlightCard>;
}

export function EmptyState({ ...props }) {
  return <BaseEmptyState {...props} />;
}

export function ErrorState({ message, error, onRetry }) {
  const readable = getErrorMessage(message || error, 'The request failed. Please try again.');
  return <div role="alert" className="rounded-lg border border-danger/20 bg-danger/[0.06] p-5"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" /><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-content">Could not load this information</h3><p className="mt-1 break-words text-sm text-content-muted">{readable}</p>{onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Retry</Button>}</div></div></div>;
}

export function LoadingState({ label = 'Loading', className = '' }) {
  return <div className={`flex items-center gap-3 py-8 text-sm text-content-muted ${className}`} role="status"><FadeContent><LoaderCircle className="h-4 w-4 animate-spin text-primary" /></FadeContent><span>{label}</span></div>;
}

export function AccountRequired({ destination = '/dashboard' }) {
  return <div className="flex min-h-[50vh] items-center justify-center p-6"><div className="max-w-sm text-center"><LockKeyhole className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-4 font-display text-xl font-semibold text-content">Sign in to continue</h2><p className="mt-2 text-sm text-content-muted">This workspace requires an account.</p><Link to="/" state={{ authRequired: true, destination }} className="mt-5 inline-flex"><Button>Open sign-in</Button></Link></div></div>;
}

export function AuthDrawer({ isOpen, onClose, children, title = 'Account access' }) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[100] bg-black/70" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}><section role="dialog" aria-modal="true" aria-label={title} className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-xl border border-white/[0.08] bg-[#0D131C] p-5">{children}</section></div>;
}

export function ConnectAccountModal({ isOpen, onClose, children, title = 'Connect account' }) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}><section role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0D131C] p-5">{children}</section></div>;
}