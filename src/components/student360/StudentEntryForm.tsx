// src/components/student360/StudentEntryForm.tsx

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ParentEntryForm } from './ParentEntryForm';
import { Loader2, Save, Shield, Map, BookOpen, Clock, Users } from 'lucide-react';
import { useSchemaExtensions } from '@/hooks/use-schema-extensions';
import { DynamicFormField } from '@/components/ui/dynamic-form-field';
import { Student360Service } from '@/services/student360-service'; 
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions'; 
import { useFirestoreCollection } from '@/hooks/use-firestore'; 
import { getRegionalDb } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';

const COMMON_SUBJECTS = ["Maths", "English", "Science", "History", "Geography", "Art", "PE", "Computing"];

const defaultValues = {
  identity: {
    firstName: { value: '', metadata: { source: 'manual', verified: false } },
    lastName: { value: '', metadata: { source: 'manual', verified: false } },
    dateOfBirth: { value: '', metadata: { source: 'manual', verified: false } },
    gender: { value: '', metadata: { source: 'manual', verified: false } },
    nationalId: { value: '', metadata: { source: 'manual', verified: false } },
  },
  education: {
    currentSchoolId: { value: '', metadata: { source: 'manual', verified: false } },
    enrollmentDate: { value: '', metadata: { source: 'manual', verified: false } },
    // New Academic Fields
    classGroup: { value: '', metadata: { source: 'manual', verified: false } },
    formTutorId: { value: '', metadata: { source: 'manual', verified: false } },
  },
  academicRecord: { // New Complex Object
      subjects: [] // { name, teacherId }
  },
  family: {
    parents: []
  },
  extensions: {}, 
  health: { 
      allergies: { value: [], metadata: { source: 'manual', verified: false } },
      conditions: { value: [], metadata: { source: 'manual', verified: false } },
      medications: { value: [], metadata: { source: 'manual', verified: false } }
  }
};

export function StudentEntryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { shardId } = usePermissions(); 
  
  const { data: schools, loading: loadingSchools } = useFirestoreCollection('schools', 'name', 'asc');
  const { config: schemaConfig, loading: loadingExtensions } = useSchemaExtensions();

  // Dynamic Options for Academic Record
  const [staff, setStaff] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  const form = useForm({
    defaultValues
  });

  const selectedSchoolId = form.watch('education.currentSchoolId.value');

  // Load School Specifics when selected
  useEffect(() => {
    if (!selectedSchoolId || !user) return;
    
    async function loadSchoolDetails() {
        try {
            const db = getRegionalDb(user?.region);
            
            // 1. Get School Doc for Classes/Timetables
            const schoolSnap = await getDoc(doc(db, 'schools', selectedSchoolId));
            if (schoolSnap.exists()) {
                const data = schoolSnap.data();
                // Extract classes from timetables or just operations
                if (data.operations?.timetables) {
                    setClasses(data.operations.timetables.map((t: any) => t.class));
                }
            }

            // 2. Get Staff at this School
            // Simple query for now, assuming small school or filter
            // In production, query with where('schoolId', '==', selectedSchoolId)
            const staffSnap = await getDocs(collection(db, 'staff_members'));
            const schoolStaff = staffSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter((s: any) => s.schoolId === selectedSchoolId);
            setStaff(schoolStaff);

        } catch (e) {
            console.error("Failed to load school context", e);
        }
    }
    loadSchoolDetails();
  }, [selectedSchoolId, user]);


  const onSubmit = async (data: any) => {
    let tenantId = (user as any)?.tenantId;
    
    // DEV/PILOT FIX
    if (!tenantId) {
        if ((user as any)?.role === 'EPP') {
            tenantId = `practice_${user?.uid}`;
        } else if (user?.email?.includes('admin')) {
            tenantId = 'default';
        }
    }

    if (!tenantId) {
        toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "No Tenant Context found."
        });
        return;
    }

    setIsSubmitting(true);
    
    try {
        console.log(`Submitting Student Record to tenant: ${tenantId}`);

        const studentData = {
            identity: data.identity,
            education: data.education,
            academicRecord: data.academicRecord, // New
            family: data.family,
            health: data.health,
            extensions: data.extensions 
        };

        const studentId = await Student360Service.createStudentWithParents(
            tenantId, 
            studentData as any, 
            data.family.parents, 
            user?.uid || 'system',
            shardId || 'default' 
        );
        
        toast({
            title: "Student Record Created",
            description: "Student and parent records have been saved successfully.",
        });

        router.push(`/dashboard/students/${studentId}`);

    } catch (error: any) {
        console.error("Submission Error:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to create record.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
      console.error("Form Validation Failed:", errors);
      toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please check the highlighted fields."
      });
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">New Student Record</h1>
                <p className="text-muted-foreground text-sm">Create a comprehensive 360° profile including parents and academic data.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button onClick={form.handleSubmit(onSubmit, onError)} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Create Record
                </Button>
            </div>
        </div>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Student Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Identity & Demographics
                                </CardTitle>
                                <CardDescription>Core legal identity. All fields are tracked for verification.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="identity.firstName.value"
                                    rules={{ required: "First Name is required" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl><Input {...field} placeholder="Legal First Name" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="identity.lastName.value"
                                    rules={{ required: "Last Name is required" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl><Input {...field} placeholder="Legal Surname" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="identity.dateOfBirth.value"
                                    rules={{ required: "Date of Birth is required" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date of Birth</FormLabel>
                                            <FormControl><Input {...field} type="date" /></FormControl>
                                            <FormDescription className="text-xs">Requires verification via Birth Cert.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="identity.gender.value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gender</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                    <SelectItem value="Non-Binary">Non-Binary</SelectItem>
                                                    <SelectItem value="Prefer Not to Say">Prefer Not to Say</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="identity.nationalId.value"
                                    rules={{ 
                                        pattern: {
                                            value: /^[A-Z0-9-]{5,20}$/i,
                                            message: "Invalid ID format (5-20 alphanumeric characters)"
                                        }
                                    }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>National ID / NHS No</FormLabel>
                                            <FormControl><Input {...field} placeholder="e.g. 123 456 7890" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* ACADEMIC INFO - ENHANCED */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    Education & Academic Record
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="education.currentSchoolId.value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current School</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={loadingSchools ? "Loading schools..." : "Select School"} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {schools.length === 0 ? (
                                                            <SelectItem value="none" disabled>No schools found</SelectItem>
                                                        ) : (
                                                            schools.map((school: any) => (
                                                                <SelectItem key={school.id} value={school.id}>
                                                                    {school.name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="education.enrollmentDate.value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Enrollment Date</FormLabel>
                                                <FormControl><Input {...field} type="date" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="education.classGroup.value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Class / Form Group</FormLabel>
                                                 {classes.length > 0 ? (
                                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                 ) : (
                                                    <FormControl><Input {...field} placeholder="e.g. 6A" /></FormControl>
                                                 )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="education.formTutorId.value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Form Tutor</FormLabel>
                                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder={staff.length > 0 ? "Select Tutor" : "Manual Entry..."} /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                         {staff.length === 0 ? (
                                                            <SelectItem value="manual" disabled>No staff loaded for school</SelectItem>
                                                        ) : (
                                                            staff.map((s: any) => (
                                                                <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                {selectedSchoolId && (
                                    <div className="pt-4 border-t">
                                        <h4 className="text-sm font-semibold mb-2">Subject Enrollments & Teachers</h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                            {COMMON_SUBJECTS.map((sub, idx) => (
                                                <div key={sub} className="flex gap-2 items-center text-sm">
                                                    <div className="w-24 font-medium">{sub}</div>
                                                    <Select 
                                                        onValueChange={(val) => {
                                                            // Update academicRecord.subjects array
                                                            const current = form.getValues('academicRecord.subjects') as any[];
                                                            const updated = current.filter(x => x.name !== sub);
                                                            if (val !== 'none') {
                                                                updated.push({ name: sub, teacherId: val });
                                                            }
                                                            form.setValue('academicRecord.subjects', updated as any);
                                                        }}
                                                    >
                                                         <SelectTrigger className="h-8 flex-1"><SelectValue placeholder="Assign Teacher" /></SelectTrigger>
                                                         <SelectContent>
                                                             <SelectItem value="none">No Teacher</SelectItem>
                                                             {staff.map(s => (
                                                                 <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                                                             ))}
                                                         </SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Parents & Family */}
                    <div className="lg:col-span-1 space-y-6">
                        <ParentEntryForm form={form} />
                        
                        <Card className="bg-blue-50 border-blue-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-blue-800">Next Steps</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-blue-700 space-y-2">
                                <p>After saving:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Upload Birth Certificate to verify DOB.</li>
                                    <li>Send consent request to Primary Parent.</li>
                                    <li>Import school records via OneRoster.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </Form>
    </div>
  );
}
