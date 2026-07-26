import React from 'react';

export default function Quality() {
  const qualityMetrics = [
    { name: 'Maintainability Index', score: '78/100', grade: 'A', status: 'Optimal' },
    { name: 'Cyclomatic Complexity', score: '12 (Rank B)', grade: 'B', status: 'Moderate' },
    { name: 'Technical Debt Ratio', score: '3.4%', grade: 'A', status: 'Low Debt' },
    { name: 'Duplicated Code Density', score: '1.8%', grade: 'A', status: 'Minimal' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Code Quality & Maintainability Inspector</h1>
        <p className="text-sm text-slate-400">Astroid & Radon Static Code Quality Metrics</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {qualityMetrics.map(m => (
          <div key={m.name} className="bg-[#121826] p-4 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400 uppercase font-semibold">{m.name}</div>
            <div className="text-2xl font-extrabold text-blue-400 mt-1">{m.score}</div>
            <div className="text-xs text-emerald-400 mt-1">Grade: {m.grade} • {m.status}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#121826] p-6 rounded-xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-semibold text-white">Code Smells & Refactoring Candidates</h2>
        <div className="space-y-3">
          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
            <div>
              <span className="font-semibold text-slate-200">[Unused Import]</span>
              <span className="text-slate-400 ml-2">backend/analyzers/smell_analyzer.py:4</span>
            </div>
            <span className="text-amber-400 font-mono">Remove unused import 'sys'</span>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
            <div>
              <span className="font-semibold text-slate-200">[Long Function]</span>
              <span className="text-slate-400 ml-2">backend/api/review_routes.py:55</span>
            </div>
            <span className="text-amber-400 font-mono">Function length is 98 lines (Max: 50)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
