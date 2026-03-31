import { useState } from 'react'
import { LayoutDashboard, BarChart3, TrendingUp, Table, FileSpreadsheet } from 'lucide-react'
import CampaignMetrics from './components/CampaignMetrics'
import MerchantPerformance from './components/MerchantPerformance'
import ABTestResults from './components/ABTestResults'
import DataUpload from './components/DataUpload'
import ExecutiveSummary from './components/ExecutiveSummary'

type View = 'summary' | 'campaigns' | 'merchants' | 'ab-tests' | 'upload'

function App() {
  const [activeView, setActiveView] = useState<View>('summary')

  const renderView = () => {
    switch (activeView) {
      case 'summary':
        return <ExecutiveSummary />
      case 'campaigns':
        return <CampaignMetrics />
      case 'merchants':
        return <MerchantPerformance />
      case 'ab-tests':
        return <ABTestResults />
      case 'upload':
        return <DataUpload />
      default:
        return <ExecutiveSummary />
    }
  }

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Ad Campaign Analytics</h1>
        <nav className="nav">
          <button 
            className={activeView === 'summary' ? 'active' : ''}
            onClick={() => setActiveView('summary')}
          >
            <LayoutDashboard size={16} /> Summary
          </button>
          <button 
            className={activeView === 'campaigns' ? 'active' : ''}
            onClick={() => setActiveView('campaigns')}
          >
            <TrendingUp size={16} /> Campaigns
          </button>
          <button 
            className={activeView === 'merchants' ? 'active' : ''}
            onClick={() => setActiveView('merchants')}
          >
            <BarChart3 size={16} /> Merchants
          </button>
          <button 
            className={activeView === 'ab-tests' ? 'active' : ''}
            onClick={() => setActiveView('ab-tests')}
          >
            <Table size={16} /> A/B Tests
          </button>
          <button 
            className={activeView === 'upload' ? 'active' : ''}
            onClick={() => setActiveView('upload')}
          >
            <FileSpreadsheet size={16} /> Upload
          </button>
        </nav>
      </header>
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  )
}

export default App
