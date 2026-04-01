import alasql from 'alasql';
import { generateAllData } from './seed';

let dataInitialized = false;

export function initDatabase() {
  if (dataInitialized) return;
  
  const data = generateAllData();
  
  const tableDefs = [
    { name: 'campaigns', data: data.campaigns },
    { name: 'merchants', data: data.merchants },
    { name: 'customers', data: data.customers },
    { name: 'time_dim', data: data.time_dim },
    { name: 'store_locations', data: data.store_locations },
    { name: 'impressions', data: data.impressions },
    { name: 'clicks', data: data.clicks },
    { name: 'orders', data: data.orders },
    { name: 'ad_groups', data: data.ad_groups },
    { name: 'creatives', data: data.creatives },
    { name: 'experiments', data: data.experiments },
    { name: 'experiment_results', data: data.experiment_results },
  ];
  
  tableDefs.forEach(({ name, data: tableData }) => {
    try {
      alasql(`DROP TABLE IF EXISTS ${name}`);
    } catch {}
    
    alasql(`CREATE TABLE ${name}`);
    alasql.tables[name].data = tableData;
  });
  
  dataInitialized = true;
}

export function executeQuery(sql: string): { data: unknown[]; columns: string[]; rowCount: number } {
  initDatabase();
  
  try {
    const result = alasql(sql);
    
    if (Array.isArray(result)) {
      if (result.length > 0) {
        if (typeof result[0] === 'object' && result[0] !== null && !Array.isArray(result[0])) {
          const columns = Object.keys(result[0] as object);
          return {
            data: result,
            columns,
            rowCount: result.length
          };
        }
      }
    }
    
    return { data: [], columns: [], rowCount: 0 };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Query execution failed');
  }
}

export function getTableData(tableName: string, limit = 100) {
  return executeQuery(`SELECT * FROM ${tableName} LIMIT ${limit}`);
}

export function getTableStats(): Record<string, number> {
  initDatabase();
  
  const stats: Record<string, number> = {};
  const tables = Object.keys(alasql.tables);
  
  tables.forEach(table => {
    stats[table] = alasql.tables[table].data?.length || 0;
  });
  
  return stats;
}

export function getDatabase() {
  initDatabase();
  return alasql;
}
