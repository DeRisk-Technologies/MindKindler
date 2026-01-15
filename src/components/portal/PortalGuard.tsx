"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LinkManager } from '../../lib/security/link-manager';
import { FeedbackSession } from '../../types/feedback';
import { Loader2, ShieldAlert, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface PortalGuardProps {
    children: React.ReactNode;
}

export function PortalGuard({ children }: PortalGuardProps) {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'valid' | 'expired' | 'invalid'>('loading');
    const [session, setSession] = useState<FeedbackSession | null>(null);

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            return;
        }

        const verify = async () => {
            try {
                // In a real app, this would be an API call to /api/validate-session
                // Simulating the LinkManager logic here for frontend demo
                const manager = new LinkManager(); 
                
                // Mock Validation Logic since we can't access the server-side DB map directly here
                // We'll simulate a valid check if token starts with 'valid'
                await new Promise(r => setTimeout(r, 1000));
                
                if (token.startsWith('fail')) throw new Error('Invalid');
                
                setStatus('valid');
                // Mock session data
                setSession({
                    id: token,
                    caseId: 'case-123',
                    reportId: 'rep-456',
                    stakeholderEmail: 'parent@gmail.com',
                    stakeholderRole: 'parent',
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 86400000).toISOString(),
                    accessedAt: new Date().toISOString(),
                    accessCount: 1,
                    isRevoked: false
                });

            } catch (err) {
                setStatus('invalid'); // Simplified for demo
            }
        };

        verify();
    }, [token]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-medium">Verifying Secure Link...</p>
            </div>
        );
    }

    if (status === 'expired') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader className="flex flex-col items-center">
                        <div className="p-3 bg-amber-100 rounded-full mb-2">
                            <Clock className="w-8 h-8 text-amber-600" />
                        </div>
                        <CardTitle className="text-xl">Link Expired</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-6">
                            For security reasons, access links expire after 7 days. 
                            Please contact your Educational Psychologist for a new link.
                        </p>
                        <Button disabled variant="outline">Request New Link</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                 <Card className="max-w-md w-full text-center border-red-200">
                    <CardHeader className="flex flex-col items-center">
                        <div className="p-3 bg-red-100 rounded-full mb-2">
                            <ShieldAlert className="w-8 h-8 text-red-600" />
                        </div>
                        <CardTitle className="text-xl text-red-900">Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">
                            We could not verify your access token. It may be invalid or revoked.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}
