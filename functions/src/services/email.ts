// functions/src/services/email.ts
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

// Template Definitions
const TEMPLATES: Record<string, (data: any) => { subject: string, html: string }> = {
    'magic-link-parent': (data) => ({
        subject: `Contribution Request for ${data.studentName}`,
        html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                <div style="background: #4f46e5; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0;">MindKindler Portal</h2>
                </div>
                <div style="padding: 30px;">
                    <h3>Share your views for ${data.studentName}</h3>
                    <p>Hello,</p>
                    <p>The Educational Psychology Service is currently assessing ${data.studentName}. Your views are a vital part of this process.</p>
                    <p>Please click the secure link below to complete the Parent Contribution form (Section A):</p>
                    <br/>
                    <p style="text-align: center;">
                        <a href="${data.link}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Open Secure Portal
                        </a>
                    </p>
                    <br/>
                    <p style="font-size: 14px; color: #666;">This link expires in 7 days. If you did not request this, please ignore this email.</p>
                </div>
            </div>
        `
    }),
    'magic-link-school': (data) => ({
        subject: `Statutory Advice Request: ${data.studentName}`,
        html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                <div style="background: #ea580c; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0;">School Portal</h2>
                </div>
                <div style="padding: 30px;">
                    <h3>Information Request for ${data.studentName}</h3>
                    <p>Dear Colleague,</p>
                    <p>We require updated attainment data, intervention logs, and behavior statistics for the statutory assessment of ${data.studentName}.</p>
                    <p>Please submit your evidence via the secure portal below:</p>
                    <br/>
                    <p style="text-align: center;">
                        <a href="${data.link}" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Submit Professional Advice
                        </a>
                    </p>
                    <br/>
                    <p style="font-size: 14px; color: #666;">Deadline: 2 weeks from receipt.</p>
                </div>
            </div>
        `
    }),
    'consent-request': (data) => ({
        subject: `Action Required: Consent for EP Involvement (${data.studentName})`,
        html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                <div style="background: #16a34a; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0;">Consent Required</h2>
                </div>
                <div style="padding: 30px;">
                    <h3>Educational Psychology Involvement</h3>
                    <p>Hello,</p>
                    <p>Before we can begin working with <strong>${data.studentName}</strong>, we require your legal consent as the person with parental responsibility.</p>
                    <p>Please review the privacy notice and sign the digital consent form:</p>
                    <br/>
                    <p style="text-align: center;">
                        <a href="${data.link}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Review & Sign Consent
                        </a>
                    </p>
                    <br/>
                    <p style="font-size: 14px; color: #666;">This is a secure link valid for 7 days.</p>
                </div>
            </div>
        `
    })
};

/**
 * MindKindler Email Service
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
                    secure: port === 465,
                    auth: { user, pass },
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
             return true;
        }
    }
};

/**
 * Cloud Function Trigger: processEmailQueue
 * Listens for new documents in 'mail_queue' collection.
 * Supports raw 'html' OR 'templateId' + 'data'.
 */
export const processEmailQueue = onDocumentCreated({
    document: "mail_queue/{emailId}",
    region: "europe-west3"
}, async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();
    if (!data || data.status === 'sent' || data.status === 'error') return;

    try {
        let subject = data.subject;
        let html = data.html;

        // Render Template if provided
        if (data.templateId && TEMPLATES[data.templateId]) {
            const rendered = TEMPLATES[data.templateId](data.data || {});
            subject = rendered.subject;
            html = rendered.html;
        }

        await emailService.send({
            to: data.to,
            subject: subject,
            html: html,
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
