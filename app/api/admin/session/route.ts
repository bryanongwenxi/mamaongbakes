import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { authReady,COOKIE,isAdmin,sameOrigin,signSession,verifyPassword } from '@/lib/auth';
import { allowLogin,storageReady } from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(){return Response.json({authenticated:await isAdmin(),configured:authReady()&&storageReady()},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Please sign in from this website.'},{status:403});
 if(!authReady()||!storageReady())return Response.json({error:'Admin setup is not finished. Connect the database and configure the admin password first.'},{status:503});
 try{const text=await request.text();if(text.length>1024)return Response.json({error:'Invalid sign-in request.'},{status:400});
 const ip=process.env.VERCEL?request.headers.get('x-vercel-forwarded-for')??'unknown':'local';
 const key=createHash('sha256').update(ip).digest('hex');if(!await allowLogin(key))return Response.json({error:'Too many attempts. Please try again in 15 minutes.'},{status:429});
 const {password}=JSON.parse(text);if(typeof password!=='string'||!verifyPassword(password))return Response.json({error:'That password isn’t right. Please try again.'},{status:401});
 (await cookies()).set(COOKIE,signSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:8*60*60});return Response.json({ok:true});
 }catch{return Response.json({error:'Sign-in is unavailable. Please try again shortly.'},{status:503});}
}
export async function DELETE(request:Request){if(!sameOrigin(request))return Response.json({error:'Invalid request.'},{status:403});(await cookies()).delete(COOKIE);return Response.json({ok:true});}
