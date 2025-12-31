"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function NotificationSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        email: true,
        push: true,
        sms: false,
        assessment: true,
        guardian: true,
        training: true
    });

    const handleSave = () => {
        // Mock Save
        toast({ title: "Preferences Saved", description: "Notification settings updated." });
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Notification Preferences</h1>

            <Card>
                <CardHeader><CardTitle>Channels</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Email Notifications</Label>
                        <Switch checked={settings.email} onCheckedChange={c => setSettings(s => ({ ...s, email: c }))} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Push Notifications</Label>
                        <Switch checked={settings.push} onCheckedChange={c => setSettings(s => ({ ...s, push: c }))} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>SMS Alerts</Label>
                        <Switch checked={settings.sms} onCheckedChange={c => setSettings(s => ({ ...s, sms: c }))} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Assessment Updates</Label>
                        <Switch checked={settings.assessment} onCheckedChange={c => setSettings(s => ({ ...s, assessment: c }))} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Guardian Warnings</Label>
                        <Switch checked={settings.guardian} onCheckedChange={c => setSettings(s => ({ ...s, guardian: c }))} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Training Reminders</Label>
                        <Switch checked={settings.training} onCheckedChange={c => setSettings(s => ({ ...s, training: c }))} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
        </div>
    );
}
