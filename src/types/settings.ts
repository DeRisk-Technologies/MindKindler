export interface OrganizationSettings {
  id: string; // "global" or orgId
  theme: {
    primaryColor: string;
    fontFamily: string;
    mode: 'light' | 'dark' | 'system';
  };
  landingPage: {
    heroTitle: string;
    heroSubtitle: string;
    heroImageUrl?: string;
    showFeatures: boolean;
    featuresTitle: string;
    features: { title: string; description: string; icon: string }[];
  };
  branding: {
    logoUrl?: string;
    companyName: string;
  };
}
