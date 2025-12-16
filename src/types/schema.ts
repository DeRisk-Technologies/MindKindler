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

// Deprecated or Legacy Assessment (Manual Entry)
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

// --- New Assessment Module Types ---

export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'audio-response' | 'video-response' | 'scale';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[]; // For MC, scale
  correctAnswer?: string | string[];
  points: number;
  mediaUrl?: string; // Image/Audio/Video
  mediaType?: 'image' | 'audio' | 'video';
  hint?: string;
  required: boolean;
}

export interface AssessmentTemplate {
  id: string;
  title: string;
  description: string;
  category: string; // e.g., 'Reading', 'Behavioral'
  questions: Question[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  settings: {
    timeLimit?: number; // in minutes
    allowBacktracking: boolean;
    shuffleQuestions: boolean;
  };
}

export interface AssessmentAssignment {
  id: string;
  templateId: string;
  targetId: string; // Student ID, or Group ID
  targetType: 'student' | 'group' | 'class';
  assignedBy: string;
  assignedAt: string;
  dueDate?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
}

export interface AssessmentResult {
  id: string;
  assignmentId: string;
  studentId: string;
  templateId: string;
  startedAt: string;
  completedAt?: string;
  responses: {
    questionId: string;
    answer: string | string[]; // Text or URL for audio/video
    score?: number;
    feedback?: string; // AI or manual feedback
  }[];
  totalScore: number;
  maxScore: number;
  status: 'graded' | 'pending-review';
  aiAnalysis?: string; // Overall summary/flags
}

// -----------------------------------
// --- AI Co-Pilot & Reporting Module ---

export interface ConsultationSession {
  id: string;
  caseId: string;
  studentId: string;
  eppId: string;
  date: string; // ISO string
  transcript?: string; // Optional raw text
  transcriptUrl?: string; // Secure URL to audio/text file
  notes: string; // Structured notes (SOAP/DAP)
  
  // AI Generated Insights
  summary?: string;
  differentialDiagnoses?: {
    diagnosis: string;
    reasoning: string;
    confidence: 'low' | 'medium' | 'high';
    selected: boolean;
  }[];
  treatmentSuggestions?: {
    intervention: string;
    rationale: string;
    selected: boolean;
  }[];
  
  reportId?: string; // Link to generated report
  status: 'in-progress' | 'completed';
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: 'SOAP' | 'DAP' | 'Assessment' | 'Custom';
  structure: {
    sectionTitle: string;
    prompt: string; // Instructions for AI
    required: boolean;
  }[];
  createdBy?: string; // User ID or 'system'
}

export interface Report {
  id: string;
  sessionId?: string;
  caseId?: string;
  assessmentId?: string;
  studentId: string;
  templateId?: string;
  
  title: string;
  sections: {
    title: string;
    content: string;
  }[];
  
  generatedContent?: string; // Fallback or raw AI draft
  finalContent?: string; 
  language: 'en' | 'ha' | 'yo' | 'ig';
  createdAt: string;
  authorId?: string;
  status: 'draft' | 'final';
  version: number;
}

export interface KnowledgeBaseEntry {
  id: string;
  tags: string[]; // e.g. ["adhd", "age-10", "reading-intervention"]
  embedding?: number[]; 
  content: string; // Anonymized snippet of effective intervention/outcome
  metadata: Record<string, any>;
}

// -----------------------------------
// --- Appointment & Scheduling ---

export interface AvailabilityProfile {
  id: string; // User ID or Org ID
  workingDays: ('Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun')[];
  workingHours: { day: string; start: string; end: string }[];
  consultationHours?: { day: string; start: string; end: string }[];
  unavailableDates: { start: string; end: string; reason?: string }[];
  backupContactId?: string;
  allowedChannels: ('inPerson'|'video'|'chat'|'phone')[];
  appointmentReasons?: string[];
}

export interface Holiday {
  id: string;
  region: string; // 'NG', 'US', etc.
  date: string; // YYYY-MM-DD
  description: string;
}

export interface Appointment {
  id: string;
  title: string;
  participants: string[]; // User IDs
  initiator: string; // User ID
  reason: 'assessment' | 'therapy' | 'consultation' | 'followUp' | 'remoteSession' | string;
  channel: 'inPerson' | 'video' | 'chat' | 'phone';
  location?: string; // Physical or Link
  
  startTime: string; // ISO
  endTime: string; // ISO
  
  status: 'proposed' | 'confirmed' | 'rescheduled' | 'cancelled';
  proposedSlots?: { start: string; end: string }[];
  
  caseId?: string;
  createdByAI?: boolean;
  urgent?: boolean;
  notes?: string;
}

// -----------------------------------

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
