export type CommunityScope = 'global' | 'regional' | 'private' | 'public';

export interface CommunitySpace {
    id: string;
    title: string;
    description: string;
    type: 'forum' | 'blog' | 'wiki';
    scope: CommunityScope;
    region?: string; // e.g. 'uk', 'us' (Required if scope === 'regional')
    tenantId?: string; // (Required if scope === 'private')
    moderatorIds: string[];
    isPublic: boolean; // Accessible to non-MindKindler users?
    createdAt: string;
}

export interface ForumPost {
    id: string;
    spaceId: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    authorRole: string; // 'EPP', 'Public', 'Admin'
    tags: string[];
    likes: number;
    replies: number;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface WikiArticle {
    id: string;
    spaceId: string;
    title: string;
    content: string; // Markdown or HTML
    version: number;
    lastEditedBy: string;
    tags: string[];
    status: 'draft' | 'published' | 'archived';
    createdAt: string;
    updatedAt: string;
}

export interface BlogPost {
    id: string;
    spaceId: string;
    title: string;
    summary: string;
    content: string;
    authorId: string;
    coverImage?: string;
    publishedAt: string;
    tags: string[];
}
