"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Key, Smartphone, History, Loader2 } from 'lucide-react';

export default function SecurityPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate data fetch delay to prevent hydration mismatch on timestamp/data
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Security & Privacy</h2>
                    <p className="text-muted-foreground">Manage your account security and active sessions.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5"/> Password</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Password was last changed on Oct 1, 2023.
                        </div>
                        <Button variant="outline">Change Password</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5"/> Two-Factor Authentication</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Status: <span className="font-semibold text-green-600">Enabled</span></span>
                            <Button variant="ghost" size="sm" className="text-red-500">Disable</Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Protect your account with an extra layer of security.
                        </p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/> Recent Activity</CardTitle>
                        <CardDescription>Login sessions from your account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { device: 'Chrome on MacOS', ip: '192.168.1.1', location: 'London, UK', time: 'Just now' },
                                { device: 'Safari on iPhone', ip: '192.168.1.2', location: 'London, UK', time: '2 hours ago' },
                            ].map((session, i) => (
                                <div key={i} className="flex justify-between items-center border-b last:border-0 pb-2 last:pb-0">
                                    <div>
                                        <div className="font-medium text-sm">{session.device}</div>
                                        <div className="text-xs text-muted-foreground">{session.location} • {session.ip}</div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{session.time}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
