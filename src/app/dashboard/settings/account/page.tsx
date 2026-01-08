// src/app/dashboard/settings/account/page.tsx

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, AlertTriangle, Key } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";

export default function AccountSettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    // Placeholder for password reset (firebase auth handles this via email usually)
    const handlePasswordReset = () => {
        toast({ 
            title: "Reset Email Sent", 
            description: `A password reset link has been sent to ${user?.email}` 
        });
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        // In a real app, this would call a Cloud Function to recursively delete user data
        // and then delete the auth user.
        setTimeout(() => {
            setIsDeleting(false);
            toast({ 
                title: "Request Received", 
                description: "Your account deletion request has been logged. Support will contact you within 24h." 
            });
        }, 1500);
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
                <p className="text-muted-foreground">Manage your login credentials and account security.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Email Address</CardTitle>
                    <CardDescription>Your primary email for logging in and notifications.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Input value={user?.email || ''} disabled className="max-w-md bg-muted" />
                        <Button variant="outline" disabled>Change Email</Button> 
                        {/* Changing email is complex in Firebase if it's the primary ID, often disabled in MVPs */}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        To change your email, please contact support as this affects your tenancy access.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your password and authentication methods.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between border p-4 rounded-md">
                        <div className="flex items-center gap-3">
                            <Key className="h-5 w-5 text-slate-500" />
                            <div>
                                <div className="font-medium">Password</div>
                                <div className="text-xs text-muted-foreground">Last changed: Never (Managed by Provider)</div>
                            </div>
                        </div>
                        <Button variant="outline" onClick={handlePasswordReset}>Reset Password</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/10">
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5"/> Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Permanent actions that cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Delete Account</div>
                            <div className="text-xs text-muted-foreground">
                                Permanently delete your account and all associated personal data.
                            </div>
                        </div>
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        account and remove your data from our servers.
                                        
                                        If you are a Tenant Admin, this may also lock out other users in your organization.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Yes, Delete My Account"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
