// import * as nodemailer from 'nodemailer'; // Uncomment when configuring SMTP
import * as functions from 'firebase-functions';

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
        // In production, use:
        // const host = process.env.SMTP_HOST;
        // const user = process.env.SMTP_USER;
        // const pass = process.env.SMTP_PASS;
        
        // Fallback for Development/MVP if env vars missing
        // const transporter = nodemailer.createTransport({
        //     host: process.env.SMTP_HOST || "smtp.sendgrid.net",
        //     port: 587,
        //     secure: false, // true for 465, false for other ports
        //     auth: {
        //         user: process.env.SMTP_USER || "apikey", 
        //         pass: process.env.SMTP_PASS || "mock_key", 
        //     },
        // });

        // For MVP without live credentials, we log the attempt.
        // Once SMTP_HOST/USER/PASS are set in .env or secrets, uncomment the transporter logic.
        
        console.log(`
        >>> [OUTBOUND EMAIL] >>>
        To: ${options.to}
        Subject: ${options.subject}
        Content-Length: ${options.html?.length || options.text?.length}
        <<< [END EMAIL] <<<
        `);

        // Simulate success
        return true;
    }
};

/**
 * Cloud Function Trigger: onEmailQueue
 * Listens for new documents in 'mail_queue' collection to send asynchronously.
 */
export const processEmailQueue = functions.firestore
    .document('mail_queue/{emailId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        if (!data) return;

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
            console.error(`Failed to send email ${context.params.emailId}`, error);
            await snap.ref.update({
                status: 'error',
                error: error.message
            });
        }
    });
