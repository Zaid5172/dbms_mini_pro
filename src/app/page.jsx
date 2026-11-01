export default function Dashboard() {
  return (
    <div>
      <h2 style={{ fontSize: '1.875rem', fontWeight: '800' }}>System Dashboard</h2>
      <p style={{ color: '#64748b', marginTop: '0.25rem' }}>
        Real-time status overview powered by MySQL relational state & Redis in-memory cache.
      </p>

      <div className="card-grid">
        <div className="card">
          <h3>Active Lots</h3>
          <div className="stat-number stat-blue">3</div>
          <span className="badge badge-green">100% Operational</span>
        </div>

        <div className="card">
          <h3>Available Slots (Redis Cached)</h3>
          <div className="stat-number stat-green">142</div>
          <span className="badge badge-gray">Sub-millisecond lookup</span>
        </div>

        <div className="card">
          <h3>Active Incidents</h3>
          <div className="stat-number stat-orange">2</div>
          <span className="badge badge-orange">Under investigation</span>
        </div>
      </div>

      <div className="architecture-box">
        <h3>Architecture Highlights</h3>
        <div className="arch-grid">
          <div className="arch-card-blue">
            <div className="arch-title-blue">MySQL Relational Backend</div>
            <p style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>
              Stores normalized relational entities (Users, Vehicles, Lots, Slots, Bookings, Payments) with ACID transactions, triggers, and views.
            </p>
          </div>

          <div className="arch-card-red">
            <div className="arch-title-red">Redis In-Memory NoSQL</div>
            <p style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>
              Caches real-time slot availability, active parking countdown timers, and API rate limits for high-performance state tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}