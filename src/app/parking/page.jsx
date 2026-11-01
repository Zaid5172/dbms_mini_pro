'use client';
import { useState } from 'react';

const SAMPLE_SLOTS = [
  { id: 1, number: 'A-101', type: 'Standard', status: 'Available' },
  { id: 2, number: 'A-102', type: 'EV Charge', status: 'Available' },
  { id: 3, number: 'A-103', type: 'Handicapped', status: 'Occupied' },
  { id: 4, number: 'A-104', type: 'Standard', status: 'Available' },
  { id: 5, number: 'B-201', type: 'Standard', status: 'Available' },
  { id: 6, number: 'B-202', type: 'EV Charge', status: 'Occupied' },
  { id: 7, number: 'B-203', type: 'Standard', status: 'Available' },
  { id: 8, number: 'B-204', type: 'Handicapped', status: 'Available' },
];

export default function ParkingPage() {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [userId, setUserId] = useState('1');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select a slot from the parking map first.');
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
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      
      setMessage(`Slot ${selectedSlot.number} successfully booked! Booking ID: ${data.bookingId}`);
      selectedSlot.status = 'Occupied';
      setSelectedSlot(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: '800' }}>Interactive Parking Slot Booking</h2>
        <p style={{ color: '#64748b' }}>Select an available slot from the grid below and confirm your reservation.</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Visual Slot Selection Grid */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Select a Parking Slot</h3>
          <div className="slot-grid">
            {SAMPLE_SLOTS.map((slot) => {
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
                  <div style={{ fontSize: '0.7rem', fontWeight: '600', marginTop: '0.5rem' }}>
                    {isOccupied ? 'OCCUPIED' : isSelected ? 'SELECTED' : 'AVAILABLE'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Booking Form */}
        <div className="card">
          <h3>Booking Summary</h3>
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
              <label>Selected Slot</label>
              <input 
                type="text" 
                value={selectedSlot ? `${selectedSlot.number} (${selectedSlot.type})` : 'None selected'} 
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
              {loading ? 'Processing...' : 'Confirm Reservation'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}