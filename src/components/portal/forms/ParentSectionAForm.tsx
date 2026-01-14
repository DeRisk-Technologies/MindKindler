"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { submitContribution } from '@/app/actions/portal';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart, History, Star, Home, User } from 'lucide-react';

const formSchema = z.object({
  strengths: z.string().min(10, "Please tell us a bit more about their strengths."),
  history: z.string().optional(),
  aspirations: z.string().min(5, "Please share at least one hope for the future."),
  homeNeeds: z.string().min(5, "Please describe what works or doesn't work at home."),
  respondentName: z.string().min(2, "Your name is required.")
});

interface ParentSectionAFormProps {
    requestId: string;
    token: string;
    onSuccess: () => void;
}

export function ParentSectionAForm({ requestId, token, onSuccess }: ParentSectionAFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            strengths: "",
            history: "",
            aspirations: "",
            homeNeeds: "",
            respondentName: ""
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            // Map flat form to structured Schema
            const payload = {
                respondentName: values.respondentName,
                childStrengths: [values.strengths], // Array for schema compatibility
                historyOfNeeds: values.history,
                childAspirations: values.aspirations,
                homeSupport: values.homeNeeds
            };

            await submitContribution(requestId, token, payload);
            toast({ title: "Contribution Saved", description: "Thank you for sharing your views." });
            onSuccess();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to submit. Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Introduction */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-sm text-indigo-800">
                    <p><strong>Welcome!</strong> This form helps us understand your child through your eyes. This information is used for <strong>Section A</strong> of the Statutory Advice, which is all about the child's voice and family views.</p>
                </div>

                <div className="space-y-6">
                    {/* 1. Strengths */}
                    <div className="space-y-4 border-b pb-6">
                        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-lg">
                            <Heart className="h-5 w-5" />
                            <h2>All About Me (Strengths)</h2>
                        </div>
                        <FormField
                            control={form.control}
                            name="strengths"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>What are their "Super Powers"? What do they enjoy?</FormLabel>
                                    <FormDescription>Think about hobbies, personality traits, and things they are good at.</FormDescription>
                                    <FormControl>
                                        <Textarea placeholder="e.g. Charlie loves Lego and is very kind to animals..." className="min-h-[120px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* 2. History */}
                    <div className="space-y-4 border-b pb-6">
                        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-lg">
                            <History className="h-5 w-5" />
                            <h2>My History</h2>
                        </div>
                        <FormField
                            control={form.control}
                            name="history"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Brief Background (Optional)</FormLabel>
                                    <FormDescription>Any early development milestones, medical history, or significant events we should know?</FormDescription>
                                    <FormControl>
                                        <Textarea placeholder="e.g. Early speech delay, grommets fitted at age 3..." className="min-h-[100px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* 3. Aspirations */}
                    <div className="space-y-4 border-b pb-6">
                        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-lg">
                            <Star className="h-5 w-5" />
                            <h2>Hopes for the Future</h2>
                        </div>
                        <FormField
                            control={form.control}
                            name="aspirations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>What are your hopes for them as an adult?</FormLabel>
                                    <FormDescription>Think about employment, independent living, and happiness.</FormDescription>
                                    <FormControl>
                                        <Textarea placeholder="e.g. To have a job they enjoy and live independently..." className="min-h-[100px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* 4. Home */}
                    <div className="space-y-4 border-b pb-6">
                        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-lg">
                            <Home className="h-5 w-5" />
                            <h2>At Home</h2>
                        </div>
                        <FormField
                            control={form.control}
                            name="homeNeeds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>What works well? What is difficult?</FormLabel>
                                    <FormDescription>Describe routines, triggers for distress, and what support you find helpful.</FormDescription>
                                    <FormControl>
                                        <Textarea placeholder="e.g. Visual timetables help in the morning. Loud noises are a trigger..." className="min-h-[120px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Sign Off */}
                    <div className="space-y-4 pt-2">
                        <FormField
                            control={form.control}
                            name="respondentName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Name</FormLabel>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input placeholder="Type your full name" className="pl-9" {...field} />
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Submit Views Securely"}
                </Button>
            </form>
        </Form>
    );
}
