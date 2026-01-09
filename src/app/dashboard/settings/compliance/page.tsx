// src/app/dashboard/settings/compliance/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSchemaExtensions } from '@/hooks/use-schema-extensions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ShieldCheck, AlertTriangle } from 'lucide-react';
import { DynamicFormField } from '@/components/ui/dynamic-form-field';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StaffProfile } from '@/types/schema';

export default function MyCompliancePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { config: schemaConfig, loading: configLoading } = useSchemaExtensions();
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        defaultValues: {
            extensions: {}
        }
    });

    // Load current compliance data
    useEffect(() => {
        if (!user) return;
        async function loadData() {
            try {
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (snap.exists()) {
                    const data = snap.data() as StaffProfile;
                    if (data.extensions) {
                        form.reset({ extensions: data.extensions });
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingProfile(false);
            }
        }
        loadData();
    }, [user, form]);

    const onSubmit = async (data: any) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            // Update profile with new compliance data
            // Also reset any active 'override' since user is claiming they fixed it.
            await updateDoc(doc(db, 'users', user.uid), {
                extensions: {
                    ...data.extensions,
                    complianceOverrideUntil: null // Reset override
                },
                updatedAt: serverTimestamp()
            });

            toast({ 
                title: "Compliance Updated", 
                description: "Your records have been updated. Admin will review." 
            });
        } catch (e) {
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (configLoading || loadingProfile) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

    const staffFields = schemaConfig.staffFields || [];

    if (staffFields.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No specific compliance requirements found for your role in this region.
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Compliance</h1>
                <p className="text-muted-foreground">Manage your statutory vetting information and upload required evidence.</p>
            </div>

            <Card className="border-l-4 border-l-amber-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-amber-600" />
                        Required Information
                    </CardTitle>
                    <CardDescription>
                        Please ensure these details are up to date to maintain access to clinical tools.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid gap-6 bg-amber-50/50 p-6 rounded-lg border border-amber-100">
                                {staffFields.map((field) => (
                                    <DynamicFormField 
                                        key={field.fieldName}
                                        field={field} 
                                        control={form.control}
                                        baseName="extensions"
                                    />
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-3 rounded">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Updates may trigger a re-verification review by your organization's Administrator.</span>
                            </div>

                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Compliance Record
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
