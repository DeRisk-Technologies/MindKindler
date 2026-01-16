import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from './use-auth';
import { Appointment } from '@/types/schema';

export function useAppointments(startDate: Date, endDate: Date) {
    const { user, userProfile } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !userProfile?.tenantId) return;

        async function subscribe() {
            setLoading(true);
            try {
                // Ensure we connect to the correct regional shard
                const db = getRegionalDb(userProfile?.metadata?.region || 'uk');
                
                // Firestore queries need consistent types. Convert dates to ISO strings or Timestamps depending on your schema.
                // Assuming schema stores 'startAt' as ISO String for easier querying in this context, 
                // OR Timestamp. Let's assume ISO String based on typical patterns seen.
                
                const q = query(
                    collection(db, 'appointments'),
                    where('tenantId', '==', userProfile?.tenantId),
                    where('startAt', '>=', startDate.toISOString()),
                    where('startAt', '<=', endDate.toISOString())
                );

                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const data = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Appointment));
                    setAppointments(data);
                    setLoading(false);
                });

                return unsubscribe;
            } catch (error) {
                console.error("Failed to fetch appointments:", error);
                setLoading(false);
            }
        }

        const unsubPromise = subscribe();
        return () => { unsubPromise.then(unsub => unsub && unsub()); };

    }, [user, userProfile, startDate, endDate]);

    return { appointments, loading };
}
