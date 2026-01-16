// src/lib/security/link-manager.ts (UPDATED)

import { FeedbackSession } from '../../types/feedback';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

export class LinkManager {
    
    async generateReviewLink(
        caseId: string, 
        reportId: string, 
        email: string, 
        role: string
    ): Promise<string> {
        
        const generateFn = httpsCallable(functions, 'generateSecureLink');
        const result = await generateFn({ caseId, reportId, email, role });
        const data = result.data as any;
        return data.url;
    }

    async validateSession(token: string): Promise<FeedbackSession> {
        const validateFn = httpsCallable(functions, 'validateSecureLink');
        const result = await validateFn({ token });
        const data = result.data as any;
        
        return data.session as FeedbackSession;
    }
}
