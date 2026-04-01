import { useState, useEffect } from 'react';
import { Database, Table, X, ChevronRight } from 'lucide-react';
import { getTableStats, initDatabase } from '../data/database';
import { theme } from '../theme';

interface Relationship { from: string; to: string; fromCol: string; toCol: string; }

const tableLayouts: Record<string, { x: number; y: number; width: number; height: number }> = {
  campaigns:          { x: 50,  y: 50,  width: 220, height: 185 },
  merchants:          { x: 350, y: 50,  width: 220, height: 200 },
  customers:          { x: 650, y: 50,  width: 220, height: 185 },
  time_dim:           { x: 50,  y: 310, width: 220, height: 185 },
  store_locations:    { x: 350, y: 310, width: 220, height: 200 },
  ad_groups:          { x: 50,  y: 570, width: 220, height: 165 },
  creatives:          { x: 350, y: 570, width: 220, height: 165 },
  impressions:        { x: 650, y: 310, width: 220, height: 200 },
  clicks:             { x: 650, y: 570, width: 220, height: 185 },
  orders:             { x: 950, y: 310, width: 220, height: 225 },
  experiments:        { x: 950, y: 50,  width: 220, height: 185 },
  experiment_results: { x: 950, y: 570, width: 220, height: 165 },
};

const tableColumns: Record<string, { name: string; type: string }[]> = {
  campaigns:          [{ name: 'campaign_id', type: 'PK' }, { name: 'name', type: 'string' }, { name: 'type', type: 'enum' }, { name: 'status', type: 'enum' }, { name: 'budget_daily', type: 'number' }, { name: 'budget_lifetime', type: 'number' }, { name: 'start_date', type: 'date' }, { name: 'end_date', type: 'date' }, { name: 'targeting_type', type: 'enum' }, { name: 'merchant_id', type: 'FK' }],
  merchants:          [{ name: 'merchant_id', type: 'PK' }, { name: 'name', type: 'string' }, { name: 'category', type: 'string' }, { name: 'city', type: 'string' }, { name: 'state', type: 'string' }, { name: 'tier', type: 'enum' }, { name: 'avg_rating', type: 'number' }, { name: 'is_premium', type: 'boolean' }, { name: 'created_date', type: 'date' }],
  customers:          [{ name: 'customer_id', type: 'PK' }, { name: 'is_new', type: 'boolean' }, { name: 'first_order_date', type: 'date' }, { name: 'segment', type: 'enum' }, { name: 'lifetime_value', type: 'number' }, { name: 'ltv_tier', type: 'enum' }, { name: 'signup_source', type: 'enum' }],
  time_dim:           [{ name: 'date', type: 'PK' }, { name: 'day_of_week', type: 'string' }, { name: 'hour', type: 'number' }, { name: 'daypart', type: 'enum' }, { name: 'is_weekend', type: 'boolean' }, { name: 'month', type: 'number' }, { name: 'quarter', type: 'number' }, { name: 'year', type: 'number' }],
  store_locations:    [{ name: 'location_id', type: 'PK' }, { name: 'merchant_id', type: 'FK' }, { name: 'city', type: 'string' }, { name: 'state', type: 'string' }, { name: 'region', type: 'enum' }, { name: 'is_test_market', type: 'boolean' }, { name: 'lat', type: 'number' }, { name: 'lng', type: 'number' }],
  ad_groups:          [{ name: 'ad_group_id', type: 'PK' }, { name: 'campaign_id', type: 'FK' }, { name: 'name', type: 'string' }, { name: 'bid_type', type: 'enum' }, { name: 'bid_amount', type: 'number' }, { name: 'targeting_criteria', type: 'string' }, { name: 'status', type: 'enum' }],
  creatives:          [{ name: 'creative_id', type: 'PK' }, { name: 'campaign_id', type: 'FK' }, { name: 'name', type: 'string' }, { name: 'type', type: 'enum' }, { name: 'headline', type: 'string' }, { name: 'image_url', type: 'string' }, { name: 'ctr_benchmark', type: 'number' }],
  impressions:        [{ name: 'imp_id', type: 'PK' }, { name: 'date', type: 'FK' }, { name: 'campaign_id', type: 'FK' }, { name: 'merchant_id', type: 'FK' }, { name: 'location_id', type: 'FK' }, { name: 'device', type: 'enum' }, { name: 'placement', type: 'enum' }, { name: 'audience_segment', type: 'enum' }, { name: 'creative_id', type: 'FK' }, { name: 'hour', type: 'number' }],
  clicks:             [{ name: 'click_id', type: 'PK' }, { name: 'imp_id', type: 'FK' }, { name: 'date', type: 'FK' }, { name: 'campaign_id', type: 'FK' }, { name: 'device', type: 'enum' }, { name: 'placement', type: 'enum' }, { name: 'keyword', type: 'string' }, { name: 'creative_id', type: 'FK' }, { name: 'hour', type: 'number' }],
  orders:             [{ name: 'order_id', type: 'PK' }, { name: 'date', type: 'FK' }, { name: 'customer_id', type: 'FK' }, { name: 'campaign_id', type: 'FK' }, { name: 'merchant_id', type: 'FK' }, { name: 'location_id', type: 'FK' }, { name: 'revenue', type: 'number' }, { name: 'is_incremental', type: 'boolean' }, { name: 'order_type', type: 'enum' }, { name: 'coupon_used', type: 'boolean' }, { name: 'delivery_fee', type: 'number' }, { name: 'hour', type: 'number' }],
  experiments:        [{ name: 'exp_id', type: 'PK' }, { name: 'name', type: 'string' }, { name: 'type', type: 'enum' }, { name: 'start_date', type: 'date' }, { name: 'end_date', type: 'date' }, { name: 'control_group', type: 'string' }, { name: 'treatment_group', type: 'string' }, { name: 'metric_type', type: 'enum' }, { name: 'status', type: 'enum' }, { name: 'p_value', type: 'number' }],
  experiment_results: [{ name: 'result_id', type: 'PK' }, { name: 'exp_id', type: 'FK' }, { name: 'variant', type: 'enum' }, { name: 'sample_size', type: 'number' }, { name: 'conversion_rate', type: 'number' }, { name: 'revenue', type: 'number' }, { name: 'orders', type: 'number' }, { name: 'lift_pct', type: 'number' }],
};

const relationships: Relationship[] = [
  { from: 'campaigns', to: 'merchants', fromCol: 'merchant_id', toCol: 'merchant_id' },
  { from: 'impressions', to: 'campaigns', fromCol: 'campaign_id', toCol: 'campaign_id' },
  { from: 'impressions', to: 'merchants', fromCol: 'merchant_id', toCol: 'merchant_id' },
  { from: 'impressions', to: 'store_locations', fromCol: 'location_id', toCol: 'location_id' },
  { from: 'impressions', to: 'creatives', fromCol: 'creative_id', toCol: 'creative_id' },
  { from: 'clicks', to: 'impressions', fromCol: 'imp_id', toCol: 'imp_id' },
  { from: 'clicks', to: 'campaigns', fromCol: 'campaign_id', toCol: 'campaign_id' },
  { from: 'clicks', to: 'creatives', fromCol: 'creative_id', toCol: 'creative_id' },
  { from: 'orders', to: 'customers', fromCol: 'customer_id', toCol: 'customer_id' },
  { from: 'orders', to: 'campaigns', fromCol: 'campaign_id', toCol: 'campaign_id' },
  { from: 'orders', to: 'merchants', fromCol: 'merchant_id', toCol: 'merchant_id' },
  { from: 'orders', to: 'store_locations', fromCol: 'location_id', toCol: 'location_id' },
  { from: 'ad_groups', to: 'campaigns', fromCol: 'campaign_id', toCol: 'campaign_id' },
  { from: 'creatives', to: 'campaigns', fromCol: 'campaign_id', toCol: 'campaign_id' },
  { from: 'experiment_results', to: 'experiments', fromCol: 'exp_id', toCol: 'exp_id' },
];

const tableColors: Record<string, string> = {
  campaigns: theme.colors.indigo, merchants: theme.colors.emerald, customers: theme.colors.amber,
  time_dim: '#64748b', store_locations: theme.colors.violet, ad_groups: theme.colors.pink,
  creatives: theme.colors.cyan, impressions: theme.colors.red, clicks: theme.colors.orange,
  orders: '#84cc16', experiments: theme.colors.cyan, experiment_results: theme.colors.violet,
};

const tableLabels: Record<string, string> = {
  campaigns: 'Campaigns', merchants: 'Merchants', customers: 'Customers',
  time_dim: 'Time Dimension', store_locations: 'Store Locations', ad_groups: 'Ad Groups',
  creatives: 'Creatives', impressions: 'Impressions', clicks: 'Clicks',
  orders: 'Orders', experiments: 'Experiments', experiment_results: 'Exp. Results',
};

function bezierPath(
  x1: number, y1: number, x2: number, y2: number
): string {
  const dx = Math.abs(x2 - x1) * 0.5;
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

export default function SchemaExplorer() {
  const [selectedTable, setSelectedTable]   = useState<string | null>(null);
  const [hoveredTable,  setHoveredTable]    = useState<string | null>(null);
  const [showConnected, setShowConnected]   = useState(false);
  const [stats, setStats]                   = useState<Record<string, number>>({});

  useEffect(() => {
    initDatabase();
    setStats(getTableStats());
  }, []);

  const tables = Object.keys(tableLayouts).map(name => ({
    name, ...tableLayouts[name], columns: tableColumns[name] || [], rowCount: stats[name] || 0,
  }));

  const getConnected = (t: string) => {
    const s = new Set<string>();
    relationships.forEach(r => {
      if (r.from === t) s.add(r.to);
      if (r.to === t)   s.add(r.from);
    });
    return [...s];
  };

  const visible = showConnected && selectedTable
    ? tables.filter(t => t.name === selectedTable || getConnected(selectedTable).includes(t.name))
    : tables;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} style={{ color: 'var(--indigo)' }} />
            Interactive ERD · DoorDash Ads Schema
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Click any table to inspect · Bezier lines show FK relationships
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowConnected(!showConnected)}
            className={`btn${showConnected ? ' btn-primary' : ''}`}
          >
            {showConnected ? 'Show All' : 'Connected Only'}
          </button>
          {selectedTable && (
            <button className="btn" onClick={() => setSelectedTable(null)}>
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', minHeight: '600px' }}>
        {/* ERD Canvas */}
        <div className="card" style={{
          position: 'relative', overflow: 'auto', minHeight: '720px',
          background: 'rgba(15,17,23,0.8)',
        }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '1200px', height: '800px', pointerEvents: 'none' }}>
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="rgba(99,102,241,0.6)" />
              </marker>
            </defs>
            {relationships.map((rel, idx) => {
              const f = tableLayouts[rel.from];
              const t = tableLayouts[rel.to];
              if (!f || !t) return null;
              const isHigh = hoveredTable === rel.from || hoveredTable === rel.to ||
                             selectedTable === rel.from || selectedTable === rel.to;
              const x1 = f.x + f.width;
              const y1 = f.y + f.height / 2;
              const x2 = t.x;
              const y2 = t.y + t.height / 2;
              return (
                <path
                  key={idx}
                  d={bezierPath(x1, y1, x2, y2)}
                  fill="none"
                  stroke={isHigh ? theme.colors.indigo : 'rgba(255,255,255,0.08)'}
                  strokeWidth={isHigh ? 2 : 1}
                  strokeDasharray={isHigh ? 'none' : '4 3'}
                  markerEnd={isHigh ? 'url(#arrow)' : undefined}
                  style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                />
              );
            })}
          </svg>

          <div style={{ position: 'relative', width: '1200px', height: '800px' }}>
            {visible.map(table => {
              const isSel = selectedTable === table.name;
              const isHov = hoveredTable === table.name;
              const color = tableColors[table.name];
              return (
                <div
                  key={table.name}
                  onClick={() => setSelectedTable(isSel ? null : table.name)}
                  onMouseEnter={() => setHoveredTable(table.name)}
                  onMouseLeave={() => setHoveredTable(null)}
                  style={{
                    position: 'absolute', left: table.x, top: table.y, width: table.width,
                    background: isSel ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
                    borderRadius: '0.75rem',
                    border: `1.5px solid ${isSel ? color : isHov ? 'rgba(255,255,255,0.15)' : 'var(--border)'}`,
                    boxShadow: isSel ? `0 0 20px ${color}44` : isHov ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.3)',
                    cursor: 'pointer', overflow: 'hidden',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    zIndex: isSel || isHov ? 10 : 1,
                  }}
                >
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    background: color,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.03em' }}>
                      {tableLabels[table.name]}
                    </span>
                    <span style={{
                      background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '0.6rem',
                      padding: '0.1rem 0.4rem', borderRadius: '99px', fontFamily: 'monospace', fontWeight: 600,
                    }}>
                      {table.rowCount.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ padding: '0.5rem 0.6rem' }}>
                    {table.columns.slice(0, 6).map(col => (
                      <div key={col.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0', fontSize: '0.7rem' }}>
                        <span style={{
                          minWidth: '24px', fontSize: '0.6rem', fontWeight: 700,
                          color: col.type === 'PK' ? theme.colors.amber : col.type === 'FK' ? theme.colors.cyan : 'transparent',
                        }}>{col.type === 'PK' ? 'PK' : col.type === 'FK' ? 'FK' : ''}</span>
                        <span className="mono" style={{ color: col.type === 'PK' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{col.name}</span>
                      </div>
                    ))}
                    {table.columns.length > 6 && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        +{table.columns.length - 6} more columns
                      </div>
                    )}
                  </div>
                  {getConnected(table.name).length > 0 && (
                    <div style={{ padding: '0.3rem 0.6rem', borderTop: '1px solid var(--border)', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <ChevronRight size={10} /> {getConnected(table.name).length} relationships
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="card" style={{ padding: '1rem', overflow: 'auto' }}>
          {selectedTable ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                  <Table size={15} style={{ color: tableColors[selectedTable] }} />
                  {tableLabels[selectedTable]}
                </h3>
                <button onClick={() => setSelectedTable(null)} className="btn" style={{ padding: '0.3rem 0.5rem' }}>
                  <X size={13} />
                </button>
              </div>

              {/* Row count highlight */}
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: `${tableColors[selectedTable]}18`, border: `1px solid ${tableColors[selectedTable]}33`, marginBottom: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Total Rows</div>
                <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: tableColors[selectedTable] }}>
                  {(stats[selectedTable] || 0).toLocaleString()}
                </div>
              </div>

              {/* Connected tables */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Connected Tables</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {getConnected(selectedTable).map(conn => (
                    <span
                      key={conn}
                      onClick={() => setSelectedTable(conn)}
                      style={{
                        padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.72rem', cursor: 'pointer',
                        background: `${tableColors[conn]}22`, color: tableColors[conn], border: `1px solid ${tableColors[conn]}44`,
                        transition: 'all 0.15s',
                      }}
                    >
                      {tableLabels[conn]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Columns */}
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                Columns ({tableColumns[selectedTable]?.length || 0})
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {tableColumns[selectedTable]?.map(col => (
                    <tr key={col.name}>
                      <td className="mono" style={{ fontSize: '0.75rem' }}>
                        {col.type === 'PK' && <span style={{ color: theme.colors.amber, marginRight: '0.3rem', fontWeight: 700 }}>PK</span>}
                        {col.type === 'FK' && <span style={{ color: theme.colors.cyan, marginRight: '0.3rem', fontWeight: 700 }}>FK</span>}
                        {col.name}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{col.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '3rem' }}>
              <Database size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>Click any table to view schema details</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: theme.colors.amber, display: 'inline-block' }} /> Primary Key (PK)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: theme.colors.cyan, display: 'inline-block' }} /> Foreign Key (FK)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 20, height: 2, background: theme.colors.indigo, display: 'inline-block' }} /> Relationship (hover to highlight)
        </div>
      </div>
    </div>
  );
}
