import * as nodemailer from 'nodemailer';
import { onDocumentCreated } from "firebase-functions/v2/firestore";

// Interface for email options
interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
}

/**
 * MindKindler Email Service
 * 
 * Uses Nodemailer with SMTP transport.
 * Credentials should be stored in Google Cloud Secret Manager or Firebase Config.
 */
export const emailService = {
    async send(options: EmailOptions): Promise<boolean> {
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || "587");
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;

        if (host && user && pass) {
            try {
                const transporter = nodemailer.createTransport({
                    host: host,
                    port: port,
                    secure: port === 465, // true for 465, false for other ports
                    auth: {
                        user: user,
                        pass: pass,
                    },
                });

                await transporter.sendMail({
                    from: process.env.SMTP_FROM || '"MindKindler" <noreply@mindkindler.com>',
                    to: options.to,
                    subject: options.subject,
                    text: options.text,
                    html: options.html,
                    attachments: options.attachments,
                });

                console.log(`[Email Service] Sent email to ${options.to}`);
                return true;
            } catch (error) {
                console.error("[Email Service] Failed to send email via SMTP", error);
                // Fallback to logging for debugging if SMTP fails, or rethrow?
                // For now, let's log and rethrow so the queue processor knows it failed.
                throw error;
            }
        } else {
             // Fallback for Development/MVP if env vars missing
             console.log(`
             >>> [OUTBOUND EMAIL (MOCK)] >>>
             To: ${options.to}
             Subject: ${options.subject}
             Content-Length: ${options.html?.length || options.text?.length}
             <<< [END EMAIL] <<<
             `);
     
             // Simulate success
             return true;
        }
    }
};

/**
 * Cloud Function Trigger: onEmailQueue
 * Listens for new documents in 'mail_queue' collection to send asynchronously.
 */
export const processEmailQueue = onDocumentCreated({
    document: "mail_queue/{emailId}",
    region: "europe-west3"
}, async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();
    if (!data) return;

    // Avoid infinite loops or reprocessing if already sent/error (though onDocumentCreated usually only triggers once)
    if (data.status === 'sent' || data.status === 'error') return;

    try {
        await emailService.send({
            to: data.to,
            subject: data.subject,
            html: data.html,
            text: data.text
        });

        await snap.ref.update({
            status: 'sent',
            sentAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error(`Failed to send email ${event.params.emailId}`, error);
        await snap.ref.update({
            status: 'error',
            error: error.message
        });
    }
});
