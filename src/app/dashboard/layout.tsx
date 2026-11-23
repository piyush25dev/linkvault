'use client';
import { useEffect } from 'react'; import { useRouter } from 'next/navigation'; import { Loader } from '@/components/common/Loader'; import { useAuth } from '@/context/AuthContext';
export default function Layout({children}:{children:React.ReactNode}){const {user,loading}=useAuth();const router=useRouter();useEffect(()=>{if(!loading&&!user)router.replace('/login')},[loading,user,router]);if(loading||!user)return <Loader fullScreen label="Loading your vault…" />;return children;}
