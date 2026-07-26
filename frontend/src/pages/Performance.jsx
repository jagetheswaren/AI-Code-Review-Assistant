import React from 'react';

export default function Performance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Performance Bottleneck Inspector</h1>
        <p className="text-sm text-slate-400">Big-O Algorithmic Complexity & Execution Optimization</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#121826] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">Average Execution Time</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">42 ms</div>
        </div>
        <div className="bg-[#121826] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">Nested Loop Alerts</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">2 Flags</div>
        </div>
        <div className="bg-[#121826] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">Memory Allocation</div>
          <div className="text-2xl font-extrabold text-blue-400 mt-1">18.4 MB</div>
        </div>
      </div>

      <div className="bg-[#121826] p-6 rounded-xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-semibold text-white">Algorithmic Optimization Recommendations</h2>
        <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between font-semibold text-amber-400">
            <span>[O(N²) Quadratic Complexity Detected]</span>
            <span>File: ml/severity_classifier.py:120</span>
          </div>
          <p className="text-slate-300">Nested iteration over dataset items found. Replacing nested loop with map/hash table lookup improves time complexity from O(N²) to O(N).</p>
        </div>
      </div>
    </div>
  );
}
