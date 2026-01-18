// src/components/dashboard/case/tabs/case-files.tsx

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Eye, Loader2, Plus, UserPlus } from 'lucide-react';
import { DocumentUploader } from '@/components/dashboard/data-ingestion/document-uploader'; 
import { Badge } from '@/components/ui/badge';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, getDoc } from 'firebase/firestore';
import { getRegionalDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stakeholder, StakeholderRole } from '@/types/case';

export function CaseFiles({ caseId, studentId }: { caseId: string, studentId: string }) {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<any[]>([]);
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Stakeholder Dialog
    const [isAddStakeholderOpen, setIsAddStakeholderOpen] = useState(false);
    const [newStakeholder, setNewStakeholder] = useState<Partial<Stakeholder>>({
        role: 'Mother',
        name: '',
        contactInfo: { email: '', phone: '' }
    });

    // Grouped Roles for easier selection
    const roleGroups = {
        "Family": ["Mother", "Father", "Step-Parent", "Legal Guardian", "Foster Carer", "GrandMother", "GrandFather", "Sister", "Brother", "Cousin"],
        "Social": ["Friend", "Girlfriend", "BoyFriend"],
        "School": ["Class Teacher", "Head Teacher", "SENCO", "Teacher"],
        "Professional": ["Social Worker", "Pediatrician", "EPP Lead", "Other"]
    };

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            try {
                const db = getRegionalDb(user.region || 'uk');
                
                // 1. Fetch Docs
                const docQ = query(collection(db, 'knowledgeDocuments'), where('caseId', '==', caseId));
                const docSnap = await getDocs(docQ);
                const docs = docSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                docs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setDocuments(docs);

                // 2. Fetch Case (for Stakeholders)
                // Assuming parent passed ID, but we need fresh stakeholders list
                const caseSnap = await getDoc(doc(db, 'cases', caseId));
                if (caseSnap.exists()) {
                    setStakeholders(caseSnap.data().stakeholders || []);
                }

            } catch (e) {
                console.error("Failed to fetch case files/stakeholders", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [caseId, user, isAddStakeholderOpen]); // Reload on dialog close

    const handleAddStakeholder = async () => {
        if (!user || !newStakeholder.name) return;
        try {
            const db = getRegionalDb(user.region || 'uk');
            const stakeholder: Stakeholder = {
                id: `sh-${Date.now()}`,
                role: newStakeholder.role as any,
                name: newStakeholder.name || 'Unknown',
                contactInfo: {
                    email: newStakeholder.contactInfo?.email || '',
                    phone: newStakeholder.contactInfo?.phone || '',
                    organization: newStakeholder.contactInfo?.organization || ''
                },
                consentStatus: 'pending',
                contributionStatus: 'not_requested'
            };

            await updateDoc(doc(db, 'cases', caseId), {
                stakeholders: arrayUnion(stakeholder)
            });

            setIsAddStakeholderOpen(false);
            // Optimistic update
            setStakeholders(prev => [...prev, stakeholder]);

        } catch (e) {
            console.error("Failed to add stakeholder", e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">The Digital Case File (Forensic View)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* File Tree / Timeline */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Document Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin h-5 w-5"/></div>
                        ) : documents.length === 0 ? (
                            <div className="text-center p-4 text-muted-foreground border-2 border-dashed rounded">
                                No documents found. Upload the Zip file to start.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {documents.map(doc => (
                                    <div key={doc.id} className="p-3 border rounded-lg flex items-center justify-between bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <FileText className={`w-5 h-5 ${doc.type === 'referral' ? 'text-blue-500' : 'text-slate-500'}`} />
                                            <div>
                                                <p className="text-sm font-medium">{doc.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(doc.createdAt))} ago • {doc.metadata?.evidenceType || 'General'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon">
                                            <Eye className="w-4 h-4 text-slate-400 hover:text-indigo-600"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="mt-4 p-4 border-t border-dashed">
                            <p className="text-sm font-medium mb-2">Upload New Evidence</p>
                            {/* LOCKED UPLOADER */}
                            <DocumentUploader preselectedStudentId={studentId} locked={true} /> 
                        </div>
                    </CardContent>
                </Card>

                {/* Stakeholders Manager */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Stakeholders (360° View)</CardTitle>
                        <Dialog open={isAddStakeholderOpen} onOpenChange={setIsAddStakeholderOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <UserPlus className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add 360° Stakeholder</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select 
                                            value={newStakeholder.role} 
                                            onValueChange={v => setNewStakeholder({...newStakeholder, role: v as any})}
                                        >
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {Object.entries(roleGroups).map(([group, roles]) => (
                                                    <React.Fragment key={group}>
                                                        <SelectItem value={group} disabled className="font-bold text-xs opacity-100 bg-slate-50 text-slate-900 cursor-default py-1">
                                                            --- {group} ---
                                                        </SelectItem>
                                                        {roles.map(role => (
                                                            <SelectItem key={role} value={role} className="pl-6">{role}</SelectItem>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input 
                                            value={newStakeholder.name} 
                                            onChange={e => setNewStakeholder({...newStakeholder, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input 
                                            value={newStakeholder.contactInfo?.email} 
                                            onChange={e => setNewStakeholder({...newStakeholder, contactInfo: {...newStakeholder.contactInfo, email: e.target.value} as any})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input 
                                            value={newStakeholder.contactInfo?.phone} 
                                            onChange={e => setNewStakeholder({...newStakeholder, contactInfo: {...newStakeholder.contactInfo, phone: e.target.value} as any})}
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleAddStakeholder}>Add Stakeholder</Button>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stakeholders.map((sh) => (
                                <div key={sh.id} className="text-sm border-b pb-2 last:border-0">
                                    <div className="flex justify-between">
                                        <p className="font-medium">{sh.name}</p>
                                        <Badge variant="secondary" className="text-[10px] h-5">{sh.role}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{sh.contactInfo.email}</p>
                                    {sh.contactInfo.phone && <p className="text-xs text-muted-foreground">{sh.contactInfo.phone}</p>}
                                    {sh.consentStatus === 'pending' && <Badge variant="outline" className="mt-1 text-[10px] text-amber-600 bg-amber-50">Consent Pending</Badge>}
                                </div>
                            ))}
                            {stakeholders.length === 0 && <p className="text-xs text-muted-foreground">No stakeholders added.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
