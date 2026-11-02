import pool from '@/lib/mysql';
import {route,user} from '@/lib/http';
export const GET=route(async request=>{
 await user(request);
 const [slots]=await pool.query('SELECT s.slot_id AS id,s.slot_number AS number,s.slot_type AS type,s.status,s.lot_id,l.name AS lot FROM parking_slots s JOIN parking_lots l ON l.lot_id=s.lot_id ORDER BY l.lot_id,s.slot_number');
 return {slots};
});
