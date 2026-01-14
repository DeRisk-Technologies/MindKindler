// src/components/ui/empty-state.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="outline" className="bg-white hover:bg-slate-50">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
