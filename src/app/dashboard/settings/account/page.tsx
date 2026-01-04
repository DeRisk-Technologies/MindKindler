"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download } from 'lucide-react';

export default function AccountDataPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Account & Data</h2>
                    <p className="text-muted-foreground">Manage your personal data and account status.</p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5"/> Export Data</CardTitle>
                        <CardDescription>Download a copy of your personal data.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            You can request a download of your account information, activity logs, and settings. 
                            This does not include patient data which is owned by the tenant organization.
                        </p>
                        <Button variant="outline">Request Archive</Button>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700 flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-red-900">Delete Account</div>
                                <div className="text-sm text-red-700">Permanently remove your account and all personal data.</div>
                            </div>
                            <Button variant="destructive">Delete Account</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
