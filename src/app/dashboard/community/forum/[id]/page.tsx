"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { communityService } from '@/services/community-service';
import { ForumThread, ForumPost } from '@/types/mindkindler';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageSquare, ThumbsUp, CheckCircle, Flag, Share2, BookOpen } from "lucide-react";
import Link from 'next/link';

export default function ThreadDetailPage({ params }: { params: { id: string } }) {
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const { toast } = useToast();
  const router = useRouter(); // Use the hook

  useEffect(() => {
    async function loadData() {
      try {
        const t = await communityService.getThread(params.id);
        if (t) {
          setThread(t);
          const p = await communityService.getPosts(params.id);
          setPosts(p);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  const handleReply = async () => {
    if (!replyContent.trim() || !thread) return;
    setReplying(true);
    try {
      await communityService.createPost(thread.id, {
        threadId: thread.id,
        content: replyContent,
        authorId: 'current-user',
        authorName: 'Current User',
        reactions: {},
        isAcceptedAnswer: false
      });
      setReplyContent('');
      // Reload posts
      const p = await communityService.getPosts(thread.id);
      setPosts(p);
      toast({ title: "Reply posted" });
    } catch (error) {
       toast({ title: "Error posting reply", variant: "destructive" });
    } finally {
      setReplying(false);
    }
  };

  const handlePromoteToWiki = () => {
      // In a real app, this would pass thread data to the wiki creation form
      // For now, we just navigate
      router.push(`/dashboard/community/wiki/new?sourceThreadId=${thread?.id}`);
  };

  if (loading) return <div>Loading discussion...</div>;
  if (!thread) return <div>Thread not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Link href="/dashboard/community/forum">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4"/></Button>
            </Link>
            <h1 className="text-2xl font-bold">{thread.title}</h1>
         </div>
         <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePromoteToWiki}>
               <BookOpen className="mr-2 h-4 w-4"/> Promote to Wiki
            </Button>
            <Button variant="ghost" size="icon"><Share2 className="h-4 w-4"/></Button>
            <Button variant="ghost" size="icon"><Flag className="h-4 w-4"/></Button>
         </div>
       </div>

       <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <Badge variant={thread.status === 'open' ? 'default' : 'secondary'}>{thread.status}</Badge>
          <span>Posted by {thread.authorName}</span>
          <span>{new Date(thread.createdAt as any).toLocaleDateString()}</span>
          <div className="flex gap-2 ml-auto">
             {thread.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
          </div>
       </div>

       <Card className="border-l-4 border-l-primary/50">
          <CardHeader>
             <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-8 w-8">
                   <AvatarFallback>{thread.authorName[0]}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{thread.authorName}</span>
             </div>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
             {thread.content}
          </CardContent>
       </Card>

       <div className="space-y-4 mt-8">
          <h3 className="text-lg font-semibold">{posts.length} Replies</h3>
          {posts.map((post) => (
             <Card key={post.id} className={post.isAcceptedAnswer ? "border-green-500" : ""}>
                <CardContent className="pt-6">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                         <Avatar className="h-8 w-8">
                            <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                         </Avatar>
                         <div>
                            <span className="font-semibold block text-sm">{post.authorName}</span>
                            <span className="text-xs text-muted-foreground">{new Date(post.createdAt as any).toLocaleDateString()}</span>
                         </div>
                      </div>
                      {post.isAcceptedAnswer && (
                         <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
                            <CheckCircle className="h-3 w-3" /> Accepted Answer
                         </Badge>
                      )}
                   </div>
                   <div className="prose dark:prose-invert max-w-none text-sm">
                      {post.content}
                   </div>
                   <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                      <Button variant="ghost" size="sm" className="h-8 gap-1">
                         <ThumbsUp className="h-3 w-3" /> Helpful ({post.reactions?.helpful || 0})
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 gap-1">
                         <MessageSquare className="h-3 w-3" /> Reply
                      </Button>
                   </div>
                </CardContent>
             </Card>
          ))}
       </div>

       <div className="border rounded-lg p-4 bg-card mt-8">
          <h4 className="font-medium mb-2">Post a Reply</h4>
          <Textarea 
             placeholder="Type your reply here..." 
             className="min-h-[100px] mb-4"
             value={replyContent}
             onChange={(e) => setReplyContent(e.target.value)}
          />
          <div className="flex justify-end">
             <Button onClick={handleReply} disabled={replying}>
                {replying ? 'Posting...' : 'Post Reply'}
             </Button>
          </div>
       </div>
    </div>
  );
}
