"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { submitConsentAction } from '@/app/actions/submit-consent'; // Renamed to avoid conflict
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, FileSignature, ShieldCheck } from 'lucide-react';

const consentSchema = z.object({
    agreeInvolvement: z.boolean().refine(val => val === true, "You must agree to EP involvement to proceed."),
    agreeSharing: z.boolean().refine(val => val === true, "You must agree to information sharing for the statutory process."),
    agreeRecording: z.boolean().default(false),
    signedName: z.string().min(3, "Please type your full name to sign."),
    isParentalResponsibility: z.boolean().refine(val => val === true, "You must confirm you have parental responsibility.")
});

interface ConsentFormProps {
    requestId: string;
    token: string;
    studentName: string;
    onSuccess: () => void;
}

export function ConsentForm({ requestId, token, studentName, onSuccess }: ConsentFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof consentSchema>>({
        resolver: zodResolver(consentSchema),
        defaultValues: {
            agreeInvolvement: false,
            agreeSharing: false,
            agreeRecording: false,
            signedName: "",
            isParentalResponsibility: false
        },
    });

    async function onSubmit(values: z.infer<typeof consentSchema>) {
        setIsSubmitting(true);
        try {
            await submitConsentAction(requestId, token, values);
            toast({ title: "Consent Signed", description: "Thank you. A copy has been filed." });
            onSuccess();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to submit signature.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div>
                        <p className="font-semibold mb-1">Legal Consent Required</p>
                        <p>Before we can work with <strong>{studentName}</strong>, we need your permission. Please read the notices below carefully.</p>
                    </div>
                </div>

                {/* Privacy Notice */}
                <Accordion type="single" collapsible className="w-full border rounded-md px-4">
                    <AccordionItem value="privacy" className="border-b-0">
                        <AccordionTrigger className="text-sm font-medium text-slate-600 hover:no-underline">
                            <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4" /> How we use your data (GDPR Privacy Notice)
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-slate-500 space-y-2">
                            <p>We collect and process personal data to carry out our statutory duties under the Children and Families Act 2014.</p>
                            <p>Data is stored securely on encrypted servers (UK/EU). We retain records until the child's 25th birthday.</p>
                            <p>You have the right to request access to your data at any time.</p>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div className="space-y-6">
                    {/* Checkbox 1: Involvement */}
                    <FormField
                        control={form.control}
                        name="agreeInvolvement"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        I agree to the Educational Psychologist being involved with my child.
                                    </FormLabel>
                                    <FormDescription>
                                        This includes observation, assessment, and consultation with school staff.
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />

                    {/* Checkbox 2: Sharing */}
                    <FormField
                        control={form.control}
                        name="agreeSharing"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        I agree to information being shared.
                                    </FormLabel>
                                    <FormDescription>
                                        Reports will be shared with the School, Local Authority, and Health professionals involved in your child's care.
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />

                    {/* Checkbox 3: Recording (Optional) */}
                    <FormField
                        control={form.control}
                        name="agreeRecording"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-indigo-50 border-indigo-100">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        I consent to audio recording of consultations.
                                    </FormLabel>
                                    <FormDescription className="text-indigo-600">
                                        Optional. Recordings are used by our AI to ensure report accuracy and are deleted after processing.
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>

                {/* Signature Block */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FileSignature className="h-5 w-5 text-slate-400" />
                        <h3 className="font-semibold text-slate-700">Digital Signature</h3>
                    </div>

                    <FormField
                        control={form.control}
                        name="isParentalResponsibility"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        I confirm I am the person with <strong>Parental Responsibility</strong>.
                                    </FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="signedName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Jane Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Date</FormLabel>
                            <Input disabled value={new Date().toLocaleDateString()} />
                        </FormItem>
                    </div>
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-lg py-6" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign & Confirm Consent"}
                </Button>
            </form>
        </Form>
    );
}
