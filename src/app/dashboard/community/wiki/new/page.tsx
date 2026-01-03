"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { communityService } from '@/services/community-service';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Wand2 } from 'lucide-react';
import Link from 'next/link';

function NewWikiPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceThreadId = searchParams.get('sourceThreadId');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: ''
  });

  const handleAiDraft = () => {
     if (!sourceThreadId) {
        toast({ title: "No source thread to draft from." });
        return;
     }
     setFormData(prev => ({
        ...prev,
        title: "Draft: Summary of Best Practices",
        content: "## Overview\nBased on community discussions, here are the key takeaways...\n\n### Key Points\n- Point 1\n- Point 2\n\n### References\n- [Original Thread](/dashboard/community/forum/" + sourceThreadId + ")"
     }));
     toast({ title: "Draft generated from thread." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await communityService.createWikiPage({
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/ /g, '-'),
        content: formData.content,
        summary: formData.summary,
        tenantId: 'default-tenant',
        status: 'draft',
        version: 1,
        authorId: 'current-user',
        metrics: { views: 0, helpfulCount: 0, trustScore: 0.5 },
        tags: [],
        metadata: {
           sourceThreadId: sourceThreadId || undefined
        }
      });

      toast({
        title: "Wiki Page Created",
        description: "Your page has been saved as a draft."
      });
      
      router.push('/dashboard/community/wiki');
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <Link href="/dashboard/community/wiki">
             <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4"/></Button>
           </Link>
           <h2 className="text-2xl font-bold">Create Wiki Page</h2>
        </div>
        {sourceThreadId && (
           <Button variant="outline" onClick={handleAiDraft}>
              <Wand2 className="mr-2 h-4 w-4"/> AI Draft from Thread
           </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 border p-6 rounded-lg bg-card">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title" 
            placeholder="e.g., SEN Policy Template 2024" 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL friendly)</Label>
          <Input 
            id="slug" 
            placeholder="sen-policy-template-2024" 
            value={formData.slug}
            onChange={(e) => setFormData({...formData, slug: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Input 
            id="summary" 
            placeholder="Brief description for search results" 
            value={formData.summary}
            onChange={(e) => setFormData({...formData, summary: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content (Markdown)</Label>
          <Textarea 
            id="content" 
            className="min-h-[400px] font-mono text-sm"
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            required
          />
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Link href="/dashboard/community/wiki">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Draft'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewWikiPage() {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <NewWikiPageContent />
    </Suspense>
  );
}
