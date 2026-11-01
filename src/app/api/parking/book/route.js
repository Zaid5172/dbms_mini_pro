import { NextResponse } from 'next/server';
import pool from '../../../../lib/mysql';
import { getRedisClient } from '../../../../lib/redis';

export async function POST(request) {
  let connection;
  try {
    const { userId, slotId } = await request.json();

    if (!userId || !slotId) {
      return NextResponse.json({ error: 'User ID and Slot ID are required.' }, { status: 400 });
    }

    connection = await pool.getConnection();

    // Start MySQL ACID Transaction
    await connection.beginTransaction();

    // Check slot availability with row locking (FOR UPDATE)
    const [slots] = await connection.execute(
      'SELECT slot_id, status FROM parking_slots WHERE slot_id = ? FOR UPDATE',
      [slotId]
    );

    if (slots.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: `Slot ID ${slotId} does not exist.` }, { status: 404 });
    }

    if (slots[0].status !== 'Available') {
      await connection.rollback();
      return NextResponse.json({ error: `Slot ID ${slotId} is currently ${slots[0].status}.` }, { status: 400 });
    }

    // Update slot status to Occupied
    await connection.execute(
      'UPDATE parking_slots SET status = ? WHERE slot_id = ?',
      ['Occupied', slotId]
    );

    // Insert booking record
    const [bookingResult] = await connection.execute(
      'INSERT INTO bookings (user_id, slot_id, status) VALUES (?, ?, ?)',
      [userId, slotId, 'Active']
    );

    const bookingId = bookingResult.insertId;

    // Commit MySQL Transaction
    await connection.commit();

    // Fast-path cache update in Redis
    try {
      const redis = await getRedisClient();
      await redis.set(`slot:${slotId}:status`, 'Occupied');
      await redis.set(`slot:${slotId}:bookedBy`, userId);
    } catch (redisErr) {
      console.warn('Redis Cache Warning:', redisErr.message);
    }

    return NextResponse.json({ success: true, bookingId, slotId });
  } catch (error) {
    if (connection) await connection.rollback();
    return NextResponse.json({ error: error.message || 'Database error occurred' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}