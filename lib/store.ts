import postgres from 'postgres';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { seedProducts } from './seed';
import type { Product } from './types';
const url=process.env.DATABASE_URL;
const sql=url?postgres(url,{max:3,idle_timeout:20,connect_timeout:10,ssl:'require'}):null;
const local=path.join(process.cwd(),'.local');
export const storageReady=()=>Boolean(sql)||process.env.NODE_ENV!=='production';
let initialization:Promise<void>|undefined;
async function init(){ if(!sql)return; if(!initialization)initialization=(async()=>{
 await sql`CREATE TABLE IF NOT EXISTS mob_catalog (id integer PRIMARY KEY, revision integer NOT NULL, products jsonb NOT NULL)`;
 await sql`CREATE TABLE IF NOT EXISTS mob_images (id text PRIMARY KEY, data bytea NOT NULL, type text NOT NULL)`;
 await sql`INSERT INTO mob_catalog (id,revision,products) VALUES (1,1,${sql.json(seedProducts)}) ON CONFLICT DO NOTHING`;
 })().catch(e=>{initialization=undefined;throw e}); await initialization; }
export type Catalog={revision:number;products:Product[]};
export async function getCatalog():Promise<Catalog>{
 if(sql){await init();const [row]=await sql`SELECT revision,products FROM mob_catalog WHERE id=1`;return {revision:row.revision,products:row.products};}
 if(process.env.NODE_ENV==='production')return {revision:1,products:seedProducts};
 try{return JSON.parse(await fs.readFile(path.join(local,'catalog.json'),'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;return {revision:1,products:seedProducts};}
}
let writeQueue=Promise.resolve();
export async function saveCatalog(products:Product[],revision:number){
 if(!storageReady())throw Error('Connect a Postgres database before saving the menu.');
 if(sql){await init();const rows=await sql`UPDATE mob_catalog SET products=${sql.json(products)},revision=revision+1 WHERE id=1 AND revision=${revision} RETURNING revision`;if(!rows.length)throw Error('The menu changed in another window. Refresh before saving.');return rows[0].revision as number;}
 let next=0;const operation=writeQueue.then(async()=>{const current=await getCatalog();if(current.revision!==revision)throw Error('The menu changed in another window. Refresh before saving.');next=revision+1;await fs.mkdir(local,{recursive:true});await fs.writeFile(path.join(local,'catalog.tmp'),JSON.stringify({revision:next,products}));await fs.rename(path.join(local,'catalog.tmp'),path.join(local,'catalog.json'));});writeQueue=operation.catch(()=>{});await operation;return next;
}
export async function saveImage(id:string,data:Buffer,type:string){if(!storageReady())throw Error('Storage is not connected.');if(sql){await init();await sql`INSERT INTO mob_images (id,data,type) VALUES (${id},${data},${type})`;return;}await fs.mkdir(path.join(local,'images'),{recursive:true});await fs.writeFile(path.join(local,'images',id),data);}
export async function readImage(id:string){if(sql){await init();const [image]=await sql`SELECT data,type FROM mob_images WHERE id=${id}`;return image ? {data:Buffer.from(image.data),type:image.type as string}:null;}try{return {data:await fs.readFile(path.join(local,'images',id)),type:'image/webp'};}catch{return null;}}
