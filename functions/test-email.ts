
import * as dotenv from 'dotenv';
import { emailService } from './src/services/email';

dotenv.config();

async function testEmail() {
    console.log('--- Testing Email Configuration ---');
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`User: ${process.env.SMTP_USER}`);

    if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'your-secure-password') {
        console.error('ERROR: Please update functions/.env with your real password before testing.');
        process.exit(1);
    }

    try {
        await emailService.send({
            to: process.env.SMTP_USER || 'test@example.com', // Send to self
            subject: 'MindKindler SMTP Test',
            text: 'If you are reading this, the email configuration is working correctly.',
            html: '<p>If you are reading this, the <strong>email configuration</strong> is working correctly.</p>'
        });
        console.log('--- Success: Email sent successfully! ---');
    } catch (error) {
        console.error('--- Failed: Email could not be sent ---');
        console.error(error);
    }
}

testEmail();
