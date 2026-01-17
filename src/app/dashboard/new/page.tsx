"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NewCasePage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the new Forensic Intake Wizard
        router.replace(`/dashboard/cases/new`);
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-500 font-medium">Redirecting to Intake Wizard...</p>
        </div>
    );
}
