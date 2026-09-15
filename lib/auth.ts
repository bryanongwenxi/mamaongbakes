import { createHmac,timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
export const COOKIE='mob_admin';
export const OAUTH_COOKIE='mob_oauth';
export const allowedEmails=()=>new Set((process.env.ADMIN_EMAILS??'').split(',').map(e=>e.trim().toLowerCase()).filter(Boolean));
export const emailAllowed=(email:string)=>allowedEmails().has(email.trim().toLowerCase());
export const authReady=()=>Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&(process.env.SESSION_SECRET?.length??0)>=32&&allowedEmails().size);
export function signPayload(payload:object,secret=process.env.SESSION_SECRET??''){if(secret.length<32)throw Error('Session secret is not configured.');const data=Buffer.from(JSON.stringify(payload)).toString('base64url');return `${data}.${createHmac('sha256',secret).update(data).digest('base64url')}`;}
export function readPayload(token:string,secret=process.env.SESSION_SECRET??''):Record<string,unknown>|null {try{if(secret.length<32||token.length>4096)return null;const [data,signature,extra]=token.split('.');if(!data||!signature||extra)return null;const expected=Buffer.from(createHmac('sha256',secret).update(data).digest('base64url'));const actual=Buffer.from(signature);if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;const p=JSON.parse(Buffer.from(data,'base64url').toString());return p&&typeof p==='object'?p:null;}catch{return null;}}
export function signSession(email:string,subject:string,expiry=Date.now()+8*60*60*1000,secret=process.env.SESSION_SECRET??''){return signPayload({purpose:'mob-admin',email:email.toLowerCase(),subject,expiry},secret);}
export function validSession(token:string,secret=process.env.SESSION_SECRET??''){const p=readPayload(token,secret);return !!p&&p.purpose==='mob-admin'&&typeof p.email==='string'&&emailAllowed(p.email)&&typeof p.subject==='string'&&p.subject.length>0&&typeof p.expiry==='number'&&p.expiry>Date.now()&&p.expiry<=Date.now()+9*60*60*1000;}
export async function adminEmail(){if(!authReady())return null;const token=(await cookies()).get(COOKIE)?.value??'';return validSession(token)?readPayload(token)?.email as string:null;}
export async function isAdmin(){return Boolean(await adminEmail());}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');if(!origin)return false;try{const url=new URL(origin);return url.host===request.headers.get('host')&&['http:','https:'].includes(url.protocol)&&(!process.env.VERCEL||url.protocol==='https:');}catch{return false;}}
export function appOrigin(){return (process.env.NEXT_PUBLIC_SITE_URL||(process.env.VERCEL_PROJECT_PRODUCTION_URL?`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`:'http://localhost:3107')).replace(/\/$/,'');}
