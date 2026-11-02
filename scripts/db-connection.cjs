const mysql=require('mysql2/promise');
module.exports=async()=>{
 const db=await mysql.createConnection({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE,decimalNumbers:true});
 await db.query("SET time_zone='+00:00'");return db;
};
