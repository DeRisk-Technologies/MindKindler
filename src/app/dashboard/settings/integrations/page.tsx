// src/app/dashboard/settings/integrations/page.tsx

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Plug, 
    CheckCircle2, 
    AlertTriangle, 
    RefreshCcw, 
    ExternalLink, 
    Server,
    BookOpen,
    Calendar,
    Video,
    FileSpreadsheet,
    Loader2
} from 'lucide-react';
import { useFirestoreCollection } from '@/hooks/use-firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

// Available Connectors Registry
const AVAILABLE_CONNECTORS = [
    {
        id: 'oneroster',
        name: 'OneRoster 1.1',
        description: 'Sync students, staff, and classes from compliant MIS/SIS.',
        icon: <BookOpen className="h-6 w-6 text-orange-600"/>,
        type: 'sis',
        fields: ['endpointUrl', 'clientId', 'clientSecret']
    },
    {
        id: 'wonde',
        name: 'Wonde',
        description: 'Universal API for UK School MIS (SIMS, Arbor, Bromcom).',
        icon: <Server className="h-6 w-6 text-blue-600"/>,
        type: 'sis',
        fields: ['apiKey', 'schoolId']
    },
    {
        id: 'google_workspace',
        name: 'Google Workspace',
        description: 'Sync Calendar, Meet, and Classroom rosters.',
        icon: <Video className="h-6 w-6 text-green-600"/>,
        type: 'productivity',
        fields: ['domain', 'serviceAccountJson']
    },
    {
        id: 'microsoft_365',
        name: 'Microsoft 365',
        description: 'Integration with Outlook, Teams, and Entra ID.',
        icon: <Calendar className="h-6 w-6 text-blue-500"/>,
        type: 'productivity',
        fields: ['tenantId', 'clientId', 'clientSecret']
    }
];

export default function IntegrationsSettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // Fetch user's active integrations (from global or region? Integrations are usually tenant-level config)
    // Storing in 'integrations' collection at root, filtered by tenantId.
    const { data: integrations, loading, refresh } = useFirestoreCollection(
        'integrations', 
        'updatedAt', 
        'desc',
        { filter: { field: 'tenantId', operator: '==', value: user?.tenantId || 'none' } }
    );

    const [isConfigureOpen, setIsConfigureOpen] = useState(false);
    const [selectedConnector, setSelectedConnector] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleConfigure = (connector: any) => {
        setSelectedConnector(connector);
        setIsConfigureOpen(true);
    };

    const handleSaveConfig = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user?.tenantId) return;
        setIsSaving(true);
        
        const formData = new FormData(e.currentTarget);
        const configData: any = {};
        selectedConnector.fields.forEach((f: string) => {
            configData[f] = formData.get(f);
        });

        const payload = {
            connectorId: selectedConnector.id,
            connectorName: selectedConnector.name,
            tenantId: user.tenantId,
            type: selectedConnector.type,
            status: 'active',
            config: configData,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid
        };

        try {
            // Check if exists to update, or create new. 
            // Simplified: Just add new or update existing if found in local list.
            const existing = integrations.find(i => i.connectorId === selectedConnector.id);
            
            if (existing) {
                await updateDoc(doc(db, 'integrations', existing.id), payload);
                toast({ title: "Integration Updated", description: "Configuration saved." });
            } else {
                await addDoc(collection(db, 'integrations'), { ...payload, createdAt: serverTimestamp() });
                toast({ title: "Integration Enabled", description: "Connection established." });
            }
            
            setIsConfigureOpen(false);
            refresh();
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const getStatus = (connectorId: string) => {
        const integration = integrations.find(i => i.connectorId === connectorId);
        if (!integration) return 'inactive';
        return integration.status; // 'active', 'error', 'syncing'
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
                <p className="text-muted-foreground">Connect your practice with external systems and data sources.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {AVAILABLE_CONNECTORS.map((connector) => {
                    const status = getStatus(connector.id);
                    const isConnected = status !== 'inactive';

                    return (
                        <Card key={connector.id} className={isConnected ? "border-indigo-200 bg-indigo-50/20" : ""}>
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-md border shadow-sm">
                                        {connector.icon}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{connector.name}</CardTitle>
                                        <CardDescription className="text-xs">{connector.type.toUpperCase()}</CardDescription>
                                    </div>
                                </div>
                                {isConnected ? (
                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                        <CheckCircle2 className="w-3 h-3 mr-1"/> Active
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-slate-500">
                                        Not Connected
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{connector.description}</p>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button 
                                    variant={isConnected ? "outline" : "default"} 
                                    className="w-full"
                                    onClick={() => handleConfigure(connector)}
                                >
                                    {isConnected ? "Manage Configuration" : "Connect"}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Custom CSV Import Card */}
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5"/> Manual Import
                    </CardTitle>
                    <CardDescription>
                        Don't have an API? Upload CSV files for students, staff, or timetables.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                     <Button variant="secondary" onClick={() => window.location.href='/dashboard/data-ingestion/import'}>
                        Go to Import Tool
                     </Button>
                </CardFooter>
            </Card>

            {/* Configuration Dialog */}
            <Dialog open={isConfigureOpen} onOpenChange={setIsConfigureOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configure {selectedConnector?.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveConfig} className="space-y-4">
                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-xs text-yellow-800 flex items-start gap-2">
                             <AlertTriangle className="h-4 w-4 shrink-0"/>
                             <div>
                                 <strong>Security Notice:</strong> Credentials are encrypted at rest. Ensure you have proper authorization from the data controller (School/LEA).
                             </div>
                        </div>
                        
                        {selectedConnector?.fields.map((field: string) => (
                            <div key={field} className="space-y-2">
                                <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
                                <Input 
                                    name={field} 
                                    type={field.toLowerCase().includes('secret') || field.toLowerCase().includes('key') ? "password" : "text"}
                                    placeholder={`Enter ${field}...`}
                                    defaultValue={integrations.find(i => i.connectorId === selectedConnector.id)?.config[field] || ''}
                                />
                            </div>
                        ))}

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch id="sync-active" defaultChecked={true} />
                            <Label htmlFor="sync-active">Enable Nightly Sync</Label>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Configuration
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
