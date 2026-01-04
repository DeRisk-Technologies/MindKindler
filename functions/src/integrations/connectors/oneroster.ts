// functions/src/integrations/connectors/oneroster.ts

import axios from 'axios';

interface OneRosterConfig {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
}

export const OneRosterConnector = {
    async getToken(config: OneRosterConfig): Promise<string> {
        // Standard OAuth2 Client Credentials Flow for OneRoster
        try {
            const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
            const resp = await axios.post(`${config.baseUrl}/oauth/token`, 'grant_type=client_credentials', {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            return resp.data.access_token;
        } catch (e) {
            console.error("OneRoster Auth Failed", e);
            throw new Error("Failed to authenticate with SIS");
        }
    },

    async fetchGrades(config: OneRosterConfig) {
        const token = await this.getToken(config);
        
        // Fetch Results (Grades)
        // OneRoster 1.1 Endpoint: /results
        try {
            const resp = await axios.get(`${config.baseUrl}/ims/oneroster/v1p1/results?limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            return resp.data.results.map((r: any) => ({
                studentId: r.student.sourcedId,
                subject: r.class.sourcedId, // or title lookup
                score: r.score,
                date: r.date,
                source: 'oneroster'
            }));
        } catch (e) {
             console.error("OneRoster Sync Failed", e);
             throw new Error("Failed to fetch grades");
        }
    }
};
