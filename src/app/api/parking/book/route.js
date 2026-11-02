import pool from '@/lib/mysql';
import {publishEvent} from '@/lib/redis';
import {route,user,body,assert,id} from '@/lib/http';
export const POST=route(async request=>{
 const actor=await user(request);const data=await body(request);const slotId=id(data.slotId);
 assert(typeof data.licensePlate==='string',400,'Enter a vehicle registration.');
 const plate=data.licensePlate.toUpperCase().replace(/\s/g,'');
 assert(/^[A-Z0-9-]{4,20}$/.test(plate),400,'Registration must contain 4–20 letters, numbers or hyphens.');
 const db=await pool.getConnection();let bookingId;
 try{
  await db.beginTransaction();
  const [slots]=await db.execute('SELECT status FROM parking_slots WHERE slot_id=? FOR UPDATE',[slotId]);
  assert(slots.length,404,'Slot not found.');assert(slots[0].status==='Available',409,'This slot is no longer available.');
  await db.execute('INSERT INTO vehicles(user_id,license_plate) VALUES (?,?) ON DUPLICATE KEY UPDATE vehicle_id=LAST_INSERT_ID(vehicle_id)',[actor.user_id,plate]);
  const [vehicles]=await db.execute('SELECT vehicle_id,user_id FROM vehicles WHERE license_plate=? FOR UPDATE',[plate]);
  assert(vehicles[0].user_id===actor.user_id,403,'Vehicle belongs to another account.');
  const [active]=await db.execute("SELECT booking_id FROM bookings WHERE vehicle_id=? AND status='Active'",[vehicles[0].vehicle_id]);
  assert(!active.length,409,'Vehicle already has an active booking.');
  const [result]=await db.execute('INSERT INTO bookings(user_id,slot_id,vehicle_id) VALUES (?,?,?)',[actor.user_id,slotId,vehicles[0].vehicle_id]);bookingId=result.insertId;
  await db.execute("UPDATE parking_slots SET status='Occupied' WHERE slot_id=?",[slotId]);
  await db.commit();
 }catch(e){await db.rollback();if(e.code==='ER_DUP_ENTRY'){e.status=409;e.message='Slot or vehicle already reserved.';}throw e;}finally{db.release();}
 await publishEvent('booking.created',bookingId);return {success:true,bookingId};
});
