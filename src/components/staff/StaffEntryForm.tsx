// src/components/staff/StaffEntryForm.tsx

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ShieldAlert, BookOpen, Users } from 'lucide-react';
import { useSchemaExtensions } from '@/hooks/use-schema-extensions';
import { DynamicFormField } from '@/components/ui/dynamic-form-field';
import { StaffService } from '@/services/staff-service';
import { useAuth } from '@/hooks/use-auth';
import { getRegionalDb } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';

const defaultValues = {
    firstName: '',
    lastName: '',
    role: 'Teacher',
    category: 'academic',
    email: '',
    schoolId: '',
    subjects: [],
    assignedClasses: [],
    extensions: {} 
};

const COMMON_SUBJECTS = ["Maths", "English", "Science", "History", "Geography", "Art", "PE", "Computing"];
const COMMON_CLASSES = ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13", "6A", "6B", "Form 1"];

export function StaffEntryForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [schools, setSchools] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    
    const { toast } = useToast();
    const { user } = useAuth();
    const { config: schemaConfig, loading } = useSchemaExtensions();

    const form = useForm({ defaultValues });

    // Fetch Schools and Students on Load (SECURE)
    useEffect(() => {
        if (!user || !user.tenantId) return;
        async function loadData() {
            try {
                const db = getRegionalDb(user?.region);
                
                // Secure Queries: Filter by tenantId to match Firestore Rules
                // Note: Schools use 'tenantId' now standardized
                const schoolsQ = query(
                    collection(db, 'schools'), 
                    where('tenantId', '==', user?.tenantId)
                );
                const schoolsSnap = await getDocs(schoolsQ);
                setSchools(schoolsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                
                const studentsQ = query(
                    collection(db, 'students'), 
                    where('tenantId', '==', user?.tenantId)
                );
                const studentsSnap = await getDocs(studentsQ);
                setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            } catch (e: any) {
                console.error("Failed to load options", e);
                // If permission denied, it likely means index is missing or rules are strict
                if (e.code === 'permission-denied') {
                    toast({ title: "Access Error", description: "Could not load schools. Check permissions.", variant: "destructive" });
                }
            }
        }
        loadData();
    }, [user]);

    const onSubmit = async (data: any) => {
        if (!user?.tenantId) return;
        
        setIsSubmitting(true);
        try {
            const region = user.region || 'uk'; 

            await StaffService.createStaffMember(user.tenantId, region, {
                tenantId: user.tenantId,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
                category: data.category,
                email: data.email,
                schoolId: data.schoolId,
                subjects: data.subjects,
                assignedClasses: data.assignedClasses,
                // Cast to any if needed to bypass strict type checking for this field
                // or update interface
                assignedStudents: selectedStudentIds, 
                status: 'active',
                extensions: data.extensions
            } as any);
            
            toast({ title: "Staff Record Created", description: "Securely saved to Regional Single Central Record." });
            form.reset();
            setSelectedStudentIds([]);
        } catch (e: any) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: e.message || "Failed to create staff." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Staff Member</CardTitle>
                            <CardDescription>Enter academic, pastoral, and statutory vetting information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            {/* Personal & School Link */}
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
                                name="schoolId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assigned School</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select School..."/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {schools.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Job Title / Role</FormLabel>
                                             <FormControl><Input {...field} placeholder="e.g. Head of Year 9"/></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="academic">Academic / Teaching</SelectItem>
                                                    <SelectItem value="support">Support / TA</SelectItem>
                                                    <SelectItem value="admin">Admin / Ops</SelectItem>
                                                    <SelectItem value="leadership">Leadership / SLT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Work Email</FormLabel>
                                        <FormControl><Input {...field} type="email" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Academic Assignments */}
                             <div className="pt-4 border-t">
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4"/> Academic Assignments
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="subjects"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Subjects Taught</FormLabel>
                                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                                                    {COMMON_SUBJECTS.map((item) => (
                                                        <FormField
                                                            key={item}
                                                            control={form.control}
                                                            name="subjects"
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem key={item} className="flex flex-row items-start space-x-2 space-y-0">
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(item as never)}
                                                                                onCheckedChange={(checked) => {
                                                                                    return checked
                                                                                        ? field.onChange([...(field.value || []), item])
                                                                                        : field.onChange(field.value?.filter((value) => value !== item));
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal cursor-pointer">{item}</FormLabel>
                                                                    </FormItem>
                                                                );
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="assignedClasses"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Classes / Forms</FormLabel>
                                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                                                    {COMMON_CLASSES.map((item) => (
                                                        <FormField
                                                            key={item}
                                                            control={form.control}
                                                            name="assignedClasses"
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem key={item} className="flex flex-row items-start space-x-2 space-y-0">
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(item as never)}
                                                                                onCheckedChange={(checked) => {
                                                                                    return checked
                                                                                        ? field.onChange([...(field.value || []), item])
                                                                                        : field.onChange(field.value?.filter((value) => value !== item));
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal cursor-pointer">{item}</FormLabel>
                                                                    </FormItem>
                                                                );
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                             </div>

                             {/* Student Assignment */}
                             <div className="pt-4 border-t">
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Users className="h-4 w-4"/> Assigned Students ({selectedStudentIds.length})
                                </h3>
                                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border p-2 rounded bg-slate-50">
                                    {students.map((stu) => (
                                        <div key={stu.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`stu-${stu.id}`}
                                                checked={selectedStudentIds.includes(stu.id)}
                                                onCheckedChange={(checked) => {
                                                    if(checked) setSelectedStudentIds(prev => [...prev, stu.id]);
                                                    else setSelectedStudentIds(prev => prev.filter(id => id !== stu.id));
                                                }}
                                            />
                                            <label htmlFor={`stu-${stu.id}`} className="text-xs cursor-pointer select-none">
                                                {stu.firstName} {stu.lastName}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                             </div>


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
