import { NextResponse } from 'next/server';
import pool from '../../../../lib/mysql';

export async function POST(request) {
  try {
    const { name, email, password, vehicleNumber } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const [existing] = await pool.execute('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email is already registered.' }, { status: 400 });
    }

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, vehicle_number) VALUES (?, ?, ?, ?)',
      [name, email, password, vehicleNumber || null]
    );

    return NextResponse.json({ success: true, userId: result.insertId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}