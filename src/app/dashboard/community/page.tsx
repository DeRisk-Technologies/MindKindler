"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Map, Lock, Users, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { CommunitySpace } from '@/types/community';

export default function CommunityHub() {
    const { user } = useAuth();
    const [spaces, setSpaces] = useState<CommunitySpace[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSpaces() {
            try {
                // In a real app, complex queries might need backend indexing
                // We fetch all spaces and filter client-side for the demo/pilot simplicity
                // or query specifically based on user attributes.
                
                const q = query(collection(db, 'community_spaces')); // Fetch all visible spaces logic
                const snapshot = await getDocs(q);
                
                const allSpaces = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as CommunitySpace[];
                
                // Filter Visibility
                const visible = allSpaces.filter(space => {
                    if (space.isPublic) return true;
                    if (!user) return false;
                    
                    if (space.scope === 'global') return true;
                    if (space.scope === 'regional') return space.region === user.region;
                    if (space.scope === 'private') return space.tenantId === user.tenantId;
                    
                    return false;
                });

                setSpaces(visible);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        fetchSpaces();
    }, [user]);

    const getIcon = (scope: string) => {
        switch (scope) {
            case 'global': return <Globe className="w-5 h-5 text-blue-500" />;
            case 'regional': return <Map className="w-5 h-5 text-green-500" />;
            case 'private': return <Lock className="w-5 h-5 text-amber-500" />;
            case 'public': return <Users className="w-5 h-5 text-purple-500" />;
            default: return <Users className="w-5 h-5" />;
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600"/></div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Community Hub</h1>
                    <p className="text-slate-500">Connect, share, and learn with peers globally and locally.</p>
                </div>
                {user?.role === 'SuperAdmin' && (
                    <Button variant="outline">
                        <ShieldCheck className="w-4 h-4 mr-2" /> Moderate
                    </Button>
                )}
            </div>

            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">All Spaces</TabsTrigger>
                    <TabsTrigger value="global">Global</TabsTrigger>
                    <TabsTrigger value="regional">Regional ({user?.region?.toUpperCase() || 'UK'})</TabsTrigger>
                    <TabsTrigger value="private">My Team</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {spaces.map(space => (
                        <Card key={space.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                                        {getIcon(space.scope)}
                                    </div>
                                    <Badge variant="outline" className="capitalize">{space.type}</Badge>
                                </div>
                                <CardTitle className="mt-4">{space.title}</CardTitle>
                                <CardDescription>{space.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href={`/dashboard/community/${space.type}/${space.id}`}>
                                    <Button className="w-full" variant="ghost">
                                        Enter Space <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
                
                {/* Other tabs would filter the `spaces` array similarly */}
            </Tabs>
        </div>
    );
}
