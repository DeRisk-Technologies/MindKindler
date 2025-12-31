// src/integrations/sms/gateway.ts

export interface SMSPayload {
    to: string;
    message: string;
}

export async function sendSMS(payload: SMSPayload): Promise<boolean> {
    console.log(`[SMS Gateway Mock] Sending to ${payload.to}: ${payload.message}`);
    // Simulate latency
    await new Promise(r => setTimeout(r, 800));
    return true; // Simulate success
}

export async function sendUSSD(payload: { to: string, menu: any }): Promise<boolean> {
    console.log(`[USSD Gateway Mock] Pushing menu to ${payload.to}`);
    await new Promise(r => setTimeout(r, 800));
    return true;
}
