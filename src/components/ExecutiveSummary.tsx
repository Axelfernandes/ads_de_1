import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const mockData = [
  { date: 'Jan 1', revenue: 4200, spend: 1200 },
  { date: 'Jan 8', revenue: 5100, spend: 1350 },
  { date: 'Jan 15', revenue: 4800, spend: 1280 },
  { date: 'Jan 22', revenue: 6200, spend: 1500 },
  { date: 'Jan 29', revenue: 5800, spend: 1420 },
  { date: 'Feb 5', revenue: 7100, spend: 1680 },
  { date: 'Feb 12', revenue: 6800, spend: 1550 },
]

export default function ExecutiveSummary() {
  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Revenue</h3>
          <div className="value">$40,200</div>
          <div className="change positive">+18.2% vs last week</div>
        </div>
        <div className="metric-card">
          <h3>Total Spend</h3>
          <div className="value">$9,980</div>
          <div className="change negative">+5.3% vs last week</div>
        </div>
        <div className="metric-card">
          <h3>ROAS</h3>
          <div className="value">4.03x</div>
          <div className="change positive">+12.4% vs last week</div>
        </div>
        <div className="metric-card">
          <h3>Conversions</h3>
          <div className="value">2,847</div>
          <div className="change positive">+22.1% vs last week</div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Revenue vs Spend Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="spend" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Quick Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Avg CPA</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>$3.51</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>CTR</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>2.34%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Active Campaigns</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>24</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Active Merchants</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>18</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
