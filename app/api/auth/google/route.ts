import { randomBytes } from 'node:crypto';
import { OAuth2Client,CodeChallengeMethod } from 'google-auth-library';
import { cookies } from 'next/headers';
import { appOrigin,authReady,OAUTH_COOKIE,signPayload } from '@/lib/auth';
export const dynamic='force-dynamic';
export async function GET(){const origin=appOrigin();if(!authReady())return Response.redirect(`${origin}/admin?error=setup`,303);const client=new OAuth2Client(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,`${origin}/api/auth/google/callback`);const state=randomBytes(32).toString('base64url'),nonce=randomBytes(32).toString('base64url');const {codeVerifier,codeChallenge}=await client.generateCodeVerifierAsync();(await cookies()).set(OAUTH_COOKIE,signPayload({purpose:'mob-oauth',state,nonce,codeVerifier,expiry:Date.now()+600000}),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/auth/google',maxAge:600});return Response.redirect(client.generateAuthUrl({scope:['openid','email'],state,nonce,code_challenge:codeChallenge,code_challenge_method:CodeChallengeMethod.S256,prompt:'select_account',access_type:'online'}),303);}
