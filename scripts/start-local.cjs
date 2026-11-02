const fs=require('node:fs');
const path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const {randomBytes}=require('node:crypto');
process.chdir(path.resolve(__dirname,'..'));
const npm=process.platform==='win32'?'npm.cmd':'npm';
function run(command,args){const r=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32',env:process.env});if(r.error||r.status!==0)throw Error(`${command} failed. ${r.error?.message||'See the output above.'}`);}
async function main(){
 if(Number(process.versions.node.split('.')[0])<24)throw Error('Install Node.js 24 LTS first.');
 if(!fs.existsSync('.env.local')){
  const secret=()=>randomBytes(24).toString('hex');
  fs.writeFileSync('.env.local',`MYSQL_HOST=127.0.0.1\nMYSQL_PORT=3306\nMYSQL_USER=parking\nMYSQL_PASSWORD=${secret()}\nMYSQL_ROOT_PASSWORD=${secret()}\nMYSQL_DATABASE=smart_parking_db\nREDIS_URL=redis://127.0.0.1:6379\nSEED_CUSTOMER_PASSWORD=${secret()}\nSEED_STAFF_PASSWORD=${secret()}\nCOOKIE_SECURE=false\n`,{mode:0o600});
  console.log('Created private local configuration.');
 }
 process.loadEnvFile('.env.local');
 const docker=spawnSync('docker',['compose','version'],{stdio:'ignore'});
 if(docker.error||docker.status!==0)throw Error('Install Docker Desktop with Compose, start it, then run this launcher again.');
 if(!fs.existsSync('node_modules/next/package.json'))run(npm,['ci']);
 run('docker',['compose','--env-file','.env.local','up','-d','--wait']);
 const mysql=require('mysql2/promise');
 const db=await mysql.createConnection({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE});
 const [tables]=await db.query("SHOW TABLES LIKE 'users'");await db.end();
 if(!tables.length)run(npm,['run','db:init']);
 console.log('\nLocal website: http://localhost:3000/login');
 console.log('Demo emails: customer@parking.local / staff@parking.local');
 console.log('Find their passwords in .env.local (SEED_CUSTOMER_PASSWORD / SEED_STAFF_PASSWORD).');
 console.log('Keep this window open. Press Ctrl+C to stop the website. Database volumes remain saved.\n');
 const app=spawn(npm,['run','dev','--','--webpack','--hostname','127.0.0.1'],{stdio:'inherit',shell:process.platform==='win32'});
 let opened=false;
 const timer=setInterval(async()=>{if(opened)return;try{const r=await fetch('http://localhost:3000/api/health');if(!r.ok || opened)return;opened=true;clearInterval(timer);clearTimeout(timeout);const url='http://localhost:3000/login';let child;if(process.platform==='win32')child=spawn('cmd.exe',['/c','start','',url],{stdio:'ignore'});else if(process.platform==='darwin')child=spawn('open',[url],{stdio:'ignore'});else child=spawn('xdg-open',[url],{stdio:'ignore'});child.on('error',()=>console.log('Open '+url+' in your browser.'));}catch{}},1500);
 const timeout=setTimeout(()=>{clearInterval(timer);console.log('If the browser did not open, visit http://localhost:3000/login.');},90000);
 app.on('exit',code=>{clearInterval(timer);clearTimeout(timeout);process.exitCode=code||0;});
 process.on('SIGINT',()=>{clearInterval(timer);clearTimeout(timeout);app.kill('SIGINT');});
}
main().catch(e=>{console.error('\nSetup could not finish: '+e.message);process.exitCode=1;});
