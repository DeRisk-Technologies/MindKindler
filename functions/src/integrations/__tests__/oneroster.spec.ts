// functions/src/integrations/__tests__/oneroster.spec.ts
import axios from 'axios';
import { OneRosterConnector } from '../connectors/oneroster';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OneRoster Connector', () => {
    
    const config = {
        clientId: 'client',
        clientSecret: 'secret',
        baseUrl: 'https://sis.example.com'
    };

    it('authenticates and fetches grades', async () => {
        // Mock Auth
        mockedAxios.post.mockResolvedValue({ data: { access_token: 'abc-123' } });
        
        // Mock Results
        mockedAxios.get.mockResolvedValue({ 
            data: { 
                results: [
                    { 
                        student: { sourcedId: 's1' }, 
                        class: { sourcedId: 'math' }, 
                        score: 95, 
                        date: '2023-01-01' 
                    }
                ] 
            } 
        });

        const grades = await OneRosterConnector.fetchGrades(config);

        expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.stringContaining('/oauth/token'), 
            expect.any(String), 
            expect.any(Object)
        );
        
        expect(grades).toHaveLength(1);
        expect(grades[0].score).toBe(95);
    });
});
