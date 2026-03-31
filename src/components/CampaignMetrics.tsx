import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const campaignData = [
  { name: 'Summer Promo', spend: 2500, revenue: 12500, conversions: 820 },
  { name: 'New User', spend: 1800, revenue: 9200, conversions: 540 },
  { name: 'Holiday Sale', spend: 2200, revenue: 11000, conversions: 680 },
  { name: 'Retargeting', spend: 1500, revenue: 7800, conversions: 490 },
  { name: 'Brand Awareness', spend: 980, revenue: 3700, conversions: 317 },
]

export default function CampaignMetrics() {
  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Campaigns</h3>
          <div className="value">5</div>
          <div className="change positive">All active</div>
        </div>
        <div className="metric-card">
          <h3>Total Spend</h3>
          <div className="value">$9,980</div>
        </div>
        <div className="metric-card">
          <h3>Total Revenue</h3>
          <div className="value">$44,200</div>
        </div>
        <div className="metric-card">
          <h3>Avg ROAS</h3>
          <div className="value">4.43x</div>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <h3>Campaign Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={campaignData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Bar yAxisId="left" dataKey="spend" fill="#ef4444" name="Spend ($)" />
            <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <h3>Campaign Details</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e1e5eb' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Campaign</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Spend</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Revenue</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Conversions</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>ROAS</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>CPA</th>
            </tr>
          </thead>
          <tbody>
            {campaignData.map((campaign) => {
              const roas = (campaign.revenue / campaign.spend).toFixed(2)
              const cpa = (campaign.spend / campaign.conversions).toFixed(2)
              return (
                <tr key={campaign.name} style={{ borderBottom: '1px solid #e1e5eb' }}>
                  <td style={{ padding: '0.75rem' }}>{campaign.name}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>${campaign.spend.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>${campaign.revenue.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>{campaign.conversions}</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>{roas}x</td>
                  <td style={{ textAlign: 'right', padding: '0.75rem' }}>${cpa}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
