// src/app/dashboard/marketplace/success/page.tsx
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { verifyPurchaseAction } from '@/app/actions/verify-purchase';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    
    const sessionId = searchParams.get('session_id');
    const packId = searchParams.get('packId');
    
    const [status, setStatus] = useState('verifying'); // verifying, success, error

    useEffect(() => {
        if (!user || !sessionId || status !== 'verifying') return;

        async function verify() {
            try {
                // Pass optional user.uid as backup if metadata missing
                const result = await verifyPurchaseAction(sessionId!, user!.tenantId!, packId || undefined, user!.uid);
                if (result.success) {
                    setStatus('success');
                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                    setTimeout(() => router.push('/dashboard/marketplace/installed'), 2500);
                } else {
                    console.error("Purchase Verification Failed:", result.error);
                    setStatus('error');
                }
            } catch (e) {
                console.error("Verification Error:", e);
                setStatus('error');
            }
        }
        verify();
    }, [user, sessionId, packId]);

    return (
        <Card className="w-[400px] shadow-lg border-t-4 border-t-indigo-600">
            <CardContent className="pt-6 flex flex-col items-center text-center p-8">
                {status === 'verifying' && (
                    <>
                        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-slate-800">Finalizing Setup...</h2>
                        <p className="text-slate-500 text-sm mt-2">Verifying payment and provisioning resources.</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4 animate-in zoom-in" />
                        <h2 className="text-xl font-bold text-slate-800">Pack Installed!</h2>
                        <p className="text-slate-500 text-sm mt-2">Redirecting to your installed apps...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600 font-bold text-xl">!</div>
                        <h2 className="text-xl font-bold text-red-900">Verification Failed</h2>
                        <p className="text-slate-500 text-sm mt-2">We couldn't confirm the transaction automatically.</p>
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => router.push('/dashboard/marketplace')} className="text-sm text-slate-600 hover:underline">Return to Store</button>
                            <button onClick={() => window.location.reload()} className="text-sm font-semibold text-indigo-600 hover:underline">Try Again</button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function SuccessPage() {
    return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <Suspense fallback={<Loader2 className="animate-spin" />}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
