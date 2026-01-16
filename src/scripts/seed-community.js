const admin = require('firebase-admin');

// --- Configuration ---
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// We seed into the GLOBAL DB because communities span regions
const db = admin.firestore(); 

const SPACES = [
    {
        id: 'space_global_forum',
        title: 'Global EPP Lounge',
        description: 'Connect with psychologists worldwide.',
        type: 'forum',
        scope: 'global',
        moderatorIds: ['super-admin-global'],
        isPublic: false,
        createdAt: new Date().toISOString()
    },
    {
        id: 'space_uk_forum',
        title: 'UK Practitioners',
        description: 'Discuss EHCPs, Tribunals, and UK Law.',
        type: 'forum',
        scope: 'regional',
        region: 'uk',
        moderatorIds: ['super-admin-uk'],
        isPublic: false,
        createdAt: new Date().toISOString()
    },
    {
        id: 'space_public_blog',
        title: 'MindKindler Insights',
        description: 'Latest news and research for the public.',
        type: 'blog',
        scope: 'public',
        moderatorIds: ['super-admin-global'],
        isPublic: true, // Anyone can read
        createdAt: new Date().toISOString()
    },
    {
        id: 'space_private_wiki',
        title: 'DeRisk Tech Internal',
        description: 'Internal knowledge base.',
        type: 'wiki',
        scope: 'private',
        tenantId: 'pilot-tenant', // Only members of this tenant
        moderatorIds: ['tenant-admin-1'],
        isPublic: false,
        createdAt: new Date().toISOString()
    }
];

const POSTS = [
    {
        id: 'post_1',
        spaceId: 'space_global_forum',
        title: 'Welcome to the Global Lounge!',
        content: 'Introduce yourself here.',
        authorId: 'system',
        authorName: 'System Admin',
        authorRole: 'Admin',
        tags: ['welcome'],
        likes: 10,
        replies: 5,
        isPinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'post_2',
        spaceId: 'space_uk_forum',
        title: 'New SEND Guidance 2026',
        content: 'Has anyone reviewed the new amendments?',
        authorId: 'epp_sarah',
        authorName: 'Dr. Sarah',
        authorRole: 'EPP',
        tags: ['legislation', 'uk'],
        likes: 3,
        replies: 1,
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

async function seedCommunity() {
    console.log("🌱 Seeding Community Spaces...");
    const batch = db.batch();

    // 1. Create Spaces
    for (const space of SPACES) {
        const ref = db.collection('community_spaces').doc(space.id);
        batch.set(ref, space);
    }

    // 2. Create Posts
    for (const post of POSTS) {
        const ref = db.collection('community_posts').doc(post.id);
        batch.set(ref, post);
    }

    await batch.commit();
    console.log("✅ Community Seed Complete!");
}

seedCommunity().catch(console.error);
