import {randomBytes} from 'node:crypto';
import pool from '@/lib/mysql';
import {getRedisClient} from '@/lib/redis';
import security from '@/lib/security.cjs';
import {route,body,assert} from '@/lib/http';
export const POST=route(async request=>{
 const {email,password}=await body(request);
 assert(typeof email==='string'&&email.length<=150&&typeof password==='string'&&password.length<=200,400,'Enter a valid email and password.');
 const normalizedEmail=email.toLowerCase().trim();
 // Fail closed if shared rate limiter is unavailable.
 const redis=await getRedisClient();
 const key=`login:${security.digest(normalizedEmail)}`;
 const attempts=await redis.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],300) end; return n",{keys:[key],arguments:[]});
 assert(attempts<=20,429,'Too many login attempts. Try again in five minutes.');
 const [rows]=await pool.execute('SELECT * FROM users WHERE email=?',[normalizedEmail]);
 const valid=security.verifyPassword(password,rows[0]?.password_hash||'00000000000000000000000000000000:'+ '0'.repeat(128));
 assert(rows.length&&valid,401,'Invalid email or password.');
 const token=randomBytes(32).toString('hex');
 await pool.execute('DELETE FROM sessions WHERE expires_at<=UTC_TIMESTAMP()');
 await pool.execute('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 8 HOUR))',[security.digest(token),rows[0].user_id]);
 // The shared wrapper returns JSON; set cookie using Next headers.
 const {cookies}=await import('next/headers');
 (await cookies()).set('parking_session',token,{httpOnly:true,sameSite:'lax',secure:process.env.COOKIE_SECURE==='true',path:'/',maxAge:28800});
 return {user:{name:rows[0].name,role:rows[0].role}};
});
