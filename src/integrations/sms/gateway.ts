// src/integrations/sms/gateway.ts
// Real delivery logic moved to Cloud Functions for security.
// This client-side helper now just triggers a function if needed, 
// or provides a stub for local logging.

export async function sendSMS(to: string, body: string) {
    console.log("[SMS Stub] Request to send:", { to, body });
    // In production, we would call an onCall function like 'sendSmsTrigger'
    return { success: true, message: 'Request logged' };
}

export async function sendUSSD(to: string, menu: string) {
    console.log("[USSD Stub] Request to push:", { to, menu });
    return { success: true };
}
