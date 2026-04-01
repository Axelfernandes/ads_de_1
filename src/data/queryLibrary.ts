export interface QueryTemplate {
  id: string;
  name: string;
  description: string;
  sql: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  concepts: string[];
}

export const queryLibrary: QueryTemplate[] = [
  {
    id: 'roas-by-campaign',
    name: 'ROAS by Campaign',
    description: 'Calculate Return on Ad Spend (ROAS) for each campaign, ranked from highest to lowest.',
    sql: `SELECT 
  c.campaign_id,
  c.name AS campaign_name,
  c.type,
  c.status,
  ROUND(SUM(o.revenue) / SUM(c.budget_daily * 30), 2) AS estimated_roas,
  ROUND(SUM(o.revenue), 2) AS total_revenue,
  COUNT(DISTINCT o.order_id) AS total_orders,
  ROUND(AVG(o.revenue), 2) AS avg_order_value
FROM campaigns c
LEFT JOIN orders o ON c.campaign_id = o.campaign_id
GROUP BY c.campaign_id, c.name, c.type, c.status
ORDER BY estimated_roas DESC`,
    difficulty: 'Beginner',
    category: 'Performance',
    concepts: ['JOIN', 'GROUP BY', 'Aggregation', 'Arithmetic']
  },
  {
    id: 'ctr-by-device',
    name: 'CTR by Device',
    description: 'Calculate Click-Through Rate segmented by device type.',
    sql: `SELECT 
  i.device,
  COUNT(DISTINCT i.imp_id) AS impressions,
  COUNT(DISTINCT cl.click_id) AS clicks,
  ROUND(COUNT(DISTINCT cl.click_id) * 100.0 / COUNT(DISTINCT i.imp_id), 2) AS ctr_pct,
  COUNT(DISTINCT o.order_id) AS conversions,
  ROUND(COUNT(DISTINCT o.order_id) * 100.0 / COUNT(DISTINCT cl.click_id), 2) AS conversion_rate
FROM impressions i
LEFT JOIN clicks cl ON i.imp_id = cl.imp_id
LEFT JOIN orders o ON i.campaign_id = o.campaign_id AND i.date = o.date
GROUP BY i.device
ORDER BY ctr_pct DESC`,
    difficulty: 'Beginner',
    category: 'Performance',
    concepts: ['JOIN', 'GROUP BY', 'Ratio Calculation']
  },
  {
    id: 'new-vs-returning',
    name: 'New vs Returning Orders',
    description: 'Compare order metrics between new and returning customers.',
    sql: `SELECT 
  CASE WHEN cu.is_new THEN 'New Customer' ELSE 'Returning Customer' END AS customer_type,
  COUNT(DISTINCT o.order_id) AS total_orders,
  ROUND(SUM(o.revenue), 2) AS total_revenue,
  ROUND(AVG(o.revenue), 2) AS avg_order_value,
  ROUND(COUNT(DISTINCT o.campaign_id) / COUNT(DISTINCT o.merchant_id), 2) AS campaigns_per_merchant,
  ROUND(SUM(CASE WHEN o.coupon_used THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS coupon_usage_pct
FROM orders o
JOIN customers cu ON o.customer_id = cu.customer_id
GROUP BY cu.is_new
ORDER BY total_revenue DESC`,
    difficulty: 'Beginner',
    category: 'Customer Analysis',
    concepts: ['JOIN', 'CASE WHEN', 'GROUP BY']
  },
  {
    id: 'daypart-performance',
    name: 'Daypart Performance',
    description: 'Analyze performance by time of day (breakfast, lunch, dinner, etc.)',
    sql: `SELECT 
  CASE 
    WHEN i.hour >= 6 AND i.hour < 10 THEN 'Breakfast (6-10am)'
    WHEN i.hour >= 10 AND i.hour < 14 THEN 'Lunch (10am-2pm)'
    WHEN i.hour >= 14 AND i.hour < 17 THEN 'Afternoon (2-5pm)'
    WHEN i.hour >= 17 AND i.hour < 21 THEN 'Dinner (5-9pm)'
    ELSE 'Late Night (9pm-6am)'
  END AS daypart,
  COUNT(DISTINCT i.imp_id) AS impressions,
  COUNT(DISTINCT cl.click_id) AS clicks,
  ROUND(COUNT(DISTINCT cl.click_id) * 100.0 / COUNT(DISTINCT i.imp_id), 2) AS ctr_pct,
  COUNT(DISTINCT o.order_id) AS orders,
  ROUND(SUM(o.revenue), 2) AS revenue
FROM impressions i
LEFT JOIN clicks cl ON i.imp_id = cl.imp_id
LEFT JOIN orders o ON i.campaign_id = o.campaign_id AND i.date = o.date
GROUP BY 
  CASE 
    WHEN i.hour >= 6 AND i.hour < 10 THEN 'Breakfast (6-10am)'
    WHEN i.hour >= 10 AND i.hour < 14 THEN 'Lunch (10am-2pm)'
    WHEN i.hour >= 14 AND i.hour < 17 THEN 'Afternoon (2-5pm)'
    WHEN i.hour >= 17 AND i.hour < 21 THEN 'Dinner (5-9pm)'
    ELSE 'Late Night (9pm-6am)'
  END
ORDER BY revenue DESC`,
    difficulty: 'Beginner',
    category: 'Performance',
    concepts: ['CASE WHEN', 'GROUP BY', 'Time Analysis']
  },
  {
    id: 'top-merchants',
    name: 'Top Merchants by Revenue',
    description: 'Find the top 10 performing merchants by total revenue.',
    sql: `SELECT 
  m.merchant_id,
  m.name AS merchant_name,
  m.category,
  m.city,
  m.tier,
  m.avg_rating,
  COUNT(DISTINCT o.order_id) AS total_orders,
  ROUND(SUM(o.revenue), 2) AS total_revenue,
  ROUND(AVG(o.revenue), 2) AS avg_order_value,
  ROUND(COUNT(DISTINCT o.campaign_id), 2) AS active_campaigns
FROM merchants m
JOIN orders o ON m.merchant_id = o.merchant_id
GROUP BY m.merchant_id, m.name, m.category, m.city, m.tier, m.avg_rating
ORDER BY total_revenue DESC
LIMIT 10`,
    difficulty: 'Beginner',
    category: 'Merchant Analysis',
    concepts: ['JOIN', 'GROUP BY', 'ORDER BY', 'LIMIT']
  },
  {
    id: 'wow-ctr-change',
    name: 'Week-over-Week CTR Change',
    description: 'Calculate week-over-week CTR change using LAG window function.',
    sql: `WITH weekly_ctr AS (
  SELECT 
    i.date,
    strftime(i.date, '%Y-%W') AS week_key,
    COUNT(DISTINCT i.imp_id) AS impressions,
    COUNT(DISTINCT cl.click_id) AS clicks,
    ROUND(COUNT(DISTINCT cl.click_id) * 100.0 / COUNT(DISTINCT i.imp_id), 2) AS ctr_pct
  FROM impressions i
  LEFT JOIN clicks cl ON i.imp_id = cl.imp_id
  GROUP BY i.date
)
SELECT 
  date,
  impressions,
  clicks,
  ctr_pct,
  LAG(ctr_pct) OVER (ORDER BY date) AS prev_week_ctr,
  ROUND(ctr_pct - LAG(ctr_pct) OVER (ORDER BY date), 2) AS ctr_change,
  ROUND((ctr_pct - LAG(ctr_pct) OVER (ORDER BY date)) * 100.0 / LAG(ctr_pct) OVER (ORDER BY date), 1) AS ctr_change_pct
FROM weekly_ctr
ORDER BY date DESC
LIMIT 30`,
    difficulty: 'Intermediate',
    category: 'Trend Analysis',
    concepts: ['Window Functions', 'LAG', 'CTE']
  },
  {
    id: 'rolling-avg-spend',
    name: '7-Day Rolling Average Spend',
    description: 'Calculate 7-day rolling average daily spend by campaign.',
    sql: `SELECT 
  c.campaign_id,
  c.name AS campaign_name,
  i.date,
  ROUND(AVG(c.budget_daily) OVER (PARTITION BY c.campaign_id ORDER BY i.date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS rolling_7day_avg_spend,
  c.budget_daily AS daily_budget
FROM campaigns c
JOIN impressions i ON c.campaign_id = i.campaign_id
WHERE c.status = 'ACTIVE'
GROUP BY c.campaign_id, c.name, i.date, c.budget_daily
ORDER BY c.campaign_id, i.date DESC
LIMIT 50`,
    difficulty: 'Intermediate',
    category: 'Trend Analysis',
    concepts: ['Window Functions', 'AVG', 'ROWS BETWEEN']
  },
  {
    id: 'cohort-analysis',
    name: 'Customer Cohort Analysis',
    description: 'Analyze customer retention by signup cohort.',
    sql: `SELECT 
  strftime(cu.first_order_date, '%Y-%m') AS cohort_month,
  COUNT(DISTINCT cu.customer_id) AS customers,
  COUNT(DISTINCT o.order_id) AS total_orders,
  ROUND(SUM(o.revenue), 2) AS total_revenue,
  ROUND(AVG(o.revenue), 2) AS avg_order_value,
  ROUND(SUM(o.revenue) / COUNT(DISTINCT cu.customer_id), 2) AS revenue_per_customer
FROM customers cu
LEFT JOIN orders o ON cu.customer_id = o.customer_id
WHERE cu.first_order_date >= '2025-01-01'
GROUP BY strftime(cu.first_order_date, '%Y-%m')
ORDER BY cohort_month DESC`,
    difficulty: 'Intermediate',
    category: 'Customer Analysis',
    concepts: ['Date Functions', 'Aggregation', 'GROUP BY']
  },
  {
    id: 'incremental-lift',
    name: 'Incremental Lift Calculation',
    description: 'Calculate incremental orders and revenue compared to non-incremental.',
    sql: `SELECT 
  c.name AS campaign_name,
  c.type,
  COUNT(CASE WHEN o.is_incremental = 1 THEN 1 END) AS incremental_orders,
  COUNT(CASE WHEN o.is_incremental = 0 THEN 1 END) AS non_incremental_orders,
  COUNT(*) AS total_orders,
  ROUND(COUNT(CASE WHEN o.is_incremental = 1 THEN 1 END) * 100.0 / COUNT(*), 1) AS incremental_pct,
  ROUND(SUM(CASE WHEN o.is_incremental = 1 THEN o.revenue ELSE 0 END), 2) AS incremental_revenue,
  ROUND(SUM(CASE WHEN o.is_incremental = 0 THEN o.revenue ELSE 0 END), 2) AS organic_revenue,
  ROUND(SUM(o.revenue), 2) AS total_revenue
FROM campaigns c
JOIN orders o ON c.campaign_id = o.campaign_id
GROUP BY c.campaign_id, c.name, c.type
ORDER BY incremental_pct DESC`,
    difficulty: 'Intermediate',
    category: 'Performance',
    concepts: ['CASE WHEN', 'Aggregation', 'Incremental Analysis']
  },
  {
    id: 'ab-test-significance',
    name: 'A/B Test Results with Significance',
    description: 'Show A/B test results with statistical significance indicators.',
    sql: `SELECT 
  e.name AS experiment_name,
  e.type AS experiment_type,
  e.metric_type,
  e.p_value,
  CASE WHEN e.p_value < 0.05 THEN 'Significant' ELSE 'Not Significant' END AS significance,
  MAX(CASE WHEN r.variant = 'CONTROL' THEN r.conversion_rate END) AS control_cvr,
  MAX(CASE WHEN r.variant = 'TREATMENT' THEN r.conversion_rate END) AS treatment_cvr,
  MAX(CASE WHEN r.variant = 'TREATMENT' THEN r.lift_pct END) AS lift_pct,
  MAX(CASE WHEN r.variant = 'CONTROL' THEN r.sample_size END) AS control_sample,
  MAX(CASE WHEN r.variant = 'TREATMENT' THEN r.sample_size END) AS treatment_sample,
  e.status
FROM experiments e
JOIN experiment_results r ON e.exp_id = r.exp_id
GROUP BY e.exp_id, e.name, e.type, e.metric_type, e.p_value, e.status
ORDER BY p_value ASC`,
    difficulty: 'Intermediate',
    category: 'Experimentation',
    concepts: ['JOIN', 'CASE WHEN', 'Aggregation', 'Statistics']
  },
  {
    id: 'geo-performance',
    name: 'Geographic Performance',
    description: 'Analyze campaign performance by region and test market status.',
    sql: `SELECT 
  sl.region,
  sl.is_test_market,
  COUNT(DISTINCT sl.location_id) AS locations,
  COUNT(DISTINCT i.imp_id) AS impressions,
  COUNT(DISTINCT cl.click_id) AS clicks,
  ROUND(COUNT(DISTINCT cl.click_id) * 100.0 / COUNT(DISTINCT i.imp_id), 2) AS ctr_pct,
  COUNT(DISTINCT o.order_id) AS orders,
  ROUND(SUM(o.revenue), 2) AS revenue,
  ROUND(COUNT(DISTINCT o.order_id) * 100.0 / COUNT(DISTINCT cl.click_id), 2) AS conversion_rate
FROM store_locations sl
JOIN impressions i ON sl.location_id = i.location_id
LEFT JOIN clicks cl ON i.imp_id = cl.imp_id
LEFT JOIN orders o ON i.campaign_id = o.campaign_id AND i.date = o.date
GROUP BY sl.region, sl.is_test_market
ORDER BY revenue DESC`,
    difficulty: 'Intermediate',
    category: 'Geographic',
    concepts: ['JOIN', 'GROUP BY', 'Geographic Analysis']
  },
  {
    id: 'campaign-efficiency-ranking',
    name: 'Campaign Efficiency Ranking',
    description: 'Rank campaigns by efficiency metrics using window functions.',
    sql: `WITH campaign_metrics AS (
  SELECT 
    c.campaign_id,
    c.name,
    c.type,
    c.status,
    COUNT(DISTINCT i.imp_id) AS impressions,
    COUNT(DISTINCT cl.click_id) AS clicks,
    ROUND(COUNT(DISTINCT cl.click_id) * 100.0 / NULLIF(COUNT(DISTINCT i.imp_id), 0), 2) AS ctr,
    COUNT(DISTINCT o.order_id) AS orders,
    ROUND(SUM(o.revenue), 2) AS revenue,
    ROUND(COUNT(DISTINCT o.order_id) * 100.0 / NULLIF(COUNT(DISTINCT cl.click_id), 0), 2) AS conversion_rate,
    ROUND(SUM(o.revenue) / NULLIF(c.budget_daily * 30, 0), 2) AS roas
  FROM campaigns c
  LEFT JOIN impressions i ON c.campaign_id = i.campaign_id
  LEFT JOIN clicks cl ON c.campaign_id = cl.campaign_id
  LEFT JOIN orders o ON c.campaign_id = o.campaign_id
  GROUP BY c.campaign_id, c.name, c.type, c.status, c.budget_daily
)
SELECT 
  *,
  RANK() OVER (ORDER BY roas DESC) AS roas_rank,
  RANK() OVER (ORDER BY ctr DESC) AS ctr_rank,
  RANK() OVER (ORDER BY conversion_rate DESC) AS cvr_rank
FROM campaign_metrics
WHERE status = 'ACTIVE'
ORDER BY roas_rank ASC`,
    difficulty: 'Advanced',
    category: 'Performance',
    concepts: ['Window Functions', 'RANK', 'CTE', 'Multiple Aggregations']
  },
  {
    id: 'funnel-analysis',
    name: 'Conversion Funnel Analysis',
    description: 'Analyze the full conversion funnel from impression to order.',
    sql: `SELECT 
  'Impressions' AS stage,
  COUNT(DISTINCT imp_id) AS count,
  100.0 AS pct_of_top
FROM impressions
UNION ALL
SELECT 
  'Clicks',
  COUNT(DISTINCT click_id),
  ROUND(COUNT(DISTINCT click_id) * 100.0 / (SELECT COUNT(DISTINCT imp_id) FROM impressions), 1)
FROM clicks
UNION ALL
SELECT 
  'Add to Cart',
  COUNT(DISTINCT o.order_id) * 3,
  ROUND(COUNT(DISTINCT o.order_id) * 3 * 100.0 / (SELECT COUNT(DISTINCT imp_id) FROM impressions), 1)
FROM orders o
UNION ALL
SELECT 
  'Checkout Started',
  COUNT(DISTINCT o.order_id) * 2,
  ROUND(COUNT(DISTINCT o.order_id) * 2 * 100.0 / (SELECT COUNT(DISTINCT imp_id) FROM impressions), 1)
FROM orders o
UNION ALL
SELECT 
  'Orders',
  COUNT(DISTINCT order_id),
  ROUND(COUNT(DISTINCT order_id) * 100.0 / (SELECT COUNT(DISTINCT imp_id) FROM impressions), 1)
FROM orders`,
    difficulty: 'Advanced',
    category: 'Funnel Analysis',
    concepts: ['UNION ALL', 'Subquery', 'Funnel Calculation']
  },
  {
    id: 'ltv-analysis',
    name: 'Customer LTV by Acquisition Source',
    description: 'Analyze lifetime value by customer signup source.',
    sql: `SELECT 
  cu.signup_source,
  COUNT(DISTINCT cu.customer_id) AS customers,
  ROUND(AVG(cu.lifetime_value), 2) AS avg_ltv,
  SUM(cu.lifetime_value) AS total_ltv,
  COUNT(DISTINCT o.order_id) AS total_orders,
  ROUND(SUM(o.revenue), 2) AS total_revenue,
  ROUND(SUM(o.revenue) / COUNT(DISTINCT cu.customer_id), 2) AS revenue_per_customer,
  ROUND(AVG(cu.lifetime_value) / NULLIF(COUNT(DISTINCT o.order_id) / COUNT(DISTINCT cu.customer_id), 0), 2) AS ltv_per_order
FROM customers cu
LEFT JOIN orders o ON cu.customer_id = o.customer_id
GROUP BY cu.signup_source
ORDER BY avg_ltv DESC`,
    difficulty: 'Intermediate',
    category: 'Customer Analysis',
    concepts: ['JOIN', 'GROUP BY', 'LTV Calculation']
  },
  {
    id: 'placement-roas',
    name: 'ROAS by Placement Type',
    description: 'Compare ROAS across different ad placement types.',
    sql: `SELECT 
  i.placement,
  COUNT(DISTINCT i.imp_id) AS impressions,
  COUNT(DISTINCT cl.click_id) AS clicks,
  ROUND(COUNT(DISTINCT cl.click_id) * 100.0 / COUNT(DISTINCT i.imp_id), 2) AS ctr_pct,
  COUNT(DISTINCT o.order_id) AS orders,
  ROUND(SUM(o.revenue), 2) AS revenue,
  ROUND(COUNT(DISTINCT o.order_id) * 100.0 / NULLIF(COUNT(DISTINCT cl.click_id), 0), 2) AS conversion_rate,
  ROUND(SUM(o.revenue) / NULLIF(
    (SELECT SUM(budget_daily * 30) FROM campaigns c WHERE c.campaign_id IN (
      SELECT campaign_id FROM impressions WHERE placement = i.placement
    )), 0), 2) AS estimated_roas
FROM impressions i
LEFT JOIN clicks cl ON i.imp_id = cl.imp_id
LEFT JOIN orders o ON i.campaign_id = o.campaign_id AND i.date = o.date
GROUP BY i.placement
ORDER BY estimated_roas DESC`,
    difficulty: 'Advanced',
    category: 'Performance',
    concepts: ['Subquery', 'GROUP BY', 'Complex JOINs']
  }
];

export function getQueryById(id: string): QueryTemplate | undefined {
  return queryLibrary.find(q => q.id === id);
}

export function getQueriesByCategory(category: string): QueryTemplate[] {
  return queryLibrary.filter(q => q.category === category);
}

export function getQueriesByDifficulty(difficulty: 'Beginner' | 'Intermediate' | 'Advanced'): QueryTemplate[] {
  return queryLibrary.filter(q => q.difficulty === difficulty);
}
