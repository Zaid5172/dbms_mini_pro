import { NextResponse } from 'next/server';
import pool from '../../../../lib/mysql';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const [users] = await pool.execute(
      'SELECT user_id, name, email, password_hash, vehicle_number, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0 || users[0].password_hash !== password) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const user = users[0];
    delete user.password_hash;

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}