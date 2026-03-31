import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const merchantData = [
  { name: 'Pizza Palace', revenue: 12500, orders: 320, rating: 4.8 },
  { name: 'Burger Barn', revenue: 9800, orders: 280, rating: 4.6 },
  { name: 'Taco Town', revenue: 7200, orders: 195, rating: 4.5 },
  { name: 'Sushi Supreme', revenue: 6800, orders: 150, rating: 4.9 },
  { name: 'Thai Delight', revenue: 5400, orders: 165, rating: 4.7 },
  { name: 'Other', revenue: 2500, orders: 85, rating: 4.3 },
]

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']

export default function MerchantPerformance() {
  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Active Merchants</h3>
          <div className="value">18</div>
        </div>
        <div className="metric-card">
          <h3>Total Merchant Revenue</h3>
          <div className="value">$44,200</div>
        </div>
        <div className="metric-card">
          <h3>Total Orders</h3>
          <div className="value">1,195</div>
        </div>
        <div className="metric-card">
          <h3>Avg Rating</h3>
          <div className="value">4.6</div>
        </div>
      </div>

      <div className="charts-section" style={{ marginTop: '1.5rem' }}>
        <div className="chart-card">
          <h3>Revenue by Merchant</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={merchantData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {merchantData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Top Performers</h3>
          {merchantData.slice(0, 4).map((merchant, index) => (
            <div key={merchant.name} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '0.75rem 0',
              borderBottom: index < 3 ? '1px solid #e1e5eb' : 'none'
            }}>
              <div>
                <div style={{ fontWeight: 500 }}>{merchant.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {merchant.orders} orders
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>${merchant.revenue.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                  {'★'.repeat(Math.floor(merchant.rating))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <h3>Merchant Performance Table</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e1e5eb' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Merchant</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Revenue</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Orders</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Avg Order</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {merchantData.map((merchant) => {
              const avgOrder = (merchant.revenue / merchant.orders).toFixed(2)
              return (
                <tr key={merchant.name} style={{ borderBottom: '1px solid #e1e5eb' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 500 }}>{merchant.name}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>${merchant.revenue.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>{merchant.orders}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>${avgOrder}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>
                    <span style={{ color: '#f59e0b' }}>{'★'.repeat(Math.floor(merchant.rating))}</span>
                    <span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - Math.floor(merchant.rating))}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
