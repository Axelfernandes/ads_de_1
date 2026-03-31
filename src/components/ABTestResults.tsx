import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const abTestData = [
  { 
    name: 'CTA Color',
    variant: 'Control (Blue)',
    control: 3.2,
    variant_value: 'Variant (Green)',
    treatment: 3.8
  },
  { 
    name: 'Banner Size',
    variant: 'Control (728x90)',
    control: 2.1,
    variant_value: 'Variant (970x250)',
    treatment: 2.4
  },
  { 
    name: 'Copy Length',
    variant: 'Control (Short)',
    control: 4.1,
    variant_value: 'Variant (Long)',
    treatment: 3.9
  },
  { 
    name: 'Offer Type',
    variant: 'Control (10% off)',
    control: 2.8,
    variant_value: 'Variant (Free Ship)',
    treatment: 3.2
  },
]

export default function ABTestResults() {
  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Active Tests</h3>
          <div className="value">4</div>
        </div>
        <div className="metric-card">
          <h3>Completed Tests</h3>
          <div className="value">12</div>
        </div>
        <div className="metric-card">
          <h3>Significant Results</h3>
          <div className="value">7</div>
          <div className="change positive">58% win rate</div>
        </div>
        <div className="metric-card">
          <h3>Avg Lift</h3>
          <div className="value">+12.4%</div>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <h3>CVR Lift: Control vs Treatment</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={abTestData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="control" name="Control" fill="#6b7280" />
            <Bar dataKey="treatment" name="Treatment" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <h3>A/B Test Details</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e1e5eb' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Test Name</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Control</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Treatment</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>CVR Lift</th>
              <th style={{ textAlign: 'center', padding: '0.75rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {abTestData.map((test) => {
              const lift = (((test.treatment - test.control) / test.control) * 100).toFixed(1)
              const isPositive = parseFloat(lift) > 0
              return (
                <tr key={test.name} style={{ borderBottom: '1px solid #e1e5eb' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 500 }}>{test.name}</td>
                  <td style={{ padding: '0.75rem' }}>{test.variant} ({test.control}%)</td>
                  <td style={{ padding: '0.75rem' }}>{test.variant_value} ({test.treatment}%)</td>
                  <td style={{ 
                    textAlign: 'right', 
                    padding: '0.75rem',
                    color: isPositive ? '#10b981' : '#ef4444',
                    fontWeight: 600
                  }}>
                    {isPositive ? '+' : ''}{lift}%
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <span style={{ 
                      backgroundColor: isPositive ? '#d1fae5' : '#fef3c7',
                      color: isPositive ? '#065f46' : '#92400e',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      {isPositive ? 'Significant' : 'Inconclusive'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="chart-card" style={{ marginTop: '1.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <h3 style={{ color: '#166534' }}>Statistical Significance Guide</h3>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#166534' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>95% confidence interval</strong> is required to declare a winner in all our A/B tests.
          </p>
          <p>
            Tests showing positive lift with p-value {'<'} 0.05 are marked as "Significant" and eligible for full rollout.
          </p>
        </div>
      </div>
    </div>
  )
}
