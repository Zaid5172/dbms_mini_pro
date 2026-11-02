import mysql from 'mysql2/promise';
const globalPool = globalThis;
const pool = globalPool.parkingPool || mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1', port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'smart_parking_db',
  waitForConnections: true, connectionLimit: 10, queueLimit: 50,
  decimalNumbers: true, timezone: 'Z', connectTimeout: 5000
});
// Driver timezone controls conversion, not the server session used by SQL functions.
if (!globalPool.parkingPool) pool.pool.on('connection', connection => {
  connection.query("SET time_zone = '+00:00'");
});
globalPool.parkingPool = pool;
export default pool;
