"use client";

import { useEffect, useState, useCallback } from 'react';
import { ForumThread } from '@/types/mindkindler';
import { communityService } from '@/services/community-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, Eye, Lock, AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

// Pagination & Filtering Constants
const ITEMS_PER_PAGE = 10;

export default function ForumPage() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my_threads' | 'unanswered'>('all');
  const { toast } = useToast();

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      // In a real prod app, you'd pass pagination tokens here
      let data = await communityService.getThreads();
      
      // Client-side filtering for MVP (Prod: Move to Firestore query in service)
      if (filter === 'unanswered') {
        data = data.filter(t => t.metrics.replies === 0);
      }
      // 'my_threads' would require current user ID check

      setThreads(data);
    } catch (error) {
      console.error("Failed to load threads", error);
      toast({ title: "Error loading discussions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold">Forum Discussions</h2>
           <p className="text-muted-foreground">Join the conversation with other practitioners.</p>
        </div>
        <Link href="/dashboard/community/forum/new">
           <Button>Start Discussion</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 pb-2">
        <Button 
            variant={filter === 'all' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('all')}
        >
            All Discussions
        </Button>
        <Button 
            variant={filter === 'unanswered' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('unanswered')}
        >
            Unanswered
        </Button>
        {/* Add more filters here */}
      </div>

      <div className="grid gap-4">
        {loading ? (
             // Skeleton Loader
             Array.from({ length: 3 }).map((_, i) => (
                 <Card key={i} className="animate-pulse">
                     <CardHeader className="h-24 bg-muted/20 rounded-t-lg" />
                     <CardContent className="h-12 bg-muted/10 rounded-b-lg" />
                 </Card>
             ))
        ) : threads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No discussions found matching your criteria.
            </CardContent>
          </Card>
        ) : (
          threads.map((thread) => (
            <Card key={thread.id} className="hover:border-primary/50 transition-colors group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                   <div className="space-y-1 w-full">
                      <div className="flex justify-between w-full">
                        <Link href={`/dashboard/community/forum/${thread.id}`} className="hover:underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary rounded">
                            <CardTitle className="text-lg flex items-center gap-2">
                            {thread.title}
                            {!thread.isPublic && <Lock className="h-4 w-4 text-amber-500" aria-label="Private Thread" />}
                            {thread.isPinned && <Badge variant="secondary">Pinned</Badge>}
                            </CardTitle>
                        </Link>
                         {/* Status Indicator */}
                         {thread.status === 'closed' && <Badge variant="outline">Closed</Badge>}
                      </div>
                      
                      <CardDescription>
                        Posted by <span className="font-medium text-foreground">{thread.authorName}</span> • {new Date(thread.createdAt as any).toLocaleDateString()}
                      </CardDescription>
                   </div>
                </div>
              </CardHeader>
              <CardContent>
                 <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        {thread.tags?.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1" title="Views"><Eye className="h-4 w-4"/> {thread.metrics?.views || 0}</span>
                        <span className="flex items-center gap-1" title="Replies"><MessageSquare className="h-4 w-4"/> {thread.metrics?.replies || 0}</span>
                        <span className="flex items-center gap-1" title="Helpful"><ThumbsUp className="h-4 w-4"/> {thread.metrics?.helpfulCount || 0}</span>
                    </div>
                 </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
