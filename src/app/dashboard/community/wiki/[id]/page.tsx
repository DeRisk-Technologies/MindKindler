"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WikiPage } from '@/types/mindkindler';
import { communityService } from '@/services/community-service';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, CheckCircle, Share2, BookOpen } from "lucide-react";
import Link from 'next/link';

export default function WikiDetailPage({ params }: { params: { id: string } }) {
  const [page, setPage] = useState<WikiPage | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast(); // Added toast for error handling

  useEffect(() => {
    async function loadData() {
      try {
        const p = await communityService.getWikiPage(params.id);
        if (p) {
            setPage(p);
        } else {
            toast({ title: "Page not found", variant: "destructive" });
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Error loading page", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id, toast]);

  if (loading) return <div>Loading page...</div>;
  if (!page) return <div>Page not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Link href="/dashboard/community/wiki">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4"/></Button>
            </Link>
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    {page.title}
                    {page.metrics.trustScore > 0.8 && <CheckCircle className="h-5 w-5 text-green-500"/>}
                </h1>
                <span className="text-sm text-muted-foreground">v{page.version} • Last updated {new Date(page.updatedAt as any).toLocaleDateString()}</span>
            </div>
         </div>
         <div className="flex gap-2">
            <Button variant="outline" size="sm">
               <Edit className="mr-2 h-4 w-4"/> Edit
            </Button>
            <Button variant="ghost" size="icon"><Share2 className="h-4 w-4"/></Button>
         </div>
       </div>

       {page.metadata.sourceThreadId && (
           <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
              <span className="text-sm">Derived from community discussion</span>
              <Link href={`/dashboard/community/forum/${page.metadata.sourceThreadId}`}>
                  <Button variant="link" size="sm">View Source Thread</Button>
              </Link>
           </div>
       )}

       <Card>
          <CardContent className="pt-6 prose dark:prose-invert max-w-none">
             {page.content}
          </CardContent>
       </Card>

       <div className="flex gap-2">
            {page.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
       </div>
    </div>
  );
}
