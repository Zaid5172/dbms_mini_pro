const fs=require('node:fs');
for(const file of ['.env.example','compose.yaml','database/mysql_schema.sql','README.md'])if(!fs.existsSync(file))throw Error('Missing '+file);
console.log('Required setup files exist. Run npm test and npm run build for validation.');
