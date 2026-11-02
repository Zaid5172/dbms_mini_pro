import {route,user} from '@/lib/http';
export const GET=route(async request=>({user:await user(request)}));
