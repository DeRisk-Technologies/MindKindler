// src/lib/data/gov/global-lea-data.ts

import { OrgUnitType } from "@/types/hierarchy";

export interface LEAReference {
    id: string;
    name: string;
    type?: OrgUnitType;
    region?: string; // Used to match parent name during seeding (e.g. "California" matches Parent "California")
}

export const GLOBAL_LEA_DATA: Record<string, LEAReference[]> = {
    'us-central1': [
        // National
        { id: 'us_gov_doe', name: 'United States Department of Education', type: 'national' },
        
        // States
        { id: 'us_st_ca', name: 'California', type: 'state' },
        { id: 'us_st_ny', name: 'New York', type: 'state' },
        { id: 'us_st_il', name: 'Illinois', type: 'state' },
        { id: 'us_st_tx', name: 'Texas', type: 'state' },
        { id: 'us_st_fl', name: 'Florida', type: 'state' },

        // Districts (Mapped to States)
        { id: 'us_ca_01', name: 'Los Angeles Unified School District', type: 'district', region: 'California' },
        { id: 'us_ca_02', name: 'San Diego Unified', type: 'district', region: 'California' },
        { id: 'us_ny_01', name: 'New York City Department of Education', type: 'district', region: 'New York' },
        { id: 'us_il_01', name: 'Chicago Public Schools', type: 'district', region: 'Illinois' },
        { id: 'us_tx_01', name: 'Houston Independent School District', type: 'district', region: 'Texas' },
        { id: 'us_fl_01', name: 'Miami-Dade County Public Schools', type: 'district', region: 'Florida' },
    ],
    'europe-west2': [ // UK (London)
        // National
        { id: 'uk_gov_dfe', name: 'Department for Education (DfE)', type: 'national' },
        
        // Regions (Level 2)
        { id: 'uk_reg_london', name: 'London Region', type: 'region_uk' },
        { id: 'uk_reg_se', name: 'South East England', type: 'region_uk' },
        { id: 'uk_reg_sw', name: 'South West England', type: 'region_uk' },
        { id: 'uk_reg_mids', name: 'West Midlands', type: 'region_uk' },
        { id: 'uk_reg_nw', name: 'North West England', type: 'region_uk' },
        
        // LEAs (Level 3) - Mapped to Regions where known, or generic
        { id: 'lea_202', name: 'Camden Council', type: 'local_authority', region: 'London Region' },
        { id: 'lea_214', name: 'Westminster City Council', type: 'local_authority', region: 'London Region' },
        { id: 'lea_204', name: 'Hackney Council', type: 'local_authority', region: 'London Region' },
        { id: 'lea_330', name: 'Birmingham City Council', type: 'local_authority', region: 'West Midlands' },
        { id: 'lea_886', name: 'Kent County Council', type: 'local_authority', region: 'South East England' },
        { id: 'lea_936', name: 'Surrey County Council', type: 'local_authority', region: 'South East England' }
    ],
    'europe-west3': [ // Germany
        // National
        { id: 'de_gov_bmbf', name: 'Bundesministerium für Bildung und Forschung', type: 'national' },
        
        // Bundesland (States)
        { id: 'de_be', name: 'Berlin', type: 'bundesland' },
        { id: 'de_by', name: 'Bayern (Bavaria)', type: 'bundesland' },
        { id: 'de_nw', name: 'Nordrhein-Westfalen', type: 'bundesland' },

        // Landkreis/District (Mapped)
        { id: 'de_be_mid', name: 'Berlin-Mitte', type: 'landkreis', region: 'Berlin' },
        { id: 'de_by_muc', name: 'München (Munich)', type: 'landkreis', region: 'Bayern (Bavaria)' },
    ],
    'me-central2': [ // Saudi Arabia
        // National
        { id: 'sa_gov_moe', name: 'Ministry of Education', type: 'national' },
        
        // General Directorate (Provinces)
        { id: 'sa_gd_ry', name: 'Riyadh Region', type: 'general_directorate' },
        { id: 'sa_gd_mk', name: 'Makkah Region', type: 'general_directorate' },
        { id: 'sa_gd_ep', name: 'Eastern Province', type: 'general_directorate' },

        // Education Offices
        { id: 'sa_eo_north', name: 'North Riyadh Education Office', type: 'education_office', region: 'Riyadh Region' },
        { id: 'sa_eo_jeddah', name: 'Jeddah Education', type: 'education_office', region: 'Makkah Region' },
        { id: 'sa_eo_dammam', name: 'Dammam Education', type: 'education_office', region: 'Eastern Province' },
    ],
    'northamerica-northeast1': [ // Canada
        { id: 'ca_gov_edu', name: 'Council of Ministers of Education', type: 'national' },
        // Provinces
        { id: 'ca_pv_on', name: 'Ontario', type: 'state' }, // Using 'state' type for Province generic
        { id: 'ca_pv_bc', name: 'British Columbia', type: 'state' },
        // Boards
        { id: 'ca_on_tdsb', name: 'Toronto District School Board', type: 'district', region: 'Ontario' },
        { id: 'ca_bc_vsb', name: 'Vancouver School Board', type: 'district', region: 'British Columbia' },
    ],
    'asia-northeast1': [ // Japan
        { id: 'jp_gov_mext', name: 'MEXT', type: 'national' },
        // Prefectures
        { id: 'jp_pr_tokyo', name: 'Tokyo Metropolis', type: 'prefecture' },
        { id: 'jp_pr_osaka', name: 'Osaka Prefecture', type: 'prefecture' },
        // Municipalities
        { id: 'jp_mn_shinjuku', name: 'Shinjuku City', type: 'municipality', region: 'Tokyo Metropolis' },
        { id: 'jp_mn_minato', name: 'Minato City', type: 'municipality', region: 'Tokyo Metropolis' },
    ]
};
