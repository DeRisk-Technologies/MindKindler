"use client";

import { useEffect, useState } from 'react';
import { WikiPage } from '@/types/mindkindler';
import { communityService } from '@/services/community-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Clock } from "lucide-react";
import Link from 'next/link';

export default function WikiHome() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPages() {
      try {
        const data = await communityService.getWikiPages();
        setPages(data);
      } catch (error) {
        console.error("Failed to load wiki pages", error);
      } finally {
        setLoading(false);
      }
    }
    loadPages();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold">Knowledge Vault</h2>
           <p className="text-muted-foreground">Curated, vetted knowledge for practitioners.</p>
        </div>
        <Link href="/dashboard/community/wiki/new">
           <Button><BookOpen className="mr-2 h-4 w-4"/> Create Page</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
           <div className="col-span-full text-center">Loading wiki...</div>
        ) : pages.length === 0 ? (
           <div className="col-span-full p-8 text-center text-muted-foreground border rounded-lg border-dashed">
              The library is empty. Start contributing!
           </div>
        ) : (
           pages.map(page => (
             <Card key={page.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
               <CardHeader>
                 <div className="flex justify-between items-start">
                   <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                     {page.status}
                   </Badge>
                   {page.metrics?.trustScore > 0.8 && (
                     <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
                       <CheckCircle className="h-3 w-3" /> Vetted
                     </Badge>
                   )}
                 </div>
                 <CardTitle className="line-clamp-2 mt-2">
                   <Link href={`/dashboard/community/wiki/${page.id}`} className="hover:underline">
                     {page.title}
                   </Link>
                 </CardTitle>
                 <CardDescription className="line-clamp-2">
                   {page.summary || "No summary available."}
                 </CardDescription>
               </CardHeader>
               <CardContent className="flex-1">
                 <div className="flex flex-wrap gap-2 mt-2">
                   {page.tags?.slice(0, 3).map(tag => (
                     <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                   ))}
                 </div>
               </CardContent>
               <CardFooter className="text-xs text-muted-foreground border-t pt-4 flex justify-between">
                 <span>Updated {new Date(page.updatedAt as any).toLocaleDateString()}</span>
                 <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> v{page.version}</span>
               </CardFooter>
             </Card>
           ))
        )}
      </div>
    </div>
  );
}
