import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquare, BookOpen, FileText } from "lucide-react";
import Link from 'next/link';

export default function CommunityPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">MindKindler Community</h2>
        <div className="flex items-center space-x-2">
           <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      <Tabs defaultValue="forum" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forum">Forum</TabsTrigger>
          <TabsTrigger value="wiki">Wiki</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
        </TabsList>
        
        <TabsContent value="forum" className="space-y-4">
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Threads</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 since last hour</p>
                </CardContent>
              </Card>
           </div>
           
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Discussions</CardTitle>
                  <CardDescription>Latest threads from your community.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="flex flex-col gap-4">
                      {/* Placeholder for thread list */}
                      <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <h4 className="font-semibold">Best practices for SEN assessments?</h4>
                        <p className="text-sm text-muted-foreground">Started by Sarah J. • 2 replies</p>
                      </div>
                      <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <h4 className="font-semibold">Integration with new LMS</h4>
                        <p className="text-sm text-muted-foreground">Started by Mike T. • 0 replies</p>
                      </div>
                   </div>
                   <div className="mt-4">
                     <Link href="/dashboard/community/forum">
                       <Button variant="outline" className="w-full">View All Threads</Button>
                     </Link>
                   </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-3">
                 <CardHeader>
                   <CardTitle>Popular Categories</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span>Assessments</span>
                       <span className="text-muted-foreground">24 threads</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span>Safeguarding</span>
                       <span className="text-muted-foreground">18 threads</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span>Tech Support</span>
                       <span className="text-muted-foreground">12 threads</span>
                     </div>
                   </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="wiki" className="space-y-4">
          <div className="flex justify-between">
             <h3 className="text-xl font-semibold">Knowledge Base</h3>
             <Link href="/dashboard/community/wiki/new">
                <Button variant="secondary"><BookOpen className="mr-2 h-4 w-4"/> Create Page</Button>
             </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
               <CardHeader><CardTitle>Policy Templates</CardTitle></CardHeader>
               <CardContent><p className="text-sm text-muted-foreground">Standardized policy documents.</p></CardContent>
            </Card>
            <Card>
               <CardHeader><CardTitle>Clinical Guidelines</CardTitle></CardHeader>
               <CardContent><p className="text-sm text-muted-foreground">Vetted clinical procedures.</p></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blog" className="space-y-4">
           <div className="flex justify-between">
             <h3 className="text-xl font-semibold">Updates & News</h3>
              <Link href="/dashboard/community/blog/new">
                <Button variant="secondary"><FileText className="mr-2 h-4 w-4"/> New Post</Button>
             </Link>
          </div>
           <Card>
             <CardHeader>
               <CardTitle>Latest News</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground">No blog posts yet.</p>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
