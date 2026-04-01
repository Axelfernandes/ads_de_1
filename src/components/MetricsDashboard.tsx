import { useState, useEffect } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, MousePointer, Target, Zap } from 'lucide-react';
import { executeQuery, initDatabase } from '../data/database';
import { theme } from '../theme';

const COLORS = theme.colors.chartPalette;

const METRIC_CARDS = [
  { label: 'Total Revenue',    query: `SELECT SUM(revenue) AS v FROM orders`,                                      key: 'total_revenue',    icon: DollarSign, fmt: (v: number) => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(0)}`, accent: theme.colors.emerald,  accentSoft: theme.colors.emeraldSoft },
  { label: 'Total Orders',     query: `SELECT COUNT(*) AS v FROM orders`,                                          key: 'total_orders',     icon: ShoppingCart, fmt: (v: number) => v.toLocaleString(), accent: theme.colors.indigo,   accentSoft: theme.colors.indigoSoft },
  { label: 'Impressions',      query: `SELECT COUNT(*) AS v FROM impressions`,                                     key: 'total_impressions',icon: Target,       fmt: (v: number) => `${(v/1000).toFixed(0)}k`,  accent: theme.colors.cyan,     accentSoft: theme.colors.cyanSoft },
  { label: 'Clicks',           query: `SELECT COUNT(*) AS v FROM clicks`,                                          key: 'total_clicks',     icon: MousePointer, fmt: (v: number) => v.toLocaleString(), accent: theme.colors.violet,   accentSoft: theme.colors.violetSoft },
  { label: 'Active Campaigns', query: `SELECT COUNT(*) AS v FROM campaigns WHERE status = 'ACTIVE'`,               key: 'active_campaigns', icon: TrendingUp,   fmt: (v: number) => String(v),          accent: theme.colors.amber,    accentSoft: theme.colors.amberSoft },
  { label: 'Active Merchants', query: `SELECT COUNT(DISTINCT merchant_id) AS v FROM orders`,                       key: 'active_merchants', icon: Users,        fmt: (v: number) => String(v),          accent: theme.colors.pink,     accentSoft: theme.colors.pinkSoft },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string; dataKey?: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{label}</div>
      {payload.map((p, i) => {
        const isMonetary = String(p.name).toLowerCase().includes('revenue') || String(p.dataKey).toLowerCase().includes('revenue');
        const valStr = typeof p.value === 'number' ? p.value.toLocaleString() : p.value;
        return (
          <div key={i} style={{ color: p.color, fontWeight: 600 }}>
            {p.name}: {isMonetary ? `$${valStr}` : valStr}
          </div>
        );
      })}
    </div>
  );
};

const renderCustomizedLabel = (props: any, isCurrency: boolean = false) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, value } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const formatted = typeof value === 'number' 
    ? (isCurrency ? `$${(value/1000).toFixed(0)}k` : `${(value/1000).toFixed(1)}k`)
    : value;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '0.65rem', fontWeight: 600, textShadow: '0px 1px 3px rgba(0,0,0,0.8)' }}>
      {formatted}
    </text>
  );
};

export default function MetricsDashboard() {
  const [metrics, setMetrics]   = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<{
    daily: { date: string; revenue: number; orders: number }[];
    byCategory: { name: string; value: number; fill: string }[];
    byDevice: { name: string; impressions: number }[];
    byPlacement: { name: string; revenue: number }[];
    byAudience: { name: string; value: number; fill: string }[];
    byOrderType: { name: string; value: number }[];
    byCampaignType: { name: string; value: number }[];
  }>({ daily: [], byCategory: [], byDevice: [], byPlacement: [], byAudience: [], byOrderType: [], byCampaignType: [] });

  useEffect(() => {
    try {
      initDatabase();
      const vals: Record<string, number> = {};
      for (const card of METRIC_CARDS) {
        try {
          const r = executeQuery(card.query);
          if (r.data?.length) vals[card.key] = Number((r.data[0] as Record<string, unknown>).v) || 0;
        } catch { vals[card.key] = 0; }
      }
      setMetrics(vals);

      const daily = executeQuery(`SELECT date, SUM(revenue) AS revenue, COUNT(*) AS orders FROM orders GROUP BY date ORDER BY date LIMIT 60`);
      const cat   = executeQuery(`SELECT m.category AS name, SUM(o.revenue) AS val FROM orders o JOIN merchants m ON o.merchant_id = m.merchant_id GROUP BY m.category ORDER BY val DESC LIMIT 8`);
      const dev   = executeQuery(`SELECT device AS name, COUNT(*) AS impressions FROM impressions GROUP BY device`);
      const aud   = executeQuery(`SELECT audience_segment AS name, COUNT(*) AS val FROM impressions GROUP BY audience_segment`);
      const ord   = executeQuery(`SELECT order_type AS name, COUNT(*) AS val FROM orders GROUP BY order_type`);
      const cam   = executeQuery(`SELECT c.type AS name, SUM(o.revenue) AS val FROM orders o JOIN campaigns c ON o.campaign_id = c.campaign_id GROUP BY c.type`);
      
      const placeRaw = executeQuery(`SELECT date, placement, SUM(revenue) AS revenue FROM orders GROUP BY date, placement ORDER BY date`);
      const placeMap = new Map();
      
      const getWeekStart = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = d.getDay(); 
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return d.toISOString().slice(5, 10);
      };

      (placeRaw.data || []).forEach((r: unknown) => {
        const row = r as Record<string, unknown>;
        const d = getWeekStart(String(row.date || ''));
        if (!placeMap.has(d)) placeMap.set(d, { date: d });
        placeMap.get(d)[String(row.placement)] = (placeMap.get(d)[String(row.placement)] || 0) + Number(row.revenue || 0);
      });

      setChartData({
        daily: (daily.data || []).map((r: unknown) => {
          const row = r as Record<string, unknown>;
          return { date: String(row.date || '').slice(5), revenue: Number(row.revenue || 0), orders: Number(row.orders || 0) };
        }),
        byCategory: (cat.data || []).map((r: unknown, i: number) => {
          const row = r as Record<string, unknown>;
          return { name: String(row.name || ''), value: Number(row.val || 0), fill: COLORS[i % COLORS.length] };
        }),
        byDevice: (dev.data || []).map((r: unknown) => {
          const row = r as Record<string, unknown>;
          return { name: String(row.name || ''), impressions: Number(row.impressions || 0) };
        }),
        byPlacement: Array.from(placeMap.values()),
        byAudience: (aud.data || []).map((r: unknown, i: number) => {
          const row = r as Record<string, unknown>;
          return { name: String(row.name || ''), value: Number(row.val || 0), fill: COLORS[i % COLORS.length] };
        }),
        byOrderType: (ord.data || []).map((r: unknown) => {
          const row = r as Record<string, unknown>;
          return { name: String(row.name || ''), value: Number(row.val || 0) };
        }),
        byCampaignType: (cam.data || []).map((r: unknown) => {
          const row = r as Record<string, unknown>;
          return { name: String(row.name || ''), value: Number(row.val || 0) };
        }),
      });
    } catch (e) { console.error(e); }
  }, []);

  const ctr  = metrics.total_impressions ? (metrics.total_clicks / metrics.total_impressions * 100) : 0;
  const cvr  = metrics.total_clicks ? (metrics.total_orders / metrics.total_clicks * 100) : 0;
  const aov  = metrics.total_orders ? (metrics.total_revenue / metrics.total_orders) : 0;
  const roas = metrics.active_campaigns ? (metrics.total_revenue / (metrics.active_campaigns * 150 * 30)) : 0;

  const calcCards = [
    { label: 'CTR',             value: `${ctr.toFixed(2)}%`,  icon: MousePointer, color: theme.colors.indigo,  soft: theme.colors.indigoSoft,  trend: ctr > 10 },
    { label: 'Conversion Rate', value: `${cvr.toFixed(2)}%`,  icon: Zap,          color: theme.colors.emerald, soft: theme.colors.emeraldSoft, trend: cvr > 40 },
    { label: 'Avg Order Value', value: `$${aov.toFixed(2)}`,  icon: DollarSign,   color: theme.colors.amber,   soft: theme.colors.amberSoft,   trend: aov > 45 },
    { label: 'Est. ROAS',       value: `${roas.toFixed(2)}x`, icon: TrendingUp,   color: theme.colors.violet,  soft: theme.colors.violetSoft,  trend: roas > 3 },
  ];

  const deviceColors = [theme.colors.indigo, theme.colors.cyan, theme.colors.violet];
  const orderColors = [theme.colors.orange, theme.colors.emerald, theme.colors.cyan];
  const campaignColors = [theme.colors.pink, theme.colors.indigo];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title">Performance Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Oct 2025 – Mar 2026 · All campaigns</p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {METRIC_CARDS.map((card, i) => {
          const Icon = card.icon;
          const value = metrics[card.key] || 0;
          return (
            <div key={card.key} className="card" style={{
              padding: '1.25rem',
              borderLeft: `3px solid ${card.accent}`,
              animationDelay: `${i * 0.05}s`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                    {card.label}
                  </div>
                  <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {card.fmt(value)}
                  </div>
                </div>
                <div style={{ padding: '0.6rem', borderRadius: '0.5rem', background: card.accentSoft }}>
                  <Icon size={18} style={{ color: card.accent }} />
                </div>
              </div>
              <div className="trend-up" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <TrendingUp size={11} /> <span>Live data</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Calculated Metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        {calcCards.map((c, i) => {
          const Icon = c.icon;
          const TIcon = c.trend ? TrendingUp : TrendingDown;
          return (
            <div key={i} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: c.soft }}>
                  <Icon size={16} style={{ color: c.color }} />
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{c.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.color, fontFamily: 'monospace' }}>{c.value}</div>
              <div style={{ fontSize: '0.7rem', color: c.trend ? theme.colors.emerald : theme.colors.red, marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                <TIcon size={11} /> {c.trend ? 'Above target' : 'Below target'}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ marginBottom: '1rem' }}>
        {/* Revenue Trend */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Revenue Trend (Daily)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData.daily} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={theme.colors.emerald} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={theme.colors.emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval={9} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke={theme.colors.emerald} strokeWidth={2} fill="url(#revGrad)" name="Revenue ($)" dot={false} activeDot={{ r: 4, fill: theme.colors.emerald }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        {/* Category bar */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData.byCategory} layout="vertical" barSize={16} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Revenue ($)">
                {chartData.byCategory.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device bar */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Impressions by Device</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie 
                data={chartData.byDevice} 
                cx="50%" cy="50%" 
                outerRadius={80} 
                dataKey="impressions" 
                paddingAngle={2}
                label={(props) => renderCustomizedLabel(props, false)}
                labelLine={false}
              >
                {chartData.byDevice.map((_: any, i: number) => <Cell key={i} fill={deviceColors[i % deviceColors.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Impressions']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: '0.5rem', fontSize: '0.8rem' }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts Row 3 ── */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Revenue Composition by Placement</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData.byPlacement} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="splitGradient1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS[0]} stopOpacity={0.8} />
                <stop offset="100%" stopColor={COLORS[0]} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{v}</span>} />
            <Area type="monotone" dataKey="SEARCH" stackId="1" stroke={COLORS[0]} fill={COLORS[0]} strokeWidth={1} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="CATEGORIES" stackId="1" stroke={COLORS[1]} fill={COLORS[1]} strokeWidth={1} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="COLLECTION" stackId="1" stroke={COLORS[2]} fill={COLORS[2]} strokeWidth={1} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="DOUBLEDASH" stackId="1" stroke={COLORS[3]} fill={COLORS[3]} strokeWidth={1} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Charts Row 4 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {/* Audience Segment */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Audience Segment Reach</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData.byAudience} layout="vertical" barSize={16} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={80} />
              <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Impressions']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: '0.5rem', fontSize: '0.8rem' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Impressions">
                {chartData.byAudience.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Types */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Order Fulfillment Type</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={chartData.byOrderType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2} label={(props) => renderCustomizedLabel(props, false)} labelLine={false}>
                {chartData.byOrderType.map((_: any, i: number) => <Cell key={i} fill={orderColors[i % orderColors.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Orders']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: '0.5rem', fontSize: '0.8rem' }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Types */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Revenue by Campaign Type</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={chartData.byCampaignType} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2} label={(props) => renderCustomizedLabel(props, true)} labelLine={false}>
                {chartData.byCampaignType.map((_: any, i: number) => <Cell key={i} fill={campaignColors[i % campaignColors.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: '0.5rem', fontSize: '0.8rem' }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'capitalize' }}>{String(v).toLowerCase().replace('_', ' ')}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
