const {randomBytes, scryptSync, timingSafeEqual, createHash} = require('node:crypto');
function hashPassword(password) { const salt=randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password,salt,64).toString('hex')}`; }
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash || !/^[0-9a-f]{128}$/.test(hash)) return false;
  return timingSafeEqual(Buffer.from(hash,'hex'),scryptSync(password,salt,64));
}
function digest(token) { return createHash('sha256').update(token).digest('hex'); }
function positiveId(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value))) return false;
  return Number.isSafeInteger(Number(value)) && Number(value)>0;
}
module.exports={hashPassword,verifyPassword,digest,positiveId};
