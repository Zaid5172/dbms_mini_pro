import {cookies} from 'next/headers';
import pool from '@/lib/mysql';
import security from '@/lib/security.cjs';
import {route} from '@/lib/http';
export const POST=route(async request=>{
 const token=request.cookies.get('parking_session')?.value;
 if(token)await pool.execute('DELETE FROM sessions WHERE token_hash=?',[security.digest(token)]);
 (await cookies()).delete('parking_session');return {success:true};
});
