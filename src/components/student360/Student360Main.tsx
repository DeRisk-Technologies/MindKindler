// src/components/student360/Student360Main.tsx
"use client";

import { useEffect, useState } from "react";
import { AlertCard, AlertData } from "./AlertCard";
import { EvidencePanel, EvidenceDoc } from "./EvidencePanel";
import { QuickActionsBar } from "./QuickActionsBar";
import { CreateCaseModal } from "@/components/cases/CreateCaseModal"; // Fixed import path
import { getStudentProfile, getStudentAlerts, getStudentEvidence, performOptimisticAction } from "@/services/student360-service";
import { Student } from "@/types/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Archive, Clock, WifiOff, ShieldAlert } from "lucide-react";
import { auth } from "@/lib/firebase"; 
import { useTranslation } from "@/i18n/provider";
import { applyGlossaryToStructured } from "@/ai/utils/glossarySafeApply";
import { getGlossary } from "@/services/glossary-service";
import { Button } from "@/components/ui/button"; // Added Button import

interface Props {
    studentId: string;
    tenantId: string;
}

export function Student360Main({ studentId, tenantId }: Props) {
    const { toast } = useToast();
    const { t, locale } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<Student | null>(null);
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [evidence, setEvidence] = useState<EvidenceDoc[]>([]);
    const [isOffline, setIsOffline] = useState(false);
    
    // Modal State
    const [selectedAlert, setSelectedAlert] = useState<AlertData | undefined>(undefined);
    const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
    const [userId, setUserId] = useState<string>('unknown');

    useEffect(() => {
        const u = auth.currentUser;
        if (u) setUserId(u.uid);

        setIsOffline(!navigator.onLine);
        window.addEventListener('online', () => setIsOffline(false));
        window.addEventListener('offline', () => setIsOffline(true));

        async function load() {
            try {
                const [s, a, e, glossary] = await Promise.all([
                    getStudentProfile(tenantId, studentId),
                    getStudentAlerts(tenantId, studentId),
                    getStudentEvidence(tenantId, studentId),
                    getGlossary(tenantId, locale) // Fetch glossary for evidence translation
                ]);
                
                setStudent(s);
                
                // Apply Glossary to Evidence titles if available
                let processedEvidence = e;
                if (glossary && glossary.entries) {
                    const { artifact } = applyGlossaryToStructured(e, glossary.entries, ['title']);
                    processedEvidence = artifact;
                }
                setEvidence(processedEvidence);
                setAlerts(a);

            } catch (err) {
                console.error(err);
                toast({ title: "Error", description: "Failed to load profile data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }
        load();
        
        return () => {
            window.removeEventListener('online', () => setIsOffline(false));
            window.removeEventListener('offline', () => setIsOffline(true));
        };
    }, [studentId, tenantId, locale, toast]); // Re-run if locale changes

    const handleAction = async (action: string, id?: string) => {
        if (action === "Create Case" && id) {
            const alert = alerts.find(a => a.id === id);
            setSelectedAlert(alert);
            setIsCaseModalOpen(true);
        } else {
            const done = await performOptimisticAction(action, { id });
            if (done) {
                toast({ title: t('common.actions'), description: `${action} executed.` });
            } else {
                // Fixed variant type: changed 'secondary' to 'default' as toast only supports default|destructive
                toast({ title: "Queued", description: `${action} will sync when online.`, variant: "default" });
            }
        }
    };

    if (loading) {
        return (
            <div className="space-y-6" aria-busy="true">
                <div className="flex gap-4 items-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <div><Skeleton className="h-64 w-full" /></div>
                </div>
            </div>
        );
    }

    if (!student) return <div>Student not found.</div>;

    const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
    const otherAlerts = alerts.filter(a => a.severity !== 'critical' && a.severity !== 'high');
    const hasCriticalRisk = criticalAlerts.some(a => a.type === 'risk');

    return (
        <div className="flex flex-col gap-6">
            <CreateCaseModal 
                isOpen={isCaseModalOpen} 
                onClose={() => setIsCaseModalOpen(false)}
                alert={selectedAlert}
                studentId={studentId}
                tenantId={tenantId}
                userId={userId}
            />

            {/* High Risk Banner - Non Dismissible */}
            {hasCriticalRisk && (
                <div className="bg-red-600 text-white p-4 rounded-md shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2" role="alert">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="h-6 w-6 animate-pulse" />
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider">{t('student360.riskBanner.title')}</h3>
                            <p className="text-xs opacity-90">Immediate action required by statutory guidance.</p>
                        </div>
                    </div>
                    <Button variant="secondary" size="sm" className="whitespace-nowrap" onClick={() => handleAction("Emergency Protocol")}>
                        {t('student360.riskBanner.action')}
                    </Button>
                </div>
            )}

            {/* Header & Quick Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary" aria-hidden="true">
                        {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{student.firstName} {student.lastName}</h1>
                            {isOffline && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full flex items-center" title="Offline Mode"><WifiOff className="w-3 h-3 mr-1" /> {t('student360.offline')}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground flex gap-2 items-center">
                            <span>ID: {student.id.slice(0, 6)}</span>
                            <span aria-hidden="true">•</span>
                            <span>DOB: {new Date(student.dateOfBirth).toLocaleDateString()}</span>
                        </p>
                    </div>
                </div>
            </div>

            <QuickActionsBar 
                onLogNote={() => handleAction("Log Note")}
                onStartSession={() => handleAction("Start Session")}
                onUpload={() => handleAction("Upload")}
                onMessage={() => handleAction("Message Parent")}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Workflow Stream */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Action Required Section */}
                    {criticalAlerts.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                <Activity className="h-4 w-4 text-red-500" aria-hidden="true" /> {t('student360.actionRequired')}
                            </h3>
                            {criticalAlerts.map(alert => (
                                <AlertCard 
                                    key={alert.id} 
                                    alert={alert}
                                    onSnooze={() => handleAction("Snooze", alert.id)}
                                    onCreateCase={() => handleAction("Create Case", alert.id)}
                                    onOpenConsultation={() => handleAction("Consult", alert.id)}
                                    onRequestMeeting={() => handleAction("Meeting", alert.id)}
                                />
                            ))}
                        </div>
                    )}

                    <Tabs defaultValue="timeline" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                            <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 focus-visible:ring-2 focus-visible:ring-offset-2">
                                <Clock className="h-4 w-4 mr-2" aria-hidden="true" /> {t('student360.timeline')}
                            </TabsTrigger>
                            <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 focus-visible:ring-2 focus-visible:ring-offset-2">
                                <Archive className="h-4 w-4 mr-2" aria-hidden="true" /> {t('student360.allAlerts')} ({otherAlerts.length})
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="timeline" className="pt-6">
                            <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                                Timeline View Placeholder
                            </div>
                        </TabsContent>
                        <TabsContent value="history" className="pt-6 space-y-4">
                             {otherAlerts.map(alert => (
                                <AlertCard 
                                    key={alert.id} 
                                    alert={alert}
                                    onSnooze={() => handleAction("Snooze", alert.id)}
                                    onCreateCase={() => handleAction("Create Case", alert.id)}
                                    onOpenConsultation={() => handleAction("Consult", alert.id)}
                                    onRequestMeeting={() => handleAction("Meeting", alert.id)}
                                />
                            ))}
                            {otherAlerts.length === 0 && <p className="text-sm text-muted-foreground">{t('student360.noAlerts')}</p>}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right: Context & Evidence */}
                <div className="space-y-6">
                    <div className="h-[500px]">
                        <EvidencePanel 
                            documents={evidence} 
                            onViewDocument={(doc) => handleAction("View Document", doc.id)} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
