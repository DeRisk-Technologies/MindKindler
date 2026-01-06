// src/lib/data/gov/uk-school-samples.ts

/**
 * Sample standardized school list for UK.
 * In a real production app, this would be a Firestore collection 
 * synchronized from the DfE 'Get Information about Schools' API.
 */
export const UK_SCHOOL_SAMPLES = [
    { id: 'sch_101234', name: 'Westminster School', urn: '101234', type: 'Independent', leaId: 'lea_213' },
    { id: 'sch_100001', name: 'St Paul’s Cathedral School', urn: '100001', type: 'Independent', leaId: 'lea_201' },
    { id: 'sch_100005', name: 'Camden School for Girls', urn: '100005', type: 'Academy', leaId: 'lea_202' },
    { id: 'sch_100021', name: 'Hampstead School', urn: '100021', type: 'Community', leaId: 'lea_202' },
    { id: 'sch_100234', name: 'The Grey Coat Hospital', urn: '100234', type: 'Academy', leaId: 'lea_213' },
    { id: 'sch_100812', name: 'City of London School', urn: '100812', type: 'Independent', leaId: 'lea_201' },
    { id: 'sch_102030', name: 'Eton College', urn: '102030', type: 'Independent', leaId: 'lea_825' },
    { id: 'sch_103040', name: 'Rugby School', urn: '103040', type: 'Independent', leaId: 'lea_331' },
    { id: 'sch_104050', name: 'Harrow School', urn: '104050', type: 'Independent', leaId: 'lea_310' },
    { id: 'sch_105060', name: 'Winchester College', urn: '105060', type: 'Independent', leaId: 'lea_936' }
];
