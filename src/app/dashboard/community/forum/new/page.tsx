"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { communityService } from '@/services/community-service';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewThreadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: 'general',
    content: '',
    tags: '',
    isPublic: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic PII check (client-side simulation - server/cloud function should do real check)
      const piiPatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/, // SSN-like
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/ // Email
      ];
      
      const hasPotentialPII = piiPatterns.some(regex => regex.test(formData.content) || regex.test(formData.title));
      
      if (hasPotentialPII && formData.isPublic) {
        toast({
          title: "Potential PII Detected",
          description: "Your post contains potential PII. Please remove emails or ID numbers before posting publicly.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      await communityService.createThread({
        title: formData.title,
        categoryId: formData.categoryId,
        content: formData.content,
        authorId: 'current-user-id', // TODO: Get from auth context
        authorName: 'Current User', // TODO: Get from auth context
        tenantId: 'default-tenant', // TODO: Get from context
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        isPublic: formData.isPublic,
        status: 'open',
        isPinned: false,
        metrics: { views: 0, replies: 0, helpfulCount: 0 }
      });

      toast({
        title: "Thread created",
        description: "Your discussion has been started successfully."
      });
      
      router.push('/dashboard/community/forum');
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create thread. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/community/forum">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4"/></Button>
        </Link>
        <h2 className="text-2xl font-bold">Start New Discussion</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 border p-6 rounded-lg bg-card">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title" 
            placeholder="e.g., Best way to handle..." 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select 
              id="category"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
            >
              <option value="general">General Discussion</option>
              <option value="assessments">Assessments</option>
              <option value="safeguarding">Safeguarding</option>
              <option value="tech">Tech & Integration</option>
            </select>
          </div>
           <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input 
              id="tags" 
              placeholder="e.g., SEN, Policy, help" 
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea 
            id="content" 
            placeholder="Write your question or discussion point here (Markdown supported)..." 
            className="min-h-[200px]"
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            required
          />
          <p className="text-xs text-muted-foreground">
            Use Markdown for formatting. Please do not include any student PII in public posts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="public" 
            checked={formData.isPublic}
            onCheckedChange={(checked) => setFormData({...formData, isPublic: checked as boolean})}
          />
          <Label htmlFor="public">Make this discussion public (visible to global community)</Label>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Link href="/dashboard/community/forum">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Create Discussion'}
          </Button>
        </div>
      </form>
    </div>
  );
}
