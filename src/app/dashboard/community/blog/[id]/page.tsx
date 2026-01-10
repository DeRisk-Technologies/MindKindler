"use client";

import { useEffect, useState, use } from 'react';
import { BlogPost } from '@/types/mindkindler';
import { communityService } from '@/services/community-service';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
         const docRef = doc(db, `tenants/default-tenant/blog/posts`, id);
         const docSnap = await getDoc(docRef);
         if (docSnap.exists()) {
             setPost({ id: docSnap.id, ...docSnap.data() } as BlogPost);
         }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div>Loading post...</div>;
  if (!post) return <div>Post not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
       <Link href="/dashboard/community/blog">
          <Button variant="ghost" size="sm" className="pl-0 hover:pl-2 transition-all"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Blog</Button>
       </Link>

       <div className="space-y-4">
          <div className="flex gap-2">
             {post.categories.map(c => <Badge key={c}>{c}</Badge>)}
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
             <span className="font-medium text-foreground">{post.authorName}</span>
             <span>•</span>
             <span className="flex items-center gap-1"><Calendar className="h-4 w-4"/> {new Date(post.publishedAt as any || post.createdAt as any).toLocaleDateString()}</span>
          </div>
       </div>

       {post.coverImage && (
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
             <img src={post.coverImage} alt={post.title} className="object-cover w-full h-full" />
          </div>
       )}

       <article className="prose dark:prose-invert max-w-none">
          {post.content}
       </article>

       <div className="border-t pt-8 mt-8">
          <h3 className="font-semibold mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
             {post.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
          </div>
       </div>
    </div>
  );
}
