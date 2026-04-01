import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Copy, Check, AlertCircle, Clock, Download, BookOpen } from 'lucide-react';
import { executeQuery } from '../data/database';
import { queryLibrary } from '../data/queryLibrary';
import { theme } from '../theme';

const DIFF_COLORS: Record<string, string> = {
  Beginner:     theme.colors.emerald,
  Intermediate: theme.colors.amber,
  Advanced:     theme.colors.red,
};
const DIFF_BG: Record<string, string> = {
  Beginner:     theme.colors.emeraldSoft,
  Intermediate: theme.colors.amberSoft,
  Advanced:     theme.colors.redSoft,
};

export default function SQLPlayground() {
  const [query, setQuery]             = useState(queryLibrary[0].sql);
  const [result, setResult]           = useState<{ data: unknown[]; columns: string[]; rowCount: number } | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);
  const [executionTime, setExecTime]  = useState<number | null>(null);
  const [selectedId, setSelectedId]   = useState<string>(queryLibrary[0].id);
  const [categoryFilter, setCatFilter]= useState<string>('All');
  const [page, setPage]               = useState(0);

  const PAGE_SIZE = 50;
  const categories = ['All', ...Array.from(new Set(queryLibrary.map(q => q.category)))];

  const filteredLib = queryLibrary.filter(q => categoryFilter === 'All' || q.category === categoryFilter);

  const handleExecute = useCallback(() => {
    setError(null);
    setResult(null);
    setExecTime(null);
    setPage(0);
    const t0 = performance.now();
    try {
      const res = executeQuery(query);
      setResult(res);
      setExecTime(Math.round(performance.now() - t0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
    }
  }, [query]);

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    const header = result.columns.join(',');
    const rows   = result.data.map(r =>
      result.columns.map(c => {
        const v = (r as Record<string, unknown>)[c];
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v ?? '');
      }).join(',')
    );
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'query_results.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleExecute(); }
  };

  const pagedData = result?.data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) || [];
  const totalPages = result ? Math.ceil(result.data.length / PAGE_SIZE) : 0;

  return (
    <div onKeyDown={handleKeyDown}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h2 className="section-title">SQL Playground</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Live in-browser SQL · alasql engine · <span className="mono" style={{ color: 'var(--indigo)', fontSize: '0.75rem' }}>⌘ + Enter</span> to run
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleCopy} className="btn">
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy SQL'}
          </button>
          <button onClick={handleExecute} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
            <Play size={13} /> Run Query
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1rem' }}>
        {/* Query library */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '520px' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BookOpen size={14} style={{ color: 'var(--indigo)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>Query Library</span>
            <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{queryLibrary.length}</span>
          </div>
          {/* Category filter */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                style={{
                  padding: '0.2rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', border: 'none', cursor: 'pointer', fontWeight: 600,
                  background: categoryFilter === cat ? 'var(--indigo)' : 'var(--bg-surface)',
                  color: categoryFilter === cat ? 'white' : 'var(--text-muted)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem' }}>
            {filteredLib.map(q => {
              const isActive = q.id === selectedId;
              return (
                <div
                  key={q.id}
                  onClick={() => { setQuery(q.sql); setResult(null); setError(null); setSelectedId(q.id); }}
                  style={{
                    padding: '0.6rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', marginBottom: '0.2rem',
                    background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{q.name}</div>
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <span style={{
                      padding: '0.1rem 0.4rem', borderRadius: '99px', fontSize: '0.6rem', fontWeight: 600,
                      color: DIFF_COLORS[q.difficulty] || 'var(--text-muted)',
                      background: DIFF_BG[q.difficulty] || 'var(--bg-surface)',
                    }}>{q.difficulty}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{q.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Editor + results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Editor */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)',
              background: 'rgba(0,0,0,0.2)',
            }}>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SQL Editor</span>
              {executionTime !== null && (
                <span style={{ fontSize: '0.72rem', color: theme.colors.emerald, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={11} /> {executionTime}ms
                </span>
              )}
            </div>
            <Editor
              height="300px"
              defaultLanguage="sql"
              value={query}
              onChange={(v) => setQuery(v || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
                renderLineHighlight: 'gutter',
                cursorBlinking: 'smooth',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '1rem', background: theme.colors.redSoft,
              border: `1px solid ${theme.colors.red}44`, borderRadius: '0.75rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            }}>
              <AlertCircle size={18} style={{ color: theme.colors.red, flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <div style={{ fontWeight: 600, color: theme.colors.red, fontSize: '0.82rem' }}>Query Error</div>
                <div className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{error}</div>
              </div>
            </div>
          )}

          {/* Results table */}
          {result && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    {result.rowCount.toLocaleString()} rows
                  </span>
                  {totalPages > 1 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Page {page + 1} of {totalPages}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {totalPages > 1 && (
                    <>
                      <button className="btn" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>‹ Prev</button>
                      <button className="btn" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next ›</button>
                    </>
                  )}
                  <button onClick={handleDownloadCSV} className="btn">
                    <Download size={13} /> CSV
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                <table className="data-table">
                  <thead>
                    <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)' }}>
                      {result.columns.map((col, i) => <th key={i}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedData.map((row: unknown, ri) => (
                      <tr key={ri}>
                        {result.columns.map((col, ci) => {
                          const v = (row as Record<string, unknown>)[col];
                          const isNum = typeof v === 'number';
                          return (
                            <td key={ci} className={isNum ? 'mono' : ''} style={{ color: isNum ? 'var(--indigo)' : 'var(--text-secondary)', fontSize: '0.78rem' }}>
                              {isNum ? Number(v).toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(v ?? '')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
