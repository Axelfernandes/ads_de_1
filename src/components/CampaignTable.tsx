import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Search, X } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { executeQuery, initDatabase } from '../data/database';
import { theme } from '../theme';

interface Campaign {
  campaign_id: string;
  name: string;
  type: string;
  status: string;
  budget_daily: number;
  budget_lifetime: number;
  targeting_type: string;
  orders: number;
  revenue: number;
  impressions: number;
  clicks: number;
}

type SortKey = keyof Campaign;

const STATUS_CLS: Record<string, string> = {
  ACTIVE: 'badge-green', PAUSED: 'badge-yellow', ENDED: 'badge-gray',
};

export default function CampaignTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sortKey, setSortKey]     = useState<SortKey>('revenue');
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc');
  const [search,  setSearch]      = useState('');
  const [statusF, setStatusF]     = useState('All');
  const [typeF,   setTypeF]       = useState('All');
  const [selected, setSelected]   = useState<Campaign | null>(null);

  useEffect(() => {
    try {
      initDatabase();
      const r = executeQuery(`
        SELECT 
          c.campaign_id, c.name, c.type, c.status,
          c.budget_daily, c.budget_lifetime, c.targeting_type,
          COALESCE(o.orders, 0) AS orders,
          COALESCE(o.revenue, 0) AS revenue,
          COALESCE(i.impressions, 0) AS impressions,
          COALESCE(cl.clicks, 0) AS clicks
        FROM campaigns c
        LEFT JOIN (SELECT campaign_id, COUNT(order_id) AS orders, SUM(revenue) AS revenue FROM orders GROUP BY campaign_id) o ON o.campaign_id = c.campaign_id
        LEFT JOIN (SELECT campaign_id, COUNT(imp_id) AS impressions FROM impressions GROUP BY campaign_id) i ON i.campaign_id = c.campaign_id
        LEFT JOIN (SELECT campaign_id, COUNT(click_id) AS clicks FROM clicks GROUP BY campaign_id) cl ON cl.campaign_id = c.campaign_id
      `);
      setCampaigns((r.data || []).map((row: unknown) => {
        const x = row as Record<string, unknown>;
        return {
          campaign_id:    String(x.campaign_id    || ''),
          name:           String(x.name           || ''),
          type:           String(x.type           || ''),
          status:         String(x.status         || ''),
          budget_daily:   Number(x.budget_daily   || 0),
          budget_lifetime:Number(x.budget_lifetime || 0),
          targeting_type: String(x.targeting_type || ''),
          orders:         Number(x.orders         || 0),
          revenue:        Number(x.revenue        || 0),
          impressions:    Number(x.impressions    || 0),
          clicks:         Number(x.clicks         || 0),
        };
      }));
    } catch (e) { console.error(e); }
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const statuses = ['All', ...Array.from(new Set(campaigns.map(c => c.status)))];
  const types    = ['All', ...Array.from(new Set(campaigns.map(c => c.type)))];

  const filtered = campaigns
    .filter(c =>
      (statusF === 'All' || c.status === statusF) &&
      (typeF   === 'All' || c.type   === typeF) &&
      (search === '' || c.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number')
        return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  const totals = {
    revenue:     campaigns.reduce((s, c) => s + c.revenue, 0),
    orders:      campaigns.reduce((s, c) => s + c.orders, 0),
    impressions: campaigns.reduce((s, c) => s + c.impressions, 0),
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp size={11} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };



  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '1rem', transition: 'grid-template-columns 0.3s' }}>
      {/* Main table */}
      <div>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 className="section-title">Campaign Table</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            All {campaigns.length} campaigns · Click row to drill down
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Campaign Revenue', value: `$${(totals.revenue / 1000).toFixed(1)}k`, color: theme.colors.emerald },
            { label: 'Total Orders Driven',    value: totals.orders.toLocaleString(),            color: theme.colors.indigo },
            { label: 'Total Impressions',      value: `${(totals.impressions / 1000).toFixed(0)}k`, color: theme.colors.violet },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{s.label}</div>
              <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: '2rem' }}
              placeholder="Search campaign name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="select" value={statusF} onChange={e => setStatusF(e.target.value)}>
            {statuses.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="select" value={typeF} onChange={e => setTypeF(e.target.value)}>
            {types.map(t => <option key={t}>{t}</option>)}
          </select>
          {(search || statusF !== 'All' || typeF !== 'All') && (
            <button className="btn" onClick={() => { setSearch(''); setStatusF('All'); setTypeF('All'); }}>
              <X size={13} /> Clear
            </button>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {filtered.length} of {campaigns.length} campaigns
          </span>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {[
                    { label: 'Campaign',   key: 'name' as SortKey },
                    { label: 'Status',     key: 'status' as SortKey },
                    { label: 'Type',       key: 'type' as SortKey },
                    { label: 'Targeting',  key: 'targeting_type' as SortKey },
                    { label: 'Daily Bud.', key: 'budget_daily' as SortKey },
                    { label: 'Revenue',    key: 'revenue' as SortKey },
                    { label: 'Orders',     key: 'orders' as SortKey },
                    { label: 'Impr.',      key: 'impressions' as SortKey },
                    { label: 'CTR',        key: 'clicks' as SortKey },
                    { label: 'Trend',      key: null as unknown as SortKey },
                  ].map((col, i) => (
                    <th
                      key={i}
                      onClick={() => col.key && toggleSort(col.key)}
                      style={{ cursor: col.key ? 'pointer' : 'default' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {col.label}
                        {col.key && <SortIcon k={col.key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const ctr = c.impressions ? (c.clicks / c.impressions * 100).toFixed(1) : '0.0';
                  const isSelected = selected?.campaign_id === c.campaign_id;
                  const roas = c.budget_daily ? (c.revenue / (c.budget_daily * 30)) : 0;
                  return (
                    <tr
                      key={c.campaign_id}
                      onClick={() => setSelected(isSelected ? null : c)}
                      style={{ cursor: 'pointer', background: isSelected ? 'rgba(99,102,241,0.07)' : undefined }}
                    >
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{c.name}</div>
                        <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.campaign_id}</div>
                      </td>
                      <td><span className={`badge ${STATUS_CLS[c.status] || 'badge-gray'}`}>{c.status}</span></td>
                      <td style={{ fontSize: '0.75rem' }}>{c.type.replace('_', ' ')}</td>
                      <td style={{ fontSize: '0.75rem' }}>{c.targeting_type}</td>
                      <td className="mono">${c.budget_daily.toLocaleString()}</td>
                      <td className="mono" style={{ color: theme.colors.emerald, fontWeight: 600 }}>${c.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="mono">{c.orders.toLocaleString()}</td>
                      <td className="mono">{(c.impressions / 1000).toFixed(1)}k</td>
                      <td>
                        <span className={roas > 3 ? 'trend-up' : 'trend-down'} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          {Number(ctr)}% CTR
                        </span>
                      </td>
                      <td style={{ width: '80px' }}>
                        <ResponsiveContainer width={80} height={30}>
                          <LineChart data={getSparkData(c)}>
                            <Line type="monotone" dataKey="v" stroke={c.status === 'ACTIVE' ? theme.colors.emerald : '#555a7a'} strokeWidth={1.5} dot={false} />
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

      {/* Detail panel */}
      {selected && (
        <div className="card" style={{ padding: '1.25rem', position: 'sticky', top: '72px', alignSelf: 'start', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Campaign Detail</h3>
            <button className="btn" style={{ padding: '0.3rem 0.5rem' }} onClick={() => setSelected(null)}><X size={13} /></button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{selected.name}</div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span className={`badge ${STATUS_CLS[selected.status] || 'badge-gray'}`}>{selected.status}</span>
              <span className="badge badge-blue">{selected.type.replace('_', ' ')}</span>
              <span className="badge badge-gray">{selected.targeting_type}</span>
            </div>
          </div>

          {/* KPIs */}
          {[
            { label: 'Revenue',     value: `$${selected.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: theme.colors.emerald },
            { label: 'Orders',      value: selected.orders.toLocaleString(),                                                color: theme.colors.indigo },
            { label: 'Impressions', value: `${(selected.impressions / 1000).toFixed(1)}k`,                                 color: theme.colors.violet },
            { label: 'Clicks',      value: selected.clicks.toLocaleString(),                                                color: theme.colors.cyan },
            { label: 'Daily Budget',value: `$${selected.budget_daily.toLocaleString()}`,                                   color: theme.colors.amber },
            { label: 'Lifetime Budget', value: `$${selected.budget_lifetime.toLocaleString()}`,                            color: 'var(--text-secondary)' },
          ].map((kpi, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{kpi.label}</span>
              <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: kpi.color }}>{kpi.value}</span>
            </div>
          ))}

          {/* Derived */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Derived Metrics</div>
            {[
              { label: 'CTR',   value: selected.impressions ? `${(selected.clicks / selected.impressions * 100).toFixed(2)}%` : '—' },
              { label: 'CVR',   value: selected.clicks ? `${(selected.orders / selected.clicks * 100).toFixed(2)}%` : '—' },
              { label: 'ROAS (est.)', value: selected.budget_daily ? `${(selected.revenue / (selected.budget_daily * 30)).toFixed(2)}x` : '—' },
              { label: 'AOV',   value: selected.orders ? `$${(selected.revenue / selected.orders).toFixed(2)}` : '—' },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.label}</span>
                <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Revenue sparkline */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Revenue Trend (simulated)</div>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '0.5rem', padding: '0.5rem' }}>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={getSparkData(selected)}>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', fontSize: '0.72rem' }} formatter={(v: number) => [`$${v.toFixed(0)}`, 'Revenue']} />
                  <Line type="monotone" dataKey="v" stroke={theme.colors.indigo} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function getSparkData(c: Campaign) {
    const base = c.revenue / 30;
    return Array.from({ length: 14 }, (_, i) => ({
      v: base * (0.7 + Math.sin(i + c.campaign_id.charCodeAt(5)) * 0.3),
    }));
  }
}
