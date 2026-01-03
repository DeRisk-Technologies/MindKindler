// src/services/scheduling/calendar-service.ts
import { db } from '@/lib/firebase';
import { 
    collection, query, where, getDocs, addDoc, 
    updateDoc, doc, Timestamp, runTransaction 
} from 'firebase/firestore';
import { AvailabilitySlot, Appointment } from '@/types/schema';
import { addMinutes, parseISO, format, isWithinInterval } from 'date-fns';

export class CalendarService {
    private static APPOINTMENTS_COL = 'appointments';
    private static AVAILABILITY_COL = 'availability_slots';

    /**
     * Create an appointment with collision detection and optional consent check.
     */
    static async createAppointment(
        tenantId: string, 
        data: Omit<Appointment, 'id' | 'createdAt' | 'remindersSent' | 'syncStatus'>
    ): Promise<string> {
        // 1. Collision Check
        const collision = await this.checkCollision(data.hostUserId, data.startAt, data.endAt);
        if (collision) {
            throw new Error(`Time slot overlap with appointment: ${collision.id}`);
        }

        // 2. Telehealth Consent Check (Mocked for now, real implementation checks ConsentRecord)
        if (data.type === 'telehealth' && !data.recordingConsent) {
            console.warn("Booking telehealth without explicit recording consent.");
            // In strict mode, we might throw here or flag it.
        }

        // 3. Create
        const docRef = await addDoc(collection(db, this.APPOINTMENTS_COL), {
            ...data,
            tenantId,
            status: 'scheduled',
            remindersSent: false,
            syncStatus: 'pending',
            createdAt: new Date().toISOString()
        });

        return docRef.id;
    }

    /**
     * Check if a time range overlaps with existing appointments for a host.
     */
    static async checkCollision(hostId: string, startIso: string, endIso: string): Promise<Appointment | null> {
        const q = query(
            collection(db, this.APPOINTMENTS_COL),
            where('hostUserId', '==', hostId),
            where('status', 'in', ['scheduled', 'completed'])
        );
        
        // Firestore doesn't support sophisticated range queries easily on string ISOs without inequalities
        // Standard pattern: fetch range-relevant docs or all future docs and filter in memory if volume is low-ish.
        // Optimized: Store timestamp objects and use range queries.
        
        const snapshot = await getDocs(q);
        const requestedStart = new Date(startIso).getTime();
        const requestedEnd = new Date(endIso).getTime();

        for (const d of snapshot.docs) {
            const appt = d.data() as Appointment;
            const existingStart = new Date(appt.startAt).getTime();
            const existingEnd = new Date(appt.endAt).getTime();

            // Overlap logic: (StartA < EndB) and (EndA > StartB)
            if (requestedStart < existingEnd && requestedEnd > existingStart) {
                return { ...appt, id: d.id };
            }
        }
        return null;
    }

    /**
     * Fetch available slots for a user within a date range based on Availability settings.
     * This merges "Working Hours" with "Busy Appointments".
     */
    static async getAvailableSlots(
        userId: string, 
        startDate: Date, 
        endDate: Date,
        durationMinutes: number = 30
    ): Promise<Date[]> {
        // 1. Get Availability Patterns
        const availSnap = await getDocs(query(collection(db, this.AVAILABILITY_COL), where('userId', '==', userId)));
        const slotsDef = availSnap.docs.map(d => d.data() as AvailabilitySlot);

        // 2. Get Existing Appointments
        // Simplified query for prototype
        const apptSnap = await getDocs(query(collection(db, this.APPOINTMENTS_COL), where('hostUserId', '==', userId)));
        const appointments = apptSnap.docs.map(d => d.data() as Appointment);

        const availableStartTimes: Date[] = [];

        // 3. Brute-force simulation (Robust implementation uses an Interval Tree)
        // Iterate every N minutes from start to end
        let cursor = new Date(startDate);
        while (cursor < endDate) {
            const slotEnd = addMinutes(cursor, durationMinutes);
            
            // Is this within working hours?
            const dayOfWeek = cursor.getDay();
            const pattern = slotsDef.find(s => s.dayOfWeek === dayOfWeek); // Very basic
            
            if (pattern) {
                // Parse pattern times "09:00" -> Today's date with 09:00
                // Check if cursor is inside pattern window
                // Check if cursor overlaps with any appointment
                
                const isBlocked = appointments.some(appt => {
                    const aStart = new Date(appt.startAt);
                    const aEnd = new Date(appt.endAt);
                    return (cursor.getTime() < aEnd.getTime() && slotEnd.getTime() > aStart.getTime());
                });

                if (!isBlocked) {
                    availableStartTimes.push(new Date(cursor));
                }
            }

            cursor = addMinutes(cursor, 30); // Step
        }

        return availableStartTimes;
    }
}
