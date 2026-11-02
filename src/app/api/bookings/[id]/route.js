import pool from '@/lib/mysql';
import {publishEvent} from '@/lib/redis';
import {route,user,body,assert,id} from '@/lib/http';
export const PATCH=route(async(request,context)=>{
 const actor=await user(request);const bookingId=id((await context.params).id);const {action}=await body(request);
 assert(['complete','cancel'].includes(action),400,'Choose complete or cancel.');
 const db=await pool.getConnection();let fee=0;
 try{
  await db.beginTransaction();
  const [rows]=await db.execute('SELECT * FROM bookings WHERE booking_id=? FOR UPDATE',[bookingId]);
  assert(rows.length,404,'Booking not found.');
  assert(rows[0].user_id===actor.user_id||actor.role!=='Customer',403,'This booking belongs to another customer.');
  assert(rows[0].status==='Active',409,'Booking is already closed.');
  const status=action==='complete'?'Completed':'Cancelled';
  await db.execute('UPDATE bookings SET exit_time=UTC_TIMESTAMP(),status=? WHERE booking_id=?',[status,bookingId]);
  if(action==='complete'){
   const [fees]=await db.execute('SELECT calculate_parking_fee(?) AS fee',[bookingId]);fee=fees[0].fee;
   await db.execute('UPDATE bookings SET total_fee=? WHERE booking_id=?',[fee,bookingId]);
   await db.execute('INSERT INTO payments(booking_id,amount) VALUES (?,?)',[bookingId,fee]);
  }else await db.execute('UPDATE bookings SET total_fee=0 WHERE booking_id=?',[bookingId]);
  await db.commit();
 }catch(e){await db.rollback();throw e;}finally{db.release();}
 await publishEvent('booking.closed',bookingId);return {success:true,totalFee:fee};
});
