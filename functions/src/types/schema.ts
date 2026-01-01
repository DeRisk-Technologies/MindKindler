// src/types/schema.ts

// ... (Previous Content)

export interface Notification {
  id: string;
  tenantId: string;
  recipientUserId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'action_required';
  category: 'assessment' | 'training' | 'guardian' | 'partner' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  channels: { email: boolean; sms: boolean; push: boolean };
  categories: {
    assessment: boolean;
    training: boolean;
    guardian: boolean;
    partner: boolean;
    system: boolean;
  };
}

export interface UploadedDocument {
  id: string;
  tenantId: string;
  fileName: string;
  status: 'processing' | 'review_required' | 'processed';
  uploadedAt: string;
  uploadedBy: string;
  url: string;
}

export interface AssessmentTemplate {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  category?: string; // e.g., 'Clinical', 'Educational', 'Screening'
  questions: any[]; // refined type would be Question[]
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published';
  tags: string[];
}

export interface AssessmentAssignment {
  id: string;
  tenantId: string;
  templateId: string;
  studentId?: string; // Deprecated or alias for targetId
  targetId?: string; // The ID of the person being assessed (student, teacher, etc.)
  assignedByUserId: string;
  assignedAt: string;
  dueDate?: string;
  mode?: 'student-async' | 'clinician-live';
  status: 'pending' | 'in_progress' | 'completed' | 'graded';
  responses?: Record<string, any>;
  grade?: number;
  feedback?: string;
}

export interface TenantLocalizationSettings {
  defaultLocale: string;
  supportedLocales: string[];
  allowUserLocaleOverride: boolean;
  updatedAt: string;
  updatedBy: string;
}

// Extend existing settings or create new dedicated doc per tenant if not existing
export interface TenantSettings {
  localization?: TenantLocalizationSettings;
  // ... other existing settings would go here
}

export interface TranslationOverrideDoc {
  id?: string; // namespace (e.g. 'common')
  locale: string; // e.g. 'fr-FR'
  namespace: string;
  entries: Record<string, string>;
  status: 'draft' | 'published';
  updatedAt: string;
  updatedBy: string;
  publishedAt?: string;
  publishedBy?: string;
}

export interface GlossaryDoc {
  id?: string; // locale (e.g. 'en-GB')
  locale: string;
  entries: Record<string, string>; // canonical -> preferred
  status: 'draft' | 'published';
  updatedAt: string;
  updatedBy: string;
  publishedAt?: string;
  publishedBy?: string;
}

export interface ConsultationSession {
  id: string;
  tenantId: string;
  studentId: string;
  date: string;
  notes: string;
  transcript?: string;
  insights?: any[];
  status?: 'scheduled' | 'in_progress' | 'completed';
  reportId?: string;
  caseId?: string;
}

export interface Student {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  schoolId?: string;
  parentId?: string;
  address?: string;
  needs?: string[];
  alerts?: any[];
  diagnosisCategory?: string[];
  history?: string;
}

export type CasePriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type CaseStatus = 'triage' | 'active' | 'waiting' | 'resolved' | 'archived';

export interface Case {
  id: string;
  tenantId: string;
  type: 'student' | 'school' | 'staff';
  subjectId: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  assignedTo?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sourceAlertId?: string;
  evidence?: any[];
  tags?: string[];
  slaDueAt?: string;
}

export interface CaseTask {
  id?: string;
  title: string;
  status: 'pending' | 'done';
  dueAt?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
}

export interface CaseTimelineEvent {
  id?: string;
  type: 'status_change' | 'note' | 'document' | 'alert_linked' | 'task_completed' | 'assignment_change';
  content: string;
  metadata?: Record<string, any>;
  actorId: string;
  createdAt: string;
}

// Updated Interfaces
export interface AssessmentResult {
  id: string;
  studentId: string;
  templateId: string;
  totalScore: number;
  maxScore: number;
  completedAt?: string;
  startedAt?: string;
  category?: string;
  grade?: string;
  responses?: Record<string, any>;
  status?: 'pending' | 'in_progress' | 'completed' | 'graded';
  aiAnalysis?: string;
}

export interface ExternalAcademicRecord {
  id: string;
  studentId: string;
  subject: string;
  grade: string | number;
  term: string;
  date: string;
  sourceSystem: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface InterventionPlan {
  id: string;
  tenantId: string;
  studentId: string;
  title: string;
  status: 'active' | 'completed' | 'draft' | 'archived';
  startDate: string;
  endDate?: string;
  goalDescription: string;
  recommendations: Array<{
    title: string;
    description: string;
    assignedTo: string;
    steps?: string[];
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  progressLogs?: Array<{
    at: string;
    note: string;
    progressDelta?: string;
    loggedBy: string;
  }>;
  createdAt: string;
  updatedAt: string;
  baselineScore?: number; // Added
  targetScore?: number; // Added
  currentScore?: number; // Added
}

export interface RecommendationTemplate {
    id: string;
    category: string;
    title: string;
    description: string;
    impactScore: number; // 0-1 (Evidence based)
    tags: string[];
}
