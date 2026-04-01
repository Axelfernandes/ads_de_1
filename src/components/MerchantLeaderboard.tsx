import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Star } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { executeQuery, initDatabase } from '../data/database';
import { theme } from '../theme';

interface Merchant {
  merchant_id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  tier: string;
  avg_rating: number;
  is_premium: boolean;
  orders: number;
  revenue: number;
  avg_order: number;
}

type SortKey = 'revenue' | 'orders' | 'avg_order' | 'avg_rating';

const TIER_STYLE: Record<string, { cls: string; color: string }> = {
  DIAMOND: { cls: 'badge-blue',   color: theme.colors.cyan },
  GOLD:    { cls: 'badge-yellow', color: theme.colors.amber },
  SILVER:  { cls: 'badge-gray',   color: '#94a3b8' },
  BRONZE:  { cls: 'badge-gray',   color: '#a1855a' },
};

const RANK_COLORS = [theme.colors.amber, '#94a3b8', '#a1855a'];

export default function MerchantLeaderboard() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [sortKey, setSortKey]     = useState<SortKey>('revenue');
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc');
  const [catFilter, setCatFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');

  useEffect(() => {
    try {
      initDatabase();
      const r = executeQuery(`
        SELECT
          m.merchant_id, m.name, m.category, m.city, m.state,
          m.tier, m.avg_rating, m.is_premium,
          COUNT(o.order_id)           AS orders,
          SUM(o.revenue)              AS revenue,
          AVG(o.revenue)              AS avg_order
        FROM merchants m
        LEFT JOIN orders o ON o.merchant_id = m.merchant_id
        GROUP BY m.merchant_id, m.name, m.category, m.city, m.state, m.tier, m.avg_rating, m.is_premium
        HAVING COUNT(o.order_id) > 0
        ORDER BY revenue DESC
      `);
      setMerchants((r.data || []).map((row: unknown) => {
        const x = row as Record<string, unknown>;
        return {
          merchant_id: String(x.merchant_id || ''),
          name:        String(x.name        || ''),
          category:    String(x.category    || ''),
          city:        String(x.city        || ''),
          state:       String(x.state       || ''),
          tier:        String(x.tier        || ''),
          avg_rating:  Number(x.avg_rating  || 0),
          is_premium:  Boolean(x.is_premium),
          orders:      Number(x.orders      || 0),
          revenue:     Number(x.revenue     || 0),
          avg_order:   Number(x.avg_order   || 0),
        };
      }));
    } catch (e) { console.error(e); }
  }, []);

  const categories = ['All', ...Array.from(new Set(merchants.map(m => m.category))).sort()];
  const tiers      = ['All', 'DIAMOND', 'GOLD', 'SILVER', 'BRONZE'];

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const sorted = [...merchants]
    .filter(m => (catFilter === 'All' || m.category === catFilter) && (tierFilter === 'All' || m.tier === tierFilter))
    .sort((a, b) => sortDir === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]);

  const top3Rev = sorted.slice(0, 3).map(m => m.revenue);
  const maxRev  = Math.max(...merchants.map(m => m.revenue), 1);

  const sparkData = (m: Merchant) =>
    Array.from({ length: 12 }, (_, i) => ({
      v: (m.revenue / 30) * (0.65 + Math.sin(i * 1.3 + m.merchant_id.charCodeAt(6)) * 0.3),
    }));

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp size={10} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
  };

  const totals = {
    revenue: merchants.reduce((s, m) => s + m.revenue, 0),
    orders:  merchants.reduce((s, m) => s + m.orders, 0),
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 className="section-title">Merchant Leaderboard</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
          {merchants.length} active merchants · Ranked by revenue
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Merchant Revenue', value: `$${(totals.revenue/1000).toFixed(1)}k`,        color: theme.colors.emerald },
          { label: 'Total Orders',           value: totals.orders.toLocaleString(),                  color: theme.colors.indigo },
          { label: 'Diamond Tier',           value: merchants.filter(m => m.tier === 'DIAMOND').length, color: theme.colors.cyan },
          { label: 'Premium Merchants',      value: merchants.filter(m => m.is_premium).length,      color: theme.colors.violet },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{s.label}</div>
            <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Top 3 podium */}
      {sorted.length >= 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
          {sorted.slice(0, 3).map((m, i) => (
            <div key={m.merchant_id} className="card" style={{
              padding: '1.25rem', textAlign: 'center',
              borderTop: `3px solid ${RANK_COLORS[i]}`,
              background: i === 0 ? `radial-gradient(ellipse at top, ${theme.colors.amberSoft} 0%, var(--bg-card) 70%)` : 'var(--bg-card)',
            }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.15rem' }}>{m.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{m.category} · {m.city}</div>
              <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: RANK_COLORS[i] }}>
                ${m.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.orders} orders</div>
              {/* mini bar */}
              <div style={{ marginTop: '0.75rem', height: '4px', background: 'var(--bg-surface)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(m.revenue / top3Rev[0]) * 100}%`, background: RANK_COLORS[i], borderRadius: '99px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter row */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="select" value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
          {tiers.map(t => <option key={t}>{t}</option>)}
        </select>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {sorted.length} merchants
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Location</th>
                <th>Tier</th>
                <th onClick={() => toggleSort('avg_rating')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>Rating <SortIcon k="avg_rating" /></span>
                </th>
                <th onClick={() => toggleSort('orders')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>Orders <SortIcon k="orders" /></span>
                </th>
                <th onClick={() => toggleSort('revenue')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>Revenue <SortIcon k="revenue" /></span>
                </th>
                <th onClick={() => toggleSort('avg_order')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>AOV <SortIcon k="avg_order" /></span>
                </th>
                <th>Share</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => {
                const rankColor = i < 3 ? RANK_COLORS[i] : 'var(--text-muted)';
                const tierStyle = TIER_STYLE[m.tier] || { cls: 'badge-gray', color: '#9ca3af' };
                return (
                  <tr key={m.merchant_id}>
                    <td>
                      <span className="mono" style={{ fontWeight: 800, color: rankColor, fontSize: '0.9rem' }}>
                        #{i + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {m.name}
                        {m.is_premium && <span style={{ fontSize: '0.6rem', color: theme.colors.amber, background: theme.colors.amberSoft, padding: '0.1rem 0.3rem', borderRadius: '99px', fontWeight: 700 }}>PREMIUM</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>{m.category}</td>
                    <td style={{ fontSize: '0.75rem' }}>{m.city}, {m.state}</td>
                    <td><span className={`badge ${tierStyle.cls}`} style={{ color: tierStyle.color }}>{m.tier}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Star size={11} style={{ color: theme.colors.amber, fill: theme.colors.amber }} />
                        <span className="mono" style={{ fontSize: '0.78rem' }}>{m.avg_rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="mono">{m.orders.toLocaleString()}</td>
                    <td className="mono" style={{ color: theme.colors.emerald, fontWeight: 600 }}>
                      ${m.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="mono">${m.avg_order.toFixed(2)}</td>
                    <td style={{ width: '80px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ flex: 1, height: '4px', background: 'var(--bg-surface)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(m.revenue / maxRev) * 100}%`, background: tierStyle.color, borderRadius: '99px' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ width: '80px' }}>
                      <ResponsiveContainer width={80} height={28}>
                        <LineChart data={sparkData(m)}>
                          <Tooltip contentStyle={{ display: 'none' }} />
                          <Line type="monotone" dataKey="v" stroke={theme.colors.emerald} strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
