import { useState, useEffect } from 'react';
import { Database, Code, BarChart3, FlaskConical, Table2, Store, TrendingUp, Sun, Moon } from 'lucide-react';
import SchemaExplorer from './components/SchemaExplorer';
import SQLPlayground from './components/SQLPlayground';
import MetricsDashboard from './components/MetricsDashboard';
import ABTestAnalyzer from './components/ABTestAnalyzer';
import CampaignTable from './components/CampaignTable';
import MerchantLeaderboard from './components/MerchantLeaderboard';
import FunnelAnalysis from './components/FunnelAnalysis';
import { initDatabase, getTableStats } from './data/database';

type View = 'metrics' | 'campaigns' | 'merchants' | 'funnel' | 'schema' | 'sql' | 'experiments';

const TABS: { id: View; icon: React.ElementType; label: string }[] = [
  { id: 'metrics',     icon: BarChart3,   label: 'Metrics' },
  { id: 'campaigns',   icon: Table2,      label: 'Campaigns' },
  { id: 'merchants',   icon: Store,       label: 'Merchants' },
  { id: 'funnel',      icon: TrendingUp,  label: 'Funnel' },
  { id: 'schema',      icon: Database,    label: 'Schema' },
  { id: 'sql',         icon: Code,        label: 'SQL Playground' },
  { id: 'experiments', icon: FlaskConical, label: 'A/B Tests' },
];

function App() {
  const [activeView, setActiveView] = useState<View>('metrics');
  const [dbReady, setDbReady]       = useState(false);
  const [quickStats, setQuickStats] = useState<Record<string, number>>({});
  const [themeMode, setThemeMode]   = useState<'dark' | 'light'>('light');

  useEffect(() => {
    try {
      initDatabase();
      setQuickStats(getTableStats());
      setDbReady(true);
    } catch (e) {
      console.error('Failed to initialize database:', e);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  const renderView = () => {
    switch (activeView) {
      case 'metrics':     return <MetricsDashboard />;
      case 'campaigns':   return <CampaignTable />;
      case 'merchants':   return <MerchantLeaderboard />;
      case 'funnel':      return <FunnelAnalysis />;
      case 'schema':      return <SchemaExplorer />;
      case 'sql':         return <SQLPlayground />;
      case 'experiments': return <ABTestAnalyzer />;
      default:            return <MetricsDashboard />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <header style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* Logo + Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em' }}>
            <span style={{
              background: 'linear-gradient(135deg, #ff3b3b 0%, #ff6b6b 100%)',
              color: 'white',
              padding: '0.25rem 0.6rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              boxShadow: '0 0 12px rgba(255,59,59,0.35)',
            }}>
              FoodDash
            </span>
            <span style={{ color: 'var(--text-primary)' }}>Ad Analytics</span>
          </h1>

          {dbReady && (
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem' }}>
              <span className="badge badge-green">● DB Live</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                {(quickStats.impressions || 0).toLocaleString()} impressions ·{' '}
                {quickStats.campaigns || 0} campaigns ·{' '}
                {quickStats.merchants || 0} merchants
              </span>
            </div>
          )}
        </div>

        {/* Nav tabs & Theme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`tab-btn${active ? ' active' : ''}`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
          
          <button 
            className="btn" 
            onClick={() => setThemeMode(m => m === 'dark' ? 'light' : 'dark')}
            style={{ padding: '0.4rem', borderRadius: '50%' }}
            aria-label="Toggle theme"
          >
            {themeMode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
        <div key={activeView} className="animate-fade-in-up">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default App;
