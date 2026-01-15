"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NewCasePage() {
    const router = useRouter();

    useEffect(() => {
        // In a real app, this would call an API to create a blank Case record
        // const newId = await createCase({ status: 'intake' });
        
        // For the Pilot, we generate a random ID and start the Intake Wizard
        const randomId = `case-${Date.now()}`;
        
        // Redirect to the Intake Wizard for this new case
        router.replace(`/dashboard/case/${randomId}/intake`);
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-500 font-medium">Initializing new case file...</p>
        </div>
    );
}
