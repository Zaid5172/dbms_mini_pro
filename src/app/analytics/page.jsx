export default function AnalyticsPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <h2>System Analytics & Cache Diagnostics</h2>
        <p>Live lot occupancy aggregated from MySQL Views and Redis cache performance.</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>Lot Occupancy Rate (MySQL View)</h3>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
              <span>Central Campus Garage</span>
              <span>75% Occupied</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
              <span>Airport Express Lot</span>
              <span>40% Occupied</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: '40%' }}></div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Redis In-Memory Cache Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
              <span style={{ color: '#64748b' }}>Connection Status:</span>
              <span className="badge badge-green">Active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
              <span style={{ color: '#64748b' }}>Cached Slot Keys:</span>
              <strong style={{ color: '#1e293b' }}>8 Active Slots</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
              <span style={{ color: '#64748b' }}>Key Lookup Latency:</span>
              <strong style={{ color: '#059669' }}>0.4 ms</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Cache Hit Rate:</span>
              <strong style={{ color: '#2563eb' }}>99.2%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}