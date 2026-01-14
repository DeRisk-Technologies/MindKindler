// src/app/portal/contribute/[requestId]/page.tsx

import React from 'react';
import { notFound } from 'next/navigation';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { verifyPortalToken } from '@/app/actions/portal';
import { ContributionForm } from '@/components/portal/ContributionForm';

// Force dynamic since we read searchParams
export const dynamic = 'force-dynamic';

export default async function ContributionPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ requestId: string }>; 
    searchParams: Promise<{ token: string }>;
}) {
    const { requestId } = await params;
    const { token } = await searchParams;

    if (!requestId || !token) {
        return <InvalidLinkMessage reason="Missing ID or Token" />;
    }

    // Server-side verification
    const verification = await verifyPortalToken(requestId, token);

    if (!verification.valid || !verification.data) {
        return <InvalidLinkMessage reason={verification.error || "Access Denied"} />;
    }

    const request = verification.data;

    // Mask name for privacy (e.g. "John D.")
    const nameParts = request.studentName.split(' ');
    const maskedName = nameParts.length > 1 
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.` 
        : request.studentName;

    return (
        <Card className="bg-white shadow-lg border-t-4 border-t-indigo-600">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl text-slate-800">
                    {request.type === 'parent_view' ? 'Parent Contribution' : 'Professional Advice'}
                </CardTitle>
                <CardDescription>
                    Providing views for <span className="font-semibold text-slate-900">{maskedName}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ContributionForm 
                    requestId={requestId}
                    token={token}
                    type={request.type}
                    recipientRole={request.recipientRole}
                />
            </CardContent>
        </Card>
    );
}

function InvalidLinkMessage({ reason }: { reason: string }) {
    return (
        <Card className="border-red-100 shadow-sm max-w-md w-full">
            <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-red-900">Link Expired or Invalid</CardTitle>
                <CardDescription>
                    {reason}. This link is time-sensitive for security.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-slate-500">
                Please contact the Educational Psychologist or School SENCO to request a new secure link.
            </CardContent>
        </Card>
    );
}
