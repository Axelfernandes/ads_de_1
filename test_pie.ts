import { initDatabase, executeQuery } from './src/data/database.js';
initDatabase();
const placeRaw = executeQuery(`SELECT date, placement, SUM(revenue) AS revenue FROM orders GROUP BY date, placement ORDER BY date`);
const placeMap = new Map();
(placeRaw.data || []).forEach((r: unknown) => {
  const row = r as Record<string, unknown>;
  const d = String(row.date || '').slice(5);
  if (!placeMap.has(d)) placeMap.set(d, { date: d });
  placeMap.get(d)[String(row.placement)] = Number(row.revenue || 0);
});
console.log(Array.from(placeMap.values()));
