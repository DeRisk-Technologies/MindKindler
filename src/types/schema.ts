// src/types/schema.ts

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
