"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
    CloudCog, 
    Video, 
    Calendar, 
    ShieldCheck, 
    Key, 
    Lock,
    Globe,
    Server
} from 'lucide-react';

interface IntegrationConfig {
    id: string;
    name: string;
    description: string;
    provider: string;
    status: 'connected' | 'disconnected' | 'error';
    isAdminOnly: boolean;
    configFields: { key: string; label: string; type: 'text' | 'password'; value: string }[];
}

const INITIAL_INTEGRATIONS: IntegrationConfig[] = [
    // Admin Managed - System Wide
    {
        id: 'nylas',
        name: 'Unified Calendar Sync (Nylas)',
        description: 'Enables Google/Outlook sync for all users. Requires Client ID/Secret.',
        provider: 'Nylas',
        status: 'disconnected',
        isAdminOnly: true,
        configFields: [
            { key: 'client_id', label: 'Client ID', type: 'text', value: '' },
            { key: 'client_secret', label: 'Client Secret', type: 'password', value: '' }
        ]
    },
    {
        id: 'teams_admin',
        name: 'Microsoft Teams (Enterprise)',
        description: 'Tenant-wide Teams integration for meeting generation.',
        provider: 'Microsoft',
        status: 'connected',
        isAdminOnly: true,
        configFields: [
            { key: 'tenant_id', label: 'Tenant ID', type: 'text', value: '********' },
            { key: 'client_secret', label: 'Client Secret', type: 'password', value: '********' }
        ]
    },
    // User Managed (But Admins can see status)
    {
        id: 'zoom_user',
        name: 'Zoom (Personal)',
        description: 'Connect your personal Zoom account for video calls.',
        provider: 'Zoom',
        status: 'disconnected',
        isAdminOnly: false,
        configFields: [] // OAuth flow usually doesn't need manual field entry here
    }
];

export default function IntegrationsSettingsPage() {
    const [integrations, setIntegrations] = useState(INITIAL_INTEGRATIONS);
    const { toast } = useToast();
    const [isAdmin, setIsAdmin] = useState(true); // Mock role check

    const handleSave = (id: string) => {
        // API call to save config securely
        toast({ title: "Configuration Saved", description: "Integration settings updated." });
    };

    const toggleStatus = (id: string) => {
        setIntegrations(prev => prev.map(i => {
            if (i.id === id) {
                const newStatus = i.status === 'connected' ? 'disconnected' : 'connected';
                toast({ title: newStatus === 'connected' ? "Connected" : "Disconnected", description: `${i.name} is now ${newStatus}.` });
                return { ...i, status: newStatus };
            }
            return i;
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Integrations & API Connections</h3>
                    <p className="text-muted-foreground">Manage external tools. Some settings require Admin privileges.</p>
                </div>
                <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                    <Label>View as:</Label>
                    <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
                    <span className="text-sm">{isAdmin ? 'Admin' : 'User'}</span>
                </div>
            </div>

            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">All Integrations</TabsTrigger>
                    <TabsTrigger value="communication">Communication</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-6 mt-6">
                    {integrations.filter(i => isAdmin || !i.isAdminOnly).map(integration => (
                        <Card key={integration.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-md border shadow-sm">
                                            {integration.provider === 'Microsoft' && <Server className="h-6 w-6 text-blue-600"/>}
                                            {integration.provider === 'Nylas' && <Calendar className="h-6 w-6 text-emerald-600"/>}
                                            {integration.provider === 'Zoom' && <Video className="h-6 w-6 text-blue-500"/>}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {integration.name}
                                                {integration.isAdminOnly && <Badge variant="secondary" className="text-xs font-normal"><ShieldCheck className="mr-1 h-3 w-3"/> Admin Managed</Badge>}
                                            </CardTitle>
                                            <CardDescription>{integration.description}</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                         <Badge variant={integration.status === 'connected' ? 'default' : 'outline'}>
                                            {integration.status === 'connected' ? 'Active' : 'Inactive'}
                                         </Badge>
                                         {!integration.isAdminOnly || isAdmin ? (
                                             <Button variant="outline" size="sm" onClick={() => toggleStatus(integration.id)}>
                                                 {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                                             </Button>
                                         ) : null}
                                    </div>
                                </div>
                            </CardHeader>
                            
                            {(isAdmin && integration.configFields.length > 0) && (
                                <CardContent className="pt-6 border-t">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {integration.configFields.map(field => (
                                            <div key={field.key} className="space-y-2">
                                                <Label>{field.label}</Label>
                                                <div className="relative">
                                                    <Input 
                                                        type={field.type} 
                                                        defaultValue={field.value} 
                                                        placeholder={`Enter ${field.label}`}
                                                    />
                                                    {field.type === 'password' && <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground"/>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button size="sm" onClick={() => handleSave(integration.id)}>Save Configuration</Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}
