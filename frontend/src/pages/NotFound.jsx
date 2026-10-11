import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, Home, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui';
import { DecryptedText, FadeContent } from '../components/reactbits/Bits';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070A] p-6 text-content">
      <FadeContent className="max-w-lg w-full text-center space-y-6">
        {/* Terminal Glitch Icon */}
        <div className="inline-flex p-4 rounded-2xl bg-[#0D131C] border border-white/[0.08] shadow-2xl">
          <Terminal className="w-12 h-12 text-primary" />
        </div>

        <div>
          <div className="text-6xl sm:text-7xl font-bold font-display tracking-tight text-content mb-2">
            404
          </div>
          <div className="text-xs font-mono text-primary flex items-center justify-center gap-1.5 mb-3">
            <ShieldAlert className="w-3.5 h-3.5 text-warning" />
            <DecryptedText text="ERR_ROUTE_NOT_FOUND // 0x404" speed={30} />
          </div>
          <p className="text-sm text-content-muted leading-relaxed max-w-sm mx-auto font-sans">
            The requested module, review endpoint, or repository route does not exist in the active AST graph.
          </p>
        </div>

        {/* Diagnostic Code Box */}
        <div className="p-4 rounded-xl bg-[#0D131C] border border-white/[0.06] text-left font-mono text-xs text-content-muted space-y-1">
          <p className="text-content-subtle"># Diagnostic stack trace</p>
          <p><span className="text-danger">&gt;</span> Router.resolve(window.location.pathname) <span className="text-danger">FAILED</span></p>
          <p><span className="text-primary">&gt;</span> Status: 404 Not Found (ModuleUnregistered)</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/">
            <Button variant="primary" size="md" className="font-semibold text-xs font-mono">
              <Home className="w-3.5 h-3.5 mr-2" />
              Return to Dashboard
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="md"
            className="text-xs font-mono"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Go Back
          </Button>
        </div>
      </FadeContent>
    </div>
  );
}
