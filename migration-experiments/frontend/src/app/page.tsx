"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/health`);
        if (res.ok) {
          const data = await res.json();
          setHealthStatus(data);
        } else {
          setError(`Error: ${res.statusText}`);
        }
      } catch (err: any) {
        setError(`Connection Failed: ${err.message}`);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="border-b bg-white p-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-blue-600">AI-Code-Review-Assistant</h1>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-8 gap-8 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-4 max-w-2xl">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Automated AI Code Reviews</h2>
          <p className="text-lg text-slate-600">
            Detect bugs, security vulnerabilities, performance issues, and code smells instantly. Paste your code and let the AI analyze it.
          </p>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors text-lg">
          Start Code Review
        </button>

        {/* Backend Connection Status section */}
        <div className="mt-16 w-full max-w-lg p-6 bg-white rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">System Status</h3>
          
          {error ? (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm font-medium border border-red-200">
              {error}
            </div>
          ) : healthStatus ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="font-medium text-slate-600">Backend API</span>
                <span className="flex items-center text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                  Connected
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="font-medium text-slate-600">PostgreSQL</span>
                <span className={`flex items-center font-semibold ${healthStatus.postgres_connection === 'ok' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${healthStatus.postgres_connection === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {healthStatus.postgres_connection === 'ok' ? 'Connected' : 'Error'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="font-medium text-slate-600">Redis</span>
                <span className={`flex items-center font-semibold ${healthStatus.redis_connection === 'ok' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${healthStatus.redis_connection === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {healthStatus.redis_connection === 'ok' ? 'Connected' : 'Error'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-sm italic text-center p-4">
              Checking system status...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
