import pool from '@/lib/mysql';
import {publishEvent} from '@/lib/redis';
import {route,user,body,assert,id} from '@/lib/http';
export const GET=route(async request=>{
 const actor=await user(request);
 const [incidents]=await pool.execute(`SELECT i.*,s.slot_number FROM incident_reports i JOIN parking_slots s ON s.slot_id=i.slot_id WHERE ${actor.role==='Customer'?'i.user_id=?':'1=1'} ORDER BY incident_id DESC LIMIT 100`,actor.role==='Customer'?[actor.user_id]:[]);
 return {incidents};
});
export const POST=route(async request=>{
 const actor=await user(request);const data=await body(request);const slotId=id(data.slotId);
 assert(['Property Damage','Barrier Malfunction','Unauthorized Parking','Security'].includes(data.category),400,'Invalid category.');
 assert(['Low','Medium','High'].includes(data.severity),400,'Invalid severity.');
 assert(typeof data.description==='string'&&data.description.trim().length>=10&&data.description.trim().length<=2000,400,'Description must be 10–2000 characters.');
 const [slots]=await pool.execute('SELECT slot_id FROM parking_slots WHERE slot_id=?',[slotId]);assert(slots.length,404,'Slot not found.');
 const [result]=await pool.execute('INSERT INTO incident_reports(slot_id,user_id,category,description,severity) VALUES (?,?,?,?,?)',[slotId,actor.user_id,data.category,data.description.trim(),data.severity]);
 await publishEvent('incident.created',result.insertId);return {success:true,incidentId:result.insertId};
});
export const PATCH=route(async request=>{
 await user(request,true);const data=await body(request);const incidentId=id(data.incidentId);
 assert(['Open','Under Investigation','Resolved'].includes(data.status),400,'Invalid status.');
 const [result]=await pool.execute('UPDATE incident_reports SET status=? WHERE incident_id=?',[data.status,incidentId]);assert(result.affectedRows,404,'Incident not found.');
 await publishEvent('incident.updated',incidentId);return {success:true};
});
export const DELETE=route(async request=>{
 const actor=await user(request);const incidentId=id(new URL(request.url).searchParams.get('id'));
 const [result]=await pool.execute("DELETE FROM incident_reports WHERE incident_id=? AND user_id=? AND status='Open'",[incidentId,actor.user_id]);
 assert(result.affectedRows,409,'Only your own open reports can be withdrawn.');return {success:true};
});
