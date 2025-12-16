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
  
  // Linking fields (at least one usually required based on type)
  studentId?: string;
  schoolId?: string;
  parentId?: string; // For pure parent consultation cases
  
  status: 'Open' | 'In Progress' | 'In Review' | 'Closed';
  priority: 'High' | 'Medium' | 'Low';
  
  // Detailed tracking
  assignedTo: string; // EPP User ID
  description?: string;
  
  // Chronological timeline of activities
  activities: {
    id: string;
    type: 'assessment' | 'report' | 'appointment' | 'note' | 'email' | 'upload';
    referenceId?: string; // ID of the linked assessment/report/appointment doc
    date: string;
    summary: string;
    performedBy: string;
  }[];

  openedAt: string;
  closedAt?: string;
}

export interface Assessment {
  id: string;
  caseId?: string; // Link to Case
  studentId: string;
  eppId?: string; // Optional for draft
  date: string; // ISO date string
  type: string;
  data?: Record<string, any>; // JSON data of the assessment
  status: 'draft' | 'completed';
  score?: number;
  notes?: string;
}

export interface Report {
  id: string;
  caseId?: string; // Link to Case
  assessmentId?: string;
  studentId: string;
  generatedContent: string;
  finalContent: string; // EPP edited version
  language: 'en' | 'ha' | 'yo' | 'ig';
  createdAt: string;
}

// Phase 2: Training Data for Self-Learning
export interface TrainingData {
  id: string;
  originalReportId?: string;
  issueTags: string[]; // e.g., ["reading-difficulty", "attention-deficit"]
  interventionsUsed: string[];
  outcome?: 'positive' | 'neutral' | 'negative';
  anonymizedTranscript?: string;
  embedding?: number[]; // For RAG later
}

// Phase 2: Appointments
export interface Appointment {
  id: string;
  caseId?: string; // Link to Case
  participants: string[]; // User IDs (EPP, Parent, etc.)
  startTime: string; // ISO date string
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
  consentId: string; // Link to consent record
  analysisStatus: 'pending' | 'processing' | 'completed';
  aiMetadata?: Record<string, any>; // To store future AI findings
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
  id: string; // organizationId
  theme: {
    primaryColor: string;
    fontFamily: string;
  };
  enabledWidgets: string[]; // List of widget IDs to show on dashboard
}
