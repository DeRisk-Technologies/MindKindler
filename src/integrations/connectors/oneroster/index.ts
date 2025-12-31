// src/integrations/connectors/oneroster/index.ts

import { Connector, ConnectorConfig, EntityType } from "../../framework/connector";
import { StudentImport } from "../../schemas/canonical";

export class OneRosterConnector implements Connector {
    id = "oneroster";
    name = "OneRoster 1.1";
    supportedEntityTypes: EntityType[] = ['students', 'teachers', 'classes'];

    init(config: ConnectorConfig) {
        // Mock init
        console.log("OneRoster initialized");
    }

    async pullChanges(entityType: EntityType, cursor?: string): Promise<{ records: any[], nextCursor?: string }> {
        // Mock API Response
        await new Promise(r => setTimeout(r, 1000));
        
        if (entityType === 'students') {
            return {
                records: [
                    { sourcedId: "s1", givenName: "Alice", familyName: "Roster", dateOfBirth: "2015-01-01" },
                    { sourcedId: "s2", givenName: "Bob", familyName: "Sync", dateOfBirth: "2014-05-05" }
                ],
                nextCursor: "page_2"
            };
        }
        return { records: [], nextCursor: undefined };
    }

    normalizeToCanonical(entityType: EntityType, record: any): any {
        if (entityType === 'students') {
            const s: StudentImport = {
                firstName: record.givenName,
                lastName: record.familyName,
                dateOfBirth: record.dateOfBirth,
                schoolId: "default_school"
            };
            return s;
        }
        return record;
    }
}
