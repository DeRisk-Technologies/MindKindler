// src/app/portal/layout.tsx
import React from 'react';
import { Logo } from '@/components/logo';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            {/* Header / Branding */}
            <div className="w-full max-w-md flex flex-col items-center mb-8">
                <div className="mb-4">
                    {/* Placeholder for Tenant Logo - In real app, fetch from config */}
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">M</span>
                        </div>
                        <span className="text-xl font-bold text-slate-800">MindKindler</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Badge variant="outline" className="bg-white flex gap-1 items-center font-normal">
                        <Lock className="w-3 h-3" /> Secure Portal
                    </Badge>
                    <span>•</span>
                    <span>End-to-End Encrypted</span>
                </div>
            </div>

            {/* Main Content Card */}
            <main className="w-full max-w-lg">
                {children}
            </main>

            {/* Footer */}
            <footer className="mt-8 text-center text-slate-400 text-xs">
                <p>&copy; {new Date().getFullYear()} MindKindler Secure Systems.</p>
                <p className="mt-1">
                    Powered by <span className="font-semibold text-slate-500">DeRisk Technologies</span>
                </p>
            </footer>
        </div>
    );
}
