import { BasketItem, Product, OrderDetails, money, priceOf } from './types';
export function resolveBasket(basket:BasketItem[], products:Product[]) {
 return basket.flatMap(item=>{ const product=products.find(p=>p.id===item.productId && p.available); const variant=product?.variants.find(v=>v.id===item.variantId); return product && variant && Number.isInteger(item.quantity) && item.quantity>0 && item.quantity<=99 ? [{...item,product,variant,total:priceOf(variant)*item.quantity}]:[]; });
}
export function singaporeToday() { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export function orderMessage(basket:BasketItem[],products:Product[],details:OrderDetails) {
 const lines=resolveBasket(basket,products); const subtotal=lines.reduce((s,i)=>s+i.total,0);
 return ["Hello Mama Ong! I'd like to enquire about an order.",`Name: ${details.name.trim()}`,'',...lines.map(i=>`${i.quantity} × ${i.product.name} — ${i.variant.label} (${money(priceOf(i.variant))} each) = ${money(i.total)}`),'',`Items subtotal: ${money(subtotal)}`,details.method==='collection'?'Self-collection: Pasir Ris (free)':'Delivery: fee to be confirmed; not included in subtotal',`Preferred date: ${details.date} (subject to availability)`,details.method==='delivery'?`Delivery area / postal code: ${details.address.trim()}`:'',details.notes.trim()?`Notes / dietary questions: ${details.notes.trim()}`:'','Please confirm availability, collection/delivery arrangements, and the final amount. I understand this is an enquiry, and payment will be arranged in chat.'].filter(s=>s!==undefined).join('\n');
}
export const whatsappLink = (message:string) => `https://wa.me/6592301768?text=${encodeURIComponent(message)}`;
