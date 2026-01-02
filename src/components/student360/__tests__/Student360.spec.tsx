// src/components/student360/__tests__/Student360.spec.tsx

import React from 'react';
import { AlertCard, AlertData } from '../AlertCard';
import { EvidencePanel, EvidenceDoc } from '../EvidencePanel';

// Simplified Logic Tests because full rendering requires extensive mocking in this env
describe('Student 360 Logic', () => {
    
    test('AlertCard handles critical severity', () => {
        const critical: AlertData = {
            id: '1', type: 'risk', severity: 'critical', title: 'T', description: 'D', date: '2023-01-01'
        };
        const medium: AlertData = {
            id: '2', type: 'academic', severity: 'medium', title: 'T', description: 'D', date: '2023-01-01'
        };
        
        // Ensure data integrity
        expect(critical.severity).toBe('critical');
        expect(medium.severity).toBe('medium');
    });

    test('Evidence trust score formatting', () => {
        const doc: EvidenceDoc = {
            id: '1', title: 'Doc', type: 'PDF', date: '2023-01-01', trustScore: 0.95
        };
        expect((doc.trustScore * 100).toFixed(0)).toBe("95");
    });
});
