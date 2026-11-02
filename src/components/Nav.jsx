'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {api} from './client';
export default function Nav(){const path=usePathname();return <header><div className="header-container"><Link className="brand" href="/"><span className="brand-icon">P</span>Parkwise<span className="brand-tag">CAMPUS PARKING</span></Link><nav aria-label="Main navigation">{[['/','Overview'],['/parking','Parking'],['/incidents','Incidents'],['/analytics','Analytics']].map(([url,label])=><Link key={url} href={url} aria-current={path===url?'page':undefined}>{label}</Link>)}{path!=='/login'&&<button className="subtle" onClick={async()=>{try{await api('/auth/logout','POST');location.assign('/login');}catch{location.assign('/login');}}}>Sign out</button>}</nav></div></header>;}
