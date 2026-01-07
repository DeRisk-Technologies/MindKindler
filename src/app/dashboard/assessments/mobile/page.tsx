// src/app/dashboard/observations/mobile/page.tsx

"use client";

import React from 'react';
import { ObservationMode } from '@/components/assessments/ObservationMode';
import { RouteGuard } from '@/components/auth/RouteGuard';

export default function MobileObservationPage() {
    return (
        <RouteGuard>
            <ObservationMode />
        </RouteGuard>
    );
}
