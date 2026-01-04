export type TenantScope = 'global' | 'tenant' | 'private';
export type PublicationStatus = 'draft' | 'review' | 'published' | 'archived';

// --- Forum Types ---

export interface ForumCategory {
  id: string;
  title: string;
  description: string;
  slug: string;
  tenantId: string; // 'global' or specific tenant ID
  order: number;
  icon?: string;
}

export interface ForumThread {
  id: string;
  title: string;
  categoryId: string;
  content: string; // Markdown
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  tenantId: string;
  tags: string[];
  status: 'open' | 'closed' | 'locked';
  isPinned: boolean;
  metrics: {
    views: number;
    replies: number;
    helpfulCount: number;
  };
  acceptedAnswerId?: string;
  linkedCaseId?: string;
  linkedStudentId?: string;
}

export interface ForumPost {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  content: string; // Markdown
  createdAt: Date;
  updatedAt?: Date;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  reactions: Record<string, number>; // e.g. { 'like': 5, 'helpful': 2 }
  replyToPostId?: string;
  isAcceptedAnswer: boolean;
  aiSummaryProvId?: string;
}

// --- Wiki Types ---

export interface WikiPage {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown or structured blocks
  summary?: string;
  tenantId: string;
  status: PublicationStatus;
  version: number;
  authorId: string;
  metrics: {
    views: number;
    helpfulCount: number;
    trustScore: number;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    reviewedBy?: string[];
    reviewedAt?: Date;
    sourceThreadId?: string; // If promoted from forum
  };
}

// --- Blog Types ---

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  authorId: string;
  authorName: string;
  tenantId: string;
  status: PublicationStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  categories: string[];
  seo?: {
    title: string;
    description: string;
  };
}

// --- Provenance ---
export interface AIProvenance {
  id: string;
  action: 'moderation' | 'summarization' | 'generation' | 'translation';
  inputHash: string;
  model: string;
  confidence: number;
  timestamp: Date;
  triggeredBy: string; // userId or system
}
