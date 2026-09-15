import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { isAdmin,sameOrigin } from '@/lib/auth';
import { getCatalog,saveCatalog,saveImage } from '@/lib/store';
import { productSchema } from '@/lib/types';
export const dynamic='force-dynamic';
async function permitted(r:Request){return sameOrigin(r)&&await isAdmin();}
export async function PUT(request:Request){
 if(!await permitted(request))return Response.json({error:'Please sign in again.'},{status:401});
 try{const raw=await request.text();if(raw.length>1000000)return Response.json({error:'Menu is too large.'},{status:413});const body=JSON.parse(raw);const parsed=productSchema.array().max(150).safeParse(body.products);if(!parsed.success||!Number.isInteger(body.revision))return Response.json({error:parsed.success?'Invalid menu revision.':parsed.error.issues[0].message},{status:400});if(new Set(parsed.data.map(p=>p.id)).size!==parsed.data.length)return Response.json({error:'Duplicate product IDs.'},{status:400});const revision=await saveCatalog(parsed.data,body.revision);return Response.json({revision,products:parsed.data});}catch(e){const message=e instanceof Error?e.message:'Could not save the menu.';return Response.json({error:message.includes('another window')?message:'Could not save the menu. Please try again.'},{status:message.includes('another window')?409:503});}
}
export async function POST(request:Request){
 if(!await permitted(request))return Response.json({error:'Please sign in again.'},{status:401});
 try{if(Number(request.headers.get('content-length'))>4500000)return Response.json({error:'Choose a photo smaller than 4 MB.'},{status:413});const form=await request.formData();const file=form.get('photo');if(!(file instanceof File)||file.size>4000000||!['image/jpeg','image/png','image/webp'].includes(file.type))return Response.json({error:'Choose a JPG, PNG or WebP photo smaller than 4 MB.'},{status:400});const image=await sharp(Buffer.from(await file.arrayBuffer()),{limitInputPixels:30000000}).rotate().resize(1200,1200,{fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();const id=randomUUID();await saveImage(id,image,'image/webp');return Response.json({image:`/api/images/${id}`});}catch{return Response.json({error:'We couldn’t read that photo. Try a JPG, PNG or WebP image.'},{status:400});}
}
