'use client';
import { useState } from 'react';

export default function IncidentsPage() {
  const [form, setForm] = useState({ lotId: 1, slotId: 1, userId: 1, category: 'Property Damage', description: '', severity: 'Medium' });
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

      setMessage(`Incident successfully logged! ID: ${data.incidentId} (Stored in MySQL + Redis Event Stream).`);
      setForm({ lotId: 1, slotId: 1, userId: 1, category: 'Property Damage', description: '', severity: 'Medium' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Parking Incident Management</h2>
      <p className="text-sm text-gray-600 mb-6">Report vehicle scratches, barrier failures, or security concerns.</p>

      {message && <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">{message}</div>}
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Lot ID</label>
            <input type="number" value={form.lotId} onChange={(e) => setForm({...form, lotId: parseInt(e.target.value)})} className="w-full border border-gray-300 p-3 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Slot ID</label>
            <input type="number" value={form.slotId} onChange={(e) => setForm({...form, slotId: parseInt(e.target.value)})} className="w-full border border-gray-300 p-3 rounded-lg" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg bg-white">
              <option value="Property Damage">Property Damage</option>
              <option value="Barrier Malfunction">Barrier Malfunction</option>
              <option value="Unauthorized Parking">Unauthorized Parking</option>
              <option value="Security">Security Issue</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Severity</label>
            <select value={form.severity} onChange={(e) => setForm({...form, severity: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg bg-white">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows="4" className="w-full border border-gray-300 p-3 rounded-lg" placeholder="Describe the incident details..." required />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold shadow-sm disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Incident Report'}
        </button>
      </form>
    </div>
  );
}
