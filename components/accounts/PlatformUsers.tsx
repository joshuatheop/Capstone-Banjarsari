'use client';
import { useCallback, useEffect, useState } from 'react';
import { accountFetch } from '@/lib/account-client';
import styles from './accounts.module.css';
interface UserRow { uid:string; name:string; email:string; roles:string[]; sellerStatus:string; disabled:boolean }
export default function PlatformUsers() {
  const [users,setUsers]=useState<UserRow[]>([]),[token,setToken]=useState<string|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const load=useCallback(async(page?:string)=>{setLoading(true);setError('');try{const response=await accountFetch('/api/super-admin/users'+(page?'?pageToken='+encodeURIComponent(page):'')),body=await response.json();if(!response.ok)throw new Error(body.error);setUsers(body.users);setToken(body.nextPageToken);}catch(reason){setError(reason instanceof Error?reason.message:'Pengguna gagal dimuat.');}finally{setLoading(false);}},[]);
  useEffect(()=>{const timer=setTimeout(()=>void load(),0);return()=>clearTimeout(timer);},[load]);
  return <main className={styles.page}><h1>Pengguna platform</h1><p>Customer tetap dapat berbelanja setelah menjadi seller. Role akses dikelola server; profil bukan sumber otorisasi.</p>{error&&<p className={styles.error} role="alert">{error}</p>}{loading?<p role="status">Memuat pengguna…</p>:<div className={styles.tableWrap} tabIndex={0}><table><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Seller</th><th>Akun</th></tr></thead><tbody>{users.map(user=><tr key={user.uid}><td>{user.name}</td><td>{user.email}</td><td>{user.roles.join(', ')}</td><td>{user.sellerStatus}</td><td>{user.disabled?'Disabled':'Aktif'}</td></tr>)}</tbody></table></div>}<div className={styles.actions}><button className={styles.secondary} disabled={loading} onClick={()=>load()}>Halaman pertama / refresh</button>{token&&<button className={styles.primary} disabled={loading} onClick={()=>load(token)}>Berikutnya</button>}</div></main>;
}
