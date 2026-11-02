const fs=require('node:fs');
const mysql=require('mysql2/promise');
const {hashPassword}=require('../src/lib/security.cjs');
(async()=>{
 for(const key of ['MYSQL_USER','MYSQL_PASSWORD','SEED_CUSTOMER_PASSWORD','SEED_STAFF_PASSWORD'])if(!process.env[key]||process.env[key].startsWith('replace-'))throw Error(`Set ${key} first.`);
 const db=await mysql.createConnection({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE});
 try{
  const [tables]=await db.query("SHOW TABLES LIKE 'users'");
  if(tables.length)throw Error('Database already initialized; refusing to overwrite data.');
  const sql=fs.readFileSync('database/mysql_schema.sql','utf8');
  let delimiter=';',buffer='';
  for(const line of sql.split('\n')){
   if(line.startsWith('DELIMITER ')){delimiter=line.slice(10).trim();continue;}
   buffer+=line+'\n';
   if(buffer.trimEnd().endsWith(delimiter)){
    const statement=buffer.trimEnd().slice(0,-delimiter.length).trim();if(statement)await db.query(statement);buffer='';
   }
  }
  await db.beginTransaction();
  await db.execute('INSERT INTO users(name,email,password_hash,role) VALUES (?,?,?,?),(?,?,?,?)',['Demo Customer','customer@parking.local',hashPassword(process.env.SEED_CUSTOMER_PASSWORD),'Customer','Demo Staff','staff@parking.local',hashPassword(process.env.SEED_STAFF_PASSWORD),'Staff']);
  await db.execute("INSERT INTO parking_lots(name,location,total_capacity) VALUES ('Campus Central','Main entrance',12),('Library EV Hub','North gate',6)");
  for(let n=1;n<=18;n++)await db.execute('INSERT INTO parking_slots(lot_id,slot_number,slot_type,status) VALUES (?,?,?,?)',[n<=12?1:2,`P-${String(n).padStart(2,'0')}`,n>12?'EV':n===1?'Accessible':'Standard',n===12?'Maintenance':'Available']);
  await db.commit();console.log('Schema and demo users created. No passwords printed.');
 }finally{await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
