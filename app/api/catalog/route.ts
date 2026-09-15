import { getCatalog } from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(await getCatalog(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'The menu is taking a little longer to load. Please try again.'},{status:503});}}
