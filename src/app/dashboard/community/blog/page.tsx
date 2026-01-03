"use client";

import { useEffect, useState } from 'react';
import { BlogPost } from '@/types/mindkindler';
import { communityService } from '@/services/community-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function BlogHome() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await communityService.getBlogPosts();
        setPosts(data);
      } catch (error) {
        console.error("Failed to load blog posts", error);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold">Community Blog</h2>
           <p className="text-muted-foreground">News, updates, and thought leadership.</p>
        </div>
        <Link href="/dashboard/community/blog/new">
           <Button variant="outline">Write Post</Button>
        </Link>
      </div>

      <div className="space-y-6">
         {loading ? <div>Loading...</div> : posts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-lg">
               No blog posts published yet.
            </div>
         ) : (
            posts.map(post => (
              <Card key={post.id} className="overflow-hidden">
                <div className="md:flex">
                   {post.coverImage && (
                     <div className="md:w-1/3 bg-muted h-48 md:h-auto bg-cover bg-center" style={{ backgroundImage: `url(${post.coverImage})` }} />
                   )}
                   <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex gap-2 mb-2">
                          {post.categories?.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
                        </div>
                        <h3 className="text-2xl font-bold mb-2">
                          <Link href={`/dashboard/community/blog/${post.id}`} className="hover:underline">
                            {post.title}
                          </Link>
                        </h3>
                        <p className="text-muted-foreground mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
                        <span>By {post.authorName}</span>
                        <span>{new Date(post.publishedAt as any).toLocaleDateString()}</span>
                      </div>
                   </div>
                </div>
              </Card>
            ))
         )}
      </div>
    </div>
  );
}
