// src/services/copilot-service.ts
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { BotSession } from '@/types/schema';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: any[];
    createdAt: any;
}

export class CopilotService {
    
    /**
     * Send message to AI Copilot via Secure Cloud Function.
     */
    static async sendMessage(
        message: string, 
        contextMode: 'general' | 'student' | 'case',
        contextId?: string,
        sessionId?: string
    ): Promise<{ sessionId: string, message: ChatMessage }> {
        const functions = getFunctions();
        const chatWithCopilot = httpsCallable(functions, 'chatWithCopilot');
        
        try {
            const result = await chatWithCopilot({ 
                message, 
                sessionId, 
                contextMode, 
                contextId 
            });
            
            const data = result.data as any;
            return {
                sessionId: data.sessionId,
                message: {
                    id: data.message.id,
                    role: data.message.role,
                    content: data.message.text,
                    citations: data.message.citations,
                    createdAt: new Date() // Approximate, real time is in Firestore
                }
            };
        } catch (error) {
            console.error("Copilot Error:", error);
            throw error;
        }
    }

    /**
     * Subscribe to messages in a specific session.
     */
    static subscribeToMessages(sessionId: string, callback: (messages: ChatMessage[]) => void) {
        const q = query(
            collection(db, 'bot_sessions', sessionId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ChatMessage[];
            callback(msgs);
        });
    }

    /**
     * List recent sessions for the sidebar.
     */
    static async getSessions(userId: string): Promise<BotSession[]> {
        const q = query(
            collection(db, 'bot_sessions'),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as BotSession[];
    }
}
