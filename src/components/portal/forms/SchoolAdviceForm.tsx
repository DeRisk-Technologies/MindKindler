"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitContribution } from '@/app/actions/portal';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GraduationCap, TrendingUp, AlertTriangle, Plus, Trash2, FileUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const schoolAdviceSchema = z.object({
    respondentName: z.string().min(2, "Name required"),
    role: z.string().min(2, "Role required"),
    
    // Attainment
    attainment: z.array(z.object({
        subject: z.string().min(1, "Subject required"),
        grade: z.string().min(1, "Grade required"),
        date: z.string().min(1, "Date required")
    })).min(1, "Please add at least one attainment record."),

    // Interventions
    interventions: z.array(z.object({
        name: z.string().min(1, "Name required"),
        duration: z.string().min(1, "Duration required"),
        ratio: z.string(),
        outcome: z.string()
    })).optional(),

    // Stats
    attendancePercent: z.coerce.number().min(0).max(100),
    exclusions: z.coerce.number().min(0),
    isolations: z.coerce.number().min(0)
});

interface SchoolAdviceFormProps {
    requestId: string;
    token: string;
    onSuccess: () => void;
}

export function SchoolAdviceForm({ requestId, token, onSuccess }: SchoolAdviceFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof schoolAdviceSchema>>({
        resolver: zodResolver(schoolAdviceSchema),
        defaultValues: {
            respondentName: "",
            role: "SENCO",
            attainment: [{ subject: "Reading", grade: "", date: new Date().toISOString().split('T')[0] }],
            interventions: [],
            attendancePercent: 95,
            exclusions: 0,
            isolations: 0
        },
    });

    const { fields: attainmentFields, append: appendAttainment, remove: removeAttainment } = useFieldArray({
        control: form.control,
        name: "attainment"
    });

    const { fields: interventionFields, append: appendIntervention, remove: removeIntervention } = useFieldArray({
        control: form.control,
        name: "interventions"
    });

    async function onSubmit(values: z.infer<typeof schoolAdviceSchema>) {
        setIsSubmitting(true);
        try {
            await submitContribution(requestId, token, values);
            toast({ title: "Advice Submitted", description: "Thank you for your professional contribution." });
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
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700">
                    <p><strong>Professional Advice (Section F Contribution).</strong> Please provide quantitative data to support the statutory assessment. This form feeds directly into the Evidence Triangulation Engine.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="respondentName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your Name</FormLabel>
                                <FormControl><Input {...field} placeholder="e.g. Mrs. Smith" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <FormControl><Input {...field} placeholder="e.g. SENCO" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* 1. Attainment */}
                <Card>
                    <CardHeader className="pb-3 bg-blue-50/50 border-b">
                        <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" /> Current Attainment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Current Grade/Level</TableHead>
                                    <TableHead>Date Assessed</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attainmentFields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <Input {...form.register(`attainment.${index}.subject`)} placeholder="Subject" className="h-8" />
                                        </TableCell>
                                        <TableCell>
                                            <Input {...form.register(`attainment.${index}.grade`)} placeholder="Level" className="h-8" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="date" {...form.register(`attainment.${index}.date`)} className="h-8" />
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" type="button" onClick={() => removeAttainment(index)}>
                                                <Trash2 className="h-4 w-4 text-red-400" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="p-2 border-t bg-slate-50">
                            <Button type="button" variant="outline" size="sm" onClick={() => appendAttainment({ subject: "", grade: "", date: new Date().toISOString().split('T')[0] })}>
                                <Plus className="h-3 w-3 mr-1" /> Add Row
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Interventions */}
                <Card>
                    <CardHeader className="pb-3 bg-indigo-50/50 border-b">
                        <CardTitle className="text-base font-semibold text-indigo-900 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Graduated Response (Intervention Log)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {interventionFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-2 items-end border-b pb-4 last:border-0 last:pb-0">
                                <div className="col-span-4">
                                    <FormLabel className="text-xs">Intervention Name</FormLabel>
                                    <Input {...form.register(`interventions.${index}.name`)} placeholder="e.g. Lego Therapy" className="h-8" />
                                </div>
                                <div className="col-span-3">
                                    <FormLabel className="text-xs">Duration/Freq</FormLabel>
                                    <Input {...form.register(`interventions.${index}.duration`)} placeholder="6 weeks, 1x/week" className="h-8" />
                                </div>
                                <div className="col-span-2">
                                    <FormLabel className="text-xs">Ratio</FormLabel>
                                    <Select onValueChange={(val) => form.setValue(`interventions.${index}.ratio`, val)} defaultValue={field.ratio}>
                                        <FormControl>
                                            <SelectTrigger className="h-8"><SelectValue placeholder="-" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="1:1">1:1</SelectItem>
                                            <SelectItem value="Small Group">Group</SelectItem>
                                            <SelectItem value="Whole Class">Class</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2">
                                    <FormLabel className="text-xs">Outcome</FormLabel>
                                    <Select onValueChange={(val) => form.setValue(`interventions.${index}.outcome`, val)} defaultValue={field.outcome}>
                                        <FormControl>
                                            <SelectTrigger className="h-8"><SelectValue placeholder="-" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Met Target">Met</SelectItem>
                                            <SelectItem value="Partially Met">Partial</SelectItem>
                                            <SelectItem value="Not Met">Not Met</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-1">
                                    <Button variant="ghost" size="sm" type="button" onClick={() => removeIntervention(index)}>
                                        <Trash2 className="h-4 w-4 text-red-400" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendIntervention({ name: "", duration: "", ratio: "1:1", outcome: "Met Target" })}>
                            <Plus className="h-3 w-3 mr-1" /> Add Intervention
                        </Button>
                    </CardContent>
                </Card>

                {/* 3. Behavior & Attendance */}
                <Card>
                    <CardHeader className="pb-3 bg-amber-50/50 border-b">
                        <CardTitle className="text-base font-semibold text-amber-900 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Behavior & Attendance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="attendancePercent"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Attendance %</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="exclusions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>FTE Days</FormLabel>
                                    <FormDescription className="text-[10px]">Fixed Term Exclusions</FormDescription>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isolations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Isolations</FormLabel>
                                    <FormDescription className="text-[10px]">Internal / Booth</FormDescription>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* File Upload Stub */}
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                    <FileUp className="h-8 w-8 mb-2" />
                    <p className="text-sm font-medium">Upload Provision Map / IEP (PDF)</p>
                    <p className="text-xs mt-1">Drag and drop or click to browse</p>
                    <Input type="file" className="hidden" id="file-upload" />
                    <Button variant="secondary" size="sm" className="mt-4" type="button" onClick={() => document.getElementById('file-upload')?.click()}>
                        Choose File
                    </Button>
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Submit School Advice"}
                </Button>
            </form>
        </Form>
    );
}
