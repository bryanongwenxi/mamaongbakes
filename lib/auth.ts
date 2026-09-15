import { createHmac, timingSafeEqual, scryptSync } from 'node:crypto';
import { cookies } from 'next/headers';
export const COOKIE='mob_admin';
export const authReady=()=>Boolean(process.env.ADMIN_PASSWORD_HASH && (process.env.SESSION_SECRET?.length??0)>=32);
export function verifyPassword(password:string,hash=process.env.ADMIN_PASSWORD_HASH??''){try{const [salt,value]=hash.split(':');if(!salt||!value||password.length>256)return false;const expected=Buffer.from(value,'hex');const actual=scryptSync(password,salt,64);return actual.length===expected.length&&timingSafeEqual(actual,expected);}catch{return false;}}
export function signSession(expiry=Date.now()+8*60*60*1000,secret=process.env.SESSION_SECRET??''){const payload=String(expiry);return `${payload}.${createHmac('sha256',secret).update(payload).digest('hex')}`;}
export function validSession(token:string,secret=process.env.SESSION_SECRET??''){if(secret.length<32)return false;const [expiry,signature]=token.split('.');if(!/^\d+$/.test(expiry??'')||!signature||Number(expiry)<=Date.now()||Number(expiry)>Date.now()+9*60*60*1000)return false;const expected=Buffer.from(signSession(Number(expiry),secret));const actual=Buffer.from(token);return expected.length===actual.length&&timingSafeEqual(expected,actual);}
export async function isAdmin(){return authReady()&&validSession((await cookies()).get(COOKIE)?.value??'');}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');if(!origin)return false;try{const url=new URL(origin);return url.host===request.headers.get('host')&&['http:','https:'].includes(url.protocol)&&(!process.env.VERCEL||url.protocol==='https:');}catch{return false;}}
