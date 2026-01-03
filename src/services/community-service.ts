import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ForumThread, ForumPost, WikiPage, BlogPost } from '@/types/mindkindler';

const TENANT_ID = 'default-tenant'; // TODO: Get from context/auth

export const communityService = {
  // --- Forum ---
  
  async getThreads(categoryId?: string, lastSnapshot?: DocumentSnapshot): Promise<ForumThread[]> {
    const threadsRef = collection(db, `tenants/${TENANT_ID}/forum/threads`);
    let q = query(threadsRef, orderBy('createdAt', 'desc'), limit(50));
    
    if (categoryId) {
      q = query(threadsRef, where('categoryId', '==', categoryId), orderBy('createdAt', 'desc'), limit(50));
    }
    
    if (lastSnapshot) {
       q = query(q, startAfter(lastSnapshot));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumThread));
  },

  async getThread(threadId: string): Promise<ForumThread | null> {
    const docRef = doc(db, `tenants/${TENANT_ID}/forum/threads`, threadId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as ForumThread) : null;
  },

  async createThread(thread: Omit<ForumThread, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const threadsRef = collection(db, `tenants/${TENANT_ID}/forum/threads`);
    const docRef = await addDoc(threadsRef, {
      ...thread,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      metrics: { views: 0, replies: 0, helpfulCount: 0 }
    });
    return docRef.id;
  },

  async getPosts(threadId: string): Promise<ForumPost[]> {
    const postsRef = collection(db, `tenants/${TENANT_ID}/forum/threads/${threadId}/posts`);
    const q = query(postsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost));
  },

  async createPost(threadId: string, post: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const postsRef = collection(db, `tenants/${TENANT_ID}/forum/threads/${threadId}/posts`);
    const docRef = await addDoc(postsRef, {
      ...post,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Note: Thread metric updates are handled by Cloud Function 'onPostCreated'
    return docRef.id;
  },

  // --- Wiki ---

  async getWikiPages(): Promise<WikiPage[]> {
    const pagesRef = collection(db, `tenants/${TENANT_ID}/wiki/pages`);
    // Filter for published or draft depending on permissions (simplified here)
    const q = query(pagesRef, orderBy('updatedAt', 'desc'), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WikiPage));
  },
  
  async getWikiPage(pageId: string): Promise<WikiPage | null> {
      const docRef = doc(db, `tenants/${TENANT_ID}/wiki/pages`, pageId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as WikiPage) : null;
  },

  async createWikiPage(page: Omit<WikiPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const pagesRef = collection(db, `tenants/${TENANT_ID}/wiki/pages`);
    const docRef = await addDoc(pagesRef, {
      ...page,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // --- Blog ---

  async getBlogPosts(): Promise<BlogPost[]> {
    const postsRef = collection(db, `tenants/${TENANT_ID}/blog/posts`);
    const q = query(postsRef, where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
  }
};
