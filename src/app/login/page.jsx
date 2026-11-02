'use client';
import {useState} from 'react';
import {api,Notice} from '@/components/client';
export default function Login(){const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e){e.preventDefault();setBusy(true);try{await api('/auth/login','POST',Object.fromEntries(new FormData(e.target)));location.assign('/');}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <section className="login card"><span className="eyebrow">WELCOME TO PARKWISE</span><h2>Good parking starts here.</h2><p>Sign in to reserve a space, manage your stays, or report an incident.</p><Notice error={error}/><form onSubmit={submit}><label>Email<input name="email" type="email" required autoComplete="username"/></label><label>Password<input name="password" type="password" required maxLength={200} autoComplete="current-password"/></label><button disabled={busy}>{busy?'Signing in…':'Sign in'}</button></form><small>Demo accounts: customer@parking.local and staff@parking.local. Use the passwords configured during setup.</small></section>;
}
