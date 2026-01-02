// src/components/student360/QuickActionsBar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, FileInput, Stethoscope } from "lucide-react";
import { useTranslation } from "@/i18n/provider";

interface QuickActionsProps {
    onLogNote: () => void;
    onStartSession: () => void;
    onUpload: () => void;
    onMessage: () => void;
}

export function QuickActionsBar({ onLogNote, onStartSession, onUpload, onMessage }: QuickActionsProps) {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-4 gap-2 mb-6" role="group" aria-label={t('student360.actions.actions')}>
            <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1 border-dashed border-2 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 dark:hover:bg-indigo-950 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500" 
                onClick={onStartSession}
                aria-label={t('student360.actions.session')}
            >
                <Stethoscope className="h-6 w-6" aria-hidden="true" />
                <span className="text-[10px] font-semibold">{t('student360.actions.session')}</span>
            </Button>
            <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1 border-dashed border-2 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 dark:hover:bg-emerald-950 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500" 
                onClick={onLogNote}
                aria-label={t('student360.actions.logNote')}
            >
                <Plus className="h-6 w-6" aria-hidden="true" />
                <span className="text-[10px] font-semibold">{t('student360.actions.logNote')}</span>
            </Button>
            <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1 border-dashed border-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-blue-950 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500" 
                onClick={onUpload}
                aria-label={t('student360.actions.upload')}
            >
                <FileInput className="h-6 w-6" aria-hidden="true" />
                <span className="text-[10px] font-semibold">{t('student360.actions.upload')}</span>
            </Button>
            <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1 border-dashed border-2 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 dark:hover:bg-amber-950 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500" 
                onClick={onMessage}
                aria-label={t('student360.actions.message')}
            >
                <MessageCircle className="h-6 w-6" aria-hidden="true" />
                <span className="text-[10px] font-semibold">{t('student360.actions.message')}</span>
            </Button>
        </div>
    );
}
