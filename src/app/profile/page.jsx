'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    fetch(`/api/user/profile?userId=${userData.user_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.bookings) setBookings(data.bookings);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading || !user) {
    return <p style={{ textAlign: 'center', marginTop: '3rem' }}>Loading user profile...</p>;
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="page-header">
        <h2>User Dashboard & Profile</h2>
        <p>Manage your account, registered vehicles, and view active parking reservations.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* User Card */}
        <div className="card">
          <h3>Account Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Name:</span>
              <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{user.name}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Email:</span>
              <div style={{ fontWeight: '600' }}>{user.email}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Vehicle Number:</span>
              <div style={{ fontWeight: '600' }}>{user.vehicle_number || 'Not Registered'}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Role:</span>
              <div><span className="badge badge-green">{user.role}</span></div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn-primary"
            style={{ marginTop: '1.5rem', background: '#dc2626' }}
          >
            Sign Out
          </button>
        </div>

        {/* Booking History */}
        <div className="card">
          <h3>My Reservations</h3>
          {bookings.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No active or past bookings found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bookings.map((b) => (
                <div
                  key={b.booking_id}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700' }}>Slot {b.slot_number} ({b.slot_type})</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(b.booking_time).toLocaleString()}
                    </div>
                  </div>
                  <span className="badge badge-green">{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}