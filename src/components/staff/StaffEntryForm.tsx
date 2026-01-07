// src/components/staff/StaffEntryForm.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ShieldAlert, FileWarning } from 'lucide-react';
import { useSchemaExtensions } from '@/hooks/use-schema-extensions';
import { DynamicFormField } from '@/components/ui/dynamic-form-field';
import { StaffService } from '@/services/staff-service';
import { useAuth } from '@/hooks/use-auth';

const defaultValues = {
    firstName: '',
    lastName: '',
    role: 'Teacher',
    email: '',
    extensions: {} // Dynamic bucket for SCR fields
};

export function StaffEntryForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const { config: schemaConfig, loading } = useSchemaExtensions();

    const form = useForm({ defaultValues });

    const onSubmit = async (data: any) => {
        if (!user?.tenantId) return;
        
        setIsSubmitting(true);
        try {
            // Determine Region (In prod, this is stored in the User/Tenant Profile)
            // For MVP, we default to 'uk' if the UK pack is installed, or fallback to 'default'
            // A robust implementation would look up `user.region` from the token claims.
            const region = 'uk'; 

            await StaffService.createStaffMember(user.tenantId, region, {
                tenantId: user.tenantId,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
                email: data.email,
                status: 'active',
                extensions: data.extensions
            });
            
            toast({ title: "Staff Record Created", description: "Securely saved to Regional Single Central Record." });
            form.reset();
        } catch (e: any) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: e.message || "Failed to create staff." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Staff Member</CardTitle>
                            <CardDescription>Enter basic details and statutory vetting information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            {/* Standard Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Teacher">Teacher</SelectItem>
                                                <SelectItem value="TA">Teaching Assistant</SelectItem>
                                                <SelectItem value="Admin">Administrator</SelectItem>
                                                <SelectItem value="Volunteer">Volunteer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Dynamic SCR Section */}
                            {schemaConfig.staffFields.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-amber-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                                        <div>
                                            <h3 className="font-semibold text-amber-900">Vetting & Safer Recruitment (SCR)</h3>
                                            <p className="text-xs text-amber-700">Statutory fields required by KCSIE/EYFS.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50 p-4 rounded-md border border-amber-100">
                                        {schemaConfig.staffFields.map((field) => (
                                            <DynamicFormField 
                                                key={field.fieldName}
                                                field={field} 
                                                control={form.control}
                                                baseName="extensions"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                        </CardContent>
                        <div className="p-6 pt-0 flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save to Register
                            </Button>
                        </div>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
