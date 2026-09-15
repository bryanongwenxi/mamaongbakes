import Storefront from '@/components/storefront';
import { getCatalog } from '@/lib/store';
export const dynamic='force-dynamic';
export default async function Page(){try{const {products}=await getCatalog();return <Storefront initialProducts={products}/>;}catch{return <main className="error-page"><h1>The kitchen will be right with you.</h1><p>We’re having trouble loading today’s menu. Please try again, or ask us on WhatsApp.</p><a href="https://wa.me/6592301768" className="button">Chat with us</a></main>;}}
