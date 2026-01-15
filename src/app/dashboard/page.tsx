"use client";

import React, { useState } from 'react';
import { ActiveCaseList, CaseSummary } from '../../components/dashboard/ActiveCaseList';
import { Button } from '../../components/ui/button';
import { Users } from 'lucide-react';

const MOCK_CASES: CaseSummary[] = [
    { id: 'c1', studentName: 'Alex Thompson', upn: 'A12345678', status: 'assessment', currentWeek: 8, isOverdue: false, nextAction: 'Review School Advice' },
    { id: 'c2', studentName: 'Sarah Jenkins', upn: 'B98765432', status: 'drafting', currentWeek: 15, isOverdue: false, nextAction: 'Generate Draft Plan' },
    { id: 'c3', studentName: 'Michael Chen', upn: 'C45678912', status: 'consultation', currentWeek: 18, isOverdue: false, nextAction: 'Finalize Consultation Log' },
    { id: 'c4', studentName: 'Emma Watts', upn: 'D78912345', status: 'assessment', currentWeek: 13, isOverdue: true, nextAction: 'Chase Social Care' },
    { id: 'c5', studentName: 'Liam O\'Connor', upn: 'E15975346', status: 'final', currentWeek: 20, isOverdue: false, nextAction: 'Issue Final Plan' },
    { id: 'case-a-jeffery', studentName: 'XX Jeffery', upn: 'Z12345678', status: 'drafting', currentWeek: 14, isOverdue: false, nextAction: 'Draft Provision Plan' },
    { id: 'case-c-smith', studentName: 'Sarah Smith', upn: 'S12345678', status: 'assessment', currentWeek: 22, isOverdue: true, nextAction: 'CRITICAL: Issue Plan' },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <ActiveCaseList cases={MOCK_CASES} />
        </div>
    );
}
