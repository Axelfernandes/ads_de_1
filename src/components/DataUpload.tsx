import { useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export default function DataUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [fileName, setFileName] = useState<string>('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setStatus('uploading')
      setTimeout(() => {
        setStatus('success')
      }, 2000)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setFileName(file.name)
      setStatus('uploading')
      setTimeout(() => {
        setStatus('success')
      }, 2000)
    }
  }

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Supported Formats</h3>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            <div>.csv, .json, .parquet</div>
            <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>Max file size: 50MB</div>
          </div>
        </div>
        <div className="metric-card">
          <h3>S3 Integration</h3>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            <div>Bucket: ad-analytics-raw</div>
            <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>Path: s3://ad-analytics-raw/uploads/</div>
          </div>
        </div>
        <div className="metric-card">
          <h3>Athena Tables</h3>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            <div>campaign_metrics</div>
            <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>merchant_performance</div>
          </div>
        </div>
        <div className="metric-card">
          <h3>Last Upload</h3>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            <div>Mar 28, 2026</div>
            <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>campaign_q1_2026.csv</div>
          </div>
        </div>
      </div>

      <div 
        className="chart-card" 
        style={{ 
          marginTop: '1.5rem', 
          border: '2px dashed #e1e5eb',
          textAlign: 'center',
          padding: '3rem'
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {status === 'idle' && (
          <>
            <Upload size={48} style={{ margin: '0 auto 1rem', color: '#6b7280' }} />
            <h3>Upload Campaign Data</h3>
            <p style={{ color: '#6b7280', margin: '1rem 0' }}>
              Drag and drop your CSV, JSON, or Parquet files here, or click to browse
            </p>
            <input
              type="file"
              id="file-upload"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept=".csv,.json,.parquet"
            />
            <label
              htmlFor="file-upload"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1a1a2e',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Select File
            </label>
          </>
        )}

        {status === 'uploading' && (
          <>
            <FileSpreadsheet size={48} style={{ margin: '0 auto 1rem', color: '#3b82f6' }} />
            <h3>Uploading {fileName}</h3>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: '#e1e5eb',
              borderRadius: '4px',
              marginTop: '1rem',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '60%',
                height: '100%',
                backgroundColor: '#3b82f6',
                animation: 'loading 1.5s ease-in-out infinite'
              }} />
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} style={{ margin: '0 auto 1rem', color: '#10b981' }} />
            <h3 style={{ color: '#10b981' }}>Upload Successful!</h3>
            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>{fileName}</p>
            <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              File has been uploaded to S3 and is being processed by Lambda
            </p>
            <button
              onClick={() => setStatus('idle')}
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Upload Another File
            </button>
          </>
        )}
      </div>

      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <h3>Upload History</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e1e5eb' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>File</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Date</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>Size</th>
              <th style={{ textAlign: 'center', padding: '0.75rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e1e5eb' }}>
              <td style={{ padding: '0.75rem' }}>campaign_q1_2026.csv</td>
              <td style={{ padding: '0.75rem' }}>Mar 28, 2026</td>
              <td style={{ textAlign: 'right', padding: '0.75rem' }}>2.4 MB</td>
              <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                <span style={{ 
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem'
                }}>
                  Processed
                </span>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e1e5eb' }}>
              <td style={{ padding: '0.75rem' }}>merchant_data_feb.json</td>
              <td style={{ padding: '0.75rem' }}>Mar 15, 2026</td>
              <td style={{ textAlign: 'right', padding: '0.75rem' }}>1.8 MB</td>
              <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                <span style={{ 
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem'
                }}>
                  Processed
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
