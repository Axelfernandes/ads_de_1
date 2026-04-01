import { useState, useEffect } from 'react';
import { executeQuery, initDatabase } from '../data/database';
import { theme } from '../theme';
import { Target, MousePointer, ShoppingCart } from 'lucide-react';

interface FunnelRow {
  impressions: number;
  clicks: number;
  orders: number;
  revenue: number;
}

export default function FunnelAnalysis() {
  const [funnel, setFunnel] = useState<FunnelRow>({ impressions: 0, clicks: 0, orders: 0, revenue: 0 });
  const [dimension, setDimension] = useState<'device' | 'placement' | 'audience_segment'>('device');
  const [breakdown, setBreakdown] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    try {
      initDatabase();

      const imp = executeQuery(`SELECT COUNT(*) AS v FROM impressions`);
      const clk = executeQuery(`SELECT COUNT(*) AS v FROM clicks`);
      const ord = executeQuery(`SELECT COUNT(*) AS v FROM orders`);
      const rev = executeQuery(`SELECT SUM(revenue) AS v FROM orders`);

      const get = (r: typeof imp) => Number((r.data?.[0] as Record<string, unknown>)?.v || 0);

      setFunnel({
        impressions: get(imp),
        clicks:      get(clk),
        orders:      get(ord),
        revenue:     get(rev),
      });
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    try {
      initDatabase();
      const r = executeQuery(`SELECT ${dimension} AS name, COUNT(*) AS val FROM impressions GROUP BY ${dimension} ORDER BY val DESC`);
      setBreakdown((r.data || []).map((row: unknown) => {
        const x = row as Record<string, unknown>;
        return { name: String(x.name || ''), value: Number(x.val || 0) };
      }));
    } catch (e) { console.error(e); }
  }, [dimension]);

  const maxVal      = funnel.impressions || 1;
  const ctr         = funnel.impressions ? (funnel.clicks  / funnel.impressions * 100) : 0;
  const cvr         = funnel.clicks      ? (funnel.orders  / funnel.clicks      * 100) : 0;
  const overallConv = funnel.impressions ? (funnel.orders  / funnel.impressions * 100) : 0;
  const aov         = funnel.orders      ? (funnel.revenue / funnel.orders)             : 0;

  const stages = [
    { label: 'Impressions', value: funnel.impressions, icon: Target,       color: theme.colors.cyan,   dropRate: null },
    { label: 'Clicks',      value: funnel.clicks,      icon: MousePointer, color: theme.colors.violet, dropRate: ctr,  rateLabel: 'CTR' },
    { label: 'Orders',      value: funnel.orders,      icon: ShoppingCart, color: theme.colors.indigo, dropRate: cvr,  rateLabel: 'CVR' },
  ] as const;

  const maxBreak = Math.max(...breakdown.map(b => b.value), 1);

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 className="section-title">Funnel Analysis</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
          Full conversion pipeline · Impression → Click → Order
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Funnel Viz */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2rem', textAlign: 'center' }}>
            Conversion Funnel
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
            {stages.map((stage, idx) => {
              const widthPct = Math.max((stage.value / maxVal) * 100, 8);
              const Icon = stage.icon;
              return (
                <div key={stage.label} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Connector + rate badge */}
                  {idx > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.5rem 0' }}>
                      <div style={{ width: 2, height: 16, background: 'var(--border)' }} />
                      <span className="badge badge-gray">
                        {(stage as { dropRate?: number | null; rateLabel?: string }).dropRate?.toFixed(2)}%{' '}
                        {(stage as { rateLabel?: string }).rateLabel}
                      </span>
                      <div style={{ width: 2, height: 16, background: 'var(--border)' }} />
                    </div>
                  )}
                  {/* Bar */}
                  <div style={{
                    width: `${widthPct}%`,
                    minWidth: 160,
                    background: `linear-gradient(90deg, ${stage.color}99, ${stage.color})`,
                    padding: '0.9rem 1.1rem',
                    borderRadius: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: `0 4px 16px ${stage.color}33`,
                    transition: 'width 0.6s ease-out',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                      <Icon size={16} />
                      <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{stage.label}</span>
                    </div>
                    <span className="mono" style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
                      {stage.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revenue bottom */}
          <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
              Total Revenue Generated
            </div>
            <div className="mono" style={{ fontSize: '2.25rem', fontWeight: 800, color: theme.colors.emerald }}>
              ${funnel.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'CTR',               value: `${ctr.toFixed(2)}%`,          color: theme.colors.violet },
              { label: 'CVR',               value: `${cvr.toFixed(2)}%`,          color: theme.colors.indigo },
              { label: 'Overall Conv.',     value: `${overallConv.toFixed(3)}%`,  color: theme.colors.cyan },
              { label: 'Avg Order Value',   value: `$${aov.toFixed(2)}`,          color: theme.colors.emerald },
            ].map((k, i) => (
              <div key={i} className="card" style={{ padding: '0.9rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
                <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="card" style={{ padding: '1.25rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Impression Breakdown</h3>
              <select
                className="select"
                value={dimension}
                onChange={e => setDimension(e.target.value as typeof dimension)}
                style={{ fontSize: '0.75rem' }}
              >
                <option value="device">By Device</option>
                <option value="placement">By Placement</option>
                <option value="audience_segment">By Audience</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {breakdown.map((item, i) => {
                const pct = (item.value / maxBreak) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {item.name.replace(/_/g, ' ')}
                      </span>
                      <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {item.value.toLocaleString()}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({( (item.value / maxVal) * 100 ).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: theme.colors.indigo, borderRadius: 99, transition: 'width 0.5s ease-out' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insight box */}
          <div className="card" style={{ padding: '1.1rem', borderLeft: `3px solid ${theme.colors.amber}` }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.colors.amber, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
              Key Insights
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.7 }}>
              <li>
                Overall impression → order rate is{' '}
                <strong style={{ color: theme.colors.emerald }}>{overallConv.toFixed(3)}%</strong>.
              </li>
              <li>
                Biggest drop-off: impressions to clicks at <strong style={{ color: theme.colors.red }}>{(100 - ctr).toFixed(1)}%</strong> fall-through.
              </li>
              <li>
                Average order value is <strong style={{ color: theme.colors.amber }}>${aov.toFixed(2)}</strong> across {funnel.orders.toLocaleString()} orders.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
