// src/components/dashboard/PilotBanner.tsx
"use client";

import React, { useState } from 'react';
import { X, Server, Database } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function PilotBanner() {
    const { user } = useAuth();
    const [visible, setVisible] = useState(true);

    // Don't show if not logged in or dismissed
    if (!visible || !user) return null;

    const regionLabel = user.region === 'uk' ? 'London (UK)' 
                      : user.region === 'us' ? 'Iowa (US)' 
                      : user.region === 'eu' ? 'Frankfurt (EU)'
                      : 'Global Default';

    return (
        <div className="bg-slate-900 text-white text-xs py-1.5 px-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-600 rounded text-[10px] font-bold uppercase tracking-wider">
                    Pilot RC 1.0
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
                    <Database className="h-3 w-3" />
                    <span>Data Residency: <strong className="text-white">{regionLabel}</strong></span>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <span className="text-slate-400 hidden md:inline">Support: pilot-help@mindkindler.com</span>
                <button 
                    onClick={() => setVisible(false)} 
                    className="text-slate-400 hover:text-white transition-colors"
                    aria-label="Dismiss banner"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}
