import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { executeQuery, initDatabase } from '../data/database';
import { theme } from '../theme';

interface Experiment {
  exp_id: string;
  name: string;
  type: string;
  metric_type: string;
  p_value: number;
  status: string;
  control_cvr: number;
  treatment_cvr: number;
  lift_pct: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {Number(p.value).toFixed(2)}%</div>
      ))}
    </div>
  );
};

export default function ABTestAnalyzer() {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [experiments, setExperiments]   = useState<Experiment[]>([]);

  useEffect(() => {
    try {
      initDatabase();
      const expResult = executeQuery(`SELECT exp_id, name, type, metric_type, p_value, status FROM experiments ORDER BY p_value ASC`);
      const resResult = executeQuery(`SELECT exp_id, variant, conversion_rate, lift_pct FROM experiment_results`);

      const expMap = new Map<string, Record<string, unknown>>();
      (expResult.data || []).forEach((row: unknown) => {
        const r = row as Record<string, unknown>;
        expMap.set(r.exp_id as string, { ...r, control_cvr: 0, treatment_cvr: 0, lift_pct: 0 });
      });
      (resResult.data || []).forEach((row: unknown) => {
        const r = row as Record<string, unknown>;
        const exp = expMap.get(r.exp_id as string);
        if (exp) {
          if (r.variant === 'CONTROL')   { exp.control_cvr = r.conversion_rate; }
          if (r.variant === 'TREATMENT') { exp.treatment_cvr = r.conversion_rate; exp.lift_pct = r.lift_pct; }
        }
      });
      setExperiments(Array.from(expMap.values()) as unknown as Experiment[]);
    } catch (e) { console.error(e); }
  }, []);

  const chartData = selectedTest
    ? experiments.filter(e => e.exp_id === selectedTest)
    : experiments.slice(0, 10);

  const stats = {
    total:       experiments.length,
    significant: experiments.filter(e => e.p_value < 0.05).length,
    running:     experiments.filter(e => e.status === 'RUNNING').length,
    avgLift:     experiments.filter(e => e.lift_pct > 0).reduce((s, e) => s + e.lift_pct, 0) /
                 Math.max(experiments.filter(e => e.lift_pct > 0).length, 1),
  };

  const getStatusIcon = (s: string) => {
    if (s === 'RUNNING')   return <Clock size={13} style={{ color: theme.colors.cyan }} />;
    if (s === 'COMPLETED') return <CheckCircle size={13} style={{ color: theme.colors.emerald }} />;
    return <AlertTriangle size={13} style={{ color: theme.colors.amber }} />;
  };

  const getSig = (p: number) => {
    if (p < 0.01) return { text: 'Highly Sig.', cls: 'badge-green' };
    if (p < 0.05) return { text: 'Significant', cls: 'badge-blue' };
    if (p < 0.10) return { text: 'Marginal',    cls: 'badge-yellow' };
    return { text: 'Not Sig.',   cls: 'badge-gray' };
  };

  const summaryCards = [
    { label: 'Total Tests',      value: stats.total,                   color: 'var(--text-primary)',  bg: 'var(--bg-card)' },
    { label: 'Significant',      value: stats.significant,             color: theme.colors.emerald,   bg: theme.colors.emeraldSoft },
    { label: 'Running',          value: stats.running,                 color: theme.colors.cyan,      bg: theme.colors.cyanSoft },
    { label: 'Avg Lift (wins)',  value: `+${stats.avgLift.toFixed(1)}%`, color: theme.colors.violet,  bg: theme.colors.violetSoft },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title">A/B Test Analyzer</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Statistical significance · p-value thresholds · Lift analysis</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        {summaryCards.map((c, i) => (
          <div key={i} className="card" style={{ padding: '1rem', textAlign: 'center', background: c.bg }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{c.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.color, fontFamily: 'monospace' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem' }}>
        {/* Chart */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Control vs Treatment Conversion Rate
            {selectedTest && <button
              onClick={() => setSelectedTest(null)}
              style={{ marginLeft: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>
              Clear filter
            </button>}
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{v}</span>} />
              <Bar dataKey="control_cvr"   radius={[4, 4, 0, 0]} fill={theme.colors.textMuted || '#555a7a'} name="Control" />
              <Bar dataKey="treatment_cvr" radius={[4, 4, 0, 0]} name="Treatment">
                {chartData.map((e, i) => <Cell key={i} fill={e.lift_pct > 0 ? theme.colors.emerald : theme.colors.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Experiment list */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            All Experiments ({experiments.length})
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {experiments.map(exp => {
              const sig = getSig(exp.p_value);
              const isSelected = selectedTest === exp.exp_id;
              const liftPositive = Number(exp.lift_pct) > 0;
              return (
                <div
                  key={exp.exp_id}
                  onClick={() => setSelectedTest(isSelected ? null : exp.exp_id)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                    transition: 'background 0.15s',
                    borderLeft: isSelected ? `2px solid ${theme.colors.indigo}` : '2px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{String(exp.name || '')}</span>
                    {getStatusIcon(exp.status)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`badge ${sig.cls}`}>{sig.text}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>p={Number(exp.p_value).toFixed(4)}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: liftPositive ? theme.colors.emerald : theme.colors.red, display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                      {liftPositive ? <TrendingUp size={11} /> : null}
                      {liftPositive ? '+' : ''}{Number(exp.lift_pct).toFixed(1)}%
                    </span>
                  </div>
                  {/* Confidence bar */}
                  <div style={{ marginTop: '0.5rem', height: '3px', background: 'var(--bg-surface)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (1 - Number(exp.p_value)) * 100)}%`,
                      background: Number(exp.p_value) < 0.05 ? theme.colors.emerald : theme.colors.amber,
                      borderRadius: '99px',
                      transition: 'width 0.4s',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginTop: '1rem', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div>
          <span className="badge badge-green" style={{ marginBottom: '0.25rem' }}>p &lt; 0.01</span>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Highly significant. Very confident the effect is real.</p>
        </div>
        <div>
          <span className="badge badge-blue" style={{ marginBottom: '0.25rem' }}>p &lt; 0.05</span>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Significant. Standard threshold for declaring a winner.</p>
        </div>
        <div>
          <span className="badge badge-gray" style={{ marginBottom: '0.25rem' }}>p &gt; 0.05</span>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Not significant. Need more data or effect may not be real.</p>
        </div>
      </div>
    </div>
  );
}
