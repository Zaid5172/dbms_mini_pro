import './globals.css';
import Nav from '@/components/Nav';
export const metadata={title:'Parkwise | Smart Parking',description:'Smart campus parking and incident management'};
export default function Layout({children}){return <html lang="en"><body><Nav/><main>{children}</main><footer>Parkwise · Smart Parking & Incident Management · DBMS Level 3</footer></body></html>;}
