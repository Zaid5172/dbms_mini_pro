import pool from '@/lib/mysql';
import {getRedisClient} from '@/lib/redis';
import {NextResponse} from 'next/server';
export async function GET(){let mysql=false,redis=false;try{await pool.query('SELECT 1');mysql=true;}catch{}try{redis=await(await getRedisClient()).ping()==='PONG';}catch{}return NextResponse.json({mysql,redis},{status:mysql&&redis?200:503,headers:{'Cache-Control':'no-store'}});}
