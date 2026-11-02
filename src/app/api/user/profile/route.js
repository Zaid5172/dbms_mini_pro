import { NextResponse } from 'next/server';
import pool from '../../../../lib/mysql';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    // Get user details
    const [users] = await pool.execute(
      'SELECT user_id, name, email, vehicle_number, role, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user active bookings
    const [bookings] = await pool.execute(
      `SELECT b.booking_id, s.slot_number, s.slot_type, b.booking_time, b.status 
       FROM bookings b 
       JOIN parking_slots s ON b.slot_id = s.slot_id 
       WHERE b.user_id = ? ORDER BY b.booking_time DESC`,
      [userId]
    );

    return NextResponse.json({ user: users[0], bookings });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}