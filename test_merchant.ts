import { initDatabase, executeQuery } from './src/data/database.js';
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
  HAVING orders > 0
  ORDER BY revenue DESC
  LIMIT 5
`);
console.log(r);
