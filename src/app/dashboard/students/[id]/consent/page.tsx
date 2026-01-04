"use client";

import React from 'react';
import { ConsentManager } from '@/components/student360/consent/ConsentManager';
import { useToast } from '@/hooks/use-toast';

export default function StudentConsentPage({ params }: { params: { id: string } }) {
    const { toast } = useToast();
    
    // In real app, fetch consents from Firestore
    const mockConsents: any[] = [
        { category: 'education_share', status: 'granted', grantedAt: '2023-01-01' }
    ];

    const handleSave = (updates: any[]) => {
        console.log("Saving consents:", updates);
        toast({
            title: "Consent Updated",
            description: "Permissions have been logged to the audit trail."
        });
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Privacy & Consent</h1>
            <ConsentManager 
                studentId={params.id}
                consents={mockConsents}
                onSave={handleSave}
            />
        </div>
    );
}
