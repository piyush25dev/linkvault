import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticate, apiError } from '@/lib/api-auth';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
 const a=await authenticate(request); if(a.response)return a.response;
 try { const {adminDb}=getAdminServices(); const s=await adminDb.collection('users').doc(a.userId!).collection('collections').orderBy('createdAt','desc').get(); return NextResponse.json({collections:s.docs.map(d=>({id:d.id,...d.data()}))}); } catch(e){return apiError(e,'Unable to fetch collections');}
}
export async function POST(request: NextRequest) {
 const a=await authenticate(request); if(a.response)return a.response;
 try { const b=await request.json(); const name=String(b.name||'').trim(); if(!name||name.length>80)return NextResponse.json({error:'Collection name is required (max 80 characters)'},{status:400}); const {adminDb}=getAdminServices(); const r=await adminDb.collection('users').doc(a.userId!).collection('collections').add({name,description:String(b.description||'').slice(0,500),createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()}); return NextResponse.json({id:r.id,message:'Collection created'},{status:201}); }catch(e){return apiError(e,'Unable to create collection');}
}
