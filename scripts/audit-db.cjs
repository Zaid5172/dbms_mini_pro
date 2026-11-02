const connect=require('./db-connection.cjs');
const checks={
 'slot state vs active bookings':"SELECT s.slot_id,s.status,COUNT(b.booking_id) active_count FROM parking_slots s LEFT JOIN bookings b ON b.slot_id=s.slot_id AND b.status='Active' GROUP BY s.slot_id,s.status HAVING (s.status='Occupied' AND active_count<>1) OR (s.status<>'Occupied' AND active_count<>0)",
 'booking vehicle ownership':'SELECT b.booking_id FROM bookings b JOIN vehicles v ON v.vehicle_id=b.vehicle_id WHERE b.user_id<>v.user_id',
 'completed fee and payment':"SELECT b.booking_id FROM bookings b LEFT JOIN payments p ON p.booking_id=b.booking_id WHERE b.status='Completed' AND (b.total_fee IS NULL OR p.payment_id IS NULL OR b.total_fee<>p.amount)",
 'unexpected payments or cancellation fees':"SELECT b.booking_id FROM bookings b LEFT JOIN payments p ON p.booking_id=b.booking_id WHERE (b.status<>'Completed' AND p.payment_id IS NOT NULL) OR (b.status='Cancelled' AND (b.total_fee IS NULL OR b.total_fee<>0))",
 'booking lifecycle timestamps':"SELECT booking_id FROM bookings WHERE (status='Active' AND (exit_time IS NOT NULL OR total_fee IS NOT NULL)) OR (status<>'Active' AND exit_time IS NULL) OR exit_time<entry_time",
 'lot capacity vs slots':'SELECT l.lot_id,l.total_capacity,COUNT(s.slot_id) actual_slots FROM parking_lots l LEFT JOIN parking_slots s ON s.lot_id=l.lot_id GROUP BY l.lot_id,l.total_capacity HAVING total_capacity<>actual_slots'
};
async function audit(db){const results=[];await db.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');try{for(const [name,sql] of Object.entries(checks)){const [rows]=await db.query(sql);results.push({check:name,passed:rows.length===0,violations:rows});}await db.commit();return results;}catch(e){await db.rollback();throw e;}}
module.exports={audit};
if(require.main===module)(async()=>{const db=await connect();try{const results=await audit(db);for(const r of results)console.log(`${r.passed?'PASS':'FAIL'} ${r.check}${r.passed?'':': '+JSON.stringify(r.violations)}`);if(results.some(r=>!r.passed))process.exitCode=1;}finally{await db.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
