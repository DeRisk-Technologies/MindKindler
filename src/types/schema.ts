export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'epp' | 'parent' | 'teacher';
  displayName?: string;
  organizationId?: string; // For associating with schools/LEAs
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  gender: 'male' | 'female' | 'other';
  schoolId: string;
  districtId: string;
  socioEconomicStatus?: 'low' | 'medium' | 'high'; // Optional, ethical considerations
  diagnosisCategory?: string[]; // e.g., ["Dyslexia", "ADHD"]
  parentId?: string; // Single primary parent link for simplicity in this phase, or keep parentIds if many
  parentIds?: string[];
  address?: string;
  history?: any[];
  alerts?: any[];
}

export interface Case {
  id: string;
  title: string;
  type: 'student' | 'school' | 'consultation' | 'general';
  
  // Linking fields
  studentId?: string;
  schoolId?: string;
  parentId?: string; 
  
  status: 'Open' | 'In Progress' | 'In Review' | 'Closed';
  priority: 'High' | 'Medium' | 'Low';
  
  // Detailed tracking
  assignedTo: string; // EPP User ID (assignedEPP)
  teamRefs?: string[]; // Array of user IDs
  description?: string;
  
  // Metadata
  createdAt: string; // openedAt
  lastUpdated: string;
  closedAt?: string;

  // Tabs Data (optional UI state persistence)
  tabsData?: Record<string, any>;
  
  // Permissions
  permissions?: {
    userId: string;
    role: 'owner' | 'editor' | 'viewer';
  }[];

  // Chronological timeline of activities
  activities: {
    id: string;
    type: 'assessment' | 'report' | 'appointment' | 'note' | 'email' | 'upload';
    referenceId?: string; // ID of the linked assessment/report/appointment doc
    date: string;
    summary: string;
    performedBy: string;
  }[];
}

export interface Assessment {
  id: string;
  caseId?: string; 
  studentId: string;
  eppId?: string; 
  date: string; 
  type: string;
  data?: Record<string, any>; 
  status: 'draft' | 'completed';
  score?: number;
  outcome?: string; // For high-risk alerts
  notes?: string;
  voiceNoteUrl?: string; // Audio/Video URL
}

export interface Report {
  id: string;
  caseId?: string; 
  assessmentId?: string;
  studentId: string;
  generatedContent: string;
  finalContent: string; 
  language: 'en' | 'ha' | 'yo' | 'ig';
  createdAt: string;
  authorId?: string;
  status?: 'draft' | 'final';
}

export interface Observation {
  id: string;
  caseId: string;
  authorId: string; // Teacher, Parent, Psychologist
  authorRole: string;
  date: string;
  content: string; // Rich text
  privacyLevel: 'public' | 'team' | 'private';
  attachments?: string[];
  audioUrl?: string;
}

export interface IEP {
  id: string;
  caseId: string;
  studentId: string;
  startDate: string;
  endDate: string;
  goals: {
    id: string;
    type: 'academic' | 'behavioral' | 'social';
    description: string;
    successCriteria: string;
    dueDate: string;
    responsibleParty: string;
    status: 'pending' | 'in-progress' | 'achieved' | 'failed';
    progress: number; // 0-100
  }[];
  status: 'active' | 'draft' | 'archived';
}

export interface Intervention {
  id: string;
  caseId: string;
  type: string; // e.g., speech therapy
  startDate: string;
  endDate?: string;
  frequency: string; 
  status: 'planned' | 'in-progress' | 'completed';
  outcomes?: string;
  assignedTo?: string; // Staff member
}

export interface Message {
  id: string;
  caseId: string;
  senderId: string;
  content: string;
  timestamp: string;
  attachments?: string[];
  readBy?: string[];
}

export interface BillingEntry {
  id: string;
  caseId: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid' | 'overdue';
  invoiceId?: string;
}

// Phase 2: Training Data for Self-Learning
export interface TrainingData {
  id: string;
  originalReportId?: string;
  issueTags: string[]; 
  interventionsUsed: string[];
  outcome?: 'positive' | 'neutral' | 'negative';
  anonymizedTranscript?: string;
  embedding?: number[]; 
}

// Phase 2: Appointments
export interface Appointment {
  id: string;
  caseId?: string; 
  participants: string[]; 
  startTime: string; 
  endTime: string; 
  type: 'assessment' | 'counseling' | 'follow-up';
  status: 'scheduled' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
}

// Phase 3: Placeholders
export interface VideoObservation {
  id: string;
  studentId: string;
  recordedAt: string;
  durationSeconds: number;
  deviceIdentifier: string;
  storagePath: string;
  consentId: string; 
  analysisStatus: 'pending' | 'processing' | 'completed';
  aiMetadata?: Record<string, any>; 
}

export interface SensorReading {
  id: string;
  studentId: string;
  timestamp: string;
  deviceIdentifier: string;
  sensorType: 'heart-rate' | 'movement' | 'audio-level';
  value: number;
  unit: string;
}

export interface ConsentRecord {
  id: string;
  studentId: string;
  grantedByUserId: string;
  scope: ('video' | 'audio' | 'sensor')[];
  grantedAt: string;
  revokedAt?: string;
}

export interface OrganizationSettings {
  id: string; 
  theme: {
    primaryColor: string;
    fontFamily: string;
  };
  enabledWidgets: string[]; 
}
