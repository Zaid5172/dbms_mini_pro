'use client';
import {useEffect,useState} from 'react';
export async function api(path,method='GET',data){
 const res=await fetch('/api'+path,{method,headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined});
 const json=await res.json();if(!res.ok){if(res.status===401&&location.pathname!='/login')location.assign('/login');throw Error(json.error||'Request failed.');}return json;
}
export function useLoad(path){
 const [data,setData]=useState(null),[error,setError]=useState('');
 const load=async()=>{try{setData(await api(path));setError('');}catch(e){setError(e.message);}};
 useEffect(()=>{load();},[path]);return {data,error,load};
}
export function Notice({error,message}){return <>{error&&<p role="alert" className="alert alert-error">{error}</p>}{message&&<p role="status" className="alert alert-success">{message}</p>}</>;}
