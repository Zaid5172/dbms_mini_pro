'use client';
import { useState, useEffect } from 'react';

export default function ParkingPage() {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [userId, setUserId] = useState('1');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch real-time slots from database API
  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/parking/slots');
      const data = await res.json();
      if (res.ok && data.slots) {
        setSlots(data.slots);
      } else {
        setError(data.error || 'Failed to load slots from database.');
      }
    } catch (err) {
      setError('Database connection error. Ensure MySQL server is active.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available parking slot first.');
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/parking/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(userId), slotId: selectedSlot.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed.');

      setMessage(`Success! Booked Slot ${selectedSlot.number} (Booking ID: ${data.bookingId}).`);
      setSelectedSlot(null);
      fetchSlots(); // Refresh slot states from database
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: '800' }}>Live Parking Slot Reservation</h2>
        <p style={{ color: '#64748b' }}>Select an available spot below to execute an ACID database booking transaction.</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Interactive Parking Slot Map */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Select a Slot</h3>
            <button 
              onClick={fetchSlots} 
              style={{ background: 'none', border: '1px solid #cbd5e1', padding: '0.25rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              🔄 Refresh
            </button>
          </div>

          {fetching ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading slots from MySQL database...</p>
          ) : slots.length === 0 ? (
            <p style={{ color: '#991b1b', textAlign: 'center', padding: '2rem' }}>No slots found. Please run the SQL seed script in Step 1.</p>
          ) : (
            <div className="slot-grid">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                const isOccupied = slot.status === 'Occupied';
                return (
                  <button
                    key={slot.id}
                    disabled={isOccupied}
                    onClick={() => setSelectedSlot(slot)}
                    className={`slot-card ${isOccupied ? 'slot-occupied' : isSelected ? 'slot-selected' : 'slot-available'}`}
                  >
                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{slot.number}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{slot.type}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', marginTop: '0.5rem' }}>
                      {isOccupied ? 'OCCUPIED' : isSelected ? 'SELECTED' : 'AVAILABLE'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking Form */}
        <div className="card">
          <h3>Reservation Details</h3>
          <form onSubmit={handleBooking}>
            <div className="form-group">
              <label>User ID</label>
              <input 
                type="number" 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Selected Parking Slot</label>
              <input 
                type="text" 
                value={selectedSlot ? `${selectedSlot.number} (${selectedSlot.type})` : 'Click a green slot on the left'} 
                readOnly 
                style={{ background: '#f1f5f9', fontWeight: '600', color: selectedSlot ? '#1e293b' : '#94a3b8' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !selectedSlot}
              className="btn-primary"
              style={{ opacity: loading || !selectedSlot ? 0.6 : 1, cursor: selectedSlot ? 'pointer' : 'not-allowed' }}
            >
              {loading ? 'Executing Transaction...' : 'Confirm Reservation'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}