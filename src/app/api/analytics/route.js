import pool from '@/lib/mysql';
import {getRedisClient} from '@/lib/redis';
import {route,user} from '@/lib/http';
export const GET=route(async request=>{
 await user(request);
 const [occupancy]=await pool.query('SELECT * FROM vw_active_occupancy ORDER BY lot_id');
 const [[stats]]=await pool.query("SELECT (SELECT COUNT(*) FROM bookings WHERE status='Active') active_bookings,(SELECT COUNT(*) FROM incident_reports WHERE status!='Resolved') open_incidents,(SELECT COALESCE(SUM(amount),0) FROM payments) revenue");
 let redis={online:false,events:0};try{const client=await getRedisClient();redis={online:await client.ping()==='PONG',events:await client.xLen('parking:events')};}catch{}
 return {occupancy,stats,redis};
});
