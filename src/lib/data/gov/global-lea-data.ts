// src/lib/data/gov/global-lea-data.ts

export interface LEAReference {
    id: string;
    name: string;
    type?: string;
    region?: string;
}

export const GLOBAL_LEA_DATA: Record<string, LEAReference[]> = {
    'us-central1': [
        { id: 'us_ca_01', name: 'Los Angeles Unified School District', region: 'California' },
        { id: 'us_ny_01', name: 'New York City Department of Education', region: 'New York' },
        { id: 'us_il_01', name: 'Chicago Public Schools', region: 'Illinois' },
        { id: 'us_tx_01', name: 'Houston Independent School District', region: 'Texas' },
        { id: 'us_fl_01', name: 'Miami-Dade County Public Schools', region: 'Florida' },
    ],
    'europe-west3': [ // Germany
        { id: 'de_be', name: 'Senatsverwaltung für Bildung, Jugend und Familie', region: 'Berlin' },
        { id: 'de_by', name: 'Bayerisches Staatsministerium für Unterricht und Kultus', region: 'Bavaria' },
        { id: 'de_nw', name: 'Ministerium für Schule und Bildung NRW', region: 'North Rhine-Westphalia' },
    ],
    'europe-west1': [ // France
        { id: 'fr_75', name: 'Académie de Paris', region: 'Paris' },
        { id: 'fr_69', name: 'Académie de Lyon', region: 'Lyon' },
        { id: 'fr_13', name: 'Académie d\'Aix-Marseille', region: 'Marseille' },
    ],
    'northamerica-northeast1': [ // Canada
        { id: 'ca_on_tdsb', name: 'Toronto District School Board', region: 'Ontario' },
        { id: 'ca_qc_cssdm', name: 'Centre de services scolaire de Montréal', region: 'Quebec' },
        { id: 'ca_bc_vsb', name: 'Vancouver School Board', region: 'British Columbia' },
    ],
    'asia-northeast1': [ // Japan
        { id: 'jp_tk_bo', name: 'Tokyo Metropolitan Board of Education', region: 'Tokyo' },
        { id: 'jp_os_bo', name: 'Osaka Prefectural Board of Education', region: 'Osaka' },
    ],
    'me-central2': [ // Saudi Arabia
        { id: 'sa_moe_ry', name: 'Ministry of Education - Riyadh Region', region: 'Riyadh' },
        { id: 'sa_moe_jd', name: 'Ministry of Education - Jeddah Region', region: 'Makkah' },
        { id: 'sa_moe_dm', name: 'Ministry of Education - Eastern Province', region: 'Dammam' },
    ]
};
