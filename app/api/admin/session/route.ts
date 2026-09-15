import { cookies } from 'next/headers';
import { authReady,COOKIE,adminEmail,sameOrigin } from '@/lib/auth';
import { storageReady } from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(){const email=await adminEmail();return Response.json({authenticated:Boolean(email),email,configured:authReady()&&storageReady()},{headers:{'Cache-Control':'no-store'}});}
export async function DELETE(request:Request){if(!sameOrigin(request))return Response.json({error:'Invalid request.'},{status:403});(await cookies()).delete(COOKIE);return Response.json({ok:true});}
