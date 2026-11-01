import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';
import { getRedisClient } from '@/lib/redis';

export async function POST(request) {
  try {
    const body = await request.json();
    const { lotId, slotId, userId, category, description, severity } = body;

    // Insert into MySQL relational table
    const [result] = await pool.execute(
      'INSERT INTO incident_reports (lot_id, slot_id, user_id, category, description, severity, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lotId, slotId, userId, category, description, severity, 'Open']
    );

    const incidentId = result.insertId;

    // Log incident event in Redis for real-time dashboard notification stream
    try {
      const redis = await getRedisClient();
      await redis.hSet(`incident:${incidentId}`, {
        lotId,
        slotId,
        userId,
        category,
        description,
        severity,
        status: 'Open',
        reportedAt: new Date().toISOString()
      });
      await redis.lPush('recent_incidents', incidentId);
      await redis.lTrim('recent_incidents', 0, 49); // Keep last 50
    } catch (redisErr) {
      console.error('Redis incident log error:', redisErr);
    }

    return NextResponse.json({ success: true, incidentId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    
  }
}
