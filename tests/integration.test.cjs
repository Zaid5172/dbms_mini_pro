const {test}=require('node:test');const assert=require('node:assert/strict');const mysql=require('mysql2/promise');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const enabled=process.env.RUN_INTEGRATION==='1';
test('real database integration: roles, race, fees, trigger, incidents, logout',{skip:!enabled},async()=>{
 const db=await mysql.createConnection({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE,decimalNumbers:true});
 let slotId,bookingId,incidentId;const plate='TEST'+Date.now();
 async function request(path,method='GET',data,cookie){const res=await fetch(base+'/api'+path,{method,headers:{origin:base,...(data?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:data?JSON.stringify(data):undefined});return {status:res.status,json:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};}
 try{
  assert.equal((await request('/parking/slots')).status,401);
  const customer=await request('/auth/login','POST',{email:'customer@parking.local',password:process.env.SEED_CUSTOMER_PASSWORD});assert.equal(customer.status,200);
  const staff=await request('/auth/login','POST',{email:'staff@parking.local',password:process.env.SEED_STAFF_PASSWORD});assert.equal(staff.status,200);
  assert.equal((await request('/incidents','PATCH',{incidentId:1,status:'Resolved'},customer.cookie)).status,403);
  assert.equal((await request('/parking/book','POST',{slotId:'1 OR 1=1',licensePlate:plate},customer.cookie)).status,400);
  const [lots]=await db.query('SELECT lot_id FROM parking_lots ORDER BY lot_id LIMIT 1');
  const [insert]=await db.execute("INSERT INTO parking_slots(lot_id,slot_number) VALUES (?,?)",[lots[0].lot_id,'TEST-'+Date.now()]);slotId=insert.insertId;
  const race=await Promise.all([request('/parking/book','POST',{slotId,licensePlate:plate},customer.cookie),request('/parking/book','POST',{slotId,licensePlate:plate},customer.cookie)]);
  assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);bookingId=race.find(r=>r.status===200).json.bookingId;
  const checkout=await request('/bookings/'+bookingId,'PATCH',{action:'complete'},customer.cookie);assert.equal(checkout.status,200);assert.equal(checkout.json.totalFee,15);
  assert.equal((await request('/bookings/'+bookingId,'PATCH',{action:'complete'},customer.cookie)).status,409);
  const [[slot]]=await db.execute('SELECT status FROM parking_slots WHERE slot_id=?',[slotId]);assert.equal(slot.status,'Available');
  const [[payment]]=await db.execute('SELECT COUNT(*) n FROM payments WHERE booking_id=?',[bookingId]);assert.equal(payment.n,1);
  const report=await request('/incidents','POST',{slotId,category:'Security',severity:'High',description:'Integration test security report.'},customer.cookie);assert.equal(report.status,200);incidentId=report.json.incidentId;
  assert.equal((await request('/incidents','PATCH',{incidentId,status:'Resolved'},staff.cookie)).status,200);
  assert.equal((await request('/incidents?id='+incidentId,'DELETE',undefined,customer.cookie)).status,409);
  assert.equal((await request('/analytics','GET',undefined,customer.cookie)).json.redis.online,true);
  assert.equal((await request('/auth/logout','POST',undefined,customer.cookie)).status,200);
  assert.equal((await request('/bookings','GET',undefined,customer.cookie)).status,401);
 }finally{
  if(incidentId)await db.execute('DELETE FROM incident_reports WHERE incident_id=?',[incidentId]);
  if(bookingId){await db.execute('DELETE FROM payments WHERE booking_id=?',[bookingId]);await db.execute('DELETE FROM bookings WHERE booking_id=?',[bookingId]);}
  await db.execute('DELETE FROM vehicles WHERE license_plate=?',[plate]);
  if(slotId)await db.execute('DELETE FROM parking_slots WHERE slot_id=?',[slotId]);
  await db.end();
 }
});
