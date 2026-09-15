import { OAuth2Client } from 'google-auth-library';
import { cookies } from 'next/headers';
import { appOrigin,authReady,COOKIE,emailAllowed,OAUTH_COOKIE,readPayload,signSession } from '@/lib/auth';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const origin=appOrigin(),jar=await cookies();const state=readPayload(jar.get(OAUTH_COOKIE)?.value??'');jar.set(OAUTH_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/auth/google',maxAge:0});const url=new URL(request.url);const fail=(reason:string)=>Response.redirect(`${origin}/admin?error=${reason}`,303);
 if(!authReady())return fail('setup');
 if(url.searchParams.has('error'))return fail('cancelled');
 if(!state||state.purpose!=='mob-oauth'||state.state!==url.searchParams.get('state')||typeof state.expiry!=='number'||state.expiry<Date.now()||typeof state.codeVerifier!=='string'||typeof state.nonce!=='string')return fail('expired');
 const code=url.searchParams.get('code');if(!code)return fail('expired');
 try{const client=new OAuth2Client(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,`${origin}/api/auth/google/callback`);const {tokens}=await client.getToken({code,codeVerifier:state.codeVerifier});if(!tokens.id_token)return fail('failed');const ticket=await client.verifyIdToken({idToken:tokens.id_token,audience:process.env.GOOGLE_CLIENT_ID});const identity=ticket.getPayload();if(!identity||identity.email_verified!==true||!identity.email||!identity.sub||(identity as unknown as Record<string,unknown>).nonce!==state.nonce)return fail('failed');if(!emailAllowed(identity.email))return fail('not-allowed');jar.set(COOKIE,signSession(identity.email,identity.sub),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:8*60*60});return Response.redirect(`${origin}/admin`,303);}catch{return fail('failed');}
}
