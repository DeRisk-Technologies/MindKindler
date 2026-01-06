"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, MessageSquare } from 'lucide-react';

export default function NotificationsPage() {
    const { toast } = useToast();
    
    // Mock preferences
    const [preferences, setPreferences] = useState({
        email_updates: true,
        email_marketing: false,
        push_messages: true,
        push_reminders: true,
        sms_alerts: false
    });

    const toggle = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        toast({ title: "Preferences Saved", description: "Notification settings updated." });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
                    <p className="text-muted-foreground">Control how and when you receive alerts.</p>
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5"/> Email Notifications</CardTitle>
                        <CardDescription>Updates sent to your primary email address.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email_updates">Product Updates & Security</Label>
                            <Switch id="email_updates" checked={preferences.email_updates} onCheckedChange={() => toggle('email_updates')} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email_marketing">Marketing & Offers</Label>
                            <Switch id="email_marketing" checked={preferences.email_marketing} onCheckedChange={() => toggle('email_marketing')} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5"/> Push Notifications</CardTitle>
                        <CardDescription>Real-time alerts in the browser or mobile app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="push_messages">New Messages & Chat</Label>
                            <Switch id="push_messages" checked={preferences.push_messages} onCheckedChange={() => toggle('push_messages')} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="push_reminders">Appointment Reminders</Label>
                            <Switch id="push_reminders" checked={preferences.push_reminders} onCheckedChange={() => toggle('push_reminders')} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5"/> SMS Alerts</CardTitle>
                        <CardDescription>Urgent alerts sent to your mobile phone.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="sms_alerts">Emergency & Security Alerts</Label>
                            <Switch id="sms_alerts" checked={preferences.sms_alerts} onCheckedChange={() => toggle('sms_alerts')} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
