"use client";

import { useFirestoreCollection, useFirestoreDocument } from "@/hooks/use-firestore";
import { TrainingModule, TrainingCompletion, TrainingAssignment } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Loader2, WifiOff, DownloadCloud, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Citations } from "@/components/ui/citations";
import { useState, useEffect } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function ModuleDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { data: module, loading } = useFirestoreDocument<TrainingModule>("trainingModules", id);
    const { toast } = useToast();
    const [completing, setCompleting] = useState(false);
    
    // Offline State
    const [isOffline, setIsOffline] = useState(false);
    const [isCached, setIsCached] = useState(false);

    useEffect(() => {
        // Network Listener
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOffline(!navigator.onLine);

        // Check Cache
        const cached = localStorage.getItem(`module_${id}`);
        if (cached) setIsCached(true);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [id]);

    // Load from cache if offline or available
    const displayModule = isOffline && isCached 
        ? JSON.parse(localStorage.getItem(`module_${id}`) || '{}') 
        : module;

    if (loading && !displayModule) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;
    if (!displayModule) return <div className="p-8">Module not found or offline unavailable.</div>;

    const handleCache = () => {
        if (isCached) {
            localStorage.removeItem(`module_${id}`);
            setIsCached(false);
            toast({ title: "Removed", description: "Module removed from offline storage." });
        } else {
            localStorage.setItem(`module_${id}`, JSON.stringify(module));
            setIsCached(true);
            toast({ title: "Saved", description: "Module available offline." });
        }
    };

    const handleComplete = async () => {
        setCompleting(true);
        
        const completionData: Omit<TrainingCompletion, 'id'> = {
            tenantId: "default",
            userId: auth.currentUser?.uid || "unknown",
            moduleId: displayModule.id,
            completedAt: new Date().toISOString(),
            evidenceAcknowledged: true
        };

        if (isOffline) {
            // Queue offline
            const queue = JSON.parse(localStorage.getItem('offlineCompletionQueue') || '[]');
            queue.push(completionData);
            localStorage.setItem('offlineCompletionQueue', JSON.stringify(queue));
            toast({ title: "Offline Complete", description: "Progress saved locally. Will sync when online." });
            setCompleting(false);
            router.push('/dashboard/training/assignments');
            return;
        }

        try {
            await addDoc(collection(db, "trainingCompletions"), completionData);
            
            // Check Certificate
            if (displayModule.certificateEnabled) {
                // Issue Cert
                await addDoc(collection(db, "certificates"), {
                    tenantId: "default",
                    userId: auth.currentUser?.uid || "unknown",
                    moduleId: displayModule.id,
                    issuedAt: new Date().toISOString(),
                    title: `Certificate of Completion: ${displayModule.title}`,
                    hoursAwarded: displayModule.durationMinutes ? displayModule.durationMinutes / 60 : 1,
                    verificationCode: `CERT-${Date.now()}`,
                    status: 'issued'
                });
                toast({ title: "Module Completed", description: "Certificate Issued!" });
            } else {
                toast({ title: "Module Completed", description: "Progress recorded." });
            }
            router.push('/dashboard/training/assignments');
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setCompleting(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            {isOffline && (
                <div className="bg-amber-100 border border-amber-300 text-amber-900 p-3 rounded flex items-center gap-2">
                    <WifiOff className="h-4 w-4"/> You are offline. Viewing cached content.
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5"/></Button>
                    <div>
                        <h1 className="text-3xl font-bold">{displayModule.title}</h1>
                        <div className="flex gap-2 mt-2">
                            <Badge>{displayModule.category}</Badge>
                            <Badge variant="outline">{displayModule.level}</Badge>
                        </div>
                    </div>
                </div>
                <Button variant="outline" onClick={handleCache}>
                    {isCached ? <><Trash2 className="mr-2 h-4 w-4"/> Remove Offline</> : <><DownloadCloud className="mr-2 h-4 w-4"/> Save for Offline</>}
                </Button>
            </div>

            <div className="space-y-6">
                {displayModule.contentBlocks?.map((block: any, i: number) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            {block.type === 'text' && <p className="leading-relaxed">{block.content}</p>}
                            {block.type === 'bullets' && (
                                <ul className="list-disc pl-5 space-y-1">
                                    {block.content.split('\n').map((line: string, li: number) => <li key={li}>{line}</li>)}
                                </ul>
                            )}
                            {block.type === 'qa' && (
                                <div className="bg-slate-50 p-4 rounded border-l-4 border-indigo-500">
                                    <p className="font-semibold text-indigo-900 mb-2">Q & A</p>
                                    <p className="whitespace-pre-wrap text-sm">{block.content}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {!isOffline && displayModule.evidenceCitations && displayModule.evidenceCitations.length > 0 && (
                    <Citations citations={displayModule.evidenceCitations.map((c: any) => ({ chunk: c.chunk, document: c.document, score: 1 }))} />
                )}

                <div className="flex justify-center pt-8">
                    <Button size="lg" className="w-full max-w-sm" onClick={handleComplete} disabled={completing}>
                        {completing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                        Mark as Complete {isOffline ? "(Offline)" : ""}
                    </Button>
                </div>
            </div>
        </div>
    );
}
