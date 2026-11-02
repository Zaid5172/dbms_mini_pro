const {test}=require('node:test');const assert=require('node:assert/strict');
const connect=require('../scripts/db-connection.cjs');const {hashPassword,digest}=require('../src/lib/security.cjs');
const {audit}=require('../scripts/audit-db.cjs');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
test('DBMS edge cases and transaction rollback',{skip:process.env.RUN_INTEGRATION!=='1'},async t=>{
 const db=await connect();const suffix=Date.now();let lot,owner,other;const bookings=[],vehicles=[],incidents=[];
 async function req(path,method='GET',data,cookie,origin=base){const r=await fetch(base+'/api'+path,{method,headers:{origin,...(data!==undefined?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:data!==undefined?JSON.stringify(data):undefined});return {status:r.status,json:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 async function book(slotId,plate,cookie){const r=await req('/parking/book','POST',{slotId,licensePlate:plate},cookie);if(r.json.bookingId)bookings.push(r.json.bookingId);return r;}
 try{
  const customer=await req('/auth/login','POST',{email:'customer@parking.local',password:process.env.SEED_CUSTOMER_PASSWORD});assert.equal(customer.status,200);const cookie=customer.cookie;
  const [[u]]=await db.query("SELECT user_id FROM users WHERE email='customer@parking.local'");owner=u.user_id;
  const [user]=await db.execute("INSERT INTO users(name,email,password_hash) VALUES ('Audit user',?,?)",[`audit-${suffix}@parking.local`,hashPassword('AuditOnly@123')]);other=user.insertId;
  const otherSession=await req('/auth/login','POST',{email:`audit-${suffix}@parking.local`,password:'AuditOnly@123'});
  const [l]=await db.execute("INSERT INTO parking_lots(name,location,total_capacity) VALUES ('Audit lot','Test only',2)");lot=l.insertId;
  const [s1]=await db.execute("INSERT INTO parking_slots(lot_id,slot_number) VALUES (?,'AUDIT-A')",[lot]);const a=s1.insertId;
  const [s2]=await db.execute("INSERT INTO parking_slots(lot_id,slot_number) VALUES (?,'AUDIT-B')",[lot]);const b=s2.insertId;
  await t.test('reject malformed JSON objects, boolean IDs and cross-origin writes',async()=>{
   for(const data of [null,[],true])assert.equal((await req('/parking/book','POST',data,cookie)).status,400);
   assert.equal((await req('/parking/book','POST',{slotId:true,licensePlate:'AUDITX'},cookie)).status,400);
   assert.equal((await req('/parking/book','POST',{slotId:a,licensePlate:'AUDITX'},cookie,'https://foreign.invalid')).status,403);
  });
  let active;
  await t.test('one vehicle cannot hold two simultaneous spaces',async()=>{
   const plate='AUDIT'+suffix;const results=await Promise.all([book(a,plate,cookie),book(b,plate,cookie)]);
   assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);active=results.find(r=>r.status===200).json.bookingId;
   const [[state]]=await db.execute('SELECT slot_id,vehicle_id FROM bookings WHERE booking_id=?',[active]);vehicles.push(state.vehicle_id);
   const [[otherSlot]]=await db.execute('SELECT status FROM parking_slots WHERE slot_id=?',[state.slot_id===a?b:a]);assert.equal(otherSlot.status,'Available');
  });
  await t.test('database rejects booking for someone else’s vehicle',async()=>{
   const [owned]=await db.execute('INSERT INTO vehicles(user_id,license_plate) VALUES (?,?)',[owner,'OWNER'+suffix]);
   const [[free]]=await db.execute("SELECT slot_id FROM parking_slots WHERE lot_id=? AND status='Available' LIMIT 1",[lot]);
   await assert.rejects(db.execute('INSERT INTO bookings(user_id,slot_id,vehicle_id) VALUES (?,?,?)',[other,free.slot_id,owned.insertId]),e=>e.code==='ER_NO_REFERENCED_ROW_2');
   assert.equal((await req('/bookings/'+active,'PATCH',{action:'complete'},otherSession.cookie)).status,403);
  });
  await t.test('payment failure rolls back checkout, slot trigger and status',async()=>{
   await db.query("CREATE TRIGGER audit_reject_payment BEFORE INSERT ON payments FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Forced test payment failure'");
   try{assert.equal((await req('/bookings/'+active,'PATCH',{action:'complete'},cookie)).status,503);}finally{await db.query('DROP TRIGGER audit_reject_payment');}
   const [[row]]=await db.execute('SELECT b.status,b.exit_time,b.total_fee,s.status slot_status FROM bookings b JOIN parking_slots s ON s.slot_id=b.slot_id WHERE b.booking_id=?',[active]);
   assert.deepEqual({...row},{status:'Active',exit_time:null,total_fee:null,slot_status:'Occupied'});
   const [[p]]=await db.execute('SELECT COUNT(*) n FROM payments WHERE booking_id=?',[active]);assert.equal(p.n,0);
  });
  await t.test('90 minute fee, simultaneous checkout, unique payment and released slot',async()=>{
   await db.execute('UPDATE bookings SET entry_time=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 90 MINUTE) WHERE booking_id=?',[active]);
   const results=await Promise.all([req('/bookings/'+active,'PATCH',{action:'complete'},cookie),req('/bookings/'+active,'PATCH',{action:'complete'},cookie)]);
   assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.ok(Math.abs(results.find(r=>r.status===200).json.totalFee-30)<0.02);
   const [[p]]=await db.execute('SELECT COUNT(*) n FROM payments WHERE booking_id=?',[active]);assert.equal(p.n,1);
  });
  await t.test('cancellation has zero SQL fee and no payment',async()=>{
   const r=await book(a,'CANCEL'+suffix,cookie);assert.equal(r.status,200);const booking=r.json.bookingId;
   assert.equal((await req('/bookings/'+booking,'PATCH',{action:'cancel'},cookie)).status,200);
   const [[row]]=await db.execute('SELECT total_fee,calculate_parking_fee(booking_id) calculated FROM bookings WHERE booking_id=?',[booking]);assert.equal(row.total_fee,0);assert.equal(row.calculated,0);
   const [[p]]=await db.execute('SELECT COUNT(*) n FROM payments WHERE booking_id=?',[booking]);assert.equal(p.n,0);
  });
  await t.test('foreign key and CHECK constraints reject invalid records',async()=>{
   await assert.rejects(db.execute("INSERT INTO incident_reports(slot_id,user_id,category,description,severity) VALUES (?,?,'Security','short','Low')",[a,owner]),e=>e.code==='ER_CHECK_CONSTRAINT_VIOLATED');
   await assert.rejects(db.execute("INSERT INTO parking_slots(lot_id,slot_number) VALUES (2147483647,'BAD')"),e=>e.code==='ER_NO_REFERENCED_ROW_2');
  });
  await t.test('whitespace cannot bypass the shared login rate limit',async()=>{
   const email=`rate-${suffix}@parking.local`;
   for(let n=0;n<20;n++)assert.equal((await req('/auth/login','POST',{email,password:'incorrect'})).status,401);
   assert.equal((await req('/auth/login','POST',{email:' '+email+' ',password:'incorrect'})).status,429);
  });
  await t.test('empty lots appear with zero occupancy',async()=>{
   const [empty]=await db.execute("INSERT INTO parking_lots(name,location,total_capacity) VALUES ('Empty audit lot','Test',1)");
   try{const [[row]]=await db.execute('SELECT * FROM vw_active_occupancy WHERE lot_id=?',[empty.insertId]);assert.ok(row);assert.equal(Number(row.available_slots),0);assert.equal(Number(row.occupied_slots),0);}finally{await db.execute('DELETE FROM parking_lots WHERE lot_id=?',[empty.insertId]);}
  });
 }finally{
  await db.query('DROP TRIGGER IF EXISTS audit_reject_payment');
  if(lot){await db.execute('DELETE p FROM payments p JOIN bookings b ON b.booking_id=p.booking_id JOIN parking_slots s ON s.slot_id=b.slot_id WHERE s.lot_id=?',[lot]);await db.execute('DELETE b FROM bookings b JOIN parking_slots s ON s.slot_id=b.slot_id WHERE s.lot_id=?',[lot]);await db.execute('DELETE FROM parking_slots WHERE lot_id=?',[lot]);await db.execute('DELETE FROM parking_lots WHERE lot_id=?',[lot]);}
  await db.execute('DELETE FROM vehicles WHERE license_plate IN (?,?,?)',['AUDIT'+suffix,'CANCEL'+suffix,'OWNER'+suffix]);
  if(other)await db.execute('DELETE FROM users WHERE user_id=?',[other]);await db.end();
 }
});
