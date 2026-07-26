import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Security() {
  const [filter, setFilter] = useState('all');

  // eslint-disable-next-line no-unused-vars
  const { data: stats } = useQuery({
    queryKey: ['securityStats'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/statistics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.data;
    }
  });

  const issues = [
    { id: 'SEC-101', severity: 'critical', category: 'OWASP A03: Injection', file: 'auth_service/login.py', line: 14, rule: 'SQL Injection String Concatenation', fix: 'Use parameterized queries with cursor.execute()' },
    { id: 'SEC-102', severity: 'high', category: 'OWASP A08: Software Integrity', file: 'backend/utils.py', line: 32, rule: 'Unsafe Pickle Deserialization', fix: 'Replace pickle.loads() with json.loads()' },
    { id: 'SEC-103', severity: 'medium', category: 'OWASP A02: Cryptographic Failures', file: 'config/keys.py', line: 8, rule: 'Hardcoded Secret Key', fix: 'Store secrets in environment variables via python-dotenv' },
    { id: 'SEC-104', severity: 'low', category: 'OWASP A05: Security Misconfiguration', file: 'app.py', line: 42, rule: 'Debug Mode Enabled in Production', fix: 'Set FLASK_ENV=production and debug=False' },
  ];

  const filteredIssues = filter === 'all' ? issues : issues.filter(i => i.severity === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Vulnerabilities Inspector</h1>
          <p className="text-sm text-slate-400">OWASP Top 10 Security Audit & Automated Remediation</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#121826] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">Critical Vulnerabilities</div>
          <div className="text-2xl font-extrabold text-red-500 mt-1">1</div>
        </div>
        <div className="bg-[#121826] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">High Vulnerabilities</div>
          <div className="text-2xl font-extrabold text-amber-500 mt-1">1</div>
        </div>
        <div className="bg-[#121826] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">Medium Vulnerabilities</div>
          <div className="text-2xl font-extrabold text-blue-500 mt-1">1</div>
        </div>
        <div className="bg-[#121826] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">Low Vulnerabilities</div>
          <div className="text-2xl font-extrabold text-emerald-500 mt-1">1</div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {['all', 'critical', 'high', 'medium', 'low'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors ${
              filter === s ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-[#121826] border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/50 text-slate-400 uppercase border-b border-slate-800">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Severity</th>
              <th className="p-3">OWASP Category</th>
              <th className="p-3">File & Line</th>
              <th className="p-3">Rule Description</th>
              <th className="p-3">Recommended Fix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-200">
            {filteredIssues.map(iss => (
              <tr key={iss.id} className="hover:bg-slate-800/30">
                <td className="p-3 font-mono font-bold">{iss.id}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    iss.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    iss.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    iss.severity === 'medium' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {iss.severity}
                  </span>
                </td>
                <td className="p-3 text-slate-400">{iss.category}</td>
                <td className="p-3 font-mono text-slate-300">{iss.file}:{iss.line}</td>
                <td className="p-3 font-medium">{iss.rule}</td>
                <td className="p-3 text-emerald-400 font-mono text-[11px] bg-emerald-950/20">{iss.fix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
