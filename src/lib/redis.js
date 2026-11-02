import { createClient } from 'redis';
const state = globalThis.parkingRedis || (globalThis.parkingRedis = {});
export async function getRedisClient() {
  if (!state.client) {
    state.client = createClient({url: process.env.REDIS_URL, socket: {connectTimeout: 1500, reconnectStrategy: false}});
    state.client.on('error', () => {});
  }
  if (!state.client.isOpen) {
    state.connecting ||= state.client.connect().finally(() => { state.connecting = null; });
    await state.connecting;
  }
  return state.client;
}
// Redis is advisory: SQL owns all financial and reservation state.
export async function publishEvent(type, id) {
  try {
    const redis = await getRedisClient();
    await redis.xAdd('parking:events', '*', {type, id: String(id)}, {TRIM: {strategy: 'MAXLEN', strategyModifier: '~', threshold: 1000}});
  } catch { console.warn('Redis event delivery unavailable; committed SQL state is intact.'); }
}
