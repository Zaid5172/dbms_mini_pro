import pool from '@/lib/mysql';
import {route,user} from '@/lib/http';
export const GET=route(async request=>{
 const actor=await user(request);
 const [bookings]=await pool.execute(`SELECT b.*,s.slot_number,v.license_plate,calculate_parking_fee(b.booking_id) AS estimated_fee FROM bookings b JOIN parking_slots s ON s.slot_id=b.slot_id JOIN vehicles v ON v.vehicle_id=b.vehicle_id WHERE ${actor.role==='Customer'?'b.user_id=?':'1=1'} ORDER BY b.booking_id DESC LIMIT 100`,actor.role==='Customer'?[actor.user_id]:[]);
 return {bookings};
});
