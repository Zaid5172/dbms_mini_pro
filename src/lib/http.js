import {NextResponse} from 'next/server';
import pool from './mysql';
import security from './security.cjs';
export class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
export function assert(condition,status,message){if(!condition)throw new HttpError(status,message);}
export async function body(request){
 let value;try{value=await request.json();}catch{throw new HttpError(400,'A valid JSON body is required.');}
 assert(value!==null && typeof value==='object' && !Array.isArray(value),400,'A JSON object is required.');
 return value;
}
export async function user(request, staff=false) {
 const token=request.cookies.get('parking_session')?.value;
 assert(token,401,'Please sign in.');
 const [rows]=await pool.execute('SELECT u.user_id,u.name,u.role,u.email FROM sessions s JOIN users u ON u.user_id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP()',[security.digest(token)]);
 assert(rows.length,401,'Session expired. Please sign in.');
 assert(!staff || ['Staff','Admin'].includes(rows[0].role),403,'Staff access required.');
 return rows[0];
}
export function route(handler){return async(request,context)=>{
 try{
  if(!['GET','HEAD'].includes(request.method)) {
   const origin=request.headers.get('origin');
   const expectedOrigin=process.env.APP_ORIGIN || `${new URL(request.url).protocol}//${request.headers.get('host')}`;
   assert(!origin || origin===expectedOrigin,403,'Cross-origin request rejected.');
  }
  return NextResponse.json(await handler(request,context),{headers:{'Cache-Control':'no-store'}});
 }catch(error){
  if(!error.status)console.error('API failure:',error.code || error.message);
  return NextResponse.json({error:error.status?error.message:'Service unavailable. Please retry.'},{status:error.status || 503});
 }
};}
export function id(value){assert(security.positiveId(value),400,'A positive integer ID is required.');return Number(value);}
