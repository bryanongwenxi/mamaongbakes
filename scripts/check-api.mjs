import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://localhost:3107';
const password=await fs.readFile('.local/dev-password','utf8');
const response=await fetch(base+'/api/admin/session',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({password})});assert.equal(response.status,200,await response.text());
const cookie=response.headers.get('set-cookie').split(';')[0];const headers={Origin:base,'Content-Type':'application/json',Cookie:cookie};
const original=await (await fetch(base+'/api/catalog')).json();
let current=original;
const write=async(products,revision=current.revision)=>{const r=await fetch(base+'/api/admin/products',{method:'PUT',headers,body:JSON.stringify({products,revision})});return {status:r.status,body:await r.json()};};
try{
 const denied=await fetch(base+'/api/admin/products',{method:'PUT',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(original)});assert.equal(denied.status,401);
 const csrf=await fetch(base+'/api/admin/products',{method:'PUT',headers:{...headers,Origin:'https://wrong.example'},body:JSON.stringify(original)});assert.equal(csrf.status,401);
 const next=structuredClone(original.products);next[0].variants[0].salePrice=4200;
 let saved=await write(next);assert.equal(saved.status,200);current=saved.body;assert.equal(current.products[0].variants[0].salePrice,4200);
 assert.equal((await write(next,original.revision)).status,409);
 const form=new FormData();form.set('photo',new File([await fs.readFile('public/images/kuehsalat.jpg')],'cake.jpg',{type:'image/jpeg'}));const photo=await fetch(base+'/api/admin/products',{method:'POST',headers:{Origin:base,Cookie:cookie},body:form});assert.equal(photo.status,200);const image=await photo.json();assert.match(image.image,/^\/api\/images\//);const loaded=await fetch(base+image.image);assert.equal(loaded.headers.get('content-type'),'image/webp');assert.equal(loaded.status,200);
 const fake={...structuredClone(next[0]),id:'temporary-test-bake',name:'API test bake',image:image.image};saved=await write([...current.products,fake]);assert.equal(saved.status,200);current=saved.body;
 saved=await write(current.products.filter(p=>p.id!==fake.id));assert.equal(saved.status,200);current=saved.body;
 console.log('PASS: login, authorization, CSRF, persistent offer update, edit conflict, photo upload/read, add and remove.');
}finally{const restore=await write(original.products);assert.equal(restore.status,200);await fetch(base+'/api/admin/session',{method:'DELETE',headers});}
