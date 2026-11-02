const fs=require('node:fs');const connect=require('./db-connection.cjs');
(async()=>{const db=await connect();try{
 const [[lock]]=await db.query("SELECT GET_LOCK('parking_dbms_audit_migration',10) acquired");if(lock.acquired!==1)throw Error('Another migration is running.');
 const [mismatch]=await db.query('SELECT b.booking_id FROM bookings b JOIN vehicles v ON v.vehicle_id=b.vehicle_id WHERE b.user_id<>v.user_id LIMIT 1');
 if(mismatch.length)throw Error('Ownership mismatch found. Run npm run db:audit and correct the records before migration.');
 const [indexes]=await db.query("SHOW INDEX FROM vehicles WHERE Key_name='uq_vehicle_owner'");
 if(!indexes.length)await db.query('ALTER TABLE vehicles ADD UNIQUE KEY uq_vehicle_owner(vehicle_id,user_id)');
 const [constraints]=await db.execute("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='bookings' AND CONSTRAINT_NAME='fk_booking_vehicle_owner'");
 if(!constraints.length)await db.query('ALTER TABLE bookings ADD CONSTRAINT fk_booking_vehicle_owner FOREIGN KEY(vehicle_id,user_id) REFERENCES vehicles(vehicle_id,user_id)');
 const schema=fs.readFileSync('database/mysql_schema.sql','utf8');
 const view=schema.match(/CREATE VIEW vw_active_occupancy AS[\s\S]*?;/)[0].replace('CREATE VIEW','CREATE OR REPLACE VIEW');await db.query(view);
 // Run while the app is stopped: MySQL cannot replace stored functions atomically.
 const routine=schema.match(/CREATE FUNCTION calculate_parking_fee[\s\S]*?END \/\//)[0].replace(/ \/\/$/,'');
 await db.query('DROP FUNCTION IF EXISTS calculate_parking_fee');await db.query(routine);
 console.log('Database fixes applied. Existing users, bookings and payments were preserved.');
 }finally{await db.query("SELECT RELEASE_LOCK('parking_dbms_audit_migration')").catch(()=>{});await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
