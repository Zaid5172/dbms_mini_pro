'use client';
import { useState } from 'react';

export default function IncidentsPage() {
  const [form, setForm] = useState({
    lotId: 1,
    slotId: 1,
    userId: 1,
    category: 'Property Damage',
    description: '',
    severity: 'Medium',
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit incident');

      setMessage(`Incident successfully logged! ID: ${data.incidentId} (Synced with MySQL & Redis Stream)`);
      setForm({ lotId: 1, slotId: 1, userId: 1, category: 'Property Damage', description: '', severity: 'Medium' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div className="page-header">
        <h2>Report Parking Incident</h2>
        <p>Log damage reports or equipment malfunctions directly into MySQL and Redis streams.</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h3>Incident Reporting Form</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Parking Lot ID</label>
              <input 
                type="number" 
                value={form.lotId} 
                onChange={(e) => setForm({ ...form, lotId: parseInt(e.target.value) })} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Slot ID</label>
              <input 
                type="number" 
                value={form.slotId} 
                onChange={(e) => setForm({ ...form, slotId: parseInt(e.target.value) })} 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select 
                value={form.category} 
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Property Damage">Property Damage</option>
                <option value="Barrier Malfunction">Barrier Malfunction</option>
                <option value="Unauthorized Parking">Unauthorized Parking</option>
                <option value="Security">Security Issue</option>
              </select>
            </div>
            <div className="form-group">
              <label>Severity Level</label>
              <select 
                value={form.severity} 
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Detailed Description</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              rows="4" 
              placeholder="Provide specific details about the incident..." 
              required 
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Submitting Report...' : 'Submit Incident Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
